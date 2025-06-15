import { Body, Controller, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/decorators/role.decorator';
import {
  ClockoutOvertimeDTO,
  ProposeOvertimeDTO,
} from 'src/overtime/dto/overtime.dto';
import { OvertimeService } from 'src/overtime/service/overtime/overtime.service';
import { RoleGuard } from 'src/role/role.guard';

@Controller('overtime')
@UseGuards(AuthGuard)
@Roles('EMPLOYEE')
@UseGuards(RoleGuard)
export class OvertimeController {
  constructor(private readonly Overtime: OvertimeService) {}

  @Post('propose')
  async ProposeOvertime(
    @Body() proposeovt: ProposeOvertimeDTO,
    @Req() request,
    @Ip() ip,
  ) {
    const result = await this.Overtime.ProposeOvertime(
      proposeovt,
      request.user.user_id,
      ip,
    );
    return result;
  }

  @Post('clockout')
  async ClockoutOvertime(
    @Body() clockoutovt: ClockoutOvertimeDTO,
    @Req() req,
    @Ip() ip,
  ) {
    const result = await this.Overtime.ClockoutOvertime(
      clockoutovt,
      req.user.user_id,
      ip,
    );
    return result;
  }
}
