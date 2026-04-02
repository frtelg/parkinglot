import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const defaultDatabasePath = path.join(process.cwd(), "data", "parkinglot.db");

export const databasePath = process.env.PARKINGLOT_DB_PATH ?? defaultDatabasePath;

mkdirSync(path.dirname(databasePath), { recursive: true });

function initializeDatabase(database: Database.Database) {
  database.pragma("busy_timeout = 5000");
  database.pragma("journal_mode = WAL");

  database.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('active', 'resolved')),
    archived_at TEXT,
    resolved_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_items_active
    ON items (archived_at, status, updated_at DESC);

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    body TEXT NOT NULL,
    author_type TEXT NOT NULL CHECK (author_type IN ('human', 'agent', 'system')),
    author_label TEXT,
    deleted_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_comments_item
    ON comments (item_id, created_at ASC);
`);
}

const globalForDatabase = globalThis as typeof globalThis & {
  parkingLotDb?: Database.Database;
};

export const db = globalForDatabase.parkingLotDb ?? new Database(databasePath);

if (!globalForDatabase.parkingLotDb) {
  initializeDatabase(db);
  globalForDatabase.parkingLotDb = db;
}
