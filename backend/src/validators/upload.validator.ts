import { z } from "zod";

export const uploadSchema = z.object({
  postId: z
    .string({ error: "postId is required" })
    .min(1, "Invalid postId")
    .trim(),
});

export type UploadInput = z.infer<typeof uploadSchema>;
