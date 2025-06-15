import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbconnModule } from './dbconn/dbconn.module';
import { PayrollModule } from './payroll/payroll.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AttendanceModule } from './attendance/attendance.module';
import { OvertimeModule } from './overtime/overtime.module';
import { ReimbModule } from './reimb/reimb.module';
import { PayslipModule } from './payslip/payslip.module';

ConfigModule.forRoot();

@Module({
  imports: [
    DbconnModule,
    PayrollModule,
    UserModule,
    AttendanceModule,
    OvertimeModule,
    ReimbModule,
    PayslipModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
