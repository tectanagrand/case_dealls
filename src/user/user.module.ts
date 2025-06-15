import { Module } from '@nestjs/common';
import { UserController } from './controller/user/user.controller';
import { UserService } from './service/user/user.service';
import { DbconnService } from 'src/dbconn/dbconn.service';

@Module({
  controllers: [UserController],
  providers: [UserService, DbconnService],
})
export class UserModule {}
