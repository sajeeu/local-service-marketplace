import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  ProviderListResponse,
  ProviderPrivateProfileDto,
} from '@local-service-marketplace/shared-types';
import type { Request } from 'express';
import { CurrentUser } from '../../identity/decorators/current-user.decorator';
import { Permissions } from '../../identity/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../identity/interfaces/auth.interfaces';
import { RequireTenant } from '../../tenancy/decorators/require-tenant.decorator';
import { TenantGuard } from '../../tenancy/guards/tenant.guard';
import { ProviderListQueryDto, UpdateProviderProfileDto } from '../dto/provider.dto';
import { ProviderService } from '../services/provider.service';
import { getRequestMeta } from '../utils/request-meta';

@ApiTags('providers')
@ApiBearerAuth()
@Controller({ path: 'providers', version: '1' })
@UseGuards(TenantGuard)
export class ProvidersController {
  constructor(private readonly providerService: ProviderService) {}

  @Get('me')
  @RequireTenant()
  @Permissions('provider.read')
  @ApiOperation({
    summary: 'Get or create the authenticated provider profile for the active tenant',
  })
  @ApiOkResponse({ description: 'Private provider profile' })
  getMe(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<ProviderPrivateProfileDto> {
    return this.providerService.getOrCreateMe(user, getRequestMeta(req));
  }

  @Patch('me')
  @RequireTenant()
  @Permissions('provider.manage')
  @ApiOperation({ summary: 'Update the authenticated provider profile' })
  @ApiOkResponse({ description: 'Updated private provider profile' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProviderProfileDto,
    @Req() req: Request,
  ): Promise<ProviderPrivateProfileDto> {
    return this.providerService.updateMe(user, dto, getRequestMeta(req));
  }

  @Get()
  @RequireTenant()
  @Permissions('provider.read')
  @ApiOperation({ summary: 'List providers in the active tenant' })
  @ApiOkResponse({ description: 'Paginated provider list for the active tenant' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProviderListQueryDto,
  ): Promise<ProviderListResponse> {
    return this.providerService.listForTenant(user, query.page ?? 1, query.limit ?? 20);
  }

  @Patch(':id')
  @RequireTenant()
  @Permissions('provider.manage')
  @ApiOperation({
    summary:
      'Update a provider in the active tenant (self, business OWNER/ADMIN, or platform admin)',
  })
  @ApiOkResponse({ description: 'Updated private provider profile' })
  updateById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProviderProfileDto,
    @Req() req: Request,
  ): Promise<ProviderPrivateProfileDto> {
    return this.providerService.updateById(user, id, dto, getRequestMeta(req));
  }
}
