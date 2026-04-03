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
  reorderActiveItemsInputSchema,
  type ReorderActiveItemsInput,
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
  active_sort_order: number | null;
  created_at: string;
  updated_at: string;
};

export class ItemNotFoundError extends Error {
  constructor(id: string) {
    super(`Item ${id} was not found`);
    this.name = "ItemNotFoundError";
  }
}

export class InvalidActiveItemOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidActiveItemOrderError";
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
        SELECT id, title, details, status, archived_at, resolved_at, active_sort_order, created_at, updated_at
        FROM items
        WHERE id = ?
      `,
    )
    .get(id) as ItemRow | undefined;
}

function getNextActiveSortOrder() {
  const row = db
    .prepare(
      `
        SELECT COALESCE(MAX(active_sort_order), -1) + 1 AS next_sort_order
        FROM items
        WHERE archived_at IS NULL AND status = 'active'
      `,
    )
    .get() as { next_sort_order: number };

  return row.next_sort_order;
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
        SELECT id, title, details, status, archived_at, resolved_at, active_sort_order, created_at, updated_at
        FROM items
        WHERE ${whereClause}
        ORDER BY
          CASE
            WHEN archived_at IS NULL AND status = 'active' THEN active_sort_order
          END ASC,
          updated_at DESC,
          created_at DESC,
          id ASC
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
      INSERT INTO items (id, title, details, status, archived_at, resolved_at, active_sort_order, created_at, updated_at)
      VALUES (?, ?, ?, 'active', NULL, NULL, ?, ?, ?)
    `,
  ).run(id, parsed.title, parsed.details, getNextActiveSortOrder(), now, now);

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
      SET status = 'resolved', resolved_at = ?, updated_at = ?, active_sort_order = NULL
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
      SET archived_at = ?, updated_at = ?, active_sort_order = NULL
      WHERE id = ?
    `,
  ).run(archivedAt, archivedAt, id);

  return requireItem(id);
}

export function unarchiveItem(id: string) {
  const item = requireItem(id);
  const updatedAt = new Date().toISOString();
  const nextActiveSortOrder = item.status === itemStatusSchema.enum.active ? getNextActiveSortOrder() : null;

  db.prepare(
    `
      UPDATE items
      SET archived_at = NULL, updated_at = ?, active_sort_order = ?
      WHERE id = ?
    `,
  ).run(updatedAt, nextActiveSortOrder, id);

  return requireItem(id);
}

export function reorderActiveItems(input: ReorderActiveItemsInput) {
  const parsed = reorderActiveItemsInputSchema.parse(input);
  const activeItems = listItems("active");

  if (activeItems.length !== parsed.itemIds.length) {
    throw new InvalidActiveItemOrderError("Active item order must include every active item exactly once");
  }

  const activeIds = new Set(activeItems.map((item) => item.id));
  if (parsed.itemIds.some((id) => !activeIds.has(id))) {
    throw new InvalidActiveItemOrderError("Active item order can only contain active item ids");
  }

  const updateOrder = db.prepare(
    `
      UPDATE items
      SET active_sort_order = ?
      WHERE id = ?
    `,
  );

  db.transaction((itemIds: string[]) => {
    itemIds.forEach((itemId, index) => {
      updateOrder.run(index, itemId);
    });
  })(parsed.itemIds);

  return listItems("active");
}

export function getViewForItem(item: Item) {
  if (item.archivedAt) {
    return "archived" as const;
  }

  return item.status === itemStatusSchema.enum.resolved ? "resolved" : "active";
}
