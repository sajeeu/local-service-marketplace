import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {
  MessageResponse,
  ProviderAvailabilityDto,
} from '@local-service-marketplace/shared-types';
import type { Request } from 'express';
import { CurrentUser } from '../../identity/decorators/current-user.decorator';
import { Permissions } from '../../identity/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../identity/interfaces/auth.interfaces';
import { RequireTenant } from '../../tenancy/decorators/require-tenant.decorator';
import { TenantGuard } from '../../tenancy/guards/tenant.guard';
import { CreateProviderAvailabilityDto, UpdateProviderAvailabilityDto } from '../dto/provider.dto';
import { ProviderAvailabilityService } from '../services/provider-availability.service';
import { getRequestMeta } from '../utils/request-meta';

@ApiTags('providers')
@ApiBearerAuth()
@Controller({ path: 'providers/me/availability', version: '1' })
@UseGuards(TenantGuard)
@RequireTenant()
export class ProviderAvailabilityController {
  constructor(private readonly availabilityService: ProviderAvailabilityService) {}

  @Get()
  @Permissions('provider.manage')
  @ApiOperation({ summary: 'List weekly availability for the authenticated provider' })
  @ApiOkResponse({ description: 'Availability slots' })
  list(@CurrentUser() user: AuthenticatedUser): Promise<ProviderAvailabilityDto[]> {
    return this.availabilityService.listMine(user);
  }

  @Post()
  @Permissions('provider.manage')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a weekly availability slot' })
  @ApiCreatedResponse({ description: 'Created availability slot' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProviderAvailabilityDto,
    @Req() req: Request,
  ): Promise<ProviderAvailabilityDto> {
    return this.availabilityService.createMine(user, dto, getRequestMeta(req));
  }

  @Patch(':availabilityId')
  @Permissions('provider.manage')
  @ApiOperation({ summary: 'Update a weekly availability slot' })
  @ApiOkResponse({ description: 'Updated availability slot' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('availabilityId', ParseUUIDPipe) availabilityId: string,
    @Body() dto: UpdateProviderAvailabilityDto,
    @Req() req: Request,
  ): Promise<ProviderAvailabilityDto> {
    return this.availabilityService.updateMine(user, availabilityId, dto, getRequestMeta(req));
  }

  @Delete(':availabilityId')
  @Permissions('provider.manage')
  @ApiOperation({ summary: 'Delete a weekly availability slot' })
  @ApiOkResponse({ description: 'Availability slot deleted' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('availabilityId', ParseUUIDPipe) availabilityId: string,
    @Req() req: Request,
  ): Promise<MessageResponse> {
    return this.availabilityService.deleteMine(user, availabilityId, getRequestMeta(req));
  }
}
