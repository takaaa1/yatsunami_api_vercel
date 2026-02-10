import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ProductsController, CategoriesController],
    providers: [ProductsService, CategoriesService],
    exports: [ProductsService, CategoriesService],
})
export class ProductsModule { }
