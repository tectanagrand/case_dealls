import {
  Controller,
  Post,
  UseGuards,
  Body,
  Req,
  Ip,
  Get,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/decorators/role.decorator';
import { GeneratePayslipDTO } from 'src/payslip/dto/payslip.dto';
import { PayslipService } from 'src/payslip/service/payslip/payslip.service';
import { RoleGuard } from 'src/role/role.guard';

@Controller('payslip')
@UseGuards(AuthGuard)
export class PayslipController {
  constructor(private readonly Payslip: PayslipService) {}

  @Roles('EMPLOYEE')
  @UseGuards(RoleGuard)
  @Post('/generate')
  async GeneratePayslip(
    @Body() genpayslip: GeneratePayslipDTO,
    @Req() req,
    @Ip() ip,
  ) {
    const result = await this.Payslip.GeneratePayslip(
      genpayslip,
      req.user.user_id,
      ip,
    );
    return result;
  }

  @Get('/summary/:year')
  async GenerateSummary(@Req() req) {
    const { year } = req.params;
    const result = await this.Payslip.GenerateSummary({ year: year });
    return result;
  }
}
