import type { Comment, Item, ItemView } from "@/lib/schemas";

export type ParkingLotAppProps = {
  initialItems: Item[];
  initialSelectedDetail: ItemDetail | null;
};

export type ItemDetail = {
  item: Item;
  comments: Comment[];
};

export type ItemsResponse = {
  items: Item[];
};

export type ItemResponse = {
  item: Item;
};

export type ReorderItemsResponse = {
  items: Item[];
};

export type CommentResponse = {
  comment: Comment;
};

export type ItemCreatedEvent = {
  type: "item-created";
  itemId: string;
  view: ItemView;
};

export type SnoozeChoice = "later-today" | "tomorrow" | "next-week" | "custom";
