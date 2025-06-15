import {
  IsDateString,
  IsNumber,
  IsString,
  MaxLength,
  NotEquals,
} from 'class-validator';

export class InvokeReimburse {
  @IsDateString()
  date_reimb: string;

  @IsNumber()
  @NotEquals(0)
  amount_reimb: number;

  @IsString()
  @MaxLength(500)
  reimb_desc: string;
}

export class RevokeReimburse {
  @IsDateString()
  date_revoke: string;
}
