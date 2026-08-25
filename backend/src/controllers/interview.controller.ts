import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import path from "path";
import { prisma } from "../utils/prisma";
import { sendSuccess, sendError } from "../utils/apiResponse";
import {
  createInterviewSchema,
  addQuestionsSchema,
  audioResponseSchema,
  CreateInterviewInput,
  AddQuestionsInput,
  AudioResponseInput,
} from "../validators/interview.validator";

/**
 * Shared select for reading an interview with its questions and responses.
 */
const INTERVIEW_SELECT = {
  id: true,
  title: true,
  status: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, name: true },
  },
  questions: {
    orderBy: { order: "asc" as const },
    select: {
      id: true,
      question: true,
      order: true,
      responses: {
        orderBy: { createdAt: "asc" as const },
        select: {
          id: true,
          audioUrl: true,
          transcription: true,
          createdAt: true,
        },
      },
    },
  },
} satisfies Prisma.InterviewSelect;

type InterviewWithRelations = Prisma.InterviewGetPayload<{
  select: typeof INTERVIEW_SELECT;
}>;

function formatInterview(interview: InterviewWithRelations) {
  return interview;
}

/**
 * POST /api/interviews
 *
 * Auth required. Creates a new Virasat interview with a title.
 * Status defaults to "DRAFT".
 */
export async function createInterview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed: CreateInterviewInput = createInterviewSchema.parse(req.body);
    const userId = req.user!.id;

    const interview = await prisma.interview.create({
      data: {
        title: parsed.title,
        user: { connect: { id: userId } },
      },
      select: INTERVIEW_SELECT,
    });

    sendSuccess(res, 201, "Interview created successfully.", formatInterview(interview));
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, 400, "Validation failed.", error.issues);
      return;
    }
    next(error);
  }
}

/**
 * GET /api/interviews/:id
 *
 * Auth required (owner or admin). Returns the interview with all its
 * questions and any audio responses attached.
 */
export async function getInterview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;
    const role = req.user!.role;

    const interview = await prisma.interview.findUnique({
      where: { id },
      select: INTERVIEW_SELECT,
    });

    if (!interview) {
      sendError(res, 404, "Interview not found.");
      return;
    }

    if (interview.userId !== userId && role !== "ADMIN") {
      sendError(res, 403, "You can only view your own interviews.");
      return;
    }

    sendSuccess(res, 200, "Interview fetched successfully.", formatInterview(interview));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/interviews/:id/questions
 *
 * Auth required (owner only). Adds questions to an interview.
 * Replaces existing questions if any — this is a set operation, not append.
 * Interview must be in DRAFT status.
 */
export async function addQuestions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed: AddQuestionsInput = addQuestionsSchema.parse(req.body);
    const id = String(req.params.id);
    const userId = req.user!.id;

    const interview = await prisma.interview.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!interview) {
      sendError(res, 404, "Interview not found.");
      return;
    }

    if (interview.userId !== userId) {
      sendError(res, 403, "You can only modify your own interviews.");
      return;
    }

    if (interview.status !== "DRAFT") {
      sendError(res, 400, "Can only add questions to an interview in DRAFT status.");
      return;
    }

    const updated = await prisma.$transaction(
      async (tx) => {
        // Remove existing questions (cascade deletes responses)
        await tx.interviewQuestion.deleteMany({
          where: { interviewId: id },
        });

        // Create new questions
        await tx.interviewQuestion.createMany({
          data: parsed.questions.map((q) => ({
            question: q.question,
            order: q.order,
            interviewId: id,
          })),
        });

        return tx.interview.findUnique({
          where: { id },
          select: INTERVIEW_SELECT,
        });
      },
      { timeout: 30000 }
    );

    sendSuccess(res, 200, "Questions added successfully.", formatInterview(updated!));
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, 400, "Validation failed.", error.issues);
      return;
    }
    next(error);
  }
}

/**
 * POST /api/interviews/:id/audio
 *
 * Auth required (owner only). Attaches an audio response to a specific
 * question within the interview. Expects multipart/form-data with:
 *   - `questionId` (text field) — the question being answered
 *   - `audio` (file field) — the audio recording
 *
 * Interview must be in DRAFT status. Creates or replaces the response
 * for the given question.
 */
export async function uploadAudioResponse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed: AudioResponseInput = audioResponseSchema.parse({
      questionId: (req.body.questionId || req.query.questionId || "") as string,
    });
    const id = String(req.params.id);
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      sendError(res, 400, "No audio file uploaded. Expected a multipart field named 'audio'.");
      return;
    }

    const interview = await prisma.interview.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!interview) {
      sendError(res, 404, "Interview not found.");
      return;
    }

    if (interview.userId !== userId) {
      sendError(res, 403, "You can only modify your own interviews.");
      return;
    }

    if (interview.status !== "DRAFT") {
      sendError(res, 400, "Can only add audio responses to an interview in DRAFT status.");
      return;
    }

    // Verify the question belongs to this interview
    const question = await prisma.interviewQuestion.findUnique({
      where: { id: parsed.questionId },
      select: { id: true, interviewId: true },
    });

    if (!question || question.interviewId !== id) {
      sendError(res, 404, "Question not found in this interview.");
      return;
    }

    const audioUrl = `/files/audio/${path.basename(file.path)}`;

    // Upsert: create new response or replace existing one for this question
    const existingResponse = await prisma.interviewResponse.findFirst({
      where: { questionId: parsed.questionId },
      select: { id: true },
    });

    let response;
    if (existingResponse) {
      response = await prisma.interviewResponse.update({
        where: { id: existingResponse.id },
        data: { audioUrl, transcription: null },
        select: { id: true, audioUrl: true, transcription: true, createdAt: true },
      });
    } else {
      response = await prisma.interviewResponse.create({
        data: {
          audioUrl,
          questionId: parsed.questionId,
        },
        select: { id: true, audioUrl: true, transcription: true, createdAt: true },
      });
    }

    sendSuccess(res, 200, "Audio response uploaded successfully.", response);
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, 400, "Validation failed.", error.issues);
      return;
    }
    next(error);
  }
}

/**
 * POST /api/interviews/:id/complete
 *
 * Auth required (owner only). Marks the interview as COMPLETED.
 * Interview must be in DRAFT status and must have at least one question
 * with an audio response.
 */
export async function completeInterview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const interview = await prisma.interview.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!interview) {
      sendError(res, 404, "Interview not found.");
      return;
    }

    if (interview.userId !== userId) {
      sendError(res, 403, "You can only complete your own interviews.");
      return;
    }

    if (interview.status !== "DRAFT") {
      sendError(res, 400, "Interview is already completed.");
      return;
    }

    // Check that at least one question has an audio response
    const questionCount = await prisma.interviewQuestion.count({
      where: { interviewId: id },
    });

    if (questionCount === 0) {
      sendError(res, 400, "Cannot complete an interview with no questions.");
      return;
    }

    const responseCount = await prisma.interviewResponse.count({
      where: {
        question: { interviewId: id },
        audioUrl: { not: null },
      },
    });

    if (responseCount === 0) {
      sendError(res, 400, "Cannot complete an interview without at least one audio response.");
      return;
    }

    const updated = await prisma.interview.update({
      where: { id },
      data: { status: "COMPLETED" },
      select: INTERVIEW_SELECT,
    });

    sendSuccess(res, 200, "Interview marked as completed.", formatInterview(updated));
  } catch (error) {
    next(error);
  }
}
