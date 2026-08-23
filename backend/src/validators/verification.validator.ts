import { z } from "zod";

export const verifyPostSchema = z.object({
  status: z
    .string({ error: "Status is required" })
    .min(1, "Status cannot be empty")
    .trim(),
  comment: z
    .string()
    .max(1000, "Comment must be at most 1000 characters")
    .trim()
    .optional(),
});

export const correctionSchema = z.object({
  field: z
    .string({ error: "Field name is required" })
    .min(1, "Field cannot be empty")
    .max(100, "Field must be at most 100 characters")
    .trim(),
  suggestion: z
    .string({ error: "Suggestion is required" })
    .min(1, "Suggestion cannot be empty")
    .max(2000, "Suggestion must be at most 2000 characters")
    .trim(),
});

export type VerifyPostInput = z.infer<typeof verifyPostSchema>;
export type CorrectionInput = z.infer<typeof correctionSchema>;
