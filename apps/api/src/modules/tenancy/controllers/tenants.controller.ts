import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AuthSessionResponse,
  CurrentTenantResponse,
  TenantListItem,
} from '@local-service-marketplace/shared-types';
import type { Request } from 'express';
import { CurrentUser } from '../../identity/decorators/current-user.decorator';
import type {
  AuthenticatedUser,
  RequestContextMeta,
} from '../../identity/interfaces/auth.interfaces';
import { RequireTenant } from '../decorators/require-tenant.decorator';
import { SwitchTenantDto } from '../dto/tenancy.dto';
import { TenantGuard } from '../guards/tenant.guard';
import { TenancyQueryService } from '../services/tenancy-query.service';

function getRequestMeta(req: Request): RequestContextMeta {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];

  return {
    ipAddress: forwardedIp?.trim() || req.ip,
    userAgent: req.headers['user-agent'],
  };
}

@ApiTags('tenants')
@ApiBearerAuth()
@Controller({ path: 'tenants', version: '1' })
@UseGuards(TenantGuard)
export class TenantsController {
  constructor(private readonly tenancyQueryService: TenancyQueryService) {}

  @Get()
  @ApiOperation({ summary: 'List tenants the authenticated user belongs to' })
  @ApiOkResponse({ description: 'Tenant memberships for the current user' })
  list(@CurrentUser() user: AuthenticatedUser): Promise<TenantListItem[]> {
    return this.tenancyQueryService.listTenantsForUser(user.id);
  }

  @Get('current')
  @RequireTenant()
  @ApiOperation({ summary: 'Get the active tenant context' })
  @ApiOkResponse({ description: 'Current tenant, organization, membership, and permissions' })
  current(@CurrentUser() user: AuthenticatedUser): Promise<CurrentTenantResponse> {
    return this.tenancyQueryService.getCurrentTenant(user.id);
  }

  @Post('switch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch the active tenant for the authenticated user' })
  @ApiOkResponse({ description: 'Updated session with new active tenant' })
  switch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SwitchTenantDto,
    @Req() req: Request,
  ): Promise<AuthSessionResponse> {
    return this.tenancyQueryService.switchTenant(user.id, dto.tenantId, getRequestMeta(req));
  }
}
