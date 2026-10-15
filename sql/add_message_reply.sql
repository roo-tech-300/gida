-- =============================================================================
-- Migration: Add persisted message replies (reply_to snapshot)
-- =============================================================================
-- reply_to stores a denormalized snapshot of the message being replied to:
--   { "messageId": "<uuid>", "senderId": "<uuid>", "body": "<text>" }
-- Same pattern as the existing attachment JSONB column: renders without a join,
-- survives deletion of the original message, and flows through the offline and
-- realtime layers the same way attachment already does.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to JSONB;

-- Guard: the referenced message must belong to the same conversation.
CREATE OR REPLACE FUNCTION public.validate_message_reply()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ref_conversation_id UUID;
BEGIN
  IF NEW.reply_to IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.reply_to->>'messageId' IS NULL THEN
    RAISE EXCEPTION 'REPLY_MISSING_MESSAGE_ID' USING ERRCODE = '22023';
  END IF;

  SELECT conversation_id INTO ref_conversation_id
    FROM public.messages
   WHERE id = (NEW.reply_to->>'messageId')::uuid;

  IF ref_conversation_id IS DISTINCT FROM NEW.conversation_id THEN
    RAISE EXCEPTION 'REPLY_TARGET_NOT_IN_CONVERSATION' USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_validate_reply ON public.messages;
CREATE TRIGGER trg_messages_validate_reply
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_message_reply();
