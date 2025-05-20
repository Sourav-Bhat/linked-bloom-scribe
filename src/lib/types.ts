
// Types for our LinkedIn content management app

export interface ContentPost {
  id: string;
  title: string;
  content: string;
  hashtags?: string;
  status: 'draft' | 'scheduled' | 'published' | 'final';
  topic?: string;
  tone?: string;
  instructions?: string; // Added instructions field
  postLength?: 'short' | 'medium' | 'long'; // Added postLength field
  versions?: Array<{date: string, content: string, hashtags?: string}>; // Added versions field
  scheduledDate?: string;
  publishedDate?: string;
  created_at: string; // Changed from createdAt to match Supabase
  updated_at: string; // Changed from updatedAt to match Supabase
  user_id: string;    // Changed from userId to match Supabase
}

export interface UserProfile {
  id: string;
  full_name: string; // Changed to match Supabase column
  industry: string;
  job_title: string; // Changed from role to match Supabase
  topics: string[]; 
  posts_per_week: number; // Changed from postsPerWeek to match Supabase
  tone: 'professional' | 'friendly' | 'authoritative' | 'educational' | 'inspirational';
  created_at: string; // Changed from createdAt to match Supabase
  updated_at: string; // Changed from updatedAt to match Supabase
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
