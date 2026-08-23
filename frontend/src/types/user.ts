export interface CulturalUser {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  region: string;
  state: string;
  languages: string[];
  interests?: string[];
  followers: number;
  following: number;
  contributions: number;
  isKnowledgeHolder?: boolean;
  role?: 'member' | 'moderator';
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegistrationDetails extends AuthCredentials {
  name: string;
  region: string;
  languages: string[];
  interests: string[];
}