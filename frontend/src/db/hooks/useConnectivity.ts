import { useSyncStore } from '../../store/syncStore';
import { syncService } from '../../services/syncService';

export const useConnectivity = () => {
  const isOnline = useSyncStore((state) => state.isOnline);
  const isSyncing = useSyncStore((state) => state.isSyncing);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const queueCount = useSyncStore((state) => state.queueCount);

  const syncNow = () => {
    syncService.triggerSync();
  };

  return {
    isOnline,
    isSyncing,
    lastSyncedAt,
    queueCount,
    syncNow,
  };
};
