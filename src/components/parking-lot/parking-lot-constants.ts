import type { Comment, ItemView } from "@/lib/schemas";

import type { SnoozeChoice } from "./types";

export const viewLabels: Record<ItemView, string> = {
  active: "Active",
  snoozed: "Snoozed",
  resolved: "Resolved",
  archived: "Archived",
};

export const emptyMessages: Record<ItemView, string> = {
  active: "Nothing is parked right now. Add the next thing you are juggling.",
  snoozed: "Snoozed items will wait here until their wake-up time arrives.",
  resolved: "Resolved work will collect here once something is finished.",
  archived: "Archived items will wait here when they stop deserving attention.",
};

export const snoozeChoices: SnoozeChoice[] = ["later-today", "tomorrow", "next-week", "custom"];

export const snoozeChoiceLabels: Record<SnoozeChoice, string> = {
  "later-today": "Later today",
  tomorrow: "Tomorrow",
  "next-week": "Next week",
  custom: "Custom",
};

export const authorTypeLabels: Record<Comment["authorType"], string> = {
  human: "Human",
  agent: "Agent",
  system: "System",
};
