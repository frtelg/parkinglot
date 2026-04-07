import { describe, expect, test } from "vitest";

import {
  commentResultSchema,
  itemDetailResultSchema,
  itemListResultSchema,
  itemResultSchema,
  snoozeItemResultSchema,
} from "@/lib/contracts";
import {
  authorTypeSchema,
  commentSchema,
  createCommentInputSchema,
  createItemInputSchema,
  itemSchema,
  itemStatusSchema,
  itemViewSchema,
  reorderActiveItemsInputSchema,
  snoozeItemInputSchema,
  updateCommentInputSchema,
  updateItemInputSchema,
} from "@/lib/schemas";

const timestamp = "2026-04-03T12:00:00.000Z";

describe("schemas and contracts", () => {
  test("item schemas validate and normalize item inputs", () => {
    expect(itemStatusSchema.parse("active")).toBe("active");
    expect(itemViewSchema.parse("snoozed")).toBe("snoozed");
    expect(itemViewSchema.parse("archived")).toBe("archived");
    expect(authorTypeSchema.parse("agent")).toBe("agent");

    expect(
      createItemInputSchema.parse({
        title: "  Ship tests  ",
        details: undefined,
      }),
    ).toEqual({
      title: "Ship tests",
      details: "",
    });

    expect(() => createItemInputSchema.parse({ title: "   " })).toThrow("Title is required");
    expect(() => itemViewSchema.parse("unknown")).toThrow();

    expect(
      itemSchema.parse({
        id: "0df048cf-b2f8-46f9-9a0f-6fbec60b39a2",
        title: "Write tests",
        details: "Cover exports",
        status: "resolved",
        archivedAt: null,
        resolvedAt: timestamp,
        snoozedUntil: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      }).status,
    ).toBe("resolved");

    expect(
      snoozeItemInputSchema.parse({
        snoozedUntil: "2099-04-03T13:00:00.000Z",
      }).snoozedUntil,
    ).toBe("2099-04-03T13:00:00.000Z");
  });

  test("comment schemas validate and normalize comment inputs", () => {
    expect(
      createCommentInputSchema.parse({
        body: "  Context added  ",
        authorType: "human",
        authorLabel: "  Franke  ",
      }),
    ).toEqual({
      body: "Context added",
      authorType: "human",
      authorLabel: "Franke",
    });

    expect(
      createCommentInputSchema.parse({
        body: "Note",
        authorType: "system",
        authorLabel: "   ",
      }).authorLabel,
    ).toBeNull();

    expect(() => updateCommentInputSchema.parse({ body: "" })).toThrow();

    expect(
      commentSchema.parse({
        id: "b05e453d-23f1-422b-b798-65c9d07867f5",
        itemId: "0df048cf-b2f8-46f9-9a0f-6fbec60b39a2",
        body: "Saved note",
        authorType: "agent",
        authorLabel: null,
        deletedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      }).authorType,
    ).toBe("agent");
  });

  test("update item schema requires at least one field", () => {
    expect(updateItemInputSchema.parse({ title: "Retitle" })).toEqual({ title: "Retitle" });
    expect(updateItemInputSchema.parse({ details: "Refresh details" })).toEqual({ details: "Refresh details" });
    expect(() => updateItemInputSchema.parse({})).toThrow("At least one field must be provided");
    expect(
      reorderActiveItemsInputSchema.parse({
        itemIds: [
          "0df048cf-b2f8-46f9-9a0f-6fbec60b39a2",
          "b05e453d-23f1-422b-b798-65c9d07867f5",
        ],
      }).itemIds,
    ).toHaveLength(2);
    expect(() =>
      reorderActiveItemsInputSchema.parse({
        itemIds: [
          "0df048cf-b2f8-46f9-9a0f-6fbec60b39a2",
          "0df048cf-b2f8-46f9-9a0f-6fbec60b39a2",
        ],
      }),
    ).toThrow("Item ids must be unique");
  });

  test("response contract schemas validate nested payloads", () => {
    const item = {
      id: "0df048cf-b2f8-46f9-9a0f-6fbec60b39a2",
      title: "Write tests",
      details: "Cover exports",
      status: "active" as const,
      archivedAt: null,
      resolvedAt: null,
      snoozedUntil: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const comment = {
      id: "b05e453d-23f1-422b-b798-65c9d07867f5",
      itemId: item.id,
      body: "Saved note",
      authorType: "agent" as const,
      authorLabel: null,
      deletedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    expect(itemListResultSchema.parse({ items: [item] }).items).toHaveLength(1);
    expect(itemResultSchema.parse({ item }).item.title).toBe("Write tests");
    expect(snoozeItemResultSchema.parse({ item }).item.id).toBe(item.id);
    expect(itemDetailResultSchema.parse({ item, comments: [comment] }).comments[0].id).toBe(comment.id);
    expect(commentResultSchema.parse({ comment }).comment.body).toBe("Saved note");
  });
});
