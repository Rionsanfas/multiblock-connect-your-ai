-- Make the generated-media bucket private instead of public
UPDATE storage.buckets 
SET public = false 
WHERE id = 'generated-media';

-- Add RLS policy to allow authenticated users to read their own files
CREATE POLICY "Users can read their own generated media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-media' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);