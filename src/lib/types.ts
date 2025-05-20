
// Types for our LinkedIn content management app

export interface ContentPost {
  id: string;
  title: string;
  content: string;
  hashtags?: string;
  status: 'draft' | 'scheduled' | 'published' | 'final';
  topic?: string;
  tone?: string;
  instructions?: string; // Instructions for content generation
  postLength?: 'short' | 'medium' | 'long'; // Content length preference
  versions?: Array<{date: string, content: string, hashtags?: string}>; // Version history
  scheduledDate?: string;
  publishedDate?: string;
  created_at: string; // Matches Supabase column name
  updated_at: string; // Matches Supabase column name
  user_id: string;    // Matches Supabase column name
}

export interface UserProfile {
  id: string;
  full_name: string; // Matches Supabase column name
  industry: string;
  job_title: string; // Matches Supabase column name
  topics: string[]; 
  posts_per_week: number; // Matches Supabase column name
  tone: 'professional' | 'friendly' | 'authoritative' | 'educational' | 'inspirational';
  created_at: string; // Matches Supabase column name
  updated_at: string; // Matches Supabase column name
  company?: string;
  bio?: string;
  onboarding_completed?: boolean;
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

// Type for API responses from external LLM services
export interface LLMGenerationResponse {
  title: string;
  content: string;
  hashtags?: string;
}
