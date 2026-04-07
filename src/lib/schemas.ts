import { z } from "zod";

const nonEmptyTrimmed = (label: string, maxLength: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(maxLength, `${label} must be ${maxLength} characters or fewer`);

const optionalTrimmed = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Must be ${maxLength} characters or fewer`)
    .optional()
    .transform((value) => value ?? "");

const optionalNullableTrimmed = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Must be ${maxLength} characters or fewer`)
    .nullish()
    .transform((value) => {
      if (value == null || value.length === 0) {
        return null;
      }

      return value;
    });

export const itemStatusSchema = z.enum(["active", "resolved"]);
export const itemViewSchema = z.enum(["active", "snoozed", "resolved", "archived"]);
export const authorTypeSchema = z.enum(["human", "agent", "system"]);

export const snoozeItemInputSchema = z.object({
  snoozedUntil: z.string().datetime().refine((value) => new Date(value).getTime() > Date.now(), {
    message: "Snooze time must be in the future",
  }),
});

export const itemSchema = z.object({
  id: z.string().uuid(),
  title: nonEmptyTrimmed("Title", 120),
  details: z.string(),
  status: itemStatusSchema,
  archivedAt: z.string().datetime().nullable(),
  resolvedAt: z.string().datetime().nullable(),
  snoozedUntil: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createItemInputSchema = z.object({
  title: nonEmptyTrimmed("Title", 120),
  details: optionalTrimmed(4000),
});

export const updateItemInputSchema = z
  .object({
    title: nonEmptyTrimmed("Title", 120).optional(),
    details: z.string().trim().max(4000, "Must be 4000 characters or fewer").optional(),
  })
  .refine((value) => value.title !== undefined || value.details !== undefined, {
    message: "At least one field must be provided",
  });

export const reorderActiveItemsInputSchema = z
  .object({
    itemIds: z.array(z.string().uuid()).min(1, "At least one item id must be provided"),
  })
  .superRefine((value, context) => {
    if (new Set(value.itemIds).size === value.itemIds.length) {
      return;
    }

    context.addIssue({
      code: "custom",
      path: ["itemIds"],
      message: "Item ids must be unique",
    });
  });

export const commentSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
  authorType: authorTypeSchema,
  authorLabel: z.string().trim().max(80).nullable(),
  deletedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createCommentInputSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  authorType: authorTypeSchema,
  authorLabel: optionalNullableTrimmed(80),
});

export const updateCommentInputSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export type Item = z.infer<typeof itemSchema>;
export type ItemStatus = z.infer<typeof itemStatusSchema>;
export type ItemView = z.infer<typeof itemViewSchema>;
export type CreateItemInput = z.infer<typeof createItemInputSchema>;
export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;
export type ReorderActiveItemsInput = z.infer<typeof reorderActiveItemsInputSchema>;
export type SnoozeItemInput = z.infer<typeof snoozeItemInputSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentInputSchema>;
