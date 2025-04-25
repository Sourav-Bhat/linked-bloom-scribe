// Types for our LinkedIn content management app

export interface ContentPost {
  id: string;
  title: string;
  content: string;
  hashtags?: string;
  status: 'draft' | 'scheduled' | 'published' | 'final';
  topic?: string;
  tone?: string;
  scheduledDate?: string;
  publishedDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface UserProfile {
  id: string;
  name: string;
  industry: string;
  role: string;
  topics: string[];
  postsPerWeek: number;
  tone: 'professional' | 'friendly' | 'authoritative' | 'educational' | 'inspirational';
  createdAt: string;
  updatedAt: string;
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
