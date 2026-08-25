import fs from "fs";
import os from "os";
import path from "path";
import { TranscriptionResult } from "./types";
import { UPLOAD_DIR } from "../middleware/upload.middleware";

function groqUrl(): string {
  return `${process.env.GROQ_API_BASE || "https://api.groq.com"}/openai/v1/audio/transcriptions`;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000];

function isRetryableGroqError(message: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  if (lower.includes("compaction worker")) return true;
  if (lower.includes("internal server error")) return true;
  if (lower.includes("service unavailable")) return true;
  if (lower.includes("bad gateway")) return true;
  if (lower.includes("gateway timeout")) return true;
  if (lower.includes("timed out")) return true;
  if (lower.includes("empty response")) return true;
  return false;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function postToGroq(
  apiKey: string,
  body: Buffer,
  contentType: string
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(groqUrl(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": contentType,
        },
        body,
      });

      if (!response.ok) {
        await response.text().catch(() => {}); // consume body
        const msg = `Groq Whisper API error (${response.status})`;
        if (
          response.status >= 500 ||
          response.status === 429
        ) {
          lastError = new Error(msg);
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAYS_MS[attempt]!);
            continue;
          }
        }
        throw new Error(msg);
      }

      const text = await response.text();
      if (!text || text.trim() === "") {
        const msg = "Groq Whisper API returned an empty response";
        if (isRetryableGroqError(msg)) {
          lastError = new Error(msg);
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAYS_MS[attempt]!);
            continue;
          }
        }
        throw new Error(msg);
      }

      return JSON.parse(text);
    } catch (err) {
      if (err instanceof SyntaxError) {
        const msg = `Groq Whisper API returned invalid JSON: ${err.message}`;
        lastError = new Error(msg);
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAYS_MS[attempt]!);
          continue;
        }
        throw new Error(msg);
      }
      if (err instanceof Error) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAYS_MS[attempt]!);
          continue;
        }
      }
      throw err;
    }
  }

  throw lastError ?? new Error("Groq Whisper API request failed after retries");
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
  ur: "Urdu",
  raj: "Rajasthani",
  as: "Assamese",
  or: "Odia",
  ne: "Nepali",
  si: "Sinhala",
  sd: "Sindhi",
  ks: "Kashmiri",
  doi: "Dogri",
  mai: "Maithili",
  sat: "Santali",
  kha: "Khasi",
  mni: "Manipuri",
};

/**
 * Ensure we have a local file to send to Groq.
 * If the URL is a remote Cloudinary URL, download it to a temp file first.
 * If it's a local path, just return it.
 */
async function ensureLocalFile(mediaUrl: string, mimeType: string): Promise<{ filePath: string; isTemp: boolean }> {
  // If it's a remote URL, download it
  if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      throw new Error(`Failed to download media from ${mediaUrl}: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    // Guess extension from MIME type
    const extMap: Record<string, string> = {
      "audio/mpeg": ".mp3",
      "audio/wav": ".wav",
      "audio/x-wav": ".wav",
      "audio/ogg": ".ogg",
      "audio/mp4": ".m4a",
      "audio/x-m4a": ".m4a",
      "audio/aac": ".aac",
      "audio/flac": ".flac",
      "audio/webm": ".webm",
      "video/mp4": ".mp4",
      "video/webm": ".webm",
    };
    const ext = extMap[mimeType] || ".bin";
    const tmpPath = path.join(os.tmpdir(), `groq-upload-${Date.now()}${ext}`);
    await fs.promises.writeFile(tmpPath, buffer);
    return { filePath: tmpPath, isTemp: true };
  }

  // Local file path — resolve relative path like "/files/audio/file.wav"
  // against the actual uploads directory, not CWD
  const relativePath = mediaUrl.startsWith("/") ? mediaUrl.slice(1) : mediaUrl;
  return { filePath: path.join(UPLOAD_DIR, relativePath.replace(/^files\//, "")), isTemp: false };
}

/**
 * Transcribe audio/video to text using Groq's Whisper API (whisper-large-v3).
 *
 * Supports both local files and remote URLs (e.g. Cloudinary).
 */
export async function transcribe(
  mediaUrl: string,
  mimeType: string
): Promise<TranscriptionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in environment variables");
  }

  const { filePath, isTemp } = await ensureLocalFile(mediaUrl, mimeType);

  try {
    // Read the file into a buffer
    const fileBuffer = await fs.promises.readFile(filePath);

    // Build multipart/form-data body
    const boundary = `----FormBoundary${Date.now().toString(16)}`;
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".ogg": "audio/ogg",
      ".m4a": "audio/m4a",
      ".aac": "audio/aac",
      ".flac": "audio/flac",
      ".webm": "audio/webm",
      ".mp4": "audio/mp4",
    };
    const fileMime = mimeMap[ext] || mimeType || "audio/mpeg";
    const fileName = path.basename(filePath);

    const parts: Buffer[] = [];

    // model field
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n`
      )
    );

    // file field
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${fileMime}\r\n\r\n`
      )
    );
    parts.push(fileBuffer);
    parts.push(Buffer.from("\r\n"));

    // response_format field (verbose_json gives us language detection)
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n`
      )
    );

    // End boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    const response = await postToGroq(
      apiKey,
      body,
      `multipart/form-data; boundary=${boundary}`
    );

    const languageCode = response.language || "en";
    const languageName =
      LANGUAGE_NAMES[languageCode] || languageCode;

    return {
      text: response.text || "",
      languageCode,
      languageName,
      confidence: typeof response.language_probability === "number"
        ? response.language_probability
        : 0.85,
    };
  } finally {
    // Clean up temp file if we created one
    if (isTemp) {
      await fs.promises.unlink(filePath).catch(() => {});
    }
  }
}
