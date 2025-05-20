
import { supabase } from '@/integrations/supabase/client';
import { ContentPost } from '@/lib/types';

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
  return data;
};

export const getContent = async (userId: string, postId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .eq('id', postId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateContentStatus = async (userId: string, postId: string, status: string) => {
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

export const updateContent = async (userId: string, postId: string, data: Partial<ContentPost>) => {
  // Filter out properties that are not in the database schema
  const { versions, instructions, postLength, ...dbData } = data;
  
  const { error } = await supabase
    .from('posts')
    .update({ 
      ...dbData, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) throw error;
};
