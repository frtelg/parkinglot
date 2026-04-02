import { createComment, listComments, softDeleteComment, updateComment } from "./comments.ts";
import {
  commentResultSchema,
  itemDetailResultSchema,
  itemListResultSchema,
  itemResultSchema,
  type CommentResult,
  type ItemDetailResult,
  type ItemListResult,
  type ItemResult,
} from "./contracts.ts";
import {
  archiveItem,
  createItem,
  getItem,
  ItemNotFoundError,
  listItems,
  resolveItem,
  unarchiveItem,
  updateItem,
} from "./items.ts";
import {
  type CreateCommentInput,
  type CreateItemInput,
  itemViewSchema,
  type ItemView,
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
  return itemResultSchema.parse({ item: createItem(input) });
}

export function updateParkingLotItem(id: string, input: UpdateItemInput): ItemResult {
  return itemResultSchema.parse({ item: updateItem(id, input) });
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
