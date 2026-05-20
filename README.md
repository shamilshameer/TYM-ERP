# SyncERP ⚡

> **A Futuristic, High-Performance, Offline-First Mini ERP & Point of Sale (POS) System for Retail Shops.**

SyncERP is a state-of-the-art retail register node designed with a **local-offline-first** architecture. Built for small-to-medium retail outlets, it ensures that cashiers can complete transactions, update stock levels, and register customers **100% offline** with absolute safety. Once a network connection is restored, a robust **Outbox Queue Processor** automatically negotiates data synchronization with a high-performance PostgreSQL backend using **Last-Write-Wins (LWW)** and **Soft-Delete Precedence** conflict resolution.

---

## 🏗️ System Architecture

SyncERP separates its storage layers into a fast, reactive local sandbox (IndexedDB) and a secure relational database of record (PostgreSQL).

```mermaid
graph TD
    subgraph Client [Client-Side POS Node]
        UI[Futuristic React POS UI] -->|Atomic Write / Read| Dexie[Dexie.js / IndexedDB]
        Dexie -->|Append Transaction| Outbox[Local Outbox Queue]
        Outbox -->|Transport Loop| SyncEngine[Background Sync Engine]
    end

    subgraph Server [Backend Cloud Register]
        SyncEngine <-->|REST Sync Protocols| Express[Express + TypeScript]
        Express -->|Transactional ORM| Prisma[Prisma ORM]
        Prisma <-->|Relational Store| Postgres[(PostgreSQL Database)]
    end

    style UI fill:#6366f1,stroke:#312e81,stroke-width:2px,color:#fff
    style Dexie fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff
    style Outbox fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style SyncEngine fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style Express fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    style Postgres fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
```

---

## ⚡ Offline-First Mechanics & The Outbox Pattern

### 📦 The Outbox Pattern (Crash-Safe Mutations)
To prevent database corruption and half-synced states during power failures or browser crashes, SyncERP implements a transactional **Outbox Pattern** locally inside IndexedDB. 

When a POS checkout occurs, the system wraps all mutations in a **single atomic IndexedDB transaction** using Dexie.js:
1. **Invoice Header**: Writes the sale metadata.
2. **Item Ledger**: Writes individual sale items.
3. **Product Catalog**: Deducts product stock levels optimistically (blocking transaction if stock goes below zero).
4. **Outbox Queue**: Appends the mutation details into a separate `outbox` table as a pending sync action.

Because these operations are tied to a single atomic database transaction, **either all of them succeed or none do**, guaranteeing local database consistency.

### 🔄 Pull Conflict Resolution Rules
When pulling remote updates from the server, SyncERP compares local IndexedDB records against incoming PostgreSQL records using three rules:

1. **Soft Delete Wins Always**: If a record has been marked as deleted on either side (`deletedAt > 0`), the record is immediately treated as deleted. 
   - *If remote is soft-deleted*, the local copy is soft-deleted.
   - *If local is soft-deleted offline*, the local copy remains soft-deleted (local wins) and will bubble up to delete the server copy on the next push.
2. **Unsynced Local Updates Win**: If a local record contains `syncStatus: 'pending'` (meaning the user has edited the record offline but has not successfully pushed it yet), the local version is **retained**, shielding local offline changes from being overwritten by pulled server updates.
3. **Last-Write-Wins (LWW) Server Timestamp**: Otherwise, if the server's record has a newer modification timestamp (`remote.updatedAt > local.updatedAt`), the local record is updated with the server's data.

---

## 📊 Synchronization Flow Diagrams

### 1. The PUSH Sequence (Uploading Local Changes)
Pushes local mutations queued in the IndexedDB Outbox to the Express backend.

```mermaid
sequenceDiagram
    autonumber
    participant IndexDB as Dexie (IndexedDB)
    participant Sync as Sync Engine
    participant API as Express API
    participant DB as PostgreSQL

    Sync->>IndexDB: Get all pending Outbox records
    alt Outbox is Empty
        Sync->>Sync: Skip Push Loop
    else Outbox Has Records
        Sync->>Sync: Batch and group records by Table Name
        Sync->>API: POST /sync/push (Batch payload)
        API->>DB: Begin PG Transaction (Upsert batch)
        DB-->>API: Confirm database commit
        API-->>Sync: Return HTTP 200 (Success)
        Sync->>IndexDB: Delete sent Outbox records
        Sync->>IndexDB: Update item syncStatus to 'synced'
    end
```

