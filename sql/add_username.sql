-- 1. Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- 2. Case-insensitive uniqueness for username (nullable; only enforces on non-null)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uniq
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL;
