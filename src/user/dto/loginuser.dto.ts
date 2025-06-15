import { IsNotEmpty } from 'class-validator';

export class LoginUser {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  password: string;
}
