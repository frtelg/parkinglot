import { randomUUID } from "node:crypto";

import { db } from "./database.ts";
import { assertItemExists, touchItem } from "./items.ts";
import {
  commentSchema,
  createCommentInputSchema,
  type Comment,
  type CreateCommentInput,
  type UpdateCommentInput,
  updateCommentInputSchema,
} from "./schemas.ts";

type CommentRow = {
  id: string;
  item_id: string;
  body: string;
  author_type: "human" | "agent" | "system";
  author_label: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

type ListCommentOptions = {
  includeDeleted?: boolean;
};

export class CommentNotFoundError extends Error {
  constructor(commentId: string) {
    super(`Comment ${commentId} was not found`);
    this.name = "CommentNotFoundError";
  }
}

export class DeletedCommentError extends Error {
  constructor(commentId: string) {
    super(`Comment ${commentId} has already been deleted`);
    this.name = "DeletedCommentError";
  }
}

function toComment(row: CommentRow): Comment {
  return commentSchema.parse({
    id: row.id,
    itemId: row.item_id,
    body: row.body,
    authorType: row.author_type,
    authorLabel: row.author_label,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function getCommentRow(itemId: string, commentId: string) {
  return db
    .prepare(
      `
        SELECT id, item_id, body, author_type, author_label, deleted_at, created_at, updated_at
        FROM comments
        WHERE item_id = ? AND id = ?
      `,
    )
    .get(itemId, commentId) as CommentRow | undefined;
}

function requireComment(itemId: string, commentId: string, options?: ListCommentOptions) {
  const row = getCommentRow(itemId, commentId);

  if (!row) {
    throw new CommentNotFoundError(commentId);
  }

  if (!options?.includeDeleted && row.deleted_at) {
    throw new DeletedCommentError(commentId);
  }

  return toComment(row);
}

export function listComments(itemId: string, options?: ListCommentOptions) {
  assertItemExists(itemId);

  const whereDeleted = options?.includeDeleted ? "" : "AND deleted_at IS NULL";
  const rows = db
    .prepare(
      `
        SELECT id, item_id, body, author_type, author_label, deleted_at, created_at, updated_at
        FROM comments
        WHERE item_id = ? ${whereDeleted}
        ORDER BY created_at ASC, id ASC
      `,
    )
    .all(itemId) as CommentRow[];

  return rows.map(toComment);
}

export function createComment(itemId: string, input: CreateCommentInput) {
  assertItemExists(itemId);

  const parsed = createCommentInputSchema.parse(input);
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO comments (id, item_id, body, author_type, author_label, deleted_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
    `,
  ).run(id, itemId, parsed.body, parsed.authorType, parsed.authorLabel, now, now);

  touchItem(itemId, now);

  return requireComment(itemId, id, { includeDeleted: true });
}

export function updateComment(itemId: string, commentId: string, input: UpdateCommentInput) {
  const current = requireComment(itemId, commentId);
  const parsed = updateCommentInputSchema.parse(input);
  const updatedAt = new Date().toISOString();

  db.prepare(
    `
      UPDATE comments
      SET body = ?, updated_at = ?
      WHERE item_id = ? AND id = ?
    `,
  ).run(parsed.body, updatedAt, itemId, current.id);

  touchItem(itemId, updatedAt);

  return requireComment(itemId, commentId, { includeDeleted: true });
}

export function softDeleteComment(itemId: string, commentId: string) {
  const current = requireComment(itemId, commentId, { includeDeleted: true });

  if (current.deletedAt) {
    return current;
  }

  const deletedAt = new Date().toISOString();

  db.prepare(
    `
      UPDATE comments
      SET deleted_at = ?, updated_at = ?
      WHERE item_id = ? AND id = ?
    `,
  ).run(deletedAt, deletedAt, itemId, commentId);

  touchItem(itemId, deletedAt);

  return requireComment(itemId, commentId, { includeDeleted: true });
}
