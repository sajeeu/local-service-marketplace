import { Body, Controller, Param, ParseUUIDPipe, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ProviderPrivateProfileDto } from '@local-service-marketplace/shared-types';
import type { Request } from 'express';
import { CurrentUser } from '../../identity/decorators/current-user.decorator';
import { Permissions } from '../../identity/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../identity/interfaces/auth.interfaces';
import { ReviewProviderVerificationDto } from '../dto/provider.dto';
import { ProviderVerificationService } from '../services/provider-verification.service';
import { getRequestMeta } from '../utils/request-meta';

@ApiTags('admin-providers')
@ApiBearerAuth()
@Controller({ path: 'admin/providers', version: '1' })
export class AdminProvidersController {
  constructor(private readonly verificationService: ProviderVerificationService) {}

  @Patch(':id/verification')
  @Permissions('provider.verification.review')
  @ApiOperation({ summary: 'Review provider verification (approve, reject, or suspend)' })
  @ApiOkResponse({ description: 'Updated provider profile after verification review' })
  review(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewProviderVerificationDto,
    @Req() req: Request,
  ): Promise<ProviderPrivateProfileDto> {
    return this.verificationService.review(admin, id, dto, getRequestMeta(req));
  }
}
