export interface SyncProductPayload {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: string | number;
  stockQty: number;
  createdAt: string | number;
  updatedAt: string | number;
  clientUpdatedAt?: string | number | null;
  deletedAt: string | number | null;
  version: number;
}

export interface SyncCustomerPayload {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: string | number;
  updatedAt: string | number;
  clientUpdatedAt?: string | number | null;
  deletedAt: string | number | null;
  version: number;
}

export interface SyncSalePayload {
  id: string;
  customerId?: string | null;
  totalAmount: string | number;
  saleDate: string | number;
  createdAt: string | number;
  updatedAt: string | number;
  clientUpdatedAt?: string | number | null;
  deletedAt: string | number | null;
  version: number;
}

export interface SyncSaleItemPayload {
  id: string;
  saleId: string;
  productId: string;
  qty: number;
  unitPrice: string | number;
  totalPrice: string | number;
  createdAt: string | number;
  updatedAt: string | number;
  clientUpdatedAt?: string | number | null;
  deletedAt: string | number | null;
}

export interface SyncChanges {
  products: SyncProductPayload[];
  customers: SyncCustomerPayload[];
  sales: SyncSalePayload[];
  saleItems: SyncSaleItemPayload[];
}

export interface SyncPushPayload {
  clientId: string;
  clientName: string;
  changes: SyncChanges;
}

export interface SyncPullResponse {
  success: boolean;
  timestamp: string;
  changes: SyncChanges;
  error?: string;
}
