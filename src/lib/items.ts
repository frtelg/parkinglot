import { randomUUID } from "node:crypto";

import { db } from "./database.ts";
import {
  createItemInputSchema,
  itemSchema,
  itemStatusSchema,
  itemViewSchema,
  snoozeItemInputSchema,
  type CreateItemInput,
  type Item,
  type ItemStatus,
  type ItemView,
  reorderActiveItemsInputSchema,
  type ReorderActiveItemsInput,
  type SnoozeItemInput,
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
  snoozed_until: string | null;
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

export class InvalidSnoozeStateError extends Error {
  constructor(id: string) {
    super(`Item ${id} cannot be snoozed unless it is active and not already archived or snoozed`);
    this.name = "InvalidSnoozeStateError";
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
    snoozedUntil: row.snoozed_until,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function normalizeExpiredSnoozes(now = new Date().toISOString()) {
  const expiredRows = db
    .prepare(
      `
        SELECT id
        FROM items
        WHERE archived_at IS NULL
          AND status = 'active'
          AND snoozed_until IS NOT NULL
          AND snoozed_until <= ?
        ORDER BY snoozed_until ASC, created_at ASC, id ASC
      `,
    )
    .all(now) as Array<{ id: string }>;

  if (expiredRows.length === 0) {
    return;
  }

  const startSortOrder = getNextActiveSortOrder();
  const wakeItem = db.prepare(
    `
      UPDATE items
      SET snoozed_until = NULL, active_sort_order = ?
      WHERE id = ?
    `,
  );

  db.transaction((rows: Array<{ id: string }>, start: number) => {
    rows.forEach((row, index) => {
      wakeItem.run(start + index, row.id);
    });
  })(expiredRows, startSortOrder);
}

function getItemRow(id: string) {
  normalizeExpiredSnoozes();

  return db
    .prepare(
      `
        SELECT id, title, details, status, archived_at, resolved_at, snoozed_until, active_sort_order, created_at, updated_at
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
        WHERE archived_at IS NULL AND status = 'active' AND snoozed_until IS NULL
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
  normalizeExpiredSnoozes();

  let whereClause = "archived_at IS NULL AND status = 'active' AND snoozed_until IS NULL";
  let orderByClause = "active_sort_order ASC, updated_at DESC, created_at DESC, id ASC";

  if (parsedView === "snoozed") {
    whereClause = "archived_at IS NULL AND status = 'active' AND snoozed_until IS NOT NULL";
    orderByClause = "snoozed_until ASC, updated_at DESC, created_at DESC, id ASC";
  } else if (parsedView === "resolved") {
    whereClause = "archived_at IS NULL AND status = 'resolved'";
    orderByClause = "resolved_at DESC, updated_at DESC, created_at DESC, id ASC";
  } else if (parsedView === "archived") {
    whereClause = "archived_at IS NOT NULL";
    orderByClause = "archived_at DESC, updated_at DESC, created_at DESC, id ASC";
  }

  const rows = db
    .prepare(
      `
        SELECT id, title, details, status, archived_at, resolved_at, snoozed_until, active_sort_order, created_at, updated_at
        FROM items
        WHERE ${whereClause}
        ORDER BY ${orderByClause}
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
      INSERT INTO items (id, title, details, status, archived_at, resolved_at, snoozed_until, active_sort_order, created_at, updated_at)
      VALUES (?, ?, ?, 'active', NULL, NULL, NULL, ?, ?, ?)
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

export function snoozeItem(id: string, input: SnoozeItemInput) {
  const item = requireItem(id);
  const parsed = snoozeItemInputSchema.parse(input);

  if (item.archivedAt || item.status !== itemStatusSchema.enum.active || item.snoozedUntil) {
    throw new InvalidSnoozeStateError(id);
  }

  const updatedAt = new Date().toISOString();

  db.prepare(
    `
      UPDATE items
      SET snoozed_until = ?, updated_at = ?, active_sort_order = NULL
      WHERE id = ?
    `,
  ).run(parsed.snoozedUntil, updatedAt, id);

  return requireItem(id);
}

export function resolveItem(id: string) {
  requireItem(id);
  const resolvedAt = new Date().toISOString();

  db.prepare(
    `
      UPDATE items
      SET status = 'resolved', resolved_at = ?, snoozed_until = NULL, updated_at = ?, active_sort_order = NULL
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
      SET archived_at = ?, snoozed_until = NULL, updated_at = ?, active_sort_order = NULL
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
      SET archived_at = NULL, snoozed_until = NULL, updated_at = ?, active_sort_order = ?
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

  if (item.status === itemStatusSchema.enum.active && item.snoozedUntil) {
    return "snoozed" as const;
  }

  return item.status === itemStatusSchema.enum.resolved ? "resolved" : "active";
}
