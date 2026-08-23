import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string({ error: "Content is required" })
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be at most 1000 characters")
    .trim()
    .optional(),
  body: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be at most 1000 characters")
    .trim()
    .optional(),
  parentId: z.string().min(1, "Invalid parentId").optional(),
}).refine((data) => data.content || data.body, {
  message: "Content is required",
  path: ["content"],
}).transform((data) => ({
  content: data.content ?? data.body!,
  parentId: data.parentId,
}));

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
