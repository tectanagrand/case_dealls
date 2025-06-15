import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DbconnService } from 'src/dbconn/dbconn.service';
import { insertQuery, updateQuery } from 'src/helper/QueryBuilder';
import Tables from 'src/helper/TableSchema';
import TransactionEnum from 'src/helper/TransactionEnum';
import { InvokeReimburse, RevokeReimburse } from 'src/reimb/dto/reimb.dto';
import * as moment from 'moment';

@Injectable()
export class ReimbService {
  constructor(private readonly DbConn: DbconnService) {}

  async InvokeReimburse(reimb: InvokeReimburse, user_id: string, ip: string) {
    return this.DbConn.DBClientWrapper(async (client) => {
      try {
        // check if payroll period already declared
        const date_reimb = moment(reimb.date_reimb);
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
          [date_reimb.toISOString()],
        );
        if (payroll.length < 1) {
          throw new BadRequestException({
            message: 'Payroll Period not defined yet',
          });
        }
        //check if reimb exist
        await client.query(TransactionEnum.BEGIN);
        const { rowCount } = await client.query(
          `
                    select uid from ${Tables.reimbursment_emp} where date_reimb = to_date($1, 'yyyy-mm-dd') and status = 1      
                    `,
          [reimb.date_reimb],
        );
        if (rowCount) {
          throw new BadRequestException({
            message: 'Reimburse on this date already invoked',
          });
        }
        const payload = {
          ...reimb,
          user_id,
          create_by: user_id,
          payroll_id: payroll[0].uid,
          ip: ip,
        };
        const [que, val] = insertQuery(Tables.reimbursment_emp, payload, 'uid');
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

  async RevokeReimburse(reimb: RevokeReimburse, user_id: string, ip: string) {
    return this.DbConn.DBClientWrapper(async (client) => {
      try {
        //check if reimb exist
        const { rows: reimb_data, rowCount: is_exist } = await client.query(
          `
          select uid from reimbursment_emp where date_reimb = $1
          `,
          [reimb.date_revoke],
        );
        if (!is_exist) {
          throw new BadRequestException({
            message: 'Not found',
          });
        }
        const payload = {
          status: 0,
          update_by: user_id,
          update_at: moment().toISOString(),
          ip: ip,
        };
        const [que, val] = updateQuery(
          Tables.reimbursment_emp,
          payload,
          { uid: reimb_data[0].uid },
          'uid',
        );
        const { rows: result } = await client.query(que, val);
        return result[0];
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
