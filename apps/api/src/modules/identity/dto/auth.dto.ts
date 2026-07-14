import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export enum AccountTypeDto {
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  BUSINESS = 'BUSINESS',
}

export class RegisterDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    example: 'SecurePass1!',
    minLength: 8,
    description: 'At least 8 characters with upper, lower, and a number',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must include upper, lower, and a number',
  })
  password!: string;

  @ApiProperty({ enum: AccountTypeDto, example: AccountTypeDto.CUSTOMER })
  @IsEnum(AccountTypeDto)
  accountType!: AccountTypeDto;

  @ApiPropertyOptional({
    example: 'Acme Home Services',
    description: 'Required when accountType is BUSINESS',
  })
  @ValidateIf((dto: RegisterDto) => dto.accountType === AccountTypeDto.BUSINESS)
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  organizationName?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass1!' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class LogoutDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  token!: string;

  @ApiProperty({
    example: 'SecurePass1!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must include upper, lower, and a number',
  })
  password!: string;
}
