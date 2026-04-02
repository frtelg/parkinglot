import { randomUUID } from "node:crypto";

import { db } from "./database.ts";
import {
  createItemInputSchema,
  itemSchema,
  itemStatusSchema,
  itemViewSchema,
  type CreateItemInput,
  type Item,
  type ItemStatus,
  type ItemView,
  type UpdateItemInput,
  updateItemInputSchema,
} from "./schemas.ts";

type ItemRow = {
  id: string;
  title: string;
  details: string;
  status: ItemStatus;
  archived_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export class ItemNotFoundError extends Error {
  constructor(id: string) {
    super(`Item ${id} was not found`);
    this.name = "ItemNotFoundError";
  }
}

function toItem(row: ItemRow): Item {
  return itemSchema.parse({
    id: row.id,
    title: row.title,
    details: row.details,
    status: row.status,
    archivedAt: row.archived_at,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function getItemRow(id: string) {
  return db
    .prepare(
      `
        SELECT id, title, details, status, archived_at, resolved_at, created_at, updated_at
        FROM items
        WHERE id = ?
      `,
    )
    .get(id) as ItemRow | undefined;
}

function requireItem(id: string) {
  const row = getItemRow(id);

  if (!row) {
    throw new ItemNotFoundError(id);
  }

  return toItem(row);
}

export function assertItemExists(id: string) {
  requireItem(id);
}

export function touchItem(id: string, updatedAt: string) {
  db.prepare(
    `
      UPDATE items
      SET updated_at = ?
      WHERE id = ?
    `,
  ).run(updatedAt, id);
}

export function listItems(view: ItemView) {
  const parsedView = itemViewSchema.parse(view);

  let whereClause = "archived_at IS NULL AND status = 'active'";

  if (parsedView === "resolved") {
    whereClause = "archived_at IS NULL AND status = 'resolved'";
  }

  if (parsedView === "archived") {
    whereClause = "archived_at IS NOT NULL";
  }

  const rows = db
    .prepare(
      `
        SELECT id, title, details, status, archived_at, resolved_at, created_at, updated_at
        FROM items
        WHERE ${whereClause}
        ORDER BY updated_at DESC, created_at DESC
      `,
    )
    .all() as ItemRow[];

  return rows.map(toItem);
}

export function getItem(id: string) {
  const row = getItemRow(id);
  return row ? toItem(row) : null;
}

export function createItem(input: CreateItemInput) {
  const parsed = createItemInputSchema.parse(input);
  const now = new Date().toISOString();
  const id = randomUUID();

  db.prepare(
    `
      INSERT INTO items (id, title, details, status, archived_at, resolved_at, created_at, updated_at)
      VALUES (?, ?, ?, 'active', NULL, NULL, ?, ?)
    `,
  ).run(id, parsed.title, parsed.details, now, now);

  return requireItem(id);
}

export function updateItem(id: string, input: UpdateItemInput) {
  const current = requireItem(id);
  const parsed = updateItemInputSchema.parse(input);
  const nextTitle = parsed.title ?? current.title;
  const nextDetails = parsed.details ?? current.details;
  const updatedAt = new Date().toISOString();

  db.prepare(
    `
      UPDATE items
      SET title = ?, details = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(nextTitle, nextDetails, updatedAt, id);

  return requireItem(id);
}

export function resolveItem(id: string) {
  requireItem(id);
  const resolvedAt = new Date().toISOString();

  db.prepare(
    `
      UPDATE items
      SET status = 'resolved', resolved_at = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(resolvedAt, resolvedAt, id);

  return requireItem(id);
}

export function archiveItem(id: string) {
  requireItem(id);
  const archivedAt = new Date().toISOString();

  db.prepare(
    `
      UPDATE items
      SET archived_at = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(archivedAt, archivedAt, id);

  return requireItem(id);
}

export function unarchiveItem(id: string) {
  requireItem(id);
  const updatedAt = new Date().toISOString();

  db.prepare(
    `
      UPDATE items
      SET archived_at = NULL, updated_at = ?
      WHERE id = ?
    `,
  ).run(updatedAt, id);

  return requireItem(id);
}

export function getViewForItem(item: Item) {
  if (item.archivedAt) {
    return "archived" as const;
  }

  return item.status === itemStatusSchema.enum.resolved ? "resolved" : "active";
}
