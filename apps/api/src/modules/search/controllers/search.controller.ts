import { Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AutocompleteResponse,
  MessageResponse,
  PopularSearchesResponse,
  ProviderSearchResponse,
  PublicServiceDetailDto,
  RecentlyViewedResponse,
  SearchReindexResult,
  ServiceSearchResponse,
} from '@local-service-marketplace/shared-types';
import { CurrentUser } from '../../identity/decorators/current-user.decorator';
import { Permissions } from '../../identity/decorators/permissions.decorator';
import { Public } from '../../identity/decorators/public.decorator';
import type { AuthenticatedUser } from '../../identity/interfaces/auth.interfaces';
import {
  AutocompleteQueryDto,
  PopularSearchesQueryDto,
  RecentViewsQueryDto,
  SearchProvidersQueryDto,
  SearchServicesQueryDto,
} from '../dto/search.dto';
import { SearchAdminService } from '../search-admin.service';
import { SearchService } from '../search.service';

@ApiTags('search')
@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Search published services' })
  @ApiOkResponse({ description: 'Paginated service search results' })
  search(@Query() query: SearchServicesQueryDto): Promise<ServiceSearchResponse> {
    return this.searchService.searchServices(query);
  }

  @Get('categories/:slug')
  @Public()
  @ApiOperation({ summary: 'Browse services by category slug' })
  searchByCategory(
    @Param('slug') slug: string,
    @Query() query: SearchServicesQueryDto,
  ): Promise<ServiceSearchResponse> {
    return this.searchService.searchByCategory(slug, query);
  }

  @Get('providers')
  @Public()
  @ApiOperation({ summary: 'Search providers' })
  searchProviders(@Query() query: SearchProvidersQueryDto): Promise<ProviderSearchResponse> {
    return this.searchService.searchProviders(query);
  }

  @Get('autocomplete')
  @Public()
  @ApiOperation({ summary: 'Autocomplete suggestions' })
  autocomplete(@Query() query: AutocompleteQueryDto): Promise<AutocompleteResponse> {
    return this.searchService.autocomplete(query);
  }

  @Get('popular')
  @Public()
  @ApiOperation({ summary: 'Popular search terms' })
  popular(@Query() query: PopularSearchesQueryDto): Promise<PopularSearchesResponse> {
    return this.searchService.popular(query);
  }

  @Get('recent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recently viewed services for the current user' })
  recent(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecentViewsQueryDto,
  ): Promise<RecentlyViewedResponse> {
    return this.searchService.recent(user, query);
  }

  @Post('views/:serviceId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a service view for recently viewed' })
  trackView(
    @CurrentUser() user: AuthenticatedUser,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ): Promise<MessageResponse> {
    return this.searchService.trackView(user, serviceId);
  }

  @Get('services/:id')
  @Public()
  @ApiOperation({ summary: 'Get a published service detail for discovery' })
  getService(@Param('id', ParseUUIDPipe) id: string): Promise<PublicServiceDetailDto> {
    return this.searchService.getPublicService(id);
  }
}

@ApiTags('admin-search')
@ApiBearerAuth()
@Controller({ path: 'admin/search', version: '1' })
export class AdminSearchController {
  constructor(private readonly searchAdminService: SearchAdminService) {}

  @Post('reindex')
  @Permissions('search.manage')
  @ApiOperation({ summary: 'Rebuild Meilisearch indexes from PostgreSQL' })
  @ApiOkResponse({ description: 'Reindex counts' })
  reindex(): Promise<SearchReindexResult> {
    return this.searchAdminService.reindexAll();
  }
}
