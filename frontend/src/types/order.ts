export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Shipment {
  id: number;
  carrier: string;
  trackingNumber: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  warehouseId: number;
  warehouseName: string;
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  items: OrderItem[];
  shipment?: Shipment;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemFormData {
  productId: number | '';
  quantity: number;
  unitPrice?: number;
}

export interface CreateOrderFormData {
  customerId: number | '';
  warehouseId: number | '';
  notes?: string;
  items: CreateOrderItemFormData[];
}

export interface DispatchOrderFormData {
  carrier: string;
  trackingNumber: string;
}

export interface UpdateOrderStatusFormData {
  status: OrderStatus;
}
