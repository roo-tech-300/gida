-- Migration: Add optional matric_number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS matric_number text;

COMMENT ON COLUMN public.profiles.matric_number IS 'Optional student matric number collected during onboarding.';
