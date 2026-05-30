import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PosService } from './pos.service';

@Controller('pos')
@UseGuards(AuthGuard('jwt'))
export class PosController {
  constructor(private service: PosService) {}

  @Get('store/:storeId')
  findAll(@Param('storeId') storeId: string, @Request() req: { user: { tenantId: string } }) {
    return this.service.findByStore(storeId, req.user.tenantId);
  }

  @Post()
  create(@Body() dto: Record<string, unknown>, @Request() req: { user: { tenantId: string } }) {
    return this.service.createIntegration(dto, req.user.tenantId);
  }

  @Post(':id/sync')
  sync(@Param('id') id: string, @Request() req: { user: { tenantId: string } }) {
    return this.service.sync(id, req.user.tenantId);
  }
}
