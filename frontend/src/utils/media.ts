import { CULTURAL_IMAGES } from '../data/records';
import type { CulturalCategory, MediaAsset, MediaType } from '../types/culture';

/**
 * The API stores `Media.type` as a free-form string. Uploads write the
 * uppercase MediaCategory ("AUDIO" | "VIDEO" | "IMAGE" | "DOCUMENT") while the
 * demo seed writes the lowercase mime prefix ("audio" | "image" | "video").
 * The UI only understands the lowercase MediaType union, so every value coming
 * off the wire has to pass through here first — otherwise an "IMAGE" record
 * falls past all the branches in CulturalMediaViewer and gets treated as
 * time-based media.
 */
export function normalizeMediaType(raw: unknown, mimeType?: unknown): MediaType {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';

  if (value === 'image' || value === 'video' || value === 'audio' || value === 'text') return value;
  // Documents have no player of their own; they read as written records.
  if (value === 'document' || value === 'doc' || value === 'pdf') return 'text';

  const mime = typeof mimeType === 'string' ? mimeType.trim().toLowerCase() : '';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('text/') || mime === 'application/pdf') return 'text';

  return 'image';
}

/** Audio and video are the only records that have a position on a timeline. */
export function isTimeBased(type: MediaType): boolean {
  return type === 'audio' || type === 'video';
}

const FALLBACK_BY_CATEGORY: Record<CulturalCategory, string> = {
  'folk-story': CULTURAL_IMAGES.elder,
  'folk-song': CULTURAL_IMAGES.baul,
  'oral-tradition': CULTURAL_IMAGES.elder,
  artwork: CULTURAL_IMAGES.mithila,
  craft: CULTURAL_IMAGES.pottery,
  festival: CULTURAL_IMAGES.festival,
  'local-history': CULTURAL_IMAGES.warli,
  'traditional-practice': CULTURAL_IMAGES.theyyam
};

const FALLBACK_POOL = Object.values(CULTURAL_IMAGES);

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 100003;
  return h;
}

/**
 * A still to show when a record has no usable image of its own — an audio or
 * video upload (which carries no poster frame), or a record whose media row is
 * missing. Keyed off the record id so a given record always gets the same
 * image instead of flickering between renders.
 */
export function fallbackImage(seed: string, category?: CulturalCategory): string {
  if (category && FALLBACK_BY_CATEGORY[category]) return FALLBACK_BY_CATEGORY[category];
  return FALLBACK_POOL[hashSeed(seed) % FALLBACK_POOL.length] ?? CULTURAL_IMAGES.mithila;
}

/** True when a URL can actually be painted by an <img>. */
function looksLikeImage(url: string, type: MediaType): boolean {
  if (!url) return false;
  if (type === 'image') return true;
  return /\.(jpe?g|png|webp|gif|avif|svg)(\?|#|$)/i.test(url);
}

interface RawMediaRow {
  url?: unknown;
  type?: unknown;
  mimeType?: unknown;
  filename?: unknown;
}

export interface ResolveMediaInput {
  media?: RawMediaRow[] | null;
  title?: unknown;
  transcript?: string;
  category?: CulturalCategory;
  seed: string;
  /** Only set when the API genuinely knows the length of the recording. */
  durationSec?: number | undefined;
}

/**
 * Builds the MediaAsset the UI renders from the API's raw media rows.
 *
 * Deliberately leaves `durationSec` undefined unless the API supplied one:
 * `Media` has no duration column, and inventing a length here is what put a
 * running timeline under records that never had one. The players read the real
 * duration off the media element once it loads instead.
 */
export function resolveMedia(input: ResolveMediaInput): MediaAsset {
  const rows = (Array.isArray(input.media) ? input.media : [])
    .map((row) => ({
      url: typeof row?.url === 'string' ? row.url : '',
      type: normalizeMediaType(row?.type, row?.mimeType),
      filename: typeof row?.filename === 'string' ? row.filename : ''
    }))
    .filter((row) => row.url.length > 0);

  const title = typeof input.title === 'string' && input.title.trim() ? input.title.trim() : '';
  // A recording is the substance of the record and a still is its poster, so the
  // recording wins regardless of upload order — rows created in one batch share a
  // timestamp, which makes the API's ordering a coin toss.
  const primary = rows.find((row) => isTimeBased(row.type)) ?? rows[0];

/** Categories that are inherently oral / musical — always show the audio player UI. */
const AUDIO_CATEGORIES = new Set<CulturalCategory>([
  'folk-song',
  'folk-story',
  'oral-tradition',
]);

  // No media at all: a written record if there is a transcript, otherwise just
  // a record we have no still for. Either way it must not claim to be playable.
  if (!primary) {
    // Oral / musical categories without any uploaded file still show the
    // audio player UI so visitors understand what kind of record this is.
    const isAudioCategory = input.category && AUDIO_CATEGORIES.has(input.category);
    const type: MediaType = isAudioCategory
      ? 'audio'
      : input.transcript && input.transcript.trim().length > 0
      ? 'text'
      : 'image';
    return {
      type,
      posterUrl: fallbackImage(input.seed, input.category),
      altText: title ? `${title} — no original media uploaded yet` : 'Cultural record'
    };
  }

  const posterRow = rows.find((row) => looksLikeImage(row.url, row.type));
  const posterUrl = posterRow?.url ?? fallbackImage(input.seed, input.category);

  const asset: MediaAsset = {
    type: primary.type,
    posterUrl,
    altText: title || primary.filename || 'Cultural record'
  };

  // Only time-based media has something to play.
  if (isTimeBased(primary.type)) {
    asset.sourceUrl = primary.url;
  } else if (primary.type === 'image' && input.category && AUDIO_CATEGORIES.has(input.category)) {
    // The only media row is an image (thumbnail) but this is an oral/musical
    // record — treat it as audio so the player UI renders. The image becomes
    // the poster. No sourceUrl means the player runs in demo (no-audio) mode.
    asset.type = 'audio';
    asset.posterUrl = primary.url;
  }
  if (typeof input.durationSec === 'number' && Number.isFinite(input.durationSec) && input.durationSec > 0) {
    asset.durationSec = input.durationSec;
  }

  return asset;
}
