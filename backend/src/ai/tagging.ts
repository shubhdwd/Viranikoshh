import { TagExtractionResult } from "./types";
import { groqChat, geminiGenerate, withFallback } from "./providers";

function geminiUrl(): string {
  const base = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com";
  return `${base}/v1beta/models/gemini-3.6-flash:generateContent`;
}

const TAG_PROMPT_TEMPLATE = `You are a cultural content analyst specializing in Indian heritage and traditions.
Analyze the following transcript and extract structured metadata.

Respond with ONLY a valid JSON object (no markdown, no code fences, no explanation) in this exact format:
{
  "summary": "A 2-3 sentence summary of the cultural content, its significance, and what it describes",
  "tags": ["lowercase-kebab-case-tag1", "lowercase-kebab-case-tag2", ...],
  "category": "One of: Folk Song, Classical Music, Dance, Festival, Craft, Cuisine, Story, Ritual, Architecture, Language, Clothing, Agriculture, Medicine, Sports, Art, Other",
  "region": "The primary Indian state/region associated with this content, or 'Pan-India' if not specific to one region"
}

Rules for tags:
- Extract 3-8 relevant tags in lowercase kebab-case (e.g. "folk-song", "maharashtra", "harvest-festival")
- Include cultural tradition names, regions, art forms, themes, and cultural preservation keywords
- Tags should be useful for searching and categorizing this content later

Rules for summary:
- Be concise but informative
- Mention what the content is about, its cultural significance, and any notable details

Transcript:
`;

const validCategories = [
  "Folk Song", "Classical Music", "Dance", "Festival", "Craft",
  "Cuisine", "Story", "Ritual", "Architecture", "Language",
  "Clothing", "Agriculture", "Medicine", "Sports", "Art", "Other",
];

function parseTagResponse(rawText: string): TagExtractionResult {
  const cleaned = rawText
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/im, "")
    .trim();

  let jsonStr = cleaned;
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse tag response as JSON: ${jsonStr.substring(0, 300)}`);
  }

  const category = validCategories.includes(parsed.category) ? parsed.category : "Other";

  return {
    summary: parsed.summary || "No summary generated.",
    tags: Array.isArray(parsed.tags)
      ? parsed.tags.map((t: string) => String(t).toLowerCase().trim()).filter(Boolean)
      : [],
    category,
    region: parsed.region || undefined,
  };
}

/**
 * Extract cultural tags, category, region, and summary from a transcript
 * using Gemini (primary) with Groq fallback.
 */
export async function extractTags(
  transcript: string,
  _languageCode: string
): Promise<TagExtractionResult> {
  const truncated = transcript.substring(0, 8000);

  // Primary: Gemini
  async function geminiExtract(): Promise<TagExtractionResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const response = await fetch(geminiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: TAG_PROMPT_TEMPLATE + truncated }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error (${response.status})`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    if (!rawText) throw new Error("Gemini returned an empty response for tag extraction");
    return parseTagResponse(rawText);
  }

  // Fallback: Groq
  async function groqExtract(): Promise<TagExtractionResult> {
      const rawText = await groqChat(
      "You are a cultural content analyst specializing in Indian heritage and traditions.",
      TAG_PROMPT_TEMPLATE + truncated,
      { temperature: 0.3, maxTokens: 1024 }
    );
    if (!rawText) throw new Error("Groq returned an empty response for tag extraction");
    return parseTagResponse(rawText);
  }

  return withFallback(geminiExtract, groqExtract, "extractTags");
}

const LANG_DETECT_PROMPT = `Detect the primary language of the following text.
Respond with ONLY a JSON object: {"code": "language_code", "name": "Language Name"}
Use ISO 639-1 codes. If the language is an Indian language, use its common code (e.g. "hi" for Hindi, "mr" for Marathi).

Text (first 500 chars):`;

function parseLangDetectResponse(rawText: string): { code: string; name: string } {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  return { code: parsed.code || "en", name: parsed.name || "English" };
}

/**
 * Detect the primary language of a text using Gemini (primary) with Groq fallback.
 */
export async function detectLanguage(
  text: string
): Promise<{ code: string; name: string }> {
  const prompt = `${LANG_DETECT_PROMPT}\n${text.substring(0, 500)}`;

  try {
    return await withFallback(
      async () => {
        const raw = await geminiGenerate(prompt, { temperature: 0.1, maxOutputTokens: 64 });
        return parseLangDetectResponse(raw);
      },
      async () => {
        const raw = await groqChat(
          "You are a language detection assistant.",
          prompt,
          { temperature: 0.1, maxTokens: 64 }
        );
        return parseLangDetectResponse(raw);
      },
      "detectLanguage"
    );
  } catch {
    return { code: "en", name: "English" };
  }
}
