import type { CulturalCategory } from '../types/culture';

export const CATEGORIES: CulturalCategory[] = [
'folk-story',
'folk-song',
'oral-tradition',
'artwork',
'craft',
'festival',
'local-history',
'traditional-practice'];


export const REGIONS = [
'Mithila, Bihar',
'Palghar, Maharashtra',
'Birbhum, West Bengal',
'Jaisalmer, Rajasthan',
'Kannur, Kerala',
'Puri, Odisha',
'Kutch, Gujarat',
'Bastar, Chhattisgarh',
'Jhargram, West Bengal',
'Alwar, Rajasthan',
'Thanjavur, Tamil Nadu',
'Majuli, Assam'];


export const LANGUAGES = [
'Maithili',
'Marathi',
'Bengali',
'Rajasthani',
'Malayalam',
'Odia',
'Kutchi',
'Halbi',
'Santali',
'Tamil',
'Assamese',
'Hindi'];


export const TRADITIONS = [
'Sohar',
'Warli wall painting',
'Baul',
'Kalbelia',
'Theyyam',
'Pattachitra',
'Rogan art',
'Ghotul storytelling',
'Chhau',
'Terracotta pottery',
'Bhavai',
'Sattriya'];


export const ART_FORMS = [
'Mithila painting',
'Warli painting',
'Baul singing',
'Kalbelia dance',
'Theyyam performance',
'Pattachitra scroll',
'Rogan cloth painting',
'Dhokra metal casting',
'Chhau mask making',
'Wheel pottery'];


export const FESTIVALS = [
'Chhath',
'Tarpa Utsav',
'Poush Mela',
'Teej',
'Theyyam Kaliyattam',
'Ratha Yatra',
'Navratri',
'Bhagoria',
'Gajan',
'Bihu'];


export const INTERESTS = [
'Folk stories',
'Folk songs',
'Oral storytelling',
'Tribal art',
'Textile craft',
'Ritual performance',
'Village festivals',
'Local history'];

/**
 * Maps interest display names (from INTERESTS) to category slugs
 * stored in the `culturalCategory` DB table (name field).
 * Used by InteractionsContext to follow/unfollow interests.
 */
export const INTEREST_TO_CATEGORY: Record<string, string> = {
  'Folk songs': 'folk-song',
  'Oral storytelling': 'folk-story',
  'Tribal art': 'artwork',
  'Textile craft': 'craft',
  'Ritual performance': 'traditional-practice',
  'Village festivals': 'festival',
  'Pottery & clay': 'craft',
  'Regional cuisine lore': 'folk-story',
  'Instrument making': 'craft',
  'Local history': 'local-history',
};

/** Reverse map: category slug → interest display name */
export const CATEGORY_TO_INTEREST: Record<string, string> = Object.fromEntries(
  Object.entries(INTEREST_TO_CATEGORY).map(([interest, slug]) => [slug, interest])
);


export const MEDIA_TYPE_LABELS: Record<string, string> = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  text: 'Text'
};