import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DbconnService } from 'src/dbconn/dbconn.service';
import { LoginUser } from 'src/user/dto/loginuser.dto';
import { compareSync } from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
@Injectable()
export class UserService {
  constructor(private readonly DBConn: DbconnService) {}

  async LoginUser(loginuserdto: LoginUser) {
    return this.DBConn.DBClientWrapper(async (client) => {
      try {
        const { rows: dataUser, rowCount } = await client.query(
          `select user_id, password, role from users where username = $1 `,
          [loginuserdto.username],
        );
        const hashedpass = dataUser[0].password;
        if (!rowCount) {
          throw new BadRequestException({
            message: 'Credential Invalid',
          });
        }
        //check bcrypt
        if (!compareSync(loginuserdto.password, hashedpass)) {
          throw new BadRequestException({
            message: 'Credential Invalid',
          });
        }
        //generate token
        const token = jwt.sign(
          {
            user_id: dataUser[0].user_id,
            role: dataUser[0].role,
          },
          process.env.TOKEN_KEY ?? '',
          {
            expiresIn: '10m',
          },
        );
        return {
          token,
          user_id: dataUser[0].user_id,
        };
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        throw new InternalServerErrorException({
          message: (error as Error).message,
        });
      }
    });
  }
}
