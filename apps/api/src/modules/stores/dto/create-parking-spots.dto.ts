import { IsArray, IsString, ArrayMinSize } from 'class-validator';
export class CreateParkingSpotsDto {
  @IsArray() @ArrayMinSize(1) @IsString({ each: true })
  spotNumbers: string[];
}
