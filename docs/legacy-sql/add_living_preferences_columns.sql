-- Add preferred_layout and must_have_amenities to living_preferences
-- Run this migration to support the new 2-step onboarding flow

ALTER TABLE public.living_preferences
ADD COLUMN IF NOT EXISTS preferred_layout TEXT,
ADD COLUMN IF NOT EXISTS must_have_amenities TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.living_preferences.preferred_layout IS 'User preferred layout type: self_contain, single_room, flat, or any';
COMMENT ON COLUMN public.living_preferences.must_have_amenities IS 'Array of required amenities: generator, borehole, fenced_gate, wifi, etc.';
