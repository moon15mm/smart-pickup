import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PosIntegration } from '../../database/entities/pos-integration.entity';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [TypeOrmModule.forFeature([PosIntegration]), ProductsModule],
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}
