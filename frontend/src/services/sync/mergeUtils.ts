import { SyncProductPayload, SyncCustomerPayload, SyncSalePayload, SyncSaleItemPayload } from './types';
import { LocalProduct, LocalCustomer, LocalSale, LocalSaleItem } from '../../db';

export const mergeUtils = {
  /**
   * Translates a Product remote database model to a Product local IndexedDB model.
   */
  formatProduct(p: SyncProductPayload): LocalProduct {
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
      stockQty: p.stockQty,
      createdAt: new Date(p.createdAt).getTime(),
      updatedAt: new Date(p.updatedAt).getTime(),
      clientUpdatedAt: p.clientUpdatedAt ? new Date(p.clientUpdatedAt).getTime() : undefined,
      deletedAt: p.deletedAt ? new Date(p.deletedAt).getTime() : 0, // Convert null to 0 for index support
      version: p.version,
      syncStatus: 'synced',
    };
  },

  /**
   * Translates a Customer remote database model to a Customer local IndexedDB model.
   */
  formatCustomer(c: SyncCustomerPayload): LocalCustomer {
    return {
      id: c.id,
      name: c.name,
      phone: c.phone || undefined,
      email: c.email || undefined,
      address: c.address || undefined,
      createdAt: new Date(c.createdAt).getTime(),
      updatedAt: new Date(c.updatedAt).getTime(),
      clientUpdatedAt: c.clientUpdatedAt ? new Date(c.clientUpdatedAt).getTime() : undefined,
      deletedAt: c.deletedAt ? new Date(c.deletedAt).getTime() : 0,
      version: c.version,
      syncStatus: 'synced',
    };
  },

  /**
   * Translates a Sale remote database model to a Sale local IndexedDB model.
   */
  formatSale(s: SyncSalePayload): LocalSale {
    return {
      id: s.id,
      customerId: s.customerId || null,
      totalAmount: typeof s.totalAmount === 'string' ? parseFloat(s.totalAmount) : s.totalAmount,
      saleDate: new Date(s.saleDate).getTime(),
      createdAt: new Date(s.createdAt).getTime(),
      updatedAt: new Date(s.updatedAt).getTime(),
      clientUpdatedAt: s.clientUpdatedAt ? new Date(s.clientUpdatedAt).getTime() : undefined,
      deletedAt: s.deletedAt ? new Date(s.deletedAt).getTime() : 0,
      version: s.version,
      syncStatus: 'synced',
    };
  },

  /**
   * Translates a SaleItem remote database model to a SaleItem local IndexedDB model.
   */
  formatSaleItem(i: SyncSaleItemPayload): LocalSaleItem {
    return {
      id: i.id,
      saleId: i.saleId,
      productId: i.productId,
      qty: i.qty,
      unitPrice: typeof i.unitPrice === 'string' ? parseFloat(i.unitPrice) : i.unitPrice,
      totalPrice: typeof i.totalPrice === 'string' ? parseFloat(i.totalPrice) : i.totalPrice,
      createdAt: new Date(i.createdAt).getTime(),
      updatedAt: new Date(i.updatedAt).getTime(),
      clientUpdatedAt: i.clientUpdatedAt ? new Date(i.clientUpdatedAt).getTime() : undefined,
      deletedAt: i.deletedAt ? new Date(i.deletedAt).getTime() : 0,
      syncStatus: 'synced',
    };
  }
};
