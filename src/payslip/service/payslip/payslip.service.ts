import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { QueryResult } from 'pg';
import { DbconnService } from 'src/dbconn/dbconn.service';
import {
  GeneratePayslipDTO,
  GenerateSummaryDTO,
} from 'src/payslip/dto/payslip.dto';
import {
  PayslipDetail,
  RawPayslipData,
  ReimburseDetail,
} from 'src/types/Payslip';
import * as moment from 'moment';
import TransactionEnum from 'src/helper/TransactionEnum';
import { insertQuery } from 'src/helper/QueryBuilder';
import Tables from 'src/helper/TableSchema';

@Injectable()
export class PayslipService {
  constructor(private readonly DbConn: DbconnService) {}

  async GeneratePayslip(
    gendto: GeneratePayslipDTO,
    user_id: string,
    ip: string,
  ) {
    return this.DbConn.DBClientWrapper(async (client) => {
      try {
        await client.query(TransactionEnum.BEGIN);
        const {
          rows: get_data,
          rowCount: is_pp_exist,
        }: QueryResult<RawPayslipData> = await client.query(
          `
                    select
                        pp.uid,
                        pp.month,
                        pp.year,
                        ae.user_id,
                        ae.clockin,
                        ae.clockout ,
                        ole.clockout as clockout_overtime,
                        ole.hours_actual,
                        u.hourly_salary
                    from
                        payroll_period pp
                    left join attendance_emp ae on
                        ae.payroll_id = pp.uid
                    left join overtime_log_emp ole on
                        ole.attendance_id = ae.uid
                    left join users u on
                        u.user_id = ae.user_id
                    where pp.month = $1 and pp.year = $2 and ae.user_id = $3                  
                    `,
          [gendto.month, gendto.year, user_id],
        );

        if (!is_pp_exist) {
          throw new BadRequestException({
            message: 'Payroll Period not exist, ask admin',
          });
        }

        let payroll_period_id = get_data[0].uid;

        let detail_payslip: PayslipDetail[] = [];
        let hourly_salary = parseFloat(get_data[0].hourly_salary);
        let detail_reimb: ReimburseDetail[] = [];
        let total_attendace_hours: number = 0;
        let total_overtime_hours: number = 0;
        let total_wage_attendance: number = 0;
        let total_wage_ovt: number = 0;
        let clockin: moment.Moment;
        let clockout: moment.Moment;
        let clockout_overtime: moment.Moment;
        let hours = 0;
        let wage_calc = 0;
        let overtime_calc = 0;
        let overtime_hours = 0;
        let reimburse_wage = 0;

        // get attendace hours and wage also overtime hours and wage
        for (const data of get_data) {
          clockin = moment(data.clockin);
          let default_clockin = clockin
            .clone()
            .set('hour', 17)
            .set('minute', 0)
            .set('second', 0);
          clockout = moment(data.clockout ?? default_clockin);
          clockout_overtime = moment(data.clockout_overtime ?? null);
          overtime_hours = parseFloat(data.hours_actual ?? 0);
          hours = parseFloat(
            (clockout.diff(clockin, 'minutes') / 60).toFixed(2),
          );
          wage_calc = hourly_salary * hours;
          overtime_calc = hourly_salary * 2 * overtime_hours;
          // total all
          total_attendace_hours += hours;
          total_overtime_hours += overtime_hours;
          total_wage_attendance += wage_calc;
          total_wage_ovt += overtime_calc;
          detail_payslip.push({
            clockin: clockin.toLocaleString(),
            clockout: clockout.toLocaleString(),
            clockout_overtime: clockout_overtime.isValid()
              ? clockout_overtime.toLocaleString()
              : null,
            hours_per_day: hours,
            overtime_hours: overtime_hours,
            wage: wage_calc,
            overtime_wage: overtime_calc,
          });
        }

        //get reimburse data
        const { rows: reimburse_data } = await client.query(
          `
                    select date_reimb, amount_reimb from reimbursment_emp where user_id = $1 and payroll_id = $2 and status = 1                 
                    `,
          [user_id, payroll_period_id],
        );

        for (const reimb of reimburse_data) {
          reimburse_wage += parseFloat(reimb.amount_reimb);
          detail_reimb.push({
            reimb_date: moment(reimb.date_reimb).toLocaleString(),
            reimb_amount: parseFloat(reimb.amount_reimb),
          });
        }
        let all_total = parseFloat(
          (total_wage_attendance + total_wage_ovt + reimburse_wage).toFixed(2),
        );
        let result = {
          hourly_salary,
          total_wage: all_total,
          total_hours: total_attendace_hours,
          total_overtime_hours: total_overtime_hours,
          total_reimbursed: reimburse_wage,
          detail_payslip,
          detail_reimb,
        };

        // check payroll period id is already generated or not
        const { rowCount: is_generated } = await client.query(
          `select uid from payroll_res where payroll_period_id = $1`,
          [payroll_period_id],
        );
        if (is_generated) {
          return {
            payslip_status: 'already exist',
            result,
          };
        } else {
          const payload = {
            payroll_period_id,
            user_id,
            attendance_hours: total_attendace_hours,
            overtime_hours: total_overtime_hours,
            attendance_wage: total_wage_attendance,
            overtime_wage: total_wage_ovt,
            reimburse_wage,
            total_wage: result.total_wage,
            ip: ip,
            create_by: user_id,
          };
          const [que, val] = insertQuery(Tables.payroll_res, payload, 'uid');
          await client.query(que, val);
          await client.query(TransactionEnum.COMMIT);
          return {
            payslip_status: 'generated',
            result,
          };
        }
      } catch (error) {
        console.error(error);
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

  async GenerateSummary(gensumdto: GenerateSummaryDTO) {
    return this.DbConn.DBClientWrapper(async (client) => {
      try {
        const { rows: summary, rowCount: is_exist } = await client.query(
          `
                select
                    pp.year,
                    u.user_id,
                    u.username,
                    u.fullname,
                    sum(attendance_hours) as attendance_hours,
                    sum(overtime_hours) as overtime_hourse,
                    sum(attendance_wage) as attendance_wage,
                    sum(overtime_wage) as overtime_wage,
                    sum(reimburse_wage) as reimburse_wage,
                    sum(total_wage) as total_wage
                from
                    payroll_res pr
                left join users u on
                    pr.user_id = u.user_id
                left join payroll_period pp on
                    pp.uid = pr.payroll_period_id
                where pp.year = $1
                group by
                    u.user_id,
                    pp.year                
                `,
          [gensumdto.year],
        );
        if (!is_exist) {
          throw new BadRequestException({
            message: 'Summary on this year not generated yet',
          });
        }
        let total_all_wage = {
          attendance_wage: 0,
          overtime_wage: 0,
          reimburse: 0,
          all: 0,
        };
        for (const data of summary) {
          total_all_wage.attendance_wage += parseFloat(data.attendance_wage);
          total_all_wage.overtime_wage += parseFloat(data.overtime_wage);
          (total_all_wage.reimburse += parseFloat(data.reimburse_wage)),
            (total_all_wage.all += parseFloat(data.total_wage));
        }
        return {
          total_all_wage,
          summary,
        };
      } catch (error) {
        throw new InternalServerErrorException({
          message: error.message,
        });
      }
    });
  }
}
