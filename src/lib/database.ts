import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

type TableInfoRow = {
  name: string;
};

type AppliedMigrationRow = {
  id: string;
};

type Migration = {
  id: string;
  apply: (database: Database.Database) => void;
};

const defaultDatabasePath = path.join(process.cwd(), "data", "parkinglot.db");

export const databasePath = process.env.PARKINGLOT_DB_PATH ?? defaultDatabasePath;

mkdirSync(path.dirname(databasePath), { recursive: true });

function hasColumn(database: Database.Database, tableName: string, columnName: string) {
  const rows = database.prepare(`PRAGMA table_info(${tableName})`).all() as TableInfoRow[];
  return rows.some((row) => row.name === columnName);
}

function ensureMigrationTable(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}

function seedMissingActiveSortOrder(database: Database.Database) {
  const activeRows = database
    .prepare(
      `
        SELECT id
        FROM items
        WHERE archived_at IS NULL
          AND status = 'active'
          AND active_sort_order IS NULL
        ORDER BY updated_at DESC, created_at DESC, id ASC
      `,
    )
    .all() as Array<{ id: string }>;

  if (activeRows.length === 0) {
    return;
  }

  const currentMax = database
    .prepare(
      `
        SELECT COALESCE(MAX(active_sort_order), -1) AS max_sort_order
        FROM items
        WHERE archived_at IS NULL AND status = 'active'
      `,
    )
    .get() as { max_sort_order: number };

  const updateSortOrder = database.prepare(`UPDATE items SET active_sort_order = ? WHERE id = ?`);
  const seedRows = database.transaction((rows: Array<{ id: string }>, start: number) => {
    rows.forEach((row, index) => {
      updateSortOrder.run(start + index + 1, row.id);
    });
  });

  seedRows(activeRows, currentMax.max_sort_order ?? -1);
}

const migrations: Migration[] = [
  {
    id: "2026-04-03-active-sort-order",
    apply(database) {
      if (!hasColumn(database, "items", "active_sort_order")) {
        database.exec("ALTER TABLE items ADD COLUMN active_sort_order INTEGER");
      }

      database.exec(`
        CREATE INDEX IF NOT EXISTS idx_items_active_sort_order
          ON items (archived_at, status, active_sort_order ASC);
      `);

      seedMissingActiveSortOrder(database);
    },
  },
];

function applyMigrations(database: Database.Database) {
  ensureMigrationTable(database);

  const appliedMigrations = new Set(
    (database.prepare("SELECT id FROM schema_migrations ORDER BY id ASC").all() as AppliedMigrationRow[]).map((row) => row.id),
  );

  const recordMigration = database.prepare(`
    INSERT INTO schema_migrations (id, applied_at)
    VALUES (?, ?)
  `);

  for (const migration of migrations) {
    if (appliedMigrations.has(migration.id)) {
      continue;
    }

    database.transaction(() => {
      migration.apply(database);
      recordMigration.run(migration.id, new Date().toISOString());
    })();
  }
}

function ensureCoreSchema(database: Database.Database) {
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
    active_sort_order INTEGER,
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

function initializeDatabase(database: Database.Database) {
  database.pragma("busy_timeout = 5000");
  database.pragma("journal_mode = WAL");
  ensureCoreSchema(database);
  applyMigrations(database);
}

const globalForDatabase = globalThis as typeof globalThis & {
  parkingLotDb?: Database.Database;
};

export const db = globalForDatabase.parkingLotDb ?? new Database(databasePath);

// Run idempotent schema setup on every module load so hot-reloaded dev sessions
// still pick up local schema migrations even when the shared DB connection persists.
initializeDatabase(db);

if (!globalForDatabase.parkingLotDb) {
  globalForDatabase.parkingLotDb = db;
}
