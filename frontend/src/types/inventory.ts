export type InventoryTransactionType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'ADJUSTMENT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'RESERVATION'
  | 'FULFILLMENT';

export interface InventoryItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  productCategory: string;
  warehouseId: number;
  warehouseName: string;
  warehouseCity: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  isLowStock: boolean;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  quantityDelta: number;
  transactionType: InventoryTransactionType;
  referenceId?: string;
  performedBy: string;
  reason?: string;
  timestamp: string;
}

export interface StockOperationFormData {
  productId: number | '';
  warehouseId: number | '';
  quantity: number | '';
  reason: string;
  referenceId?: string;
}

export interface StockAdjustmentFormData {
  productId: number | '';
  warehouseId: number | '';
  newTotalQuantity: number | '';
  reason: string;
}

export interface StockTransferFormData {
  sourceWarehouseId: number | '';
  destinationWarehouseId: number | '';
  productId: number | '';
  quantity: number | '';
  reason: string;
}
