export type WarehouseStatus = 'ACTIVE' | 'INACTIVE';

export interface Warehouse {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  managerName?: string;
  status: WarehouseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseFormData {
  name: string;
  address: string;
  city: string;
  capacity: number | '';
  managerName: string;
  status: WarehouseStatus;
}
