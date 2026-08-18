-- Optional migration: align the DB default for slot_credits.payment_deadline
-- with the app's 3-day payment window (PAYMENT_WINDOW_MS in utils/liquidity-math.ts).
-- The app always sends payment_deadline explicitly, so this is defense-in-depth.
-- Safe to run anytime after the add_payment_flow.sql migration.
ALTER TABLE public.slot_credits ALTER COLUMN payment_deadline SET DEFAULT (NOW() + INTERVAL '3 days');
