import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ValidateIf((o) => !o.fullName)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ValidateIf((o) => !o.fullName)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;
}
