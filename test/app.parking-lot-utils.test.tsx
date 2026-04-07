// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, test, vi } from "vitest";

import type { Comment, Item } from "@/lib/schemas";
import { DetailDescriptionPreview } from "@/components/parking-lot/ui/detail-description-preview";
import {
  buildLinkedTextSegments,
  buildSnoozedUntil,
  formatHumanReadableDateTime,
  getCommentAuthorLabel,
  getDefaultSnoozeDateTime,
  getItemPresentation,
  hasCommentBeenEdited,
  reorderItems,
} from "@/components/parking-lot/parking-lot-utils";

const timestamp = "2026-04-03T12:00:00.000Z";

const baseItem: Item = {
  id: "0df048cf-b2f8-46f9-9a0f-6fbec60b39a2",
  title: "Initial item",
  details: "Seeded detail",
  status: "active",
  archivedAt: null,
  resolvedAt: null,
  snoozedUntil: null,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const baseComment: Comment = {
  id: "b05e453d-23f1-422b-b798-65c9d07867f5",
  itemId: baseItem.id,
  body: "Existing note",
  authorType: "human",
  authorLabel: null,
  deletedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
};

describe("parking lot utils", () => {
  test("getDefaultSnoozeDateTime returns preset-specific times", () => {
    const now = new Date(2026, 3, 3, 13, 20, 0, 0);
    const laterToday = getDefaultSnoozeDateTime("later-today", now);
    const tomorrow = getDefaultSnoozeDateTime("tomorrow", now);
    const nextWeek = getDefaultSnoozeDateTime("next-week", now);
    const custom = getDefaultSnoozeDateTime("custom", now);

    expect(laterToday.getDate()).toBe(3);
    expect(laterToday.getHours()).toBe(18);
    expect(laterToday.getMinutes()).toBe(0);
    expect(tomorrow.getDate()).toBe(4);
    expect(tomorrow.getHours()).toBe(8);
    expect(tomorrow.getMinutes()).toBe(0);
    expect(nextWeek.getDate()).toBe(10);
    expect(nextWeek.getHours()).toBe(8);
    expect(nextWeek.getMinutes()).toBe(0);
    expect(custom.getDate()).toBe(3);
    expect(custom.getHours()).toBe(15);
    expect(custom.getMinutes()).toBe(0);
  });

  test("buildSnoozedUntil builds local datetime iso values", () => {
    expect(buildSnoozedUntil("2026-04-12", "09:30")).toBe(new Date("2026-04-12T09:30").toISOString());
  });

  test("formatHumanReadableDateTime handles invalid and valid values", () => {
    const formatterSpy = vi.spyOn(Intl, "DateTimeFormat");

    expect(formatHumanReadableDateTime("", "")).toBe("a custom time");
    expect(formatHumanReadableDateTime("bad", "time")).toBe("a custom time");
    expect(formatHumanReadableDateTime("2026-04-12", "09:30")).not.toBe("a custom time");
    expect(formatterSpy).toHaveBeenCalled();
  });

  test("getItemPresentation reflects archived, snoozed, resolved, and active states", () => {
    expect(getItemPresentation(baseItem)).toEqual({ label: "Active", tone: "active" });
    expect(getItemPresentation({ ...baseItem, status: "resolved" })).toEqual({ label: "Resolved", tone: "resolved" });
    expect(getItemPresentation({ ...baseItem, snoozedUntil: timestamp })).toEqual({ label: "Snoozed", tone: "snoozed" });
    expect(getItemPresentation({ ...baseItem, archivedAt: timestamp, status: "resolved" })).toEqual({ label: "Archived", tone: "archived" });
  });

  test("comment helpers use explicit labels and edited timestamps", () => {
    expect(getCommentAuthorLabel(baseComment)).toBe("Human");
    expect(getCommentAuthorLabel({ ...baseComment, authorLabel: "Franke" })).toBe("Franke");
    expect(hasCommentBeenEdited(baseComment)).toBe(false);
    expect(hasCommentBeenEdited({ ...baseComment, updatedAt: "2026-04-03T12:30:00.000Z" })).toBe(true);
  });

  test("reorderItems moves items only when source and target are valid and distinct", () => {
    const secondItem = { ...baseItem, id: "36b481a2-d13b-4c4c-ad8b-71f696eb79d3", title: "Second" };
    const thirdItem = { ...baseItem, id: "4e0df6b7-2c45-4cae-a310-0d930fe5c314", title: "Third" };
    const items = [baseItem, secondItem, thirdItem];

    expect(reorderItems(items, baseItem.id, thirdItem.id).map((item) => item.title)).toEqual(["Second", "Third", "Initial item"]);
    expect(reorderItems(items, baseItem.id, baseItem.id)).toBe(items);
    expect(reorderItems(items, "missing", thirdItem.id)).toBe(items);
  });

  test("buildLinkedTextSegments keeps punctuation outside links", () => {
    expect(buildLinkedTextSegments("Read https://example.com/guide, then continue.")).toEqual([
      { type: "text", value: "Read " },
      { type: "link", value: "https://example.com/guide" },
      { type: "text", value: "," },
      { type: "text", value: " then continue." },
    ]);
  });

  test("DetailDescriptionPreview renders linked descriptions and empty fallback", () => {
    const { rerender } = render(<DetailDescriptionPreview details="Updated details with docs\nhttps://example.com/guide, plus plain text around it." />);

    const detailLink = screen.getByRole("link", { name: "https://example.com/guide" });
    expect(detailLink).toHaveAttribute("href", "https://example.com/guide");
    expect(screen.getByText(/Updated details with docs/)).toBeInTheDocument();
    expect(screen.getByText(/plus plain text around it\./)).toBeInTheDocument();

    rerender(<DetailDescriptionPreview details="" />);
    expect(screen.getByText("No extra details yet.")).toBeInTheDocument();
  });
});
