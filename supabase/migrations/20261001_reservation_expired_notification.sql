-- Migration: Notify a booking user when their lodge reservation expires.
-- Companion to sql/add_reservation_expired_notification.sql (keep both in sync).
--
-- When a slot_credits row transitions to status = 'expired', we send the booking
-- user a direct message FROM the admin who owns the listing
-- ("the admin in charge of the lodge"):
--     "Your reservation for <listing title> has expired."
-- carrying a standard `listing` attachment. MessageListingCard already navigates
-- to /property/<listingId> on tap, so no client changes are needed. The existing
-- Database Webhook on public.messages (INSERT) then dispatches the FCM push,
-- titled with the admin's name.
--
-- The trigger is SECURITY DEFINER (bypasses the messages RLS policy, which would
-- otherwise forbid a client from sending as the admin) and fires for both the
-- scheduled worker PATCH and the in-app "Release Hold" path.

CREATE OR REPLACE FUNCTION public.notify_reservation_expired()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title      text;
  v_image      text;
  v_landmark   text;
  v_city       text;
  v_admin_id   uuid;
  v_price      numeric;
  v_a          uuid;
  v_b          uuid;
  v_conv_id    uuid;
  v_body       text;
  v_attachment jsonb;
BEGIN
  IF NEW.status <> 'expired' OR OLD.status IS NOT DISTINCT FROM 'expired' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL OR NEW.listing_id IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT l.title, l.primary_image, l.location_landmark, l.city, l.admin_id, l.price_amount
      INTO v_title, v_image, v_landmark, v_city, v_admin_id, v_price
      FROM public.listings l
     WHERE l.id = NEW.listing_id;

    IF NOT FOUND OR v_admin_id IS NULL OR v_admin_id = NEW.user_id THEN
      RETURN NEW;
    END IF;

    IF NEW.user_id < v_admin_id THEN
      v_a := NEW.user_id;
      v_b := v_admin_id;
    ELSE
      v_a := v_admin_id;
      v_b := NEW.user_id;
    END IF;

    INSERT INTO public.conversations (participant_a, participant_b)
    VALUES (v_a, v_b)
    ON CONFLICT (participant_a, participant_b) DO NOTHING;

    SELECT c.id INTO v_conv_id
      FROM public.conversations c
     WHERE c.participant_a = v_a
       AND c.participant_b = v_b;

    IF v_conv_id IS NULL THEN
      RAISE WARNING '[notify_reservation_expired] conversation missing for % / %', v_a, v_b;
      RETURN NEW;
    END IF;

    v_body := format(
      'Your reservation for %s has expired.',
      COALESCE(NULLIF(v_title, ''), 'the property')
    );

    v_attachment := jsonb_build_object(
      'type', 'listing',
      'listingId', NEW.listing_id,
      'title', COALESCE(NULLIF(v_title, ''), 'Gida Property'),
      'image', v_image,
      'price', chr(8358) || to_char(COALESCE(v_price, 0), 'FM999,999,999,999') || '/year',
      'location', concat_ws(', ', NULLIF(v_landmark, ''), NULLIF(v_city, ''))
    );

    INSERT INTO public.messages (conversation_id, sender_id, body, attachment, client_sent_at)
    VALUES (
      v_conv_id,
      v_admin_id,
      v_body,
      v_attachment,
      (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[notify_reservation_expired] failed for credit %: % (%)', NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_reservation_expired ON public.slot_credits;
CREATE TRIGGER trg_notify_reservation_expired
  AFTER UPDATE OF status ON public.slot_credits
  FOR EACH ROW
  WHEN (NEW.status = 'expired' AND OLD.status IS DISTINCT FROM 'expired')
  EXECUTE FUNCTION public.notify_reservation_expired();
