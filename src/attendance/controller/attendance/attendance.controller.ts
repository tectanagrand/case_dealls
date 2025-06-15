import { Body, Controller, Post, UseGuards, Request, Ip } from '@nestjs/common';
import { CheckIn, CheckOut } from 'src/attendance/dto/checkin.dto';
import { AttendanceService } from 'src/attendance/service/attendance/attendance.service';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly Attendance: AttendanceService) {}

  @Post('/clockin')
  async ClockIn(@Body() clockin: CheckIn, @Request() req, @Ip() ip) {
    const result = await this.Attendance.CheckIn(clockin, req.user.user_id, ip);
    return {
      data: result,
    };
  }

  @Post('/clockout')
  async ClockOut(@Body() clockout: CheckOut, @Request() req, @Ip() ip) {
    const result = await this.Attendance.CheckOut(
      clockout,
      req.user.user_id,
      ip,
    );
    return {
      data: result,
    };
  }
}
