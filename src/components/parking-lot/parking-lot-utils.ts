import type { Comment, Item } from "@/lib/schemas";

import { authorTypeLabels } from "./parking-lot-constants";
import type { SnoozeChoice } from "./types";

const detailUrlPattern = /https?:\/\/[^\s]+/g;

export type LinkedTextSegment =
  | { type: "text"; value: string }
  | { type: "link"; value: string };

export type ItemTone = "active" | "resolved" | "snoozed" | "archived";

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeInputValue(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function roundUpToNextHour(date: Date) {
  const next = new Date(date);
  next.setMinutes(0, 0, 0);

  if (date.getMinutes() !== 0 || date.getSeconds() !== 0 || date.getMilliseconds() !== 0) {
    next.setHours(next.getHours() + 1);
  }

  return next;
}

function toLocalDateTimeFields(date: Date) {
  return {
    date: formatDateInputValue(date),
    time: formatTimeInputValue(date),
  };
}

function splitTrailingUrlPunctuation(value: string) {
  const trailing = value.match(/[),.!?\]}]+$/)?.[0] ?? "";

  if (trailing.length === 0) {
    return { url: value, trailingText: "" };
  }

  return {
    url: value.slice(0, -trailing.length),
    trailingText: trailing,
  };
}

export function getDefaultSnoozeDateTime(choice: SnoozeChoice, now = new Date(Date.now())) {
  const next = new Date(now);

  if (choice === "later-today") {
    next.setTime(now.getTime() + 4 * 60 * 60 * 1000);
    return roundUpToNextHour(next);
  }

  if (choice === "tomorrow") {
    next.setDate(next.getDate() + 1);
    next.setHours(8, 0, 0, 0);
    return next;
  }

  if (choice === "next-week") {
    next.setDate(next.getDate() + 7);
    next.setHours(8, 0, 0, 0);
    return next;
  }

  return roundUpToNextHour(new Date(now.getTime() + 60 * 60 * 1000));
}

export function buildSnoozedUntil(date: string, time: string) {
  return new Date(`${date}T${time}`).toISOString();
}

export function getInitialSnoozeFields() {
  return toLocalDateTimeFields(getDefaultSnoozeDateTime("later-today"));
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatHumanReadableDateTime(date: string, time: string) {
  if (!date || !time) {
    return "a custom time";
  }

  const nextDate = new Date(`${date}T${time}`);

  if (Number.isNaN(nextDate.getTime())) {
    return "a custom time";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(nextDate);
}

export function getItemPresentation(item: Item): { label: string; tone: ItemTone } {
  if (item.archivedAt) {
    return { label: "Archived", tone: "archived" };
  }

  if (item.snoozedUntil) {
    return { label: "Snoozed", tone: "snoozed" };
  }

  if (item.status === "resolved") {
    return { label: "Resolved", tone: "resolved" };
  }

  return { label: "Active", tone: "active" };
}

export function getCommentAuthorLabel(comment: Comment) {
  return comment.authorLabel ?? authorTypeLabels[comment.authorType];
}

export function hasCommentBeenEdited(comment: Comment) {
  return comment.updatedAt !== comment.createdAt;
}

export function reorderItems(items: Item[], sourceId: string, targetId: string) {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(targetIndex, 0, movedItem);
  return nextItems;
}

export function buildLinkedTextSegments(text: string): LinkedTextSegment[] {
  const segments: LinkedTextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(detailUrlPattern)) {
    const start = match.index ?? 0;
    const rawUrl = match[0];

    if (start > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, start) });
    }

    const { url, trailingText } = splitTrailingUrlPunctuation(rawUrl);

    if (url.length > 0) {
      segments.push({ type: "link", value: url });
    }

    if (trailingText.length > 0) {
      segments.push({ type: "text", value: trailingText });
    }

    lastIndex = start + rawUrl.length;
  }

  if (segments.length === 0) {
    return [{ type: "text", value: text }];
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}
