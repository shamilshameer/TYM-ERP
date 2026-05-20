import { db, LocalSale, LocalSaleItem, LocalProduct } from '../db';
import { outboxRepository } from './outboxRepository';

export const saleRepository = {
  async getAllActive(): Promise<LocalSale[]> {
    return db.sales.where('deletedAt').equals(0).toArray();
  },

  async getSaleWithItems(saleId: string): Promise<{ sale: LocalSale; items: LocalSaleItem[] } | null> {
    const sale = await db.sales.get(saleId);
    if (!sale) return null;
    const items = await db.saleItems.where('saleId').equals(saleId).toArray();
    return { sale, items };
  },

  // Creates a sale locally. Wraps sale, sale-items, product stock adjustments, and outbox queue entries in a single IndexedDB transaction.
  async createSaleLocal(
    sale: Omit<LocalSale, 'createdAt' | 'updatedAt' | 'syncStatus'>,
    items: Omit<LocalSaleItem, 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus'>[]
  ): Promise<void> {
    const now = Date.now();

    const saleRecord: LocalSale = {
      ...sale,
      createdAt: now,
      updatedAt: now,
      clientUpdatedAt: now,
      syncStatus: 'pending',
    };

    // Dexie transaction ensures atomic execution and crash recovery
    await db.transaction('rw', [db.sales, db.saleItems, db.products, db.outbox], async () => {
      
      for (const item of items) {
        // Fetch product and verify stock qty (Prevent Negative Stock)
        const product = await db.products.get(item.productId);
        if (!product) {
          throw new Error(`Product with ID "${item.productId}" not found.`);
        }
        if (product.stockQty < item.qty) {
          throw new Error(`Insufficient stock for product "${product.name}". Required: ${item.qty}, Available: ${product.stockQty}`);
        }

        // Deduct stock levels optimistically
        const updatedProduct: LocalProduct = {
          ...product,
          stockQty: product.stockQty - item.qty,
          updatedAt: now,
          clientUpdatedAt: now,
          syncStatus: 'pending',
        };
        await db.products.put(updatedProduct);

        // Queue product change in outbox
        await outboxRepository.add({
          table: 'products',
          action: 'update',
          entityId: product.id,
          payload: updatedProduct,
        });

        // Save Sale Item
        const itemRecord: LocalSaleItem = {
          ...item,
          createdAt: now,
          updatedAt: now,
          clientUpdatedAt: now,
          deletedAt: 0,
          syncStatus: 'pending',
        };
        await db.saleItems.put(itemRecord);

        // Queue sale item creation in outbox
        await outboxRepository.add({
          table: 'saleItems',
          action: 'create',
          entityId: item.id,
          payload: itemRecord,
        });
      }

      // Save Sale Header
      await db.sales.put(saleRecord);

      // Queue sale write in outbox
      await outboxRepository.add({
        table: 'sales',
        action: 'create',
        entityId: sale.id,
        payload: saleRecord,
      });
    });
  },

  // Soft delete a sale (e.g. void transaction)
  async deleteSaleLocal(id: string): Promise<void> {
    const existing = await db.sales.get(id);
    if (!existing) return;

    const now = Date.now();
    const saleRecord: LocalSale = {
      ...existing,
      deletedAt: now,
      updatedAt: now,
      clientUpdatedAt: now,
      syncStatus: 'pending',
    };

    // Soft delete sale and its items
    await db.transaction('rw', [db.sales, db.saleItems, db.products, db.outbox], async () => {
      const items = await db.saleItems.where('saleId').equals(id).toArray();
      
      for (const item of items) {
        const itemRecord: LocalSaleItem = {
          ...item,
          deletedAt: now,
          updatedAt: now,
          clientUpdatedAt: now,
          syncStatus: 'pending',
        };
        await db.saleItems.put(itemRecord);
        await outboxRepository.add({
          table: 'saleItems',
          action: 'delete',
          entityId: item.id,
          payload: itemRecord,
        });

        // Restock quantities optimistically
        const product = await db.products.get(item.productId);
        if (product) {
          const updatedProduct: LocalProduct = {
            ...product,
            stockQty: product.stockQty + item.qty,
            updatedAt: now,
            clientUpdatedAt: now,
            syncStatus: 'pending',
          };
          await db.products.put(updatedProduct);
          await outboxRepository.add({
            table: 'products',
            action: 'update',
            entityId: product.id,
            payload: updatedProduct,
          });
        }
      }

      await db.sales.put(saleRecord);
      await outboxRepository.add({
        table: 'sales',
        action: 'delete',
        entityId: id,
        payload: saleRecord,
      });
    });
  },

  // Save synced records from Pull Sync
  async saveSyncedSale(sale: LocalSale): Promise<void> {
    await db.sales.put({ ...sale, syncStatus: 'synced' });
  },

  async saveSyncedSaleItem(item: LocalSaleItem): Promise<void> {
    await db.saleItems.put({ ...item, syncStatus: 'synced' });
  }
};
