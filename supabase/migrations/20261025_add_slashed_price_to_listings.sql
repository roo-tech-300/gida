-- Migration: Add slashed_price column to listings table
-- Purpose: Show a crossed-out "market" price above the real price the customer
-- pays, e.g. "~~800,000~~ 780,000" (Amazon-style discount display for lodges).
--
-- Semantics:
--   price_amount  -> the real price, what checkout charges.
--   slashed_price -> the higher, crossed-out market price used to signal a
--                    discount. Only rendered when slashed_price > price_amount.
--
-- Idempotent: safe to re-run

-- ---------------------------------------------------------------------------
-- 1) Add slashed_price column to listings table
-- ---------------------------------------------------------------------------
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS slashed_price numeric(10, 2);

-- ---------------------------------------------------------------------------
-- 2) Backfill existing rows: set slashed_price = price_amount
--     Equal values mean "no discount", so nothing extra is rendered.
-- ---------------------------------------------------------------------------
UPDATE public.listings
SET slashed_price = price_amount
WHERE slashed_price IS NULL;

-- ---------------------------------------------------------------------------
-- 3) Optional: add a check constraint to keep the two prices consistent.
--     Uncomment if you want to enforce at the DB level that the slashed price
--     must always be the higher, crossed-out one (or NULL/equal).
-- ---------------------------------------------------------------------------
/*
ALTER TABLE public.listings
  ADD CONSTRAINT listings_slashed_price_check
  CHECK (slashed_price IS NULL OR slashed_price >= price_amount);
*/
