import { IsNotEmpty, IsNumberString } from 'class-validator';

export class GeneratePayslipDTO {
  @IsNotEmpty()
  month: string;

  @IsNotEmpty()
  year: string;
}

export class GenerateSummaryDTO {
  @IsNotEmpty()
  @IsNumberString()
  year: string;
}
