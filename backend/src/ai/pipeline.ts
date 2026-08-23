import { prisma } from "../utils/prisma";
import { transcribe } from "./transcription";
import { translate } from "./translation";
import { extractTags, detectLanguage } from "./tagging";
import { cohereSummarize } from "./providers";
import { PipelineContext, PipelineStep } from "./types";

const TRANSLATION_TARGET_LANGUAGES = ["en"];

/**
 * Update the ProcessingJob status and step in the database.
 */
async function updateJobStatus(
  jobId: string,
  status: PipelineStep,
  step: string,
  error?: string
): Promise<void> {
  await prisma.processingJob.update({
    where: { id: jobId },
    data: {
      status,
      step,
      ...(error !== undefined ? { error } : {}),
    },
  });
}

/**
 * Ensure a Language record exists, creating it if needed.
 * Returns the language ID.
 */
async function ensureLanguage(code: string, name: string): Promise<string> {
  // Try finding by code first
  const existingByCode = await prisma.language.findUnique({ where: { code } });
  if (existingByCode) return existingByCode.id;

  // Try finding by name (unique constraint)
  const existingByName = await prisma.language.findUnique({ where: { name } });
  if (existingByName) return existingByName.id;

  // Create new — handle race condition where another process may have inserted
  try {
    const created = await prisma.language.create({
      data: { code, name },
    });
    return created.id;
  } catch {
    // Unique constraint violation — another process created it, fetch it
    const fallback = await prisma.language.findFirst({
      where: { OR: [{ code }, { name }] },
    });
    if (fallback) return fallback.id;
    throw new Error(`Failed to ensure language: ${code} / ${name}`);
  }
}

/**
 * Run the full AI processing pipeline for an uploaded media file.
 *
 * Pipeline: QUEUED -> PROCESSING -> TRANSCRIBING -> TRANSLATING -> TAGGING -> COMPLETED
 * On any error: -> FAILED
 *
 * Results are stored in Transcript and Translation tables.
 * Original media is NEVER overwritten.
 */
export async function runPipeline(ctx: PipelineContext): Promise<void> {
  try {
    // Step 1: PROCESSING - start
    await updateJobStatus(ctx.jobId, "PROCESSING", "Starting AI pipeline");

    const isAudioOrVideo =
      ctx.mediaType === "AUDIO" || ctx.mediaType === "VIDEO";

    let transcriptText = "";
    let detectedLanguageCode = "en";
    let detectedLanguageName = "English";

    // Step 2: TRANSCRIBING - only for audio/video
    if (isAudioOrVideo) {
      await updateJobStatus(
        ctx.jobId,
        "TRANSCRIBING",
        "Transcribing audio/video content"
      );

      const transcription = await transcribe(ctx.mediaUrl, ctx.mimeType);
      transcriptText = transcription.text;
      detectedLanguageCode = transcription.languageCode;
      detectedLanguageName = transcription.languageName;

      // Store transcript in a separate Transcript table (never overwrite original)
      const langId = await ensureLanguage(
        detectedLanguageCode,
        detectedLanguageName
      );

      await prisma.transcript.create({
        data: {
          content: transcriptText,
          languageId: langId,
          postId: ctx.postId,
        },
      });
    } else {
      // For images/documents, try to use existing post content for tagging
      const post = await prisma.culturalPost.findUnique({
        where: { id: ctx.postId },
        select: { content: true, description: true },
      });
      transcriptText = post?.content || post?.description || "";

      if (transcriptText) {
        const detected = await detectLanguage(transcriptText);
        detectedLanguageCode = detected.code;
        detectedLanguageName = detected.name;
      }
    }

    // Step 3: TRANSLATING
    await updateJobStatus(
      ctx.jobId,
      "TRANSLATING",
      "Translating content to target languages"
    );

    const targetLangIds: string[] = [];
    for (const targetLang of TRANSLATION_TARGET_LANGUAGES) {
      if (targetLang === detectedLanguageCode) continue; // skip self-translation

      const translation = await translate(
        transcriptText,
        detectedLanguageCode,
        targetLang
      );

      const langId = await ensureLanguage(
        translation.targetLanguageCode,
        translation.targetLanguageName
      );
      targetLangIds.push(langId);

      // Store translation in separate Translation table
      await prisma.translation.create({
        data: {
          content: translation.text,
          languageId: langId,
          postId: ctx.postId,
        },
      });
    }

    // Step 4: TAGGING - extract cultural tags and summary
    await updateJobStatus(
      ctx.jobId,
      "TAGGING",
      "Extracting cultural tags and summary"
    );

    if (transcriptText) {
      const tags = await extractTags(transcriptText, detectedLanguageCode);

      // Link extracted tags to the post (create Tag records if new, then link)
      for (const tagName of tags.tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          create: { name: tagName },
          update: {},
        });

        await prisma.tagOnPost.upsert({
          where: { postId_tagId: { postId: ctx.postId, tagId: tag.id } },
          create: { postId: ctx.postId, tagId: tag.id },
          update: {},
        });
      }

      // Step 4b: SUMMARIZATION - generate AI summary using Cohere (436K context)
      // Only if the post doesn't already have a description
      const post = await prisma.culturalPost.findUnique({
        where: { id: ctx.postId },
        select: { description: true },
      });

      if (!post?.description && transcriptText.length > 50) {
        try {
          const summary = await cohereSummarize(transcriptText, {
            length: "medium",
            format: "paragraph",
          });
          if (summary) {
            await prisma.culturalPost.update({
              where: { id: ctx.postId },
              data: { description: summary },
            });
          }
        } catch (err) {
          // Summarization is optional — don't fail the pipeline
          const msg = err instanceof Error ? err.message : "unknown error";
          console.warn(`[pipeline] Cohere summarization skipped: ${msg}`);
        }
      }
    }

    // Step 5: COMPLETED
    await updateJobStatus(ctx.jobId, "COMPLETED", "All processing steps finished");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown pipeline error";
    await updateJobStatus(ctx.jobId, "FAILED", "Processing failed", message);
  }
}

/**
 * Start the pipeline asynchronously (fire-and-forget).
 * The upload endpoint returns immediately while processing continues in background.
 */
export function startPipeline(ctx: PipelineContext): void {
  setImmediate(() => {
    runPipeline(ctx).catch((err) => {
      // Last-resort error handler — ensure job is marked FAILED
      const message =
        err instanceof Error ? err.message : "Unknown pipeline error";
      prisma.processingJob
        .update({
          where: { id: ctx.jobId },
          data: { status: "FAILED", step: "Pipeline crashed", error: message },
        })
        .catch(() => {});
    });
  });
}
