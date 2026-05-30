import { IsString, IsOptional, Length } from 'class-validator';

export class StaffLoginDto {
  @IsString()
  mobile: string;

  @IsOptional()
  @IsString()
  @Length(4, 6)
  pin?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
