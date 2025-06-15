import {
  Body,
  Controller,
  Inject,
  Ip,
  Post,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/decorators/role.decorator';
import {
  SetAttendanceDTO,
  UpdateAttendacePeriod,
} from 'src/payroll/dto/setattendance.dto';
import { PayrollService } from 'src/payroll/services/payroll/payroll.service';
import { RoleGuard } from 'src/role/role.guard';

@Controller('payroll')
@UseGuards(AuthGuard)
@Roles('ADMIN')
@UseGuards(RoleGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('/setattendance')
  async SetAttendancePeriod(
    @Body() setattendance: SetAttendanceDTO,
    @Req() req,
    @Ip() ip,
  ) {
    const result = await this.payrollService.SetAttendancePeriod(
      setattendance,
      req.user.user_id,
      ip,
    );
    return result;
  }

  @Patch('/setattendance')
  async UpdateAttendacePeriod(
    @Body() updateattend: UpdateAttendacePeriod,
    @Req() req,
    @Ip() ip,
  ) {
    const result = await this.payrollService.UpdateAttendancePeriod(
      updateattend,
      req.user.user_id,
      ip,
    );
    return result;
  }
}
