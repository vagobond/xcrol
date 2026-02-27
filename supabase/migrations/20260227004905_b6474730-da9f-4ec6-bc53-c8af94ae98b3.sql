-- Add soft-delete column to messages
ALTER TABLE public.messages ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Update delete policy to allow users to soft-delete (update deleted_at) their own messages
-- The existing UPDATE policy only allows to_user_id to update (for read_at).
-- We need to allow both sender and receiver to soft-delete.
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.messages;

CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id)
WITH CHECK (auth.uid() = from_user_id OR auth.uid() = to_user_id);