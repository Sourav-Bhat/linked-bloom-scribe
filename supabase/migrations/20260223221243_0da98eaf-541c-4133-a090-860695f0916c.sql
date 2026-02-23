-- Add LinkedIn profile URL to personas
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS linkedin_url text DEFAULT '';

-- Create storage bucket for admired post images
INSERT INTO storage.buckets (id, name, public) VALUES ('admired-posts', 'admired-posts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload admired post images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'admired-posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access
CREATE POLICY "Admired post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'admired-posts');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own admired post images"
ON storage.objects FOR DELETE
USING (bucket_id = 'admired-posts' AND auth.uid()::text = (storage.foldername(name))[1]);