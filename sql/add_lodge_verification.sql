-- Migration: Lodge reservation verification flow
-- Admin must accept/reject a reservation before the user can pay.
-- Run this in Supabase SQL editor.

-- 1) New statuses for the verification lifecycle
ALTER TYPE public.slot_credit_status ADD VALUE IF NOT EXISTS 'pending_verification';
ALTER TYPE public.slot_credit_status ADD VALUE IF NOT EXISTS 'rejected';

-- 2) Rejection tracking columns
ALTER TABLE public.slot_credits ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.slot_credits ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
