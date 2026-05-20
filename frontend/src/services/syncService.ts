import { db } from '../db';
import { outboxRepository } from '../db/repositories/outboxRepository';
import { productRepository } from '../db/repositories/productRepository';
import { customerRepository } from '../db/repositories/customerRepository';
import { saleRepository } from '../db/repositories/saleRepository';
import { useSyncStore } from '../store/syncStore';
import { conflictResolver } from './sync/conflictResolver';
import { mergeUtils } from './sync/mergeUtils';
import { calculateBackoff } from '../utils/backoffCalculator';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SYNC_INTERVAL = 30000;
const INITIAL_BACKOFF = 2000;
const MAX_BACKOFF = 60000;

class SyncService {
  private syncTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private retryCount = 0;
  private backoffTimeout: NodeJS.Timeout | null = null;

  private getClientId(): string {
    let id = localStorage.getItem('syncerp_client_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('syncerp_client_id', id);
    }
    return id;
  }

  public start() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    const store = useSyncStore.getState();
    store.setOnline(navigator.onLine);
    this.updateQueueCount();

    this.initLastSyncTime();
    this.scheduleSync();
  }

  public stop() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.backoffTimeout) {
      clearTimeout(this.backoffTimeout);
      this.backoffTimeout = null;
    }
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline() {
    console.log('🌐 Connection Restored: Resuming synchronization.');
    const store = useSyncStore.getState();
    store.setOnline(true);
    
    this.retryCount = 0;
    if (this.backoffTimeout) {
      clearTimeout(this.backoffTimeout);
      this.backoffTimeout = null;
    }
    this.triggerSync();
  }

  private handleOffline() {
    console.log('🔌 Connection Lost: Pausing synchronization.');
    const store = useSyncStore.getState();
    store.setOnline(false);
    
    if (this.backoffTimeout) {
      clearTimeout(this.backoffTimeout);
      this.backoffTimeout = null;
    }
  }

  private async initLastSyncTime() {
    const metadata = await db.syncMetadata.get('lastSyncedAt');
    if (metadata) {
      useSyncStore.getState().setLastSyncedAt(metadata.value);
    }
  }

  public async updateQueueCount() {
    const count = await outboxRepository.getCount();
    useSyncStore.getState().setQueueCount(count);
  }

  public triggerSync() {
    if (this.isProcessing || !navigator.onLine) return;
    this.sync();
  }

  private scheduleSync() {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.triggerSync();
    }, SYNC_INTERVAL);
  }

  private async sync() {
    this.isProcessing = true;
    const store = useSyncStore.getState();
    store.setSyncing(true);

    try {
      console.log('🔄 Sync Started: Processing Outbox...');

      // 1. Process Outbox (PUSH)
      await this.processPush();

      // 2. Fetch Server Updates (PULL)
      await this.processPull();

      this.retryCount = 0;
      this.scheduleSync();
      
      console.log('✅ Sync completed successfully.');
    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.handleSyncFailure();
    } finally {
      this.isProcessing = false;
      store.setSyncing(false);
      this.updateQueueCount();
    }
  }

  private async processPush() {
    const entries = await outboxRepository.getAll();
    if (entries.length === 0) {
      console.log('📦 Outbox is empty, skipping push.');
      return;
    }

    console.log(`📤 Pushing ${entries.length} pending local changes...`);

    const groupedChanges: Record<string, Record<string, any>> = {
      products: {},
      customers: {},
      sales: {},
      saleItems: {},
    };

    for (const entry of entries) {
      groupedChanges[entry.table][entry.entityId] = entry.payload;
    }

    const payload = {
      clientId: this.getClientId(),
      clientName: `WebPOS-${this.getClientId().substring(0, 5)}`,
      changes: {
        products: Object.values(groupedChanges.products),
        customers: Object.values(groupedChanges.customers),
        sales: Object.values(groupedChanges.sales),
        saleItems: Object.values(groupedChanges.saleItems),
      },
    };

    const response = await fetch(`${BACKEND_URL}/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Sync Push failed with status code ${response.status}`);
    }

    const ids = entries.map((e) => e.id!);
    await outboxRepository.removeMany(ids);

    for (const entry of entries) {
      const pendingCount = await db.outbox.where('entityId').equals(entry.entityId).count();
      if (pendingCount === 0) {
        const table = db[entry.table] as any;
        const item = await table.get(entry.entityId);
        if (item) {
          await table.update(entry.entityId, { syncStatus: 'synced' });
        }
      }
    }
  }

  private async processPull() {
    const store = useSyncStore.getState();
    const sinceTimestamp = store.lastSyncedAt ? new Date(store.lastSyncedAt).toISOString() : new Date(0).toISOString();

    console.log(`📥 Pulling server updates since: ${sinceTimestamp}`);

    const response = await fetch(`${BACKEND_URL}/sync/pull?since=${sinceTimestamp}`);
    if (!response.ok) {
      throw new Error(`Sync Pull failed with status code ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Server returned pull failure: ${data.error}`);
    }

    const { changes, timestamp } = data;

    // Apply Server updates using Conflict Resolution: LWW + Soft Delete Precedence
    await this.applyPulledChanges('products', changes.products, productRepository.saveSynced.bind(productRepository));
    await this.applyPulledChanges('customers', changes.customers, customerRepository.saveSynced.bind(customerRepository));
    await this.applyPulledChanges('sales', changes.sales, saleRepository.saveSyncedSale.bind(saleRepository));
    await this.applyPulledChanges('saleItems', changes.saleItems, saleRepository.saveSyncedSaleItem.bind(saleRepository));

    const newSyncTime = new Date(timestamp).getTime();
    await db.syncMetadata.put({ key: 'lastSyncedAt', value: newSyncTime });
    store.setLastSyncedAt(newSyncTime);
  }

  private async applyPulledChanges(
    tableName: 'products' | 'customers' | 'sales' | 'saleItems',
    serverItems: any[],
    saveFn: (item: any) => Promise<void>
  ) {
    if (!serverItems || serverItems.length === 0) return;

    for (const serverItem of serverItems) {
      const localTable = db[tableName] as any;
      const localItem = await localTable.get(serverItem.id);

      // 1. Translate remote record representation to client schema using mergeUtils
      let formattedServerItem: any;
      if (tableName === 'products') formattedServerItem = mergeUtils.formatProduct(serverItem);
      else if (tableName === 'customers') formattedServerItem = mergeUtils.formatCustomer(serverItem);
      else if (tableName === 'sales') formattedServerItem = mergeUtils.formatSale(serverItem);
      else if (tableName === 'saleItems') formattedServerItem = mergeUtils.formatSaleItem(serverItem);

      // 2. Delegate conflict resolution logic to conflictResolver
      const { action, item } = conflictResolver.resolve(localItem, formattedServerItem);

      if (action === 'update') {
        await saveFn(item);
      }
    }
  }

  private handleSyncFailure() {
    this.retryCount++;
    const backoffDelay = calculateBackoff(this.retryCount, INITIAL_BACKOFF, MAX_BACKOFF);
    console.warn(`⏳ Retrying synchronization in ${backoffDelay / 1000}s (Retry #${this.retryCount})`);
    
    if (this.backoffTimeout) clearTimeout(this.backoffTimeout);
    this.backoffTimeout = setTimeout(() => {
      this.triggerSync();
    }, backoffDelay);
  }
}

export const syncService = new SyncService();
export default syncService;
