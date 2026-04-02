import { z } from "zod";

import { commentSchema, itemSchema } from "./schemas.ts";

export const itemListResultSchema = z.object({
  items: z.array(itemSchema),
});

export const itemResultSchema = z.object({
  item: itemSchema,
});

export const itemDetailResultSchema = z.object({
  item: itemSchema,
  comments: z.array(commentSchema),
});

export const commentResultSchema = z.object({
  comment: commentSchema,
});

export type ItemListResult = z.infer<typeof itemListResultSchema>;
export type ItemResult = z.infer<typeof itemResultSchema>;
export type ItemDetailResult = z.infer<typeof itemDetailResultSchema>;
export type CommentResult = z.infer<typeof commentResultSchema>;
