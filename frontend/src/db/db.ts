import Dexie, { Table } from 'dexie';

export interface LocalProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stockQty: number;
  createdAt: number;
  updatedAt: number;
  clientUpdatedAt?: number;
  deletedAt: number | null;
  version: number;
  syncStatus: 'synced' | 'pending';
}

export interface LocalCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: number;
  updatedAt: number;
  clientUpdatedAt?: number;
  deletedAt: number | null;
  version: number;
  syncStatus: 'synced' | 'pending';
}

export interface LocalSale {
  id: string;
  customerId?: string | null;
  totalAmount: number;
  saleDate: number;
  createdAt: number;
  updatedAt: number;
  clientUpdatedAt?: number;
  deletedAt: number | null;
  version: number;
  syncStatus: 'synced' | 'pending';
}

export interface LocalSaleItem {
  id: string;
  saleId: string;
  productId: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: number;
  updatedAt: number;
  clientUpdatedAt?: number;
  deletedAt: number | null;
  syncStatus: 'synced' | 'pending';
}

export interface OutboxEntry {
  id?: number;
  table: 'products' | 'customers' | 'sales' | 'saleItems';
  action: 'create' | 'update' | 'delete';
  entityId: string;
  payload: any;
  timestamp: number;
}

export interface SyncMetadata {
  key: string;
  value: any;
}

class SyncERPDatabase extends Dexie {
  products!: Table<LocalProduct, string>;
  customers!: Table<LocalCustomer, string>;
  sales!: Table<LocalSale, string>;
  saleItems!: Table<LocalSaleItem, string>;
  outbox!: Table<OutboxEntry, number>;
  syncMetadata!: Table<SyncMetadata, string>;

  constructor() {
    super('SyncERPDatabase');
    this.version(1).stores({
      products: 'id, sku, category, updatedAt, deletedAt, syncStatus',
      customers: 'id, phone, email, updatedAt, deletedAt, syncStatus',
      sales: 'id, customerId, saleDate, updatedAt, deletedAt, syncStatus',
      saleItems: 'id, saleId, productId, updatedAt, deletedAt, syncStatus',
      outbox: '++id, table, action, entityId, timestamp',
      syncMetadata: 'key',
    });
  }
}

export const db = new SyncERPDatabase();