### 2. The PULL Sequence (Downloading Server Updates)
Retrieves server-side changes that occurred since the client's last successful sync.

```mermaid
sequenceDiagram
    autonumber
    participant Store as Zustand (syncStore)
    participant Sync as Sync Engine
    participant API as Express API
    participant Resolver as Conflict Resolver
    participant IndexDB as Dexie (IndexedDB)

    Store->>Sync: Fetch lastSyncedAt timestamp
    Sync->>API: GET /sync/pull?since={timestamp}
    API-->>Sync: Return HTTP 200 (Remote updates + Server timestamp)
    loop For each pulled record
        Sync->>IndexDB: Fetch local record by ID
        Sync->>Resolver: resolve(localItem, remoteItem)
        alt Resolver returns 'update'
            Sync->>IndexDB: Save remote version in local DB
        else Resolver returns 'ignore'
            Sync->>Sync: Retain local copy (Discard remote)
        end
    end
    Sync->>IndexDB: Save new lastSyncedAt metadata
    Sync->>Store: Update lastSyncedAt state (Zustand)
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (running locally or in Docker)

### 1. Backend Server Setup
Navigate to the `backend` folder:
```bash
cd backend
npm install
```

Configure the environment variables in a `.env` file (see [Environment Variables](#-environment-variables)):
```bash
cp .env.example .env
```

Apply database migrations to set up PostgreSQL schemas and indices:
```bash
npx prisma migrate dev --name init
```

Start the development server:
```bash
npm run dev
# Server will run on http://localhost:3001
```

### 2. Frontend client Setup
Navigate to the `frontend` folder:
```bash
cd ../frontend
npm install
```

Start the Vite development register node:
```bash
npm run dev
# Client will boot on http://localhost:3000
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
# Server Port
PORT=3001

# PostgreSQL Database Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/syncerp?schema=public"
```

---

## 🧪 Running Unit Tests

SyncERP uses the ultra-fast **Vitest** framework to run unit tests. We test core architectural algorithms in isolation without mock network overhead.

To run the unit tests, go to the `frontend` folder and run:
```bash
npm run test
# or npx vitest run
```

### What is tested?
1. **Conflict Resolution (`conflict.test.ts`)**: Proves soft-delete wins, local pending preservation, LWW server checks, and empty indexes.
2. **POS Invoice Calculations (`invoice.test.ts`)**: Proves precision rounding, tax rates applied post-discount, and dollar discount limits.
3. **Outbox Retry Backoffs (`outbox.test.ts`)**: Proves the mathematical correctness of the exponential delay multipliers and caps.

---

## ⚖️ Architectural Tradeoffs & Constraints

### Tradeoffs
- **IndexedDB Null Index Gotcha**: IndexedDB does not index `null` values. To support high-speed indexed queries on active items (filtering out deleted ones), **SyncERP stores active records with `deletedAt: 0`** instead of `null` and queries them with `.where('deletedAt').equals(0)`.
- **Server Time Trust**: To prevent client-side device clock skews (which are common on cash registers) from corrupting the server, **server-side timestamps win** during pull synchronization, ensuring a single absolute source of truth.
- **Client Wins on Offline Conflict**: If a cashier edits a product price offline, that change takes absolute precedence over server modifications until it successfully pushes, ensuring register operators are never surprised by sudden database rewrites.

### Constraints
- **Negative Stock offline**: Because the system is offline-first, multiple POS registers operating in the same store without a network connection cannot know each other's live stock reductions. This can lead to overselling if stock is highly constrained. A future peer-to-peer sync protocol would solve this.

---

## 🚀 Future Improvements
- **P2P Local-Network Sync**: Implement a WebRTC/WebSockets local mesh network so multiple registers in the same shop can sync inventory directly without needing a cloud/internet connection.
- **Delta-Compression Sync Payloads**: Only push and pull individual column modifications instead of full records to compress payloads over slow satellite/cellular networks.
- **Biometric Cashier Voids**: Lock voids and transaction deletions behind secure device pin locks.
