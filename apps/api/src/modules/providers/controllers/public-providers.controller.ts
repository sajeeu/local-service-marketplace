import { Controller, Get, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ProviderPublicProfileDto } from '@local-service-marketplace/shared-types';
import { Public } from '../../identity/decorators/public.decorator';
import { ProviderService } from '../services/provider.service';

@ApiTags('providers')
@Controller({ path: 'providers', version: '1' })
export class PublicProvidersController {
  constructor(private readonly providerService: ProviderService) {}

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a public provider profile' })
  @ApiOkResponse({ description: 'Public provider profile (no private fields)' })
  async getPublic(@Param('id', ParseUUIDPipe) id: string): Promise<ProviderPublicProfileDto> {
    try {
      return await this.providerService.getPublicProfile(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}
