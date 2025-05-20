
import { supabase } from '@/integrations/supabase/client';
import { ContentPost } from '@/lib/types';

/**
 * Saves a newly generated content post to the database
 * @param userId The user ID who owns the content
 * @param content The content post to save
 */
export const saveGeneratedContent = async (userId: string, content: Partial<ContentPost>) => {
  // Filter out properties that are not in the database schema
  const { versions, instructions, postLength, ...dbContent } = content;
  
  const { error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      ...dbContent,
      status: dbContent.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
};

/**
 * Retrieves all content posts for a user, optionally filtered by status
 * @param userId The user ID to fetch content for
 * @param status Optional status filter
 * @returns Array of content posts
 */
export const getUserContents = async (userId: string, status?: string) => {
  let query = supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId);
    
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Ensure the status field is cast to the proper type
  return data.map(post => ({
    ...post,
    status: post.status as ContentPost['status'],
    // Convert database fields to match our frontend types
    scheduledDate: post.scheduled_date,
    publishedDate: post.published_date
  }));
};

/**
 * Retrieves a specific content post by ID
 * @param userId The user ID who owns the content
 * @param postId The post ID to retrieve
 * @returns The content post or null if not found
 */
export const getContent = async (userId: string, postId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .eq('id', postId)
    .maybeSingle();

  if (error) throw error;
  
  if (!data) return null;
  
  // Ensure the status field is cast to the proper type
  return {
    ...data,
    status: data.status as ContentPost['status'],
    // Convert database fields to match our frontend types
    scheduledDate: data.scheduled_date,
    publishedDate: data.published_date
  };
};

/**
 * Updates the status of a content post
 * @param userId The user ID who owns the content
 * @param postId The post ID to update
 * @param status The new status
 */
export const updateContentStatus = async (userId: string, postId: string, status: ContentPost['status']) => {
  const { error } = await supabase
    .from('posts')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) throw error;
};

/**
 * Updates a content post with new data
 * @param userId The user ID who owns the content
 * @param postId The post ID to update
 * @param data The updated content data
 */
export const updateContent = async (userId: string, postId: string, data: Partial<ContentPost>) => {
  // Filter out properties that are not in the database schema
  const { versions, instructions, postLength, ...dbData } = data;
  
  const { error } = await supabase
    .from('posts')
    .update({ 
      ...dbData, 
      updated_at: new Date().toISOString(),
      // Map frontend field names to database column names
      scheduled_date: dbData.scheduledDate,
      published_date: dbData.publishedDate
    })
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) throw error;
};
