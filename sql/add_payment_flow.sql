-- Migration: dummy payment flow + enforced 3-day slot-credit deadline
-- Run this in Supabase (SQL editor) BEFORE redeploying the worker:
--   cd C:\Users\eluzi\Documents\projects\gida\worker && npx wrangler deploy
--
-- IMPORTANT: this script MUST be run before sql/fix_slot_credit_re_purchase.sql
-- (that file references the 'expired' enum value and will fail without it).
-- Run this script as its OWN execution, then run fix_slot_credit_re_purchase.sql separately.

-- 1) New status for slot credits whose 3-day payment window lapsed.
--    The worker PATCHes unpaid credits to 'expired'; this value must exist first.
ALTER TYPE public.slot_credit_status ADD VALUE IF NOT EXISTS 'expired';

-- 2) Timestamp recording when the dummy checkout marked the credit as paid.
ALTER TABLE public.slot_credits ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
