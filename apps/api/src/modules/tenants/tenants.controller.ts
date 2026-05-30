import { Controller, Post, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantsService, RegisterTenantDto } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private service: TenantsService) {}

  @Post('register')
  register(@Body() dto: RegisterTenantDto) {
    return this.service.register(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Request() req: { user: { tenantId: string } }) {
    return this.service.findById(req.user.tenantId);
  }

  @Put('me/settings')
  @UseGuards(AuthGuard('jwt'))
  updateSettings(
    @Body() settings: Record<string, unknown>,
    @Request() req: { user: { tenantId: string } },
  ) {
    return this.service.updateSettings(req.user.tenantId, settings);
  }
}
