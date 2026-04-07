import { createComment, listComments, softDeleteComment, updateComment } from "./comments.ts";
import { publishItemCreatedEvent } from "./item-events.ts";
import {
  commentResultSchema,
  itemDetailResultSchema,
  itemListResultSchema,
  reorderItemsResultSchema,
  itemResultSchema,
  type CommentResult,
  type ItemDetailResult,
  type ItemListResult,
  type ItemResult,
  type ReorderItemsResult,
} from "./contracts.ts";
import {
  archiveItem,
  createItem,
  getViewForItem,
  getItem,
  ItemNotFoundError,
  listItems,
  reorderActiveItems,
  resolveItem,
  snoozeItem,
  unarchiveItem,
  updateItem,
} from "./items.ts";
import {
  type CreateCommentInput,
  type CreateItemInput,
  itemViewSchema,
  reorderActiveItemsInputSchema,
  type ReorderActiveItemsInput,
  type ItemView,
  snoozeItemInputSchema,
  type SnoozeItemInput,
  type UpdateCommentInput,
  type UpdateItemInput,
} from "./schemas.ts";

export function listParkingLotItems(view: ItemView): ItemListResult {
  return itemListResultSchema.parse({
    items: listItems(itemViewSchema.parse(view)),
  });
}

export function getParkingLotItemDetail(id: string): ItemDetailResult {
  const item = getItem(id);

  if (!item) {
    throw new ItemNotFoundError(id);
  }

  return itemDetailResultSchema.parse({
    item,
    comments: listComments(id),
  });
}

export function createParkingLotItem(input: CreateItemInput): ItemResult {
  const item = createItem(input);
  publishItemCreatedEvent({ itemId: item.id, view: getViewForItem(item) });
  return itemResultSchema.parse({ item });
}

export function updateParkingLotItem(id: string, input: UpdateItemInput): ItemResult {
  return itemResultSchema.parse({ item: updateItem(id, input) });
}

export function snoozeParkingLotItem(id: string, input: SnoozeItemInput): ItemResult {
  return itemResultSchema.parse({ item: snoozeItem(id, snoozeItemInputSchema.parse(input)) });
}

export function reorderParkingLotActiveItems(input: ReorderActiveItemsInput): ReorderItemsResult {
  return reorderItemsResultSchema.parse({
    items: reorderActiveItems(reorderActiveItemsInputSchema.parse(input)),
  });
}

export function resolveParkingLotItem(id: string): ItemResult {
  return itemResultSchema.parse({ item: resolveItem(id) });
}

export function archiveParkingLotItem(id: string): ItemResult {
  return itemResultSchema.parse({ item: archiveItem(id) });
}

export function unarchiveParkingLotItem(id: string): ItemResult {
  return itemResultSchema.parse({ item: unarchiveItem(id) });
}

export function createParkingLotComment(itemId: string, input: CreateCommentInput): CommentResult {
  return commentResultSchema.parse({ comment: createComment(itemId, input) });
}

export function updateParkingLotComment(
  itemId: string,
  commentId: string,
  input: UpdateCommentInput,
): CommentResult {
  return commentResultSchema.parse({ comment: updateComment(itemId, commentId, input) });
}

export function deleteParkingLotComment(itemId: string, commentId: string): CommentResult {
  return commentResultSchema.parse({ comment: softDeleteComment(itemId, commentId) });
}
