-- Migration: persist each member's billed share on pod_members for DB-side revenue parity.
-- Apply in Supabase SQL editor. Run AFTER add_payment_flow.sql and fix_slot_credit_re_purchase.sql.
ALTER TABLE public.pod_members ADD COLUMN IF NOT EXISTS amount_paid NUMERIC;
