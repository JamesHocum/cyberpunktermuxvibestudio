-- Add attachments column to chat_messages
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Create index for faster queries with attachments
CREATE INDEX IF NOT EXISTS idx_chat_messages_attachments 
ON chat_messages USING GIN (attachments);

-- Create bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for chat attachments
CREATE POLICY "Users can upload own attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);