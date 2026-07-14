import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class SwitchTenantDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;
}

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Home Services Ltd' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  legalName!: string;

  @ApiProperty({ example: 'Acme Home Services' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  displayName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: '+441234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value !== undefined && value !== null)
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string;
}
