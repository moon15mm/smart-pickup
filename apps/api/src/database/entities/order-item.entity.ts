import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ nullable: true })
  productId: string;

  @Column({ length: 255 })
  nameSnapshot: string;

  @Column({ length: 255 })
  nameArSnapshot: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceSnapshot: number;

  @Column()
  quantity: number;

  @Column({ nullable: true })
  notes: string;
}
