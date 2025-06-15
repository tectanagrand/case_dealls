import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class ProposeOvertimeDTO {
  @IsDateString()
  @IsNotEmpty()
  date_overtime: string;

  @IsNumber()
  @IsNotEmpty()
  hours: number;
}

export class ClockoutOvertimeDTO {
  @IsDateString()
  clock_out: string;
}
