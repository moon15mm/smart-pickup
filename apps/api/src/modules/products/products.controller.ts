import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private service: ProductsService) {}

  // Public: browse store catalog
  @Get('store/:storeId')
  findAll(
    @Param('storeId') storeId: string,
    @Query() query: Record<string, string>,
    @Query('tenantId') tenantId: string,
  ) {
    return this.service.findAll(storeId, tenantId, query);
  }

  @Get('store/:storeId/categories')
  getCategories(
    @Param('storeId') storeId: string,
    @Query('tenantId') tenantId: string,
  ) {
    return this.service.getCategories(storeId, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.service.findById(id, tenantId);
  }

  // Staff/owner: manage products
  @Post('store/:storeId')
  @UseGuards(AuthGuard('jwt'))
  create(
    @Param('storeId') storeId: string,
    @Body() dto: CreateProductDto,
    @Request() req: { user: { tenantId: string } },
  ) {
    return this.service.create(dto, storeId, req.user.tenantId);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Request() req: { user: { tenantId: string } },
  ) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string, @Request() req: { user: { tenantId: string } }) {
    return this.service.remove(id, req.user.tenantId);
  }
}
