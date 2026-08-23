import type { AIEnrichment } from './ai';
import type { CommunityLayer } from './verification';

export type MediaType = 'image' | 'video' | 'audio' | 'text';

export type CulturalCategory =
'folk-story' |
'folk-song' |
'oral-tradition' |
'artwork' |
'craft' |
'festival' |
'local-history' |
'traditional-practice';

export type RelationshipType =
'RELATED_TRADITION' |
'REGIONAL_VARIANT' |
'SAME_FESTIVAL' |
'RELATED_SONG' |
'SAME_ART_FORM';

export interface MediaAsset {
  type: MediaType;
  /** Poster / still frame — always present so cards can render before playback. */
  posterUrl: string;
  /** Playable source for audio and video records. */
  sourceUrl?: string;
  /** Duration in seconds for time-based media. */
  durationSec?: number;
  altText: string;
}

/**
 * The untouched contribution. Nothing in the AI layer may write to these fields.
 */
export interface OriginalSource {
  media: MediaAsset;
  language: string;
  /** Transcript in the original script, as spoken or written by the contributor. */
  transcript: string;
  contributorNote?: string;
  recordedAt: string;
  recordedBy: string;
}

export interface CulturalRelationship {
  type: RelationshipType;
  recordId: string;
}

export interface PostCreator {
  id: string;
  name: string;
  avatarUrl: string;
  region?: string;
  isKnowledgeHolder?: boolean;
}

export interface CulturalRecord {
  id: string;
  title: string;
  description: string;
  category: CulturalCategory;
  region: string;
  state: string;
  coordinates: [number, number];
  tradition: string;
  artForm?: string;
  festival?: string;
  creatorId: string;
  createdAt: string;
  /** Contributor-supplied tags. AI tags live on the enrichment layer. */
  tags: string[];
  likes: number;
  comments: number;
  saves: number;
  source: OriginalSource;
  ai: AIEnrichment;
  community: CommunityLayer;
  relationships: CulturalRelationship[];
  featured?: boolean;
  fromInterview?: boolean;
  /** Creator user data returned by the API. Prefer this over getUser(creatorId). */
  user?: PostCreator | undefined;
}

export interface CulturalComment {
  id: string;
  recordId: string;
  userId: string;
  body: string;
  createdAt: string;
  likes: number;
  /** Author user data returned by the API. */
  user?: { id: string; name: string; avatarUrl: string };
}

export const CATEGORY_LABELS: Record<CulturalCategory, string> = {
  'folk-story': 'Folk Story',
  'folk-song': 'Folk Song',
  'oral-tradition': 'Oral Tradition',
  artwork: 'Regional Artwork',
  craft: 'Craft',
  festival: 'Festival',
  'local-history': 'Local History',
  'traditional-practice': 'Traditional Practice'
};

export const CATEGORY_NAME_TO_ID: Record<string, CulturalCategory> = Object.entries(CATEGORY_LABELS).reduce((acc, [id, name]) => {
  acc[name] = id as CulturalCategory;
  return acc;
}, {} as Record<string, CulturalCategory>);

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  RELATED_TRADITION: 'Related Tradition',
  REGIONAL_VARIANT: 'Regional Variant',
  SAME_FESTIVAL: 'Same Festival',
  RELATED_SONG: 'Related Folk Song',
  SAME_ART_FORM: 'Same Art Form'
};