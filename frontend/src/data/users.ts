import type { CulturalUser } from '../types/user';

export const users: CulturalUser[] = [
{
  id: 'u1',
  name: 'Kamla Devi',
  handle: 'kamladevi',
  avatarUrl: "/b3ff0c82-6a38-4489-bc6e-4bb5386e212a.jpg",
  bio: 'Sings the Sohar and Samdaun of Mithila. Learned every line from my mother-in-law.',
  region: 'Mithila, Bihar',
  state: 'Bihar',
  languages: ['Maithili', 'Hindi'],
  interests: ['Folk songs', 'Village festivals', 'Oral storytelling'],
  followers: 4820,
  following: 63,
  contributions: 41,
  isKnowledgeHolder: true
},
{
  id: 'u2',
  name: 'Jivya Vaghela',
  handle: 'jivya.warli',
  avatarUrl: "/ad6f6831-5487-4038-9c1d-784f340b9d3d.jpg",
  bio: 'Warli painter from Ganjad. I paint what the village does, not what sells.',
  region: 'Palghar, Maharashtra',
  state: 'Maharashtra',
  languages: ['Marathi', 'Warli'],
  interests: ['Tribal art', 'Village festivals'],
  followers: 9310,
  following: 122,
  contributions: 67,
  isKnowledgeHolder: true
},
{
  id: 'u3',
  name: 'Anwesha Roy',
  handle: 'anwesha.archives',
  avatarUrl: "/9c0ee134-0e5c-4d01-b23c-c42aaa2f7934.jpg",
  bio: 'Documenting Baul akharas across Birbhum. Recording, not curating.',
  region: 'Birbhum, West Bengal',
  state: 'West Bengal',
  languages: ['Bengali', 'Hindi', 'English'],
  interests: ['Folk songs', 'Ritual performance', 'Instrument making'],
  followers: 12740,
  following: 341,
  contributions: 118,
  role: 'ADMIN'
},
{
  id: 'u4',
  name: 'Rukma Sapera',
  handle: 'rukma.kalbelia',
  avatarUrl: "/5cc59d29-a3b2-4ca6-8420-ecc86f309fec.jpg",
  bio: 'Kalbelia dancer and singer. Third generation, Jaisalmer district.',
  region: 'Jaisalmer, Rajasthan',
  state: 'Rajasthan',
  languages: ['Rajasthani', 'Hindi'],
  interests: ['Folk songs', 'Ritual performance'],
  followers: 7605,
  following: 88,
  contributions: 34,
  isKnowledgeHolder: true
},
{
  id: 'u5',
  name: 'Balan Peruvannan',
  handle: 'balan.theyyam',
  avatarUrl: "/521aba80-aa8c-4b27-8ad3-50b1254f54f0.jpg",
  bio: 'Theyyam performer, Kannur. Forty-one seasons in the kavu.',
  region: 'Kannur, Kerala',
  state: 'Kerala',
  languages: ['Malayalam'],
  interests: ['Ritual performance', 'Local history'],
  followers: 6188,
  following: 41,
  contributions: 29,
  isKnowledgeHolder: true
},
{
  id: 'u6',
  name: 'Sudarshan Maharana',
  handle: 'sudarshan.patta',
  avatarUrl: "/c1801f07-2b41-4c65-8bff-e69f3c081609.jpg",
  bio: 'Pattachitra artist from Raghurajpur. Natural pigments only.',
  region: 'Puri, Odisha',
  state: 'Odisha',
  languages: ['Odia', 'Hindi'],
  interests: ['Tribal art', 'Textile craft'],
  followers: 5402,
  following: 97,
  contributions: 52,
  isKnowledgeHolder: true
},
{
  id: 'u7',
  name: 'Meera Nathwani',
  handle: 'meera.claywheel',
  avatarUrl: "/d6240f8c-0e49-4534-8f8c-4a7b61f2ba71.jpg",
  bio: 'Potter in Khavda, Kutch. Recording the songs we sing while turning the wheel.',
  region: 'Kutch, Gujarat',
  state: 'Gujarat',
  languages: ['Kutchi', 'Gujarati'],
  interests: ['Pottery & clay', 'Folk songs'],
  followers: 3117,
  following: 154,
  contributions: 23,
  isKnowledgeHolder: true
},
{
  id: 'me',
  name: 'Aarav Sen',
  handle: 'aarav',
  avatarUrl: "/6f8a9fc1-7733-4e4b-a51b-dd86f783400b.jpg",
  bio: 'Recording my grandmother’s songs before they go quiet. Student, Kolkata.',
  region: 'Birbhum, West Bengal',
  state: 'West Bengal',
  languages: ['Bengali', 'Hindi', 'English'],
  interests: ['Folk songs', 'Oral storytelling', 'Village festivals', 'Tribal art'],
  followers: 218,
  following: 412,
  contributions: 6
}];


export const currentUserId = 'me';

export function getUser(id: string): CulturalUser {
  return users.find((u) => u.id === id) ?? users[users.length - 1]!;
}