import { z } from "zod";

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim()
    .optional(),
  bio: z
    .string()
    .max(500, "Bio must be at most 500 characters")
    .trim()
    .nullable()
    .optional(),
  avatar: z
    .string()
    .url("Avatar must be a valid URL")
    .max(500, "Avatar URL must be at most 500 characters")
    .trim()
    .nullable()
    .optional(),
  location: z
    .string()
    .max(200, "Location must be at most 200 characters")
    .trim()
    .nullable()
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
