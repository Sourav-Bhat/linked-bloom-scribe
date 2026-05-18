
// Types for the LinkedIn content management app

export interface ContentPost {
  id: string;
  title: string;
  content: string;
  hashtags?: string;
  status: 'draft' | 'scheduled' | 'published' | 'final';
  topic?: string;
  tone?: string;
  instructions?: string;
  postLength?: 'short' | 'medium' | 'long';
  versions?: Array<{ date: string; content: string; hashtags?: string }>;
  scheduledDate?: string;
  publishedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id?: string;
  fullName?: string;
  industry?: string;
  jobTitle?: string;
  topics?: string[];
  postsPerWeek?: number;
  tone?: 'professional' | 'friendly' | 'authoritative' | 'educational' | 'inspirational';
  createdAt?: string;
  updatedAt?: string;
  company?: string;
  bio?: string;
  onboardingCompleted?: boolean;
}

export interface ContentCalendarEntry {
  date: Date;
  posts: ContentPost[];
}

export interface GenerationParams {
  topic: string;
  tone: string;
  instructions?: string;
  includeHashtags: boolean;
  postLength: 'short' | 'medium' | 'long';
}

export interface LLMGenerationResponse {
  title: string;
  content: string;
  hashtags?: string;
}
