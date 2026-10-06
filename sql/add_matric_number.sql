-- 1. Add matric_number column to profiles (optional, nullable)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS matric_number text;

-- 2. Helpful comment
COMMENT ON COLUMN public.profiles.matric_number IS 'Optional student matric number collected during onboarding.';
