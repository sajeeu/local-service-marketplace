import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  CategoryDto,
  CategoryTreeNodeDto,
  MessageResponse,
} from '@local-service-marketplace/shared-types';
import type { Request } from 'express';
import { CurrentUser } from '../../identity/decorators/current-user.decorator';
import { Permissions } from '../../identity/decorators/permissions.decorator';
import { Public } from '../../identity/decorators/public.decorator';
import type { AuthenticatedUser } from '../../identity/interfaces/auth.interfaces';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/service.dto';
import { CategoryService } from '../services/category.service';
import { getRequestMeta } from '../utils/request-meta';

@ApiTags('categories')
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List active categories' })
  @ApiOkResponse({ description: 'Flat list of active categories' })
  list(): Promise<CategoryDto[]> {
    return this.categoryService.listActive();
  }

  @Get('tree')
  @Public()
  @ApiOperation({ summary: 'Get active category tree' })
  @ApiOkResponse({ description: 'Nested category tree' })
  tree(): Promise<CategoryTreeNodeDto[]> {
    return this.categoryService.getTree(false);
  }
}

@ApiTags('admin-categories')
@ApiBearerAuth()
@Controller({ path: 'admin/categories', version: '1' })
export class AdminCategoriesController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('tree')
  @Permissions('category.manage')
  @ApiOperation({ summary: 'Admin category tree including inactive nodes' })
  tree(): Promise<CategoryTreeNodeDto[]> {
    return this.categoryService.getTree(true);
  }

  @Post()
  @Permissions('category.manage')
  @ApiOperation({ summary: 'Create a category' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoryDto,
    @Req() req: Request,
  ): Promise<CategoryDto> {
    return this.categoryService.create(user, dto, getRequestMeta(req));
  }

  @Patch(':id')
  @Permissions('category.manage')
  @ApiOperation({ summary: 'Update a category' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req: Request,
  ): Promise<CategoryDto> {
    return this.categoryService.update(user, id, dto, getRequestMeta(req));
  }

  @Delete(':id')
  @Permissions('category.manage')
  @ApiOperation({ summary: 'Delete an empty category' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<MessageResponse> {
    return this.categoryService.remove(user, id, getRequestMeta(req));
  }
}
