export interface SyncEntity {
  id: string;
  updatedAt: number;
  deletedAt: number;
  syncStatus?: 'synced' | 'pending';
}

export const conflictResolver = {
  /**
   * Resolves conflicts between a local IndexedDB record and a remote PostgreSQL server record.
   * 
   * Conflict Rules:
   * 1. Soft Delete Wins Always: If either is soft-deleted, it remains deleted.
   *    - If remote is soft-deleted, remote wins.
   *    - If local is soft-deleted offline (pending push), local wins.
   * 2. Unsynced Local Updates Win: If the local record has a syncStatus of 'pending',
   *    the local client changes are preserved (they will overwrite remote on the next push).
   * 3. Last-Write-Wins (LWW) Server Timestamp: If the remote server record is newer than 
   *    the local copy, remote wins.
   */
  resolve<T extends SyncEntity>(local: T | undefined, remote: T): { action: 'update' | 'ignore'; item: T } {
    if (!local) {
      // No local copy exists: Apply remote record directly
      return { action: 'update', item: remote };
    }

    // Rule 1: Soft Delete Precedence
    if (remote.deletedAt > 0) {
      // Server says it's deleted. Remote wins!
      return { action: 'update', item: remote };
    }
    if (local.deletedAt > 0) {
      // Local has deleted it offline, keeping local deleted status. Local wins!
      return { action: 'ignore', item: local };
    }

    // Rule 2: Unsynced Client Writes Take Precedence
    if (local.syncStatus === 'pending') {
      return { action: 'ignore', item: local };
    }

    // Rule 3: Last-Write-Wins (LWW) using Server Timestamp
    if (remote.updatedAt > local.updatedAt) {
      return { action: 'update', item: remote };
    }

    // Default: local record is identical or newer than remote
    return { action: 'ignore', item: local };
  }
};
