/**
 * Shared CORS headers for all edge functions.
 * Import this in every edge function to handle preflight requests.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Handle OPTIONS preflight request.
 * Usage: if (req.method === 'OPTIONS') return handleCors();
 */
export const handleCors = () => new Response(null, { headers: corsHeaders });
