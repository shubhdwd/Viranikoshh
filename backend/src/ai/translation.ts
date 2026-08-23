import { TranslationResult } from "./types";
import { groqChat, withFallback } from "./providers";

function geminiUrl(): string {
  const base = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com";
  return `${base}/v1beta/models/gemini-3.6-flash:generateContent`;
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
 * Translate text to a target language using the Gemini API.
 *
 * Uses Gemini 2.0 Flash for fast, high-quality translation.
 * The prompt asks Gemini to translate faithfully while preserving
 * cultural context and nuance.
 */
export async function translate(
  text: string,
  _sourceLanguageCode: string,
  targetLanguageCode: string
): Promise<TranslationResult> {
  const targetName = LANGUAGE_NAMES[targetLanguageCode] || targetLanguageCode;

  const translationPrompt = `You are an expert translator specializing in Indian languages and cultural content.
Translate the following text into ${targetName} (${targetLanguageCode}).

Rules:
- Translate faithfully and naturally — the translation should read as if originally written in ${targetName}.
- Preserve cultural context, proper nouns, and names of places/traditions where applicable.
- If the text is already in ${targetName}, return it unchanged.
- Do NOT add any explanation, commentary, or prefix/suffix — return ONLY the translated text.

Text to translate:
${text}`;

  // Primary: Gemini
  async function geminiTranslate(): Promise<TranslationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const response = await fetch(`${geminiUrl()}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: translationPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    const translatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!translatedText) {
      if (!text || text.trim().length <= 2) {
        return { text: text || "", targetLanguageCode, targetLanguageName: targetName };
      }
      throw new Error("Gemini returned an empty translation");
    }

    return { text: translatedText, targetLanguageCode, targetLanguageName: targetName };
  }

  // Fallback: Groq
  async function groqTranslate(): Promise<TranslationResult> {
    const response = await groqChat(
      "You are an expert translator specializing in Indian languages and cultural content.",
      translationPrompt,
      { temperature: 0.3, maxTokens: 4096 }
    );

    if (!response) {
      if (!text || text.trim().length <= 2) {
        return { text: text || "", targetLanguageCode, targetLanguageName: targetName };
      }
      throw new Error("Groq returned an empty translation");
    }

    return { text: response, targetLanguageCode, targetLanguageName: targetName };
  }

  return withFallback(geminiTranslate, groqTranslate, "translate");
}
