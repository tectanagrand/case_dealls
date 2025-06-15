import { IsDateString, IsEmpty } from 'class-validator';

export class CheckIn {
  @IsDateString()
  ts_checkin: string;
}

export class CheckOut {
  @IsDateString()
  ts_checkout: string;
}
