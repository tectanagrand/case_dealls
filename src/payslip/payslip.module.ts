import { Module } from '@nestjs/common';
import { PayslipService } from './service/payslip/payslip.service';
import { PayslipController } from './controller/payslip/payslip.controller';
import { DbconnService } from 'src/dbconn/dbconn.service';

@Module({
  providers: [PayslipService, DbconnService],
  controllers: [PayslipController],
})
export class PayslipModule {}
