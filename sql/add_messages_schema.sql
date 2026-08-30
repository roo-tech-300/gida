-- 1:1 conversations and messages for Gida's in-app messaging.
-- This script only creates the conversations/messages tables, their policies,
-- triggers and helpers. It assumes auth.users is available from Supabase Auth.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  unread_a INTEGER NOT NULL DEFAULT 0,
  unread_b INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conversations_participants_ordered CHECK (participant_a < participant_b),
  CONSTRAINT conversations_participants_unique UNIQUE (participant_a, participant_b)
);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_a ON public.conversations(participant_a);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_b ON public.conversations(participant_b);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at);

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT,
  attachment JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT messages_have_content CHECK (body IS NOT NULL OR attachment IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id) WHERE read_at IS NULL;

-- ---------------------------------------------------------------------------
-- trigger: keep conversation preview/unread counters in sync
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
     SET last_message_at = NEW.created_at,
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

DROP TRIGGER IF EXISTS trg_messages_bump_conversation ON public.messages;
CREATE TRIGGER trg_messages_bump_conversation
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.bump_conversation_on_message();

-- ---------------------------------------------------------------------------
-- helper: mark a conversation as read for a participant
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID, p_reader_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM public.conversations
     WHERE id = p_conversation_id
       AND (participant_a = p_reader_id OR participant_b = p_reader_id)
  ) THEN
    RAISE EXCEPTION 'READER_NOT_A_PARTICIPANT' USING ERRCODE = '22023';
  END IF;

  UPDATE public.messages
     SET read_at = NOW()
   WHERE conversation_id = p_conversation_id
     AND sender_id <> p_reader_id
     AND read_at IS NULL;

  UPDATE public.conversations
     SET unread_a = CASE WHEN participant_a = p_reader_id THEN 0 ELSE unread_a END,
         unread_b = CASE WHEN participant_b = p_reader_id THEN 0 ELSE unread_b END
   WHERE id = p_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_conversation_read(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID, UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- row level security
-- ---------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversations are viewable by participants" ON public.conversations;
CREATE POLICY "Conversations are viewable by participants"
  ON public.conversations FOR SELECT
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

DROP POLICY IF EXISTS "Participants can create conversations" ON public.conversations;
CREATE POLICY "Participants can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = participant_a OR auth.uid() = participant_b)
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

DROP POLICY IF EXISTS "Messages are viewable by conversation participants" ON public.messages;
CREATE POLICY "Messages are viewable by conversation participants"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
        FROM public.conversations c
       WHERE c.id = messages.conversation_id
         AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
        FROM public.conversations c
       WHERE c.id = messages.conversation_id
         AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- realtime: expose messages + conversations to Supabase Realtime
-- (RLS still gates what each client receives)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;
  END IF;
END $$;