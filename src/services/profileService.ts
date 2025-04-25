
import { supabase } from '@/integrations/supabase/client';

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

export const saveUserProfile = async (userId: string, data: any) => {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    });
    
  if (error) throw error;
  return true;
};

export const hasCompletedOnboarding = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data?.onboarding_completed ?? false;
};

export const checkUserCollections = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
    
  if (error) throw error;
  return !!data;
};
