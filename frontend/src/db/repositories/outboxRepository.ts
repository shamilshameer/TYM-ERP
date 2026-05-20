import { db, OutboxEntry } from '../db';

export const outboxRepository = {
  async add(entry: Omit<OutboxEntry, 'timestamp'>): Promise<number> {
    return db.outbox.add({
      ...entry,
      timestamp: Date.now(),
    });
  },

  async getAll(): Promise<OutboxEntry[]> {
    return db.outbox.orderBy('id').toArray();
  },

  async remove(id: number): Promise<void> {
    await db.outbox.delete(id);
  },

  async removeMany(ids: number[]): Promise<void> {
    await db.outbox.bulkDelete(ids);
  },

  async getCount(): Promise<number> {
    return db.outbox.count();
  },

  async clear(): Promise<void> {
    await db.outbox.clear();
  }
};
