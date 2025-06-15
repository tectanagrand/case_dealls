import { Module } from '@nestjs/common';
import { OvertimeService } from './service/overtime/overtime.service';
import { OvertimeController } from './controller/overtime/overtime.controller';
import { DbconnService } from 'src/dbconn/dbconn.service';

@Module({
  providers: [OvertimeService, DbconnService],
  controllers: [OvertimeController],
})
export class OvertimeModule {}
