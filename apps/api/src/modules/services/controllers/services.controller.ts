import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  MessageResponse,
  ServiceDto,
  ServiceFaqDto,
  ServiceListResponse,
  ServiceLocationDto,
  ServiceMediaDto,
  ServiceRequirementDto,
  ServiceTagDto,
} from '@local-service-marketplace/shared-types';
import type { Request } from 'express';
import { CurrentUser } from '../../identity/decorators/current-user.decorator';
import { Permissions } from '../../identity/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../identity/interfaces/auth.interfaces';
import { RequireTenant } from '../../tenancy/decorators/require-tenant.decorator';
import { TenantGuard } from '../../tenancy/guards/tenant.guard';
import {
  CreateServiceDto,
  CreateServiceFaqDto,
  CreateServiceLocationDto,
  CreateServiceMediaDto,
  CreateServiceRequirementDto,
  CreateServiceTagDto,
  ServiceListQueryDto,
  UpdateServiceDto,
  UpdateServiceFaqDto,
  UpdateServiceLocationDto,
  UpdateServiceMediaDto,
  UpdateServiceRequirementDto,
} from '../dto/service.dto';
import { ServiceCatalogService } from '../services/service-catalog.service';
import { getRequestMeta } from '../utils/request-meta';

@ApiTags('services')
@ApiBearerAuth()
@Controller({ path: 'services', version: '1' })
@UseGuards(TenantGuard)
export class ServicesController {
  constructor(private readonly serviceCatalog: ServiceCatalogService) {}

  @Post()
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Create a draft service for the authenticated provider' })
  @ApiOkResponse({ description: 'Created service' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateServiceDto,
    @Req() req: Request,
  ): Promise<ServiceDto> {
    return this.serviceCatalog.create(user, dto, getRequestMeta(req));
  }

  @Get('me')
  @RequireTenant()
  @Permissions('service.read')
  @ApiOperation({ summary: 'List services managed in the active tenant' })
  @ApiOkResponse({ description: 'Paginated service list' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ServiceListQueryDto,
  ): Promise<ServiceListResponse> {
    return this.serviceCatalog.listMine(user, query.page ?? 1, query.limit ?? 20);
  }

  @Get(':id')
  @RequireTenant()
  @Permissions('service.read')
  @ApiOperation({ summary: 'Get a managed service by id' })
  @ApiOkResponse({ description: 'Service detail' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceDto> {
    return this.serviceCatalog.getById(user, id);
  }

  @Patch(':id')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Update a service' })
  @ApiOkResponse({ description: 'Updated service' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
    @Req() req: Request,
  ): Promise<ServiceDto> {
    return this.serviceCatalog.update(user, id, dto, getRequestMeta(req));
  }

  @Delete(':id')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Delete a non-published service' })
  @ApiOkResponse({ description: 'Deletion confirmation' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<MessageResponse> {
    return this.serviceCatalog.remove(user, id, getRequestMeta(req));
  }

  @Patch(':id/publish')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Publish a service (verified providers only)' })
  @ApiOkResponse({ description: 'Published service' })
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<ServiceDto> {
    return this.serviceCatalog.publish(user, id, getRequestMeta(req));
  }

  @Patch(':id/pause')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Pause a published service' })
  @ApiOkResponse({ description: 'Paused service' })
  pause(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<ServiceDto> {
    return this.serviceCatalog.pause(user, id, getRequestMeta(req));
  }

  @Patch(':id/archive')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Archive a service' })
  @ApiOkResponse({ description: 'Archived service' })
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<ServiceDto> {
    return this.serviceCatalog.archive(user, id, getRequestMeta(req));
  }

  @Post(':id/media')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Add media to a service' })
  addMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateServiceMediaDto,
  ): Promise<ServiceMediaDto> {
    return this.serviceCatalog.addMedia(user, id, dto);
  }

  @Patch(':id/media/:mediaId')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Update service media' })
  updateMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @Body() dto: UpdateServiceMediaDto,
  ): Promise<ServiceMediaDto> {
    return this.serviceCatalog.updateMedia(user, id, mediaId, dto);
  }

  @Delete(':id/media/:mediaId')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Delete service media' })
  removeMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ): Promise<MessageResponse> {
    return this.serviceCatalog.removeMedia(user, id, mediaId);
  }

  @Post(':id/tags')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Add a tag to a service' })
  addTag(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateServiceTagDto,
  ): Promise<ServiceTagDto> {
    return this.serviceCatalog.addTag(user, id, dto);
  }

  @Delete(':id/tags/:tagId')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Remove a service tag' })
  removeTag(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ): Promise<MessageResponse> {
    return this.serviceCatalog.removeTag(user, id, tagId);
  }

  @Post(':id/faqs')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Add a FAQ to a service' })
  addFaq(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateServiceFaqDto,
  ): Promise<ServiceFaqDto> {
    return this.serviceCatalog.addFaq(user, id, dto);
  }

  @Patch(':id/faqs/:faqId')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Update a service FAQ' })
  updateFaq(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('faqId', ParseUUIDPipe) faqId: string,
    @Body() dto: UpdateServiceFaqDto,
  ): Promise<ServiceFaqDto> {
    return this.serviceCatalog.updateFaq(user, id, faqId, dto);
  }

  @Delete(':id/faqs/:faqId')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Delete a service FAQ' })
  removeFaq(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('faqId', ParseUUIDPipe) faqId: string,
  ): Promise<MessageResponse> {
    return this.serviceCatalog.removeFaq(user, id, faqId);
  }

  @Post(':id/requirements')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Add a customer requirement' })
  addRequirement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateServiceRequirementDto,
  ): Promise<ServiceRequirementDto> {
    return this.serviceCatalog.addRequirement(user, id, dto);
  }

  @Patch(':id/requirements/:requirementId')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Update a customer requirement' })
  updateRequirement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('requirementId', ParseUUIDPipe) requirementId: string,
    @Body() dto: UpdateServiceRequirementDto,
  ): Promise<ServiceRequirementDto> {
    return this.serviceCatalog.updateRequirement(user, id, requirementId, dto);
  }

  @Delete(':id/requirements/:requirementId')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Delete a customer requirement' })
  removeRequirement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('requirementId', ParseUUIDPipe) requirementId: string,
  ): Promise<MessageResponse> {
    return this.serviceCatalog.removeRequirement(user, id, requirementId);
  }

  @Post(':id/locations')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Add a service location' })
  addLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateServiceLocationDto,
  ): Promise<ServiceLocationDto> {
    return this.serviceCatalog.addLocation(user, id, dto);
  }

  @Patch(':id/locations/:locationId')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Update a service location' })
  updateLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Body() dto: UpdateServiceLocationDto,
  ): Promise<ServiceLocationDto> {
    return this.serviceCatalog.updateLocation(user, id, locationId, dto);
  }

  @Delete(':id/locations/:locationId')
  @RequireTenant()
  @Permissions('service.manage')
  @ApiOperation({ summary: 'Delete a service location' })
  removeLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('locationId', ParseUUIDPipe) locationId: string,
  ): Promise<MessageResponse> {
    return this.serviceCatalog.removeLocation(user, id, locationId);
  }
}
