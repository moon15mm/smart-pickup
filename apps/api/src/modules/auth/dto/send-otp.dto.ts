import { IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/, { message: 'Invalid mobile number' })
  mobile: string;
}
