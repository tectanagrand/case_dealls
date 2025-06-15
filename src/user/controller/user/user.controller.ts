import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { LoginUser } from 'src/user/dto/loginuser.dto';
import { UserService } from 'src/user/service/user/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly User: UserService) {}

  @Post('login')
  async LoginUser(@Body() loginuserdto: LoginUser, @Res() res: Response) {
    const result = await this.User.LoginUser(loginuserdto);
    res.cookie('token', result.token, { httpOnly: true });
    res.status(200).send(result);
    return result;
  }
}
