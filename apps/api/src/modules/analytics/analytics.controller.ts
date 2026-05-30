import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Get('store/:storeId/dashboard')
  dashboard(
    @Param('storeId') storeId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Request() req: { user: { tenantId: string } },
  ) {
    const fromDate = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0));
    const toDate = to ? new Date(to) : new Date();
    return this.service.getDashboard(storeId, req.user.tenantId, fromDate, toDate);
  }

  @Get('store/:storeId/daily-sales')
  dailySales(
    @Param('storeId') storeId: string,
    @Query('days') days: string,
    @Request() req: { user: { tenantId: string } },
  ) {
    return this.service.getDailySales(storeId, req.user.tenantId, parseInt(days ?? '30', 10));
  }
}
