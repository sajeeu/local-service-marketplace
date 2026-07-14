import { Module, forwardRef } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { OrganizationsController } from './controllers/organizations.controller';
import { TenantsController } from './controllers/tenants.controller';
import { TenantGuard } from './guards/tenant.guard';
import { MembershipService } from './services/membership.service';
import { OrganizationService } from './services/organization.service';
import { TenancyProvisionService } from './services/tenancy-provision.service';
import { TenancyQueryService } from './services/tenancy-query.service';
import { TenantContextService } from './services/tenant-context.service';
import { TenantService } from './services/tenant.service';

@Module({
  imports: [forwardRef(() => IdentityModule)],
  controllers: [TenantsController, OrganizationsController],
  providers: [
    TenantService,
    OrganizationService,
    MembershipService,
    TenantContextService,
    TenancyProvisionService,
    TenancyQueryService,
    TenantGuard,
  ],
  exports: [
    TenantService,
    OrganizationService,
    MembershipService,
    TenantContextService,
    TenancyProvisionService,
    TenancyQueryService,
    TenantGuard,
  ],
})
export class TenancyModule {}
