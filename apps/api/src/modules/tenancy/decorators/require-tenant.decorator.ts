import { SetMetadata } from '@nestjs/common';

export const REQUIRE_TENANT_KEY = 'requireTenant';

/** Marks a route as requiring a resolved active tenant + ACTIVE membership. */
export const RequireTenant = () => SetMetadata(REQUIRE_TENANT_KEY, true);
