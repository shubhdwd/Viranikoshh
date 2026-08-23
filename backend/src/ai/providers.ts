/**
 * AI Provider fallback utilities.
 *
 * Primary providers: Gemini (translation/tagging), Groq Whisper (transcription)
 * Fallback providers: Groq text (translation/tagging fallback), Cohere (summarization)
 *
 * If a primary provider fails, we attempt the fallback.
 * If fallback keys are not set, errors propagate normally.
 */

// ---------------------------------------------------------------------------
// Groq — OpenAI-compatible API, free tier for text + audio
// Used as fallback for translation and tag extraction when Gemini fails.
// Uses the same GROQ_API_KEY already in the project.
// ---------------------------------------------------------------------------

function groqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY;
}

function groqBaseUrl(): string {
  return process.env.GROQ_API_BASE || "https://api.groq.com/openai/v1";
}

export async function groqChat(
  systemPrompt: string,
  userPrompt: string,
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = groqApiKey();
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const response = await fetch(`${groqBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: opts?.temperature ?? 0.3,
      max_tokens: opts?.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// ---------------------------------------------------------------------------
// Cohere — Command A model, 288K context, free tier
// Used for long-text summarization of cultural transcripts.
// ---------------------------------------------------------------------------

function cohereApiKey(): string | undefined {
  return process.env.COHERE_API_KEY;
}

function cohereBaseUrl(): string {
  return process.env.COHERE_API_BASE || "https://api.cohere.com/v2";
}

export async function cohereSummarize(
  text: string,
  opts?: { length?: "short" | "medium" | "long"; format?: "paragraph" | "bullets" }
): Promise<string> {
  const apiKey = cohereApiKey();
  if (!apiKey) throw new Error("COHERE_API_KEY not set");

  const response = await fetch(`${cohereBaseUrl()}/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      stream: false,
      model: "command-a-03-2025",
      messages: [
        {
          role: "user",
          content: `Summarize the following cultural transcript in ${opts?.length || "medium"} length as a ${opts?.format || "paragraph"}.\n\nPreserve cultural context, key details, and any named traditions/places.\n\nTranscript:\n${text}`,
        },
      ],
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cohere API error (${response.status}): ${errText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json();
  return data.message?.content?.[0]?.text?.trim() || "";
}

// ---------------------------------------------------------------------------
// Gemini — primary provider for text generation tasks
// Wrapped here to add structured error handling.
// ---------------------------------------------------------------------------

function geminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

function geminiBaseUrl(): string {
  const base = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com";
  return `${base}/v1beta/models/gemini-3.6-flash:generateContent`;
}

export async function geminiGenerate(
  prompt: string,
  opts?: { temperature?: number; maxOutputTokens?: number }
): Promise<string> {
  const apiKey = geminiApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const response = await fetch(`${geminiBaseUrl()}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts?.temperature ?? 0.3,
        maxOutputTokens: opts?.maxOutputTokens ?? 8192,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

// ---------------------------------------------------------------------------
// Fallback wrapper — try primary, fall back to secondary on failure
// ---------------------------------------------------------------------------

export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  label: string
): Promise<T> {
  try {
    return await primary();
  } catch (primaryErr) {
    const primaryMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    console.warn(`[providers] ${label} primary failed: ${primaryMsg}. Trying fallback...`);
    try {
      return await fallback();
    } catch (fallbackErr) {
      const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      console.error(`[providers] ${label} fallback also failed: ${fallbackMsg}`);
      // Throw original primary error so upstream error messages stay consistent
      throw primaryErr;
    }
  }
}

// ---------------------------------------------------------------------------
// Provider health check — used by health endpoint
// ---------------------------------------------------------------------------

export interface ProviderStatus {
  name: string;
  available: boolean;
  keyPresent: boolean;
}

export async function checkProviders(): Promise<ProviderStatus[]> {
  const statuses: ProviderStatus[] = [
    { name: "gemini", available: false, keyPresent: !!geminiApiKey() },
    { name: "groq", available: false, keyPresent: !!groqApiKey() },
    { name: "cohere", available: false, keyPresent: !!cohereApiKey() },
  ];

  // Quick connectivity check for each provider with a key
  for (const s of statuses) {
    if (!s.keyPresent) continue;
    try {
      if (s.name === "gemini") {
        await geminiGenerate("Say ok", { maxOutputTokens: 4 });
        s.available = true;
      } else if (s.name === "groq") {
        // Check Groq text capability (not just transcription)
        await groqChat("You are a test assistant.", "Say ok", { maxTokens: 4 });
        s.available = true;
      } else if (s.name === "cohere") {
        await cohereSummarize("Hello world test.", { length: "short" });
        s.available = true;
      }
    } catch {
      s.available = false;
    }
  }

  return statuses;
}
