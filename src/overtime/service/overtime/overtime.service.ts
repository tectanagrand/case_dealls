import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DbconnService } from 'src/dbconn/dbconn.service';
import {
  ClockoutOvertimeDTO,
  ProposeOvertimeDTO,
} from 'src/overtime/dto/overtime.dto';
import * as moment from 'moment';
import { insertQuery, updateQuery } from 'src/helper/QueryBuilder';
import TransactionEnum from 'src/helper/TransactionEnum';
import Tables from 'src/helper/TableSchema';

@Injectable()
export class OvertimeService {
  constructor(private readonly DBConn: DbconnService) {}

  async ProposeOvertime(
    proposeovt: ProposeOvertimeDTO,
    user_id: string,
    ip: string,
  ) {
    if (proposeovt.hours > 3) {
      throw new BadRequestException({
        message: 'Overtime proposed exceed 3 hours',
      });
    }
    return this.DBConn.DBClientWrapper(async (client) => {
      try {
        await client.query(TransactionEnum.BEGIN);
        // check if already clocked out
        const { rows: clocked_out, rowCount } = await client.query(
          `
                select clockout, uid, payroll_id from attendance_emp where date(clockin) = to_date($1 ,'yyyy-mm-dd') and user_id = $2               
                `,
          [proposeovt.date_overtime, user_id],
        );
        if (!rowCount) {
          throw new BadRequestException({
            message: 'Not allowed to propose overtime, no attendance exists',
          });
        }
        if (!clocked_out[0].clockout) {
          throw new BadRequestException({
            message: 'Not allowed to propose overtime, not clocked out yet',
          });
        }

        //check if overtime req already proposed
        const { rowCount: is_overtime } = await client.query(
          `
            select oe.uid from overtime_log_emp oe 
            left join attendance_emp ae on oe.attendance_id = ae.uid
            where date(ae.clockin) = to_date($1, 'yyyy-mm-dd')
            `,
          [proposeovt.date_overtime],
        );

        if (is_overtime) {
          throw new BadRequestException({
            message: 'Overtime on this day already requested',
          });
        }
        const clock_out = moment(clocked_out[0].clockout);
        const allowed_ovt = clock_out
          .clone()
          .set('hour', 17)
          .set('minute', 0)
          .set('second', 0);
        if (!clock_out.isAfter(allowed_ovt)) {
          throw new BadRequestException({
            message:
              'Not allowed to propose overtime, clocked out not over designated clock out time (5 p.m)',
          });
        }
        const overtime_clockout = clock_out.add(proposeovt.hours, 'h');
        const payload = {
          user_id: user_id,
          create_by: user_id,
          payroll_id: clocked_out[0].payroll_id,
          attendance_id: clocked_out[0].uid,
          hour_length: proposeovt.hours,
          clockout_propose: overtime_clockout,
          ip: ip,
        };
        const [que, val] = insertQuery(Tables.overtime_log_emp, payload, 'uid');
        const { rows: result } = await client.query(que, val);
        await client.query(TransactionEnum.COMMIT);
        return result[0];
      } catch (error) {
        await client.query(TransactionEnum.ROLLBACK);
        // console.error(error);
        if (error instanceof HttpException) {
          throw error;
        }
        throw new InternalServerErrorException({
          message: 'Something wrong',
          detail: (error as Error).message,
        });
      }
    });
  }

  async ClockoutOvertime(
    clockoutdto: ClockoutOvertimeDTO,
    user_id: string,
    ip: string,
  ) {
    return this.DBConn.DBClientWrapper(async (client) => {
      try {
        await client.query(TransactionEnum.BEGIN);
        // get overtime data
        const { rows, rowCount: is_exist } = await client.query(
          `
                    select ae.clockout at time zone 'asia/jakarta' as clockout,
                    oe.clockout_propose at time zone 'asia/jakarta' as clockout_propose, oe.clockout as clockout_actual,
                    oe.uid from overtime_log_emp oe
                    left join attendance_emp ae on oe.attendance_id = ae.uid
                    where date(ae.clockout) = to_date($1, 'yyyy-mm-dd') and oe.user_id = $2            
                    `,
          [clockoutdto.clock_out, user_id],
        );
        if (!is_exist) {
          throw new BadRequestException({
            message: 'Overtime not proposed yet',
          });
        }
        if (rows[0].clockout_actual) {
          throw new BadRequestException({
            message: 'Already clock out',
          });
        }
        const current = moment(clockoutdto.clock_out);
        const day_clockout = moment(rows[0].clockout);
        const clockout_propose = moment(rows[0].clockout_propose);
        if (current.isBefore(day_clockout)) {
          throw new BadRequestException({
            message: 'Not allowed back date',
          });
        }
        let hours_diff = parseFloat(
          (current.diff(day_clockout, 'minutes') / 60).toFixed(2),
        );
        if (hours_diff < 1) {
          throw new BadRequestException({
            message: 'Not allowed clocking out less than 1 hour',
          });
        }
        if (hours_diff > 3) {
          hours_diff = 3;
        }
        const payload = {
          clockout: current.toISOString(),
          hours_actual: hours_diff,
          update_at: moment().toISOString(),
          update_by: user_id,
          ip: ip,
        };
        const [que, val] = updateQuery(
          Tables.overtime_log_emp,
          payload,
          { uid: rows[0].uid },
          'uid',
        );
        const { rows: update_res } = await client.query(que, val);
        await client.query(TransactionEnum.COMMIT);
        return update_res[0];
      } catch (error) {
        await client.query(TransactionEnum.ROLLBACK);
        console.error(error);
        if (error instanceof HttpException) {
          throw error;
        }
        throw new InternalServerErrorException({
          message: error.message,
        });
      }
    });
  }
}
