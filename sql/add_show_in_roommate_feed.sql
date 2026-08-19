-- Set default for show_in_roommate_feed to false for new users
ALTER TABLE public.profiles
  ALTER COLUMN show_in_roommate_feed SET DEFAULT false;
