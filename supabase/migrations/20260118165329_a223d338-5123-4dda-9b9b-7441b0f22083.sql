-- Create storage bucket for generated media (images and videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-media', 'generated-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for generated media bucket
CREATE POLICY "Users can view their own generated media"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload generated media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own generated media"
ON storage.objects FOR DELETE
USING (bucket_id = 'generated-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table to track generated media metadata
CREATE TABLE IF NOT EXISTS public.generated_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.blocks(id) ON DELETE SET NULL,
  board_id UUID REFERENCES public.boards(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  file_size_bytes INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  duration_seconds NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_generated_media_user_id ON public.generated_media(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_media_block_id ON public.generated_media(block_id);
CREATE INDEX IF NOT EXISTS idx_generated_media_board_id ON public.generated_media(board_id);
CREATE INDEX IF NOT EXISTS idx_generated_media_message_id ON public.generated_media(message_id);
CREATE INDEX IF NOT EXISTS idx_generated_media_type ON public.generated_media(type);
CREATE INDEX IF NOT EXISTS idx_generated_media_created_at ON public.generated_media(created_at DESC);

-- Enable RLS
ALTER TABLE public.generated_media ENABLE ROW LEVEL SECURITY;

-- RLS policies for generated_media
CREATE POLICY "Users can view their own generated media metadata"
ON public.generated_media FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated media metadata"
ON public.generated_media FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated media metadata"
ON public.generated_media FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated media metadata"
ON public.generated_media FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_generated_media_updated_at
BEFORE UPDATE ON public.generated_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();