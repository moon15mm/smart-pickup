import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/)
  mobile: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}
