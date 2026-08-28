-- Add min_budget column to living_preferences
ALTER TABLE public.living_preferences
  ADD COLUMN IF NOT EXISTS min_budget numeric;
