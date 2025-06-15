import { Module } from '@nestjs/common';
import { ReimbController } from './controller/reimb/reimb.controller';
import { ReimbService } from './service/reimb/reimb.service';
import { DbconnService } from 'src/dbconn/dbconn.service';

@Module({
  controllers: [ReimbController],
  providers: [ReimbService, DbconnService],
})
export class ReimbModule {}
