import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StaffService, CreateStaffDto } from './staff.service';

@Controller('staff')
@UseGuards(AuthGuard('jwt'))
export class StaffController {
  constructor(private service: StaffService) {}

  @Get('store/:storeId')
  findAll(@Param('storeId') storeId: string, @Request() req: { user: { tenantId: string } }) {
    return this.service.findByStore(storeId, req.user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateStaffDto, @Request() req: { user: { tenantId: string } }) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string, @Request() req: { user: { tenantId: string } }) {
    return this.service.deactivate(id, req.user.tenantId);
  }
}
