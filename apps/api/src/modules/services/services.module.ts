import { Module, forwardRef } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import {
  AdminCategoriesController,
  CategoriesController,
} from './controllers/categories.controller';
import { ServicesController } from './controllers/services.controller';
import { CategoryService } from './services/category.service';
import { ServiceCatalogService } from './services/service-catalog.service';

@Module({
  imports: [forwardRef(() => IdentityModule), TenancyModule],
  controllers: [CategoriesController, AdminCategoriesController, ServicesController],
  providers: [CategoryService, ServiceCatalogService],
  exports: [CategoryService, ServiceCatalogService],
})
export class ServicesModule {}
