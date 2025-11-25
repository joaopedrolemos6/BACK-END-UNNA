export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface Product {
  id: number;
  categoryId: number;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  oldPrice?: number | null;
  discountPercent?: number | null;
  sku?: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  isMain: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface Size {
  id: number;
  name: string;
  code: string;
  sortOrder: number;
}

export interface Color {
  id: number;
  name: string;
  code: string;
  hexCode?: string | null;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sizeId: number;
  colorId: number;
  sku?: string | null;
  stock: number;
  price?: number | null; // se null, usar preço do produto
  createdAt: Date;
  updatedAt: Date;
}
