-- Offline messaging support.
-- Adds a sender-device timestamp (client_sent_at) so threads/messages can keep
-- send-time metadata even when a message was created while offline and synced
-- later. Message POSITION on each phone is decided by that phone's own local
-- store (local creation time); this column supplies the displayed timestamp
-- and the stable tie-break for messages that arrive in the same batch.

-- ---------------------------------------------------------------------------
-- client_sent_at: ms since epoch, set by the sending device
-- ---------------------------------------------------------------------------
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS client_sent_at BIGINT;

-- Backfill existing rows from their server timestamp.
UPDATE public.messages
   SET client_sent_at = (EXTRACT(EPOCH FROM created_at) * 1000)::BIGINT
 WHERE client_sent_at IS NULL;

-- Guard against nonsense values; keep it monotone enough for sensible ordering.
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_client_sent_at_valid;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_client_sent_at_valid CHECK (client_sent_at > 0);

ALTER TABLE public.messages
  ALTER COLUMN client_sent_at SET NOT NULL;

ALTER TABLE public.messages
  ALTER COLUMN client_sent_at SET DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;

CREATE INDEX IF NOT EXISTS idx_messages_client_sent_at
  ON public.messages (conversation_id, client_sent_at);

-- ---------------------------------------------------------------------------
-- thread preview time should follow the sender's device time, not the moment
-- the message was flushed to the server
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bump_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  is_sender_a BOOLEAN;
  preview_text TEXT;
BEGIN
  preview_text := COALESCE(NULLIF(trim(NEW.body), ''), 'Shared a listing');

  UPDATE public.conversations
     SET last_message_at = to_timestamp(NEW.client_sent_at / 1000.0),
         last_message_preview = preview_text,
         last_message_sender_id = NEW.sender_id
   WHERE id = NEW.conversation_id;

  SELECT (c.participant_a = NEW.sender_id)
    INTO is_sender_a
    FROM public.conversations c
   WHERE c.id = NEW.conversation_id;

  IF FOUND THEN
    IF is_sender_a THEN
      UPDATE public.conversations
         SET unread_b = unread_b + 1
       WHERE id = NEW.conversation_id;
    ELSE
      UPDATE public.conversations
         SET unread_a = unread_a + 1
       WHERE id = NEW.conversation_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;