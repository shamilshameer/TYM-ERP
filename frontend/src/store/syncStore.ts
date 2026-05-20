import { create } from 'zustand';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  queueCount: number;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncedAt: (timestamp: number) => void;
  setQueueCount: (count: number) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  lastSyncedAt: null,
  queueCount: 0,
  setOnline: (online) => set({ isOnline: online }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
  setQueueCount: (count) => set({ queueCount: count }),
}));
