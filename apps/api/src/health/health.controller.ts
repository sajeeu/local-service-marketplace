import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthCheckResult } from '@local-service-marketplace/shared-types';
import { Public } from '../modules/identity/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Application health check' })
  @ApiOkResponse({ description: 'Health status of app, database, and Redis' })
  async check(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }
}
