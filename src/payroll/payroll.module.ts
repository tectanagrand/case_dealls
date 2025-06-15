import { Module } from '@nestjs/common';
import { PayrollService } from './services/payroll/payroll.service';
import { PayrollController } from './controllers/payroll/payroll.controller';
import { DbconnService } from 'src/dbconn/dbconn.service';

@Module({
  providers: [PayrollService, DbconnService],
  controllers: [PayrollController],
})
export class PayrollModule {}
