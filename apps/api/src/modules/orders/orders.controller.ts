import {
  Controller, Post, Get, Patch, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString } from 'class-validator';
import { OrdersService } from './orders.service';
import { AiCartService } from './ai-cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';

class AiParseDto {
  @IsString() rawRequest: string;
  @IsString() storeId: string;
}

@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private aiCart: AiCartService,
  ) {}

  // Public: customer creates order
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto, dto.storeId, dto.tenantId);
  }

  // Public: AI parse shopping list
  @Post('ai-parse')
  aiParse(@Body() dto: AiParseDto) {
    return this.aiCart.parseShoppingList(dto.rawRequest, dto.storeId);
  }

  // Public: customer tracks order
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  // Staff: list store orders
  @Get('store/:storeId')
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  findByStore(
    @Param('storeId') storeId: string,
    @Query() query: Record<string, string>,
    @Request() req: { user: { tenantId: string } },
  ) {
    return this.ordersService.findByStore(storeId, req.user.tenantId, query);
  }

  // Staff: update order status
  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: { user: { sub: string; tenantId: string } },
  ) {
    return this.ordersService.updateStatus(id, dto, req.user.sub, req.user.tenantId);
  }
}
