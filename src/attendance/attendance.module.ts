import { Module } from '@nestjs/common';
import { AttendanceService } from './service/attendance/attendance.service';
import { AttendanceController } from './controller/attendance/attendance.controller';
import { DbconnService } from 'src/dbconn/dbconn.service';

@Module({
  providers: [AttendanceService, DbconnService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
