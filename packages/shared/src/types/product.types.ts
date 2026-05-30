export interface Product {
  id: string;
  tenantId: string;
  storeId: string;
  sku?: string;
  barcode?: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  categoryId?: string;
  price: number;
  salePrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
  posRefId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  nameAr: string;
  sortOrder: number;
  imageUrl?: string;
}
