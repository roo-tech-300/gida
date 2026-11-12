-- Migration: Add expired_at column to slot_credits table for lodge grace period
-- This column tracks when a credit entered 'expired' status, enabling
-- a 3-day grace period before lodges are hidden from user profiles.

ALTER TABLE public.slot_credits ADD COLUMN expired_at TIMESTAMPTZ;

-- Optional: Backfill existing expired records with their creation date
-- (helps maintain consistency if credits were expired before this migration)
UPDATE public.slot_credits 
SET expired_at = created_at 
WHERE status = 'expired' AND expired_at IS NULL;

-- Note: The existing unique index slot_credits_user_listing_key already
-- filters out expired status (WHERE status <> 'expired'), so no index
-- changes are needed. The grace period logic in reserved-houses-section.tsx
-- will use this column to show expired lodges for 3 days after expiration.

COMMENT ON COLUMN public.slot_credits.expired_at IS
  'Timestamp when the slot credit entered expired status. Used for 3-day grace period before hiding from user profiles.';