import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, JoinColumn, Index,
} from 'typeorm';
import { Store } from './store.entity';
import { Product } from './product.entity';

@Entity('product_categories')
export class ProductCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  tenantId: string;

  @Index()
  @Column()
  storeId: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  nameAr: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  imageUrl: string;

  @OneToMany(() => Product, (p) => p.category)
  products: Product[];
}
