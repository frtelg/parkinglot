import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import Database from "better-sqlite3";

import { createIsolatedRuntime } from "./helpers/isolated-runtime";

describe("items and comments data layer", () => {
  let cleanup: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    await cleanup?.();
    cleanup = (await createIsolatedRuntime()).cleanup;
  });

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  test("item exports cover lifecycle, lookups, and ordering", async () => {
    const items = await import("@/lib/items");
    const database = await import("@/lib/database");

    expect(database.databasePath.endsWith("parkinglot.db")).toBe(true);
    expect(database.db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'items'").get()).toBeTruthy();

    const first = items.createItem({ title: " First item ", details: "Created first" });
    const second = items.createItem({ title: "Second item", details: "Created second" });

    expect(items.getItem(first.id)?.title).toBe("First item");
    expect(items.getItem("00000000-0000-0000-0000-000000000000")).toBeNull();

    items.assertItemExists(first.id);
    expect(() => items.assertItemExists("missing")).toThrow(items.ItemNotFoundError);

    const updated = items.updateItem(first.id, { details: "Updated details" });
    expect(updated.details).toBe("Updated details");

    expect(items.listItems("active").map((item) => item.id)).toEqual([first.id, second.id]);

    const reordered = items.reorderActiveItems({ itemIds: [second.id, first.id] });
    expect(reordered.map((item) => item.id)).toEqual([second.id, first.id]);

    const snoozed = items.snoozeItem(first.id, { snoozedUntil: "2099-04-03T14:00:00.000Z" });
    expect(snoozed.snoozedUntil).toBe("2099-04-03T14:00:00.000Z");
    expect(items.getViewForItem(snoozed)).toBe("snoozed");
    expect(items.listItems("active").map((item) => item.id)).toEqual([second.id]);
    expect(items.listItems("snoozed").map((item) => item.id)).toEqual([first.id]);

    items.touchItem(first.id, "2026-04-03T13:00:00.000Z");
    expect(items.listItems("active").map((item) => item.id)).toEqual([second.id]);

    const third = items.createItem({ title: "Third item", details: "Created third" });
    expect(items.listItems("active").map((item) => item.id)).toEqual([second.id, third.id]);

    expect(() => items.reorderActiveItems({ itemIds: [first.id, second.id] })).toThrow(items.InvalidActiveItemOrderError);
    expect(() => items.snoozeItem(first.id, { snoozedUntil: "2099-04-03T15:00:00.000Z" })).toThrow(
      items.InvalidSnoozeStateError,
    );

    const resolved = items.resolveItem(first.id);
    expect(resolved.status).toBe("resolved");
    expect(resolved.snoozedUntil).toBeNull();
    expect(items.getViewForItem(resolved)).toBe("resolved");
    expect(items.listItems("resolved").map((item) => item.id)).toContain(first.id);

    const archived = items.archiveItem(first.id);
    expect(archived.archivedAt).not.toBeNull();
    expect(items.getViewForItem(archived)).toBe("archived");
    expect(items.listItems("archived").map((item) => item.id)).toContain(first.id);

    const unarchived = items.unarchiveItem(first.id);
    expect(unarchived.archivedAt).toBeNull();
    expect(unarchived.status).toBe("resolved");
    expect(items.listItems("active").map((item) => item.id)).toEqual([second.id, third.id]);
    expect(items.listItems("resolved").map((item) => item.id)).toContain(first.id);
  });

  test("expired snoozes wake during reads and rejoin active order at the end", async () => {
    const items = await import("@/lib/items");

    const first = items.createItem({ title: "First active", details: "Created first" });
    const second = items.createItem({ title: "Second active", details: "Created second" });

    const nowSpy = vi.spyOn(Date, "now");
    nowSpy.mockImplementation(() => new Date("2026-04-03T10:00:00.000Z").valueOf());
    items.snoozeItem(first.id, { snoozedUntil: "2026-04-03T10:30:00.000Z" });
    nowSpy.mockImplementation(() => new Date("2026-04-03T11:00:00.000Z").valueOf());

    expect(items.listItems("snoozed")).toEqual([]);
    expect(items.listItems("active").map((item) => item.id)).toEqual([second.id, first.id]);
    expect(items.getItem(first.id)?.snoozedUntil).toBeNull();

    nowSpy.mockRestore();
  });

  test("database migration seeds missing active sort order from recency", async () => {
    const runtime = await createIsolatedRuntime();

    try {
      const seededDatabase = new Database(runtime.databasePath);
      seededDatabase.exec(`
        CREATE TABLE items (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          details TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL CHECK (status IN ('active', 'resolved')),
          archived_at TEXT,
          resolved_at TEXT,
          snoozed_until TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        INSERT INTO items (id, title, details, status, archived_at, resolved_at, snoozed_until, created_at, updated_at)
        VALUES
          ('11111111-1111-1111-8111-111111111111', 'Older active', '', 'active', NULL, NULL, NULL, '2026-04-03T10:00:00.000Z', '2026-04-03T10:00:00.000Z'),
          ('22222222-2222-2222-8222-222222222222', 'Newer active', '', 'active', NULL, NULL, NULL, '2026-04-03T11:00:00.000Z', '2026-04-03T11:30:00.000Z'),
          ('33333333-3333-3333-8333-333333333333', 'Resolved item', '', 'resolved', NULL, '2026-04-03T09:00:00.000Z', NULL, '2026-04-03T09:00:00.000Z', '2026-04-03T09:00:00.000Z');
      `);
      seededDatabase.close();

      const items = await import("@/lib/items");
      expect(items.listItems("active").map((item) => item.title)).toEqual(["Newer active", "Older active"]);

      const database = await import("@/lib/database");
      const appliedMigrations = database.db.prepare("SELECT id FROM schema_migrations ORDER BY id ASC").all() as Array<{ id: string }>;
      expect(appliedMigrations.map((row) => row.id)).toContain("2026-04-03-active-sort-order");
      expect(appliedMigrations.map((row) => row.id)).toContain("2026-04-07-item-snooze");
    } finally {
      await runtime.cleanup();
    }
  });

  test("comment exports cover creation, edits, deletion, and error paths", async () => {
    const items = await import("@/lib/items");
    const comments = await import("@/lib/comments");

    const item = items.createItem({ title: "Item with comments", details: "Track comment flow" });
    const created = comments.createComment(item.id, {
      body: " First note ",
      authorType: "human",
      authorLabel: " Franke ",
    });

    expect(created.body).toBe("First note");
    expect(created.authorLabel).toBe("Franke");
    expect(comments.listComments(item.id)).toHaveLength(1);

    const updated = comments.updateComment(item.id, created.id, { body: "Edited note" });
    expect(updated.body).toBe("Edited note");
    expect(updated.updatedAt >= updated.createdAt).toBe(true);

    expect(() => comments.updateComment(item.id, "missing", { body: "Nope" })).toThrow(comments.CommentNotFoundError);

    const deleted = comments.softDeleteComment(item.id, created.id);
    expect(deleted.deletedAt).not.toBeNull();
    expect(comments.softDeleteComment(item.id, created.id).deletedAt).toBe(deleted.deletedAt);

    expect(comments.listComments(item.id)).toEqual([]);
    expect(comments.listComments(item.id, { includeDeleted: true })).toHaveLength(1);

    expect(() => comments.updateComment(item.id, created.id, { body: "Should fail" })).toThrow(
      comments.DeletedCommentError,
    );
    expect(() => comments.listComments("00000000-0000-0000-0000-000000000000")).toThrow(items.ItemNotFoundError);
  });
});
