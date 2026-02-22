import { supabase } from '@/integrations/supabase/client';

export const getUserProfile = async (userId: string) => {
  const { data, error } = await (supabase
    .from('profiles' as any) as any)
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data as any;
};

export const saveUserProfile = async (userId: string, data: any) => {
  const { error } = await (supabase
    .from('profiles' as any) as any)
    .upsert({
      id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    });
    
  if (error) throw error;
  return true;
};

export const hasCompletedOnboarding = async (userId: string) => {
  const { data, error } = await (supabase
    .from('profiles' as any) as any)
    .select('onboarding_completed')
    .eq('id', userId)
    .single();
    
  if (error) return false;
  return data?.onboarding_completed ?? false;
};

export const checkUserCollections = async (userId: string) => {
  const { data, error } = await (supabase
    .from('profiles' as any) as any)
    .select('id')
    .eq('id', userId)
    .maybeSingle();
    
  if (error) return false;
  return !!data;
};

export const hasCompletedProfile = async (userId: string) => {
  const { data, error } = await (supabase
    .from('profiles' as any) as any)
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();
    
  if (error) return false;
  return !!data?.full_name;
};
