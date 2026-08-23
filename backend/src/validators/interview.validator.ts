import { z } from "zod";

export const createInterviewSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be at most 200 characters")
    .trim()
    .optional(),
  topicId: z.string().optional(),
  speakerName: z.string().optional(),
  language: z.string().optional(),
  region: z.string().optional(),
}).transform((data) => ({
  title: data.title ?? `${data.speakerName ?? 'Interview'} — ${data.topicId ?? 'topic'}`,
}));

const questionStringSchema = z.string().min(1).max(500).trim();
const questionObjectSchema = z.object({
  question: z
    .string({ error: "Question text is required" })
    .min(1, "Question cannot be empty")
    .max(500, "Question must be at most 500 characters")
    .trim(),
  order: z
    .number({ error: "Order is required" })
    .int("Order must be an integer")
    .min(1, "Order must be at least 1"),
});

export const addQuestionsSchema = z.object({
  questions: z
    .array(z.union([questionStringSchema, questionObjectSchema]))
    .min(1, "At least one question is required")
    .max(50, "At most 50 questions allowed")
    .transform((questions) =>
      questions.map((q, i) =>
        typeof q === "string"
          ? { question: q, order: i + 1 }
          : q
      )
    ),
});

export const audioResponseSchema = z.object({
  questionId: z
    .string({ error: "questionId is required" })
    .min(1, "questionId cannot be empty")
    .trim(),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type AddQuestionsInput = z.infer<typeof addQuestionsSchema>;
export type AudioResponseInput = z.infer<typeof audioResponseSchema>;
