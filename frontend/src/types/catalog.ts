export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface Category {
  id: number;
  name: string;
  description?: string;
  productCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  categoryName: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  sku: string;
  name: string;
  categoryId: number | '';
  description: string;
  costPrice: number | '';
  sellingPrice: number | '';
  reorderLevel: number;
  status: ProductStatus;
}
