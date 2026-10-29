import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    name: string;
}