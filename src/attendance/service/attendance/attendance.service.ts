import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CheckIn, CheckOut } from 'src/attendance/dto/checkin.dto';
import { DbconnService } from 'src/dbconn/dbconn.service';
import { insertQuery, updateQuery } from 'src/helper/QueryBuilder';
import Tables from 'src/helper/TableSchema';
import * as moment from 'moment';
import TransactionEnum from 'src/helper/TransactionEnum';

@Injectable()
export class AttendanceService {
  constructor(private readonly DBConn: DbconnService) {}

  async CheckIn(checkindto: CheckIn, user_id: string, ip: string) {
    return this.DBConn.DBClientWrapper(async (client) => {
      try {
        await client.query(TransactionEnum.BEGIN);
        const clockin = moment(checkindto.ts_checkin);

        //not allowed check in on weekend
        if ([0, 6].includes(clockin.day())) {
          throw new BadRequestException({
            message: 'It is weekend !, enjoy your life outside work',
          });
        }

        //check if payroll period instance is created
        const { rows: payroll } = await client.query(
          `
          select
            *
          from
            payroll_period
          where
            start_period <= to_timestamp($1, 'YYYY-MM-DDThh24:mi:ss')
            and end_period >= to_timestamp($1, 'YYYY-MM-DDThh24:mi:ss')
          `,
          [clockin.toISOString()],
        );
        if (payroll.length < 1) {
          throw new BadRequestException({
            message: 'Payroll Period not defined yet',
          });
        }
        const { rows: dt, rowCount } = await client.query(
          `
                    select user_id, clockin, clockout, uid from attendance_emp where user_id = $1 and date(clockin) = to_date($2, 'yyyy-mm-dd')
                    `,
          [user_id, checkindto.ts_checkin],
        );
        if (rowCount) {
          throw new BadRequestException({
            message: 'Already clocked in ',
          });
        }
        if (rowCount && dt[0].clockout) {
          throw new BadRequestException({
            message: 'Already clocked out, cannot clock in',
          });
        }
        let clockin_data = clockin.toISOString();
        let que = '';
        let val: any = [];
        [que, val] = insertQuery(
          Tables.attendance_emp,
          {
            user_id: user_id,
            ip: ip,
            clockin: clockin_data,
            payroll_id: payroll[0].uid,
          },
          'uid',
        );
        const { rows: result } = await client.query(que, val);
        await client.query(TransactionEnum.COMMIT);
        return result[0];
      } catch (error) {
        await client.query(TransactionEnum.ROLLBACK);
        if (error instanceof HttpException) {
          throw error;
        }
        throw new InternalServerErrorException({
          message: (error as Error).message,
        });
      }
    });
  }

  async CheckOut(checkoutdto: CheckOut, user_id: string, ip: string) {
    return this.DBConn.DBClientWrapper(async (client) => {
      try {
        const { rows: dt, rowCount } = await client.query(
          `
                    select user_id, clockin, clockout, uid from attendance_emp where user_id = $1 and date(clockin) = to_date($2, 'yyyy-mm-dd')
                    `,
          [user_id, checkoutdto.ts_checkout],
        );

        if (!rowCount) {
          throw new BadRequestException({
            message: 'Cannot checkout, not clocked in yet',
          });
        }
        if (user_id !== dt[0].user_id) {
          throw new ForbiddenException({
            message: 'Not allowed',
          });
        }
        if (rowCount && dt[0].clockout) {
          throw new BadRequestException({
            message: 'Already clocked out',
          });
        }
        let clockout_data = moment(checkoutdto.ts_checkout).toISOString();
        let que = '';
        let val: any = [];

        [que, val] = updateQuery(
          Tables.attendance_emp,
          { ip: ip, clockout: clockout_data },
          { uid: dt[0].uid },
          'uid',
        );

        const { rows: result } = await client.query(que, val);
        return result;
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        throw new InternalServerErrorException({
          message: (error as Error).message,
        });
      }
    });
  }
}
