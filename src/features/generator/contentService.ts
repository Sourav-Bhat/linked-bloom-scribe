
import { supabase } from '@/integrations/supabase/client';
import { ContentPost } from '@/lib/types';

export const saveGeneratedContent = async (userId: string, content: Partial<ContentPost>) => {
  const { versions, instructions, postLength, ...dbContent } = content;
  
  const { error } = await (supabase
    .from('posts' as any) as any)
    .insert({
      user_id: userId,
      ...dbContent,
      status: dbContent.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
};

export const getUserContents = async (userId: string, status?: string) => {
  let query = (supabase
    .from('posts' as any) as any)
    .select('*')
    .eq('user_id', userId);
    
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  return (data as any[]).map(post => ({
    ...post,
    status: post.status as ContentPost['status'],
    scheduledDate: post.scheduled_date,
    publishedDate: post.published_date
  })) as ContentPost[];
};

export const getContent = async (userId: string, postId: string) => {
  const { data, error } = await (supabase
    .from('posts' as any) as any)
    .select('*')
    .eq('user_id', userId)
    .eq('id', postId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  
  return {
    ...data,
    status: (data as any).status as ContentPost['status'],
    scheduledDate: (data as any).scheduled_date,
    publishedDate: (data as any).published_date
  } as ContentPost;
};

export const updateContentStatus = async (userId: string, postId: string, status: ContentPost['status']) => {
  const { error } = await (supabase
    .from('posts' as any) as any)
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) throw error;
};

export const updateContent = async (userId: string, postId: string, data: Partial<ContentPost>) => {
  const { versions, instructions, postLength, ...dbData } = data;
  
  const { error } = await (supabase
    .from('posts' as any) as any)
    .update({ 
      ...dbData, 
      updated_at: new Date().toISOString(),
      scheduled_date: dbData.scheduledDate,
      published_date: dbData.publishedDate
    })
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) throw error;
};
