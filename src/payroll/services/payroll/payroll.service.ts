import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { DbconnService } from 'src/dbconn/dbconn.service';
import {
  SetAttendanceDTO,
  UpdateAttendacePeriod,
} from 'src/payroll/dto/setattendance.dto';
import * as moment from 'moment';
import { insertQuery, updateQuery } from 'src/helper/QueryBuilder';
import TransactionEnum from 'src/helper/TransactionEnum';
import Tables from 'src/helper/TableSchema';
import { PoolClient } from 'pg';

@Injectable()
export class PayrollService {
  constructor(private readonly DBConn: DbconnService) {}

  async validateDateRange(from_data: moment.Moment, to_data: moment.Moment) {
    if (from_data.isAfter(to_data)) {
      throw new BadRequestException({
        message: 'End Date is less than Start Date',
      });
    }
    if (from_data.isSame(to_data)) {
      throw new BadRequestException({
        message: 'Start Date cannot be same as End Date',
      });
    }
  }

  async SetAttendancePeriod(
    payload: SetAttendanceDTO,
    user_id: string,
    ip: string,
  ) {
    return this.DBConn.DBClientWrapper(async (client) => {
      try {
        const to_data = moment(payload.to);
        const from_data = moment(payload.from);
        const month_endperiod = to_data.format('M');
        const year_endperiod = to_data.format('YYYY');

        await this.validateDateRange(from_data, to_data);

        //make sure end_period is +1 from last inputted
        const { rows: last_end_period } = await client.query(
          `select end_period from payroll_period pp order by end_period desc limit 1`,
        );
        const last_end = moment(last_end_period[0].end_period).add(1, 'day');
        if (
          last_end_period.length > 0 &&
          last_end.format('YYYY-MM-DD') != from_data.format('YYYY-MM-DD')
        ) {
          throw new BadRequestException(
            `Please set from date as +1 from last period date : ${last_end.format('YYYY-MM-DD')}`,
          );
        }

        //check whether start_period is not intersect with past end_period
        const { rowCount: is_intersect } = await client.query(
          `select uid from payroll_period where date(end_period) >= to_date($1, 'YYYY-MM-DD')`,
          [from_data.format('YYYY-MM-DD')],
        );
        if (is_intersect) {
          throw new BadRequestException({
            message: 'Start period is intersect with another period',
          });
        }
        // if payroll period on that month and year already exist, throw Bad Request
        const { rows: is_exist, rowCount } = await client.query(
          `select * from payroll_period where month = $1 and year = $2`,
          [month_endperiod, year_endperiod],
        );
        if (rowCount) {
          throw new BadRequestException({
            message: 'Payroll Period already exist, please create a new one',
            detail: {
              existed: {
                start: moment(is_exist[0].start_period).toISOString(),
                end: moment(is_exist[0].end_period).toISOString(),
              },
            },
          });
        }

        //create payroll
        await client.query(TransactionEnum.BEGIN);
        const [insque, insval] = insertQuery(
          Tables.payroll_period,
          {
            start_period: from_data.toISOString(),
            end_period: to_data.toISOString(),
            month: month_endperiod,
            year: year_endperiod,
            create_by: user_id,
            ip: ip,
          },
          'uid',
        );
        const { rows } = await client.query(insque, insval);
        await client.query(TransactionEnum.COMMIT);
        return {
          id: rows[0].uid,
        };
      } catch (error) {
        await client.query(TransactionEnum.ROLLBACK);
        if (error instanceof HttpException) {
          throw error;
        }
        throw new BadGatewayException();
      }
    });
  }

  async UpdateAttendancePeriod(
    payload: UpdateAttendacePeriod,
    user_id: string,
    ip: string,
  ) {
    return this.DBConn.DBClientWrapper(async (client) => {
      try {
        const to_data = moment(payload.to);
        const from_data = moment(payload.from);
        const month_endperiod = to_data.format('M');
        const year_endperiod = to_data.format('YYYY');

        //check whether payslip already generated. if it has, cannot be changed
        const { rowCount: is_payslip_gen } = await client.query(
          `
          select uid from payroll_res where payroll_period_id = $1
          `,
          [payload.uid],
        );

        if (is_payslip_gen) {
          throw new BadRequestException({
            message: 'Payslip already generated, cannot change payroll period',
          });
        }

        const { rows: checkExist, rowCount } = await client.query(
          `select month, year, start_period from payroll_period where uid = $1`,
          [payload.uid],
        );

        //Cannot change existing start period
        const from_data_db = moment(checkExist[0].start_period);
        if (
          from_data_db.format('YYYY-MM-DD') != from_data.format('YYYY-MM-DD')
        ) {
          throw new BadRequestException({
            message: 'Cannot Change start_period ',
          });
        }
        if (!rowCount) {
          throw new BadRequestException({
            message: 'Data Not Found',
          });
        }
        const month_db = checkExist[0].month;
        const year_db = checkExist[0].year;

        await this.validateDateRange(from_data, to_data);

        //if edited but range month is different
        if (month_db != month_endperiod || year_db != year_endperiod) {
          throw new BadRequestException(
            `Not allowed to change period (existing month ${month_db}, year ${year_db})`,
          );
        }

        //update payroll
        await client.query(TransactionEnum.BEGIN);
        const [insque, insval] = updateQuery(
          Tables.payroll_period,
          {
            start_period: from_data.toISOString(),
            end_period: to_data.toISOString(),
            month: month_endperiod,
            year: year_endperiod,
            update_by: user_id,
            update_at: moment().toISOString(),
            ip: ip,
          },
          {
            uid: payload.uid,
          },
          'uid',
        );
        const { rows } = await client.query(insque, insval);
        await client.query(TransactionEnum.COMMIT);
        return {
          id: rows[0].uid,
        };
      } catch (error) {
        await client.query(TransactionEnum.ROLLBACK);
        if (error instanceof HttpException) {
          throw error;
        }
        throw new BadGatewayException();
      }
    });
  }
}
