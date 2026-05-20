import { db, LocalCustomer } from '../db';
import { outboxRepository } from './outboxRepository';

export const customerRepository = {
  async getAllActive(): Promise<LocalCustomer[]> {
    return db.customers.where('deletedAt').equals(0).toArray();
  },

  async getById(id: string): Promise<LocalCustomer | undefined> {
    return db.customers.get(id);
  },

  // Save changes locally initiated by user (Creates Outbox Write)
  async saveLocal(customer: Omit<LocalCustomer, 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<void> {
    const now = Date.now();
    const existing = await this.getById(customer.id);

    const record: LocalCustomer = {
      ...customer,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      clientUpdatedAt: now,
      syncStatus: 'pending',
    };

    await db.transaction('rw', [db.customers, db.outbox], async () => {
      await db.customers.put(record);
      await outboxRepository.add({
        table: 'customers',
        action: existing ? 'update' : 'create',
        entityId: customer.id,
        payload: record,
      });
    });
  },

  // Soft delete locally initiated by user (Creates Outbox Delete)
  async deleteLocal(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) return;

    const record: LocalCustomer = {
      ...existing,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
      clientUpdatedAt: Date.now(),
      syncStatus: 'pending',
    };

    await db.transaction('rw', [db.customers, db.outbox], async () => {
      await db.customers.put(record);
      await outboxRepository.add({
        table: 'customers',
        action: 'delete',
        entityId: id,
        payload: record,
      });
    });
  },

  // Save changes from Server Pull Sync (Does NOT write to outbox)
  async saveSynced(customer: LocalCustomer): Promise<void> {
    await db.customers.put({
      ...customer,
      syncStatus: 'synced',
    });
  }
};
