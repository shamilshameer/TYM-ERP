import { describe, it, expect } from 'vitest';
import { conflictResolver, SyncEntity } from '../services/sync/conflictResolver';

describe('SyncERP - Conflict Resolution Engine', () => {
  
  it('should apply remote record directly if local copy does not exist', () => {
    const remote: SyncEntity = { id: 'uuid-1', updatedAt: 1716000000, deletedAt: 0 };
    
    const result = conflictResolver.resolve(undefined, remote);
    
    expect(result.action).toBe('update');
    expect(result.item).toEqual(remote);
  });

  it('should enforce Soft Delete wins: Remote deleted record overwrites local active record', () => {
    const local: SyncEntity = { id: 'uuid-1', updatedAt: 1716999999, deletedAt: 0, syncStatus: 'synced' };
    const remote: SyncEntity = { id: 'uuid-1', updatedAt: 1716000000, deletedAt: 1716800000 };
    
    const result = conflictResolver.resolve(local, remote);
    
    expect(result.action).toBe('update');
    expect(result.item.deletedAt).toBe(1716800000);
  });

  it('should enforce Soft Delete wins: Local soft-deleted record offline (pending sync) takes precedence over remote active record', () => {
    const local: SyncEntity = { id: 'uuid-1', updatedAt: 1716000000, deletedAt: 1716500000, syncStatus: 'pending' };
    const remote: SyncEntity = { id: 'uuid-1', updatedAt: 1716900000, deletedAt: 0 };
    
    const result = conflictResolver.resolve(local, remote);
    
    expect(result.action).toBe('ignore');
    expect(result.item).toEqual(local);
  });

  it('should preserve unsynced local client edits: Local record pending push takes absolute precedence over new server record', () => {
    const local: SyncEntity = { id: 'uuid-1', updatedAt: 1716000000, deletedAt: 0, syncStatus: 'pending' };
    const remote: SyncEntity = { id: 'uuid-1', updatedAt: 1716900000, deletedAt: 0 };
    
    const result = conflictResolver.resolve(local, remote);
    
    expect(result.action).toBe('ignore');
    expect(result.item).toEqual(local);
  });

  it('should enforce Last-Write-Wins (LWW) server timestamp: Remote newer record replaces older local synced record', () => {
    const local: SyncEntity = { id: 'uuid-1', updatedAt: 1716000000, deletedAt: 0, syncStatus: 'synced' };
    const remote: SyncEntity = { id: 'uuid-1', updatedAt: 1716500000, deletedAt: 0 };
    
    const result = conflictResolver.resolve(local, remote);
    
    expect(result.action).toBe('update');
    expect(result.item).toEqual(remote);
  });

  it('should ignore remote if local synced record is identical or newer than remote', () => {
    const local: SyncEntity = { id: 'uuid-1', updatedAt: 1716900000, deletedAt: 0, syncStatus: 'synced' };
    const remote: SyncEntity = { id: 'uuid-1', updatedAt: 1716500000, deletedAt: 0 };
    
    const result = conflictResolver.resolve(local, remote);
    
    expect(result.action).toBe('ignore');
    expect(result.item).toEqual(local);
  });
});
