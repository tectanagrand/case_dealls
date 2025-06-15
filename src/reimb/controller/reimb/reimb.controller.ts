import {
  Body,
  Controller,
  Delete,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/decorators/role.decorator';
import { InvokeReimburse, RevokeReimburse } from 'src/reimb/dto/reimb.dto';
import { ReimbService } from 'src/reimb/service/reimb/reimb.service';
import { RoleGuard } from 'src/role/role.guard';

@Controller('reimb')
@UseGuards(AuthGuard)
@Roles('EMPLOYEE')
@UseGuards(RoleGuard)
export class ReimbController {
  constructor(private readonly Reimb: ReimbService) {}

  @Post('')
  async CreateReimbursement(
    @Body() reimb: InvokeReimburse,
    @Req() req,
    @Ip() ip,
  ) {
    const result = await this.Reimb.InvokeReimburse(
      reimb,
      req.user.user_id,
      ip,
    );
    return result;
  }

  @Delete('')
  async RevokeReimbursement(
    @Body() reimb: RevokeReimburse,
    @Req() req,
    @Ip() ip,
  ) {
    const result = await this.Reimb.RevokeReimburse(
      reimb,
      req.user.user_id,
      ip,
    );
    return result;
  }
}
