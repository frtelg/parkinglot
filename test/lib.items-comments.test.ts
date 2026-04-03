import { afterEach, beforeEach, describe, expect, test } from "vitest";

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

    items.touchItem(first.id, "2026-04-03T13:00:00.000Z");
    expect(items.listItems("active")[0]?.id).toBe(first.id);

    const resolved = items.resolveItem(first.id);
    expect(resolved.status).toBe("resolved");
    expect(items.getViewForItem(resolved)).toBe("resolved");
    expect(items.listItems("resolved").map((item) => item.id)).toContain(first.id);

    const archived = items.archiveItem(first.id);
    expect(archived.archivedAt).not.toBeNull();
    expect(items.getViewForItem(archived)).toBe("archived");
    expect(items.listItems("archived").map((item) => item.id)).toContain(first.id);

    const unarchived = items.unarchiveItem(first.id);
    expect(unarchived.archivedAt).toBeNull();
    expect(unarchived.status).toBe("resolved");
    expect(items.listItems("active").map((item) => item.id)).toContain(second.id);
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
