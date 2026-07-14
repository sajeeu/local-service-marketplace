import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ProviderQualificationInputDto {
  @ApiProperty({ example: 'NVQ Level 3 Plumbing' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'City & Guilds' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  issuer!: string;

  @ApiProperty({ example: '2020-06-15' })
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional({ example: '2028-06-15' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsDateString()
  expiryDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  documentUrl?: string | null;
}

export class ProviderCertificationInputDto {
  @ApiProperty({ example: 'Gas Safe Registered' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'Gas Safe Register' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  issuer!: string;

  @ApiPropertyOptional({ example: '2021-01-10' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsDateString()
  issueDate?: string | null;

  @ApiPropertyOptional({ example: '2026-01-10' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsDateString()
  expiryDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  credentialId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  documentUrl?: string | null;
}

export class ProviderLanguageInputDto {
  @ApiProperty({ example: 'en' })
  @IsString()
  @MinLength(2)
  @MaxLength(16)
  code!: string;

  @ApiProperty({ example: 'English' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  label!: string;

  @ApiPropertyOptional({ example: 'native' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  proficiency?: string | null;
}

export class UpdateProviderProfileDto {
  @ApiPropertyOptional({ example: 'Alex Rivera' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  profilePhoto?: string | null;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(80)
  yearsOfExperience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [ProviderQualificationInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProviderQualificationInputDto)
  qualifications?: ProviderQualificationInputDto[];

  @ApiPropertyOptional({ type: [ProviderCertificationInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProviderCertificationInputDto)
  certifications?: ProviderCertificationInputDto[];

  @ApiPropertyOptional({ type: [ProviderLanguageInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ProviderLanguageInputDto)
  languages?: ProviderLanguageInputDto[];
}

export class CreateProviderAvailabilityDto {
  @ApiProperty({ example: 1, description: '0 = Sunday … 6 = Saturday' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm 24-hour format' })
  startTime!: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @Matches(TIME_PATTERN, { message: 'endTime must be in HH:mm 24-hour format' })
  endTime!: string;

  @ApiProperty({ example: 'Europe/London' })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  timezone!: string;
}

export class UpdateProviderAvailabilityDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm 24-hour format' })
  startTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'endTime must be in HH:mm 24-hour format' })
  endTime?: string;

  @ApiPropertyOptional({ example: 'Europe/London' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  timezone?: string;
}

export class VerificationDocumentMetaDto {
  @ApiProperty({ example: 'id-card.pdf' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  filename!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  mimeType!: string;

  @ApiProperty({ example: 102400 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20_000_000)
  sizeBytes!: number;

  @ApiPropertyOptional({ example: 'https://example.com/uploads/id-card.pdf' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  url?: string;
}

export class SubmitProviderVerificationDto {
  @ApiProperty({ type: [VerificationDocumentMetaDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => VerificationDocumentMetaDto)
  documents!: VerificationDocumentMetaDto[];
}

export class ReviewProviderVerificationDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT', 'SUSPEND'] })
  @IsIn(['APPROVE', 'REJECT', 'SUSPEND'])
  action!: 'APPROVE' | 'REJECT' | 'SUSPEND';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;
}

export class ProviderListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
