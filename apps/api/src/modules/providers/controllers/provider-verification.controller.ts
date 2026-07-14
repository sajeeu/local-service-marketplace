import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ProviderPrivateProfileDto } from '@local-service-marketplace/shared-types';
import type { Request } from 'express';
import { CurrentUser } from '../../identity/decorators/current-user.decorator';
import { Permissions } from '../../identity/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../identity/interfaces/auth.interfaces';
import { RequireTenant } from '../../tenancy/decorators/require-tenant.decorator';
import { TenantGuard } from '../../tenancy/guards/tenant.guard';
import { SubmitProviderVerificationDto } from '../dto/provider.dto';
import { ProviderVerificationService } from '../services/provider-verification.service';
import { getRequestMeta } from '../utils/request-meta';

@ApiTags('providers')
@ApiBearerAuth()
@Controller({ path: 'providers/me/verification', version: '1' })
@UseGuards(TenantGuard)
@RequireTenant()
export class ProviderVerificationController {
  constructor(private readonly verificationService: ProviderVerificationService) {}

  @Post()
  @Permissions('provider.verification.submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit provider verification document metadata' })
  @ApiCreatedResponse({ description: 'Verification submitted; profile under review' })
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitProviderVerificationDto,
    @Req() req: Request,
  ): Promise<ProviderPrivateProfileDto> {
    return this.verificationService.submitMine(user, dto, getRequestMeta(req));
  }
}
