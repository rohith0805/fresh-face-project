-- Create storage bucket for session photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-photos', 'session-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for session photos - allow public access
CREATE POLICY "Allow public access to session photos" 
ON storage.objects 
FOR ALL
USING (bucket_id = 'session-photos');

-- Add policy for uploads
CREATE POLICY "Allow public uploads to session photos" 
ON storage.objects 
FOR INSERT
WITH CHECK (bucket_id = 'session-photos');