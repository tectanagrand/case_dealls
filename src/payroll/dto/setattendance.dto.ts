import { IsISO8601, IsNotEmpty } from 'class-validator';

export class SetAttendanceDTO {
  @IsISO8601({ strict: true })
  from: string;

  @IsISO8601({ strict: true })
  to: string;
}

export class UpdateAttendacePeriod extends SetAttendanceDTO {
  @IsNotEmpty()
  uid: string;
}
