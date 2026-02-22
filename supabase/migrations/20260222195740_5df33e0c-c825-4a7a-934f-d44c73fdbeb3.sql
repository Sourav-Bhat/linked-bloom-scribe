
-- Create personas table for detailed onboarding data
CREATE TABLE public.personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  industry TEXT NOT NULL,
  experience_range TEXT NOT NULL,
  location TEXT NOT NULL,
  future_goal TEXT NOT NULL,
  topics TEXT[] NOT NULL,
  admired_posts JSONB DEFAULT '[]'::jsonb,
  no_go_topic TEXT,
  posts_per_week INTEGER NOT NULL,
  preferred_days TEXT[] NOT NULL,
  tone TEXT NOT NULL,
  archetype TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_persona UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own persona"
  ON public.personas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own persona"
  ON public.personas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persona"
  ON public.personas FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON public.personas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
