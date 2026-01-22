-- Create storage bucket for question images
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true);

-- Allow authenticated users to view images
CREATE POLICY "Anyone can view question images"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-images');

-- Allow profesores and admins to upload images
CREATE POLICY "Profesores can upload question images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'question-images' 
  AND (
    public.has_role(auth.uid(), 'profesor'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Allow profesores and admins to update images
CREATE POLICY "Profesores can update question images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'question-images' 
  AND (
    public.has_role(auth.uid(), 'profesor'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Allow profesores and admins to delete images
CREATE POLICY "Profesores can delete question images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'question-images' 
  AND (
    public.has_role(auth.uid(), 'profesor'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);