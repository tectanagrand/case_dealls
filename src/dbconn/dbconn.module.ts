import { Module } from '@nestjs/common';
import { DbconnService } from './dbconn.service';

@Module({
  providers: [DbconnService],
  exports: [DbconnService],
})
export class DbconnModule {}
