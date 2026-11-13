-- Migration: Move lodge verification from slot_credits to pods
-- Admin verifies pods (rooms), not individual slot credits.
-- Run this in Supabase SQL editor.

-- 1) New enum for pod verification status
CREATE TYPE pod_verification_status AS ENUM (
  'pending_verification',
  'approved',
  'rejected'
);

-- 2) Add verification columns to pods
ALTER TABLE public.pods
  ADD COLUMN IF NOT EXISTS verification_status pod_verification_status NOT NULL DEFAULT 'pending_verification',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 3) Migrate existing data: if a slot credit is pending_verification or rejected,
--    propagate that status to its parent pod via pod_members join.
UPDATE pods p
SET
  verification_status = CASE
    WHEN sc.status = 'rejected' THEN 'rejected'::pod_verification_status
    ELSE 'pending_verification'::pod_verification_status
  END,
  rejection_reason = sc.rejection_reason,
  verified_at = sc.verified_at
FROM pod_members pm
JOIN slot_credits sc ON sc.id = pm.slot_credit_id
WHERE pm.pod_id = p.id
  AND sc.status IN ('pending_verification', 'rejected')
  AND p.verification_status = 'pending_verification';

-- 4) Remove pending_verification and rejected from slot_credit_status enum.
--    PostgreSQL doesn't support removing enum values directly, so we recreate the type.
--    NOTE: This step is safe only if no slot_credits currently use these statuses.
--    After migration, all credits should be booked_pending_claim or other valid states.

-- First, update any remaining credits with verification statuses to booked_pending_claim
UPDATE public.slot_credits
SET status = 'booked_pending_claim'
WHERE status IN ('pending_verification', 'rejected');

-- Drop policies and indexes that depend on slot_credits.status before altering the type
DROP POLICY IF EXISTS location_access_payments_insert_lodge ON public.location_access_payments;
DROP INDEX IF EXISTS public.slot_credits_user_listing_key;

-- Create new enum without the verification statuses
CREATE TYPE slot_credit_status_new AS ENUM (
  'booked',
  'booked_pending_claim',
  'paid_unmatched',
  'matched',
  'subletting',
  'expired'
);

-- Swap the column type
ALTER TABLE public.slot_credits
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.slot_credits
  ALTER COLUMN status TYPE slot_credit_status_new
  USING status::text::slot_credit_status_new;

ALTER TABLE public.slot_credits
  ALTER COLUMN status SET DEFAULT 'booked_pending_claim';

-- Drop old enum and rename new
DROP TYPE IF EXISTS slot_credit_status;
ALTER TYPE slot_credit_status_new RENAME TO slot_credit_status;

-- Recreate the unique index that depended on slot_credits.status
CREATE UNIQUE INDEX slot_credits_user_listing_key
  ON public.slot_credits (user_id, listing_id)
  WHERE status <> 'expired';

-- Recreate the policy that depended on slot_credits.status
CREATE POLICY location_access_payments_insert_lodge
  ON public.location_access_payments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND method = 'lodge'
    AND EXISTS (
      SELECT 1
      FROM public.slot_credits sc
      WHERE sc.listing_id = location_access_payments.listing_id
        AND sc.user_id = auth.uid()
        AND sc.status = 'paid_unmatched'
    )
  );

-- 5) Clean up slot_credits verification columns (no longer needed at credit level)
ALTER TABLE public.slot_credits DROP COLUMN IF EXISTS rejection_reason;
ALTER TABLE public.slot_credits DROP COLUMN IF EXISTS verified_at;

-- 6) Grant admins UPDATE access on pods.verification_status
--    (existing RLS allows authenticated users to update pods they are members of;
--     we need admins to be able to update any pod's verification status)
CREATE POLICY "Admins can update pod verification status"
  ON public.pods
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (true);
