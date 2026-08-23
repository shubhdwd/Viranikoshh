import { z } from "zod";

const mediaSchema = z.object({
  url: z.string({ error: "Media url is required" }).min(1, "Media url cannot be empty").trim(),
  type: z.string({ error: "Media type is required" }).min(1, "Media type cannot be empty").trim(),
  mimeType: z.string({ error: "MIME type is required" }).min(1, "MIME type cannot be empty").trim(),
  size: z.number().int("Size must be an integer").min(0, "Size must be a non-negative integer"),
  filename: z.string({ error: "Filename is required" }).min(1, "Filename cannot be empty").trim(),
});

export const createPostSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be at most 200 characters")
    .trim(),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .trim()
    .optional(),
  content: z.string().trim().optional(),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  published: z.boolean().optional(),
  regionId: z.string().min(1, "Invalid regionId").optional(),
  categoryId: z.string().min(1, "Invalid categoryId").optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tags cannot be empty")
        .max(50, "Each tag must be at most 50 characters")
        .trim()
    )
    .max(20, "At most 20 tags allowed")
    .optional(),
  media: z.array(mediaSchema).max(20, "At most 20 media items allowed").optional(),
});

export const relationSchema = z.object({
  targetPostId: z.string().min(1, "Invalid targetPostId"),
  relationType: z
    .string()
    .min(1, "Relation type is required")
    .max(50, "Relation type must be at most 50 characters")
    .trim(),
});

export const updatePostSchema = createPostSchema.partial();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type RelationInput = z.infer<typeof relationSchema>;
