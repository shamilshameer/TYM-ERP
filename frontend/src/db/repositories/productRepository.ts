import { db, LocalProduct } from '../db';
import { outboxRepository } from './outboxRepository';

export const productRepository = {
  async getAllActive(): Promise<LocalProduct[]> {
    // 0 represents active (non-soft-deleted) records due to IndexedDB indexing limits on nulls
    return db.products.where('deletedAt').equals(0).toArray();
  },

  async getById(id: string): Promise<LocalProduct | undefined> {
    return db.products.get(id);
  },

  async getBySku(sku: string): Promise<LocalProduct | undefined> {
    return db.products.where('sku').equals(sku).first();
  },

  // Save changes locally initiated by the user (Creates Outbox Write)
  async saveLocal(product: Omit<LocalProduct, 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<void> {
    const now = Date.now();
    const existing = await this.getById(product.id);

    const record: LocalProduct = {
      ...product,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      clientUpdatedAt: now,
      syncStatus: 'pending',
    };

    await db.transaction('rw', [db.products, db.outbox], async () => {
      await db.products.put(record);
      await outboxRepository.add({
        table: 'products',
        action: existing ? 'update' : 'create',
        entityId: product.id,
        payload: record,
      });
    });
  },

  // Soft delete locally initiated by the user (Creates Outbox Delete)
  async deleteLocal(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) return;

    const record: LocalProduct = {
      ...existing,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
      clientUpdatedAt: Date.now(),
      syncStatus: 'pending',
    };

    await db.transaction('rw', [db.products, db.outbox], async () => {
      await db.products.put(record);
      await outboxRepository.add({
        table: 'products',
        action: 'delete',
        entityId: id,
        payload: record,
      });
    });
  },

  // Save changes from Server Pull Sync (Does NOT write to outbox)
  async saveSynced(product: LocalProduct): Promise<void> {
    await db.products.put({
      ...product,
      syncStatus: 'synced',
    });
  }
};
