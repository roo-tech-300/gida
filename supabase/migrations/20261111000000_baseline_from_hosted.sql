-- Baseline schema for local development.
-- Generated from the hosted project's system catalogs (schema only, no rows).
-- Superseded the hand-applied scripts in sql/ and the old supabase/migrations files.
set check_function_bodies = false;

create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_net" with schema extensions;

create type public.application_status as enum ('locked_pending_roommate', 'locked_pending_payment', 'partially_paid', 'active', 'expired', 'declined', 'cancelled');
create type public.pod_gender_lock as enum ('MALE', 'FEMALE', 'ANY');
create type public.pod_verification_status as enum ('pending_verification', 'approved', 'rejected');
create type public.property_layout_type as enum ('single_room', 'self_contain', 'flat', 'duplex');
create type public.roommate_invite_status as enum ('pending', 'accepted', 'declined', 'paid');
create type public.slot_credit_status as enum ('booked', 'booked_pending_claim', 'paid_unmatched', 'matched', 'subletting', 'expired');


create table public.profiles (
  id uuid not null,
  created_at timestamp with time zone default now() not null,
  full_name text,
  is_student boolean,
  city text,
  gender text,
  school text,
  campus text,
  phone_number text,
  onboarded boolean default false not null,
  show_in_roommate_feed boolean default false not null,
  avatar_url text,
  is_admin boolean default false not null,
  birth_year integer,
  entry_year integer,
  program_duration integer default 5,
  religion character varying(50),
  bio text,
  email text,
  username text,
  matric_number text,
  referral_code text,
  payout_bank_name text,
  payout_account_number text,
  payout_account_name text,
  constraint profiles_pkey PRIMARY KEY (id)
);
create table public.living_preferences (
  profile_id uuid not null,
  updated_at timestamp with time zone default now(),
  max_budget numeric,
  preferred_area text,
  preferred_layout text,
  min_bedrooms integer default 1,
  must_have_amenities text[] default '{}'::text[],
  min_budget numeric,
  constraint living_preferences_pkey PRIMARY KEY (profile_id)
);
create table public.sra_verification_tokens (
  id uuid default gen_random_uuid() not null,
  allocated_business_name character varying(255) not null,
  secret_token character varying(50) not null,
  is_used boolean default false not null,
  used_by_profile_id uuid,
  created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  constraint sra_verification_tokens_pkey PRIMARY KEY (id),
  constraint sra_verification_tokens_secret_token_key UNIQUE (secret_token)
);
create table public.listings (
  id uuid default gen_random_uuid() not null,
  admin_id uuid not null,
  title character varying(255) not null,
  description text,
  category character varying(50) not null,
  status character varying(50) default 'available'::character varying not null,
  featured boolean default false not null,
  price_amount numeric(12,2) not null,
  lease_term character varying(50) default 'per_semester'::character varying not null,
  layout_type property_layout_type default 'self_contain'::property_layout_type not null,
  units_available integer default 1 not null,
  total_floors integer,
  is_shared_bathroom boolean default false not null,
  is_shared_kitchen boolean default false not null,
  size_sqft integer,
  location_landmark text not null,
  city character varying(100) default 'Minna'::character varying not null,
  campus character varying(150),
  latitude numeric(10,7),
  longitude numeric(10,7),
  has_borehole boolean default false not null,
  has_generator boolean default false not null,
  has_fenced_gate boolean default false not null,
  has_internet boolean default false not null,
  has_burglary boolean default false not null,
  has_cabinet boolean default false not null,
  has_wardrobe boolean default false not null,
  custom_features text[] default '{}'::text[],
  primary_image text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  landlord_id uuid,
  max_roommates integer default 1 not null,
  rules text[] default '{}'::text[] not null,
  number_of_bedrooms integer default 1 not null,
  number_of_bathrooms integer default 1 not null,
  property_tier integer default 1 not null,
  abstract_slots_available integer default 1 not null,
  estate_id uuid,
  region_path uuid[] default '{}'::uuid[],
  enable_self_guided_tour boolean default true not null,
  enable_guided_tour boolean default true not null,
  slashed_price numeric(10,2),
  video_preview_path text,
  video_cover_enabled boolean default true not null,
  published boolean default true not null,
  video_expected_count integer default 0 not null,
  constraint listings_abstract_slots_available_check CHECK ((abstract_slots_available >= 0)),
  constraint listings_property_tier_check CHECK ((property_tier >= 1)),
  constraint listings_video_expected_count_nonnegative CHECK ((video_expected_count >= 0)),
  constraint listings_pkey PRIMARY KEY (id)
);
create table public.listing_photos (
  id uuid default gen_random_uuid() not null,
  listing_id uuid not null,
  image_url text not null,
  display_order integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  constraint listing_photos_pkey PRIMARY KEY (id)
);
create table public.saved_listings (
  user_id uuid not null,
  listing_id uuid,
  created_at timestamp with time zone default now() not null,
  place_id uuid,
  type text default 'lodge'::text not null,
  id uuid default gen_random_uuid() not null,
  constraint saved_listings_type_check CHECK ((type = ANY (ARRAY['place'::text, 'lodge'::text]))),
  constraint saved_listings_type_target_check CHECK ((((type = 'lodge'::text) AND (listing_id IS NOT NULL) AND (place_id IS NULL)) OR ((type = 'place'::text) AND (place_id IS NOT NULL) AND (listing_id IS NULL)))),
  constraint saved_listings_pkey PRIMARY KEY (id)
);
create table public.applications (
  id uuid default gen_random_uuid() not null,
  listing_id uuid not null,
  student_id uuid not null,
  status application_status default 'locked_pending_payment'::application_status not null,
  created_at timestamp with time zone default now() not null,
  lock_expires_at timestamp with time zone,
  constraint applications_pkey PRIMARY KEY (id)
);
create table public.regions (
  id uuid default gen_random_uuid() not null,
  name character varying(255) not null,
  parent_region_id uuid,
  created_by uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  path uuid[] default '{}'::uuid[],
  constraint regions_pkey PRIMARY KEY (id)
);
create table public.admin_profiles (
  id uuid not null,
  role text not null,
  assigned_region_id uuid,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  region_path uuid[] default '{}'::uuid[],
  constraint admin_profiles_role_check CHECK ((role = ANY (ARRAY['super_admin'::text, 'regional_admin'::text, 'field_admin'::text]))),
  constraint admin_profiles_pkey PRIMARY KEY (id)
);
create table public.landlords (
  id uuid default gen_random_uuid() not null,
  full_name character varying(255) not null,
  email character varying(255),
  phone_number character varying(50) not null,
  payout_details jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint landlords_pkey PRIMARY KEY (id),
  constraint landlords_email_key UNIQUE (email)
);
create table public.landlord_contracts (
  id uuid default gen_random_uuid() not null,
  landlord_id uuid not null,
  listing_id uuid,
  document_url text not null,
  contract_type character varying(100) default 'Fixed Term Lease'::character varying,
  signed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  constraint landlord_contracts_pkey PRIMARY KEY (id)
);
create table public.application_roommates (
  id uuid default gen_random_uuid() not null,
  application_id uuid not null,
  student_id uuid not null,
  invite_status roommate_invite_status default 'pending'::roommate_invite_status not null,
  split_amount numeric(12,2) not null,
  has_paid boolean default false not null,
  created_at timestamp with time zone default now() not null,
  constraint app_roommates_pkey PRIMARY KEY (id)
);
create table public.roommate_preferences (
  profile_id uuid not null,
  updated_at timestamp with time zone default now(),
  smoker_allowed boolean default false,
  sleep_schedule text,
  cleanliness_level text,
  guest_policy text,
  study_habitat text,
  personality_vibe text,
  religion_preference character varying(50) default 'any'::character varying,
  constraint roommate_preferences_pkey PRIMARY KEY (profile_id)
);
create table public.estates (
  id uuid default gen_random_uuid() not null,
  name text not null,
  description text,
  campus text not null,
  property_tier integer not null,
  price_per_annum numeric not null,
  physical_rooms_inventory integer default 0 not null,
  abstract_slots_available integer default 0 not null,
  primary_image text,
  rules text[] default '{}'::text[],
  amenities text[] default '{}'::text[],
  created_at timestamp with time zone default now(),
  constraint estates_property_tier_check CHECK ((property_tier >= 1)),
  constraint estates_pkey PRIMARY KEY (id)
);
create table public.slot_credits (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  estate_id uuid not null,
  property_tier integer not null,
  intent_size integer not null,
  status slot_credit_status default 'booked_pending_claim'::slot_credit_status not null,
  linked_credit_id uuid,
  invite_code text,
  payment_deadline timestamp with time zone default (now() + '3 days'::interval) not null,
  created_at timestamp with time zone default now(),
  target_occupancy integer,
  listing_id uuid,
  paid_at timestamp with time zone,
  amount_paid numeric,
  expired_at timestamp with time zone,
  constraint check_odd_tier_intent CHECK ((((property_tier % 2) = 0) OR ((intent_size = 1) OR (intent_size = property_tier)))),
  constraint slot_credits_check CHECK (((intent_size >= 1) AND (intent_size <= property_tier))),
  constraint slot_credits_pkey PRIMARY KEY (id),
  constraint slot_credits_invite_code_key UNIQUE (invite_code)
);
create table public.pods (
  id uuid default gen_random_uuid() not null,
  estate_id uuid not null,
  property_tier integer not null,
  matched_gender pod_gender_lock default 'ANY'::pod_gender_lock not null,
  current_total_intent integer default 0 not null,
  is_finalized boolean default false not null,
  physical_room_id uuid,
  created_at timestamp with time zone default now(),
  target_occupancy integer,
  group_code text,
  listing_id uuid,
  founder_user_id uuid,
  verification_status pod_verification_status default 'pending_verification'::pod_verification_status not null,
  rejection_reason text,
  verified_at timestamp with time zone,
  constraint pods_pkey PRIMARY KEY (id)
);
create table public.pod_members (
  id uuid default gen_random_uuid() not null,
  pod_id uuid not null,
  user_id uuid not null,
  slot_credit_id uuid not null,
  intent_size integer not null,
  created_at timestamp with time zone default now(),
  amount_paid numeric,
  constraint pod_members_pkey PRIMARY KEY (id),
  constraint pod_members_pod_id_user_id_key UNIQUE (pod_id, user_id)
);
create table public.physical_rooms (
  id uuid default gen_random_uuid() not null,
  estate_id uuid not null,
  property_tier integer not null,
  physical_door_number text not null,
  gender_lock pod_gender_lock default 'ANY'::pod_gender_lock not null,
  assigned_pod_id uuid,
  latecomer_slots_available integer default 0 not null,
  created_at timestamp with time zone default now(),
  constraint physical_rooms_pkey PRIMARY KEY (id)
);
create table public.location_access_payments (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  listing_id uuid not null,
  amount_paid numeric(12,2) default 500 not null,
  method text default 'card'::text not null,
  reference text not null,
  status text default 'paid'::text not null,
  created_at timestamp with time zone default now() not null,
  constraint location_access_payments_pkey PRIMARY KEY (id),
  constraint location_access_payments_reference_key UNIQUE (reference),
  constraint location_access_payments_user_id_listing_id_key UNIQUE (user_id, listing_id)
);
create table public.tour_bookings (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  listing_id uuid not null,
  admin_id uuid,
  scheduled_date date not null,
  scheduled_time text not null,
  status text default 'pending_payment'::text not null,
  created_at timestamp with time zone default now() not null,
  constraint tour_bookings_pkey PRIMARY KEY (id),
  constraint tour_bookings_user_id_listing_id_scheduled_date_scheduled_t_key UNIQUE (user_id, listing_id, scheduled_date, scheduled_time)
);
create table public.reviews (
  id uuid default gen_random_uuid() not null,
  listing_id uuid not null,
  user_id uuid not null,
  slot_id uuid,
  rating integer not null,
  text text not null,
  anonymous boolean default true not null,
  review_number integer not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
  constraint reviews_review_number_check CHECK (((review_number >= 1) AND (review_number <= 3))),
  constraint reviews_pkey PRIMARY KEY (id),
  constraint reviews_user_listing_review_number_key UNIQUE (listing_id, user_id, review_number)
);
create table public.pod_invitations (
  id uuid default gen_random_uuid() not null,
  pod_id uuid not null,
  inviter_user_id uuid not null,
  invitee_user_id uuid,
  invitee_name text not null,
  status text default 'pending'::text not null,
  created_at timestamp with time zone default now(),
  constraint pod_invitations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text]))),
  constraint pod_invitations_pkey PRIMARY KEY (id),
  constraint pod_invitations_pod_id_invitee_user_id_key UNIQUE (pod_id, invitee_user_id)
);
create table public.conversations (
  id uuid default gen_random_uuid() not null,
  participant_a uuid not null,
  participant_b uuid not null,
  created_at timestamp with time zone default now() not null,
  last_message_at timestamp with time zone,
  last_message_preview text,
  last_message_sender_id uuid,
  unread_a integer default 0 not null,
  unread_b integer default 0 not null,
  updated_at timestamp with time zone default now() not null,
  constraint conversations_participants_ordered CHECK ((participant_a < participant_b)),
  constraint conversations_pkey PRIMARY KEY (id),
  constraint conversations_participants_unique UNIQUE (participant_a, participant_b)
);
create table public.messages (
  id uuid default gen_random_uuid() not null,
  conversation_id uuid not null,
  sender_id uuid not null,
  body text,
  attachment jsonb,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  client_sent_at bigint default ((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint not null,
  reply_to jsonb,
  constraint messages_client_sent_at_valid CHECK ((client_sent_at > 0)),
  constraint messages_have_content CHECK (((body IS NOT NULL) OR (attachment IS NOT NULL))),
  constraint messages_pkey PRIMARY KEY (id)
);
create table public.device_tokens (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  token text not null,
  platform text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint device_tokens_platform_check CHECK ((platform = ANY (ARRAY['ios'::text, 'android'::text, 'web'::text]))),
  constraint device_tokens_pkey PRIMARY KEY (id),
  constraint device_tokens_user_id_platform_key UNIQUE (user_id, platform)
);
create table public.waitlist (
  id uuid default gen_random_uuid() not null,
  email text not null,
  created_at timestamp with time zone default now() not null,
  constraint waitlist_pkey PRIMARY KEY (id),
  constraint waitlist_email_key UNIQUE (email)
);
create table public.payment_attempts (
  id uuid default gen_random_uuid() not null,
  purchase_kind text not null,
  purchase_id uuid not null,
  user_id uuid not null,
  listing_id uuid not null,
  reference text not null,
  authorization_url text,
  status text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint payment_attempts_purchase_kind_check CHECK ((purchase_kind = ANY (ARRAY['lodge'::text, 'tour'::text, 'location'::text]))),
  constraint payment_attempts_status_check CHECK ((status = ANY (ARRAY['initializing'::text, 'pending'::text, 'paid'::text, 'failed'::text]))),
  constraint payment_attempts_pkey PRIMARY KEY (id),
  constraint payment_attempts_purchase_kind_purchase_id_key UNIQUE (purchase_kind, purchase_id),
  constraint payment_attempts_reference_key UNIQUE (reference)
);
create table public.referrals (
  id uuid default gen_random_uuid() not null,
  referrer_id uuid not null,
  referred_id uuid not null,
  referral_code text not null,
  created_at timestamp with time zone default now() not null,
  constraint referrals_pkey PRIMARY KEY (id),
  constraint referrals_referred_id_unique UNIQUE (referred_id)
);
create table public.referral_payments (
  id uuid default gen_random_uuid() not null,
  referral_id uuid not null,
  payout_to uuid not null,
  referred_user_id uuid not null,
  amount integer not null,
  status text default 'pending'::text not null,
  source_reference text,
  created_at timestamp with time zone default now() not null,
  paid_at timestamp with time zone,
  constraint referral_payments_pkey PRIMARY KEY (id)
);
create table public.referral_withdrawal_requests (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  amount integer not null,
  status text default 'pending'::text not null,
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  admin_note text,
  requested_at timestamp with time zone default now() not null,
  resolved_at timestamp with time zone,
  constraint referral_withdrawal_requests_account_name_check CHECK ((length(TRIM(BOTH FROM account_name)) > 0)),
  constraint referral_withdrawal_requests_account_number_check CHECK ((length(TRIM(BOTH FROM account_number)) > 0)),
  constraint referral_withdrawal_requests_amount_check CHECK ((amount > 0)),
  constraint referral_withdrawal_requests_bank_name_check CHECK ((length(TRIM(BOTH FROM bank_name)) > 0)),
  constraint referral_withdrawal_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'rejected'::text]))),
  constraint referral_withdrawal_requests_pkey PRIMARY KEY (id)
);
create table public.place_categories (
  id uuid default gen_random_uuid() not null,
  key text not null,
  label text not null,
  icon_key text not null,
  accent_color text not null,
  "order" integer default 0 not null,
  constraint place_categories_pkey PRIMARY KEY (id),
  constraint place_categories_key_key UNIQUE (key)
);
create table public.category_synonyms (
  id uuid default gen_random_uuid() not null,
  key text not null,
  synonym text not null,
  is_primary boolean default true not null,
  constraint category_synonyms_pkey PRIMARY KEY (id),
  constraint category_synonyms_key_synonym UNIQUE (key, synonym)
);
create table public.places (
  id uuid default gen_random_uuid() not null,
  created_by uuid not null,
  name text not null,
  category text not null,
  area text not null,
  address text,
  description text not null,
  latitude numeric,
  longitude numeric,
  rating numeric(3,2) default 0.00 not null,
  rating_count integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  verified boolean default false not null,
  featured boolean default false not null,
  constraint places_pkey PRIMARY KEY (id)
);
create table public.place_photos (
  id uuid default gen_random_uuid() not null,
  place_id uuid not null,
  url text not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  constraint place_photos_pkey PRIMARY KEY (id)
);
create table public.place_ratings (
  id uuid default gen_random_uuid() not null,
  place_id uuid not null,
  user_id uuid not null,
  rating integer not null,
  created_at timestamp with time zone default now() not null,
  text text default ''::text not null,
  constraint place_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
  constraint place_ratings_text_max_length CHECK ((char_length(text) <= 280)),
  constraint place_ratings_pkey PRIMARY KEY (id),
  constraint place_ratings_place_user_unique UNIQUE (place_id, user_id)
);
create table public.listing_videos (
  id uuid not null,
  listing_id uuid not null,
  uploaded_by uuid,
  status text default 'queued'::text not null,
  hls_path text,
  poster_path text,
  preview_path text,
  duration_seconds integer,
  width integer,
  height integer,
  display_order integer default 0 not null,
  error text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint listing_videos_ready_has_paths CHECK (((status <> 'ready'::text) OR ((hls_path IS NOT NULL) AND (poster_path IS NOT NULL) AND (preview_path IS NOT NULL)))),
  constraint listing_videos_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'processing'::text, 'ready'::text, 'failed'::text]))),
  constraint listing_videos_pkey PRIMARY KEY (id)
);
create table public.app_releases (
  id bigint generated always as identity not null,
  track text not null,
  platform text default 'android'::text not null,
  version_name text not null,
  build_number integer not null,
  apk_url text not null,
  release_notes text,
  min_supported_version text,
  native_fingerprint text not null,
  git_sha text not null,
  published_at timestamp with time zone default now() not null,
  constraint app_releases_build_number_check CHECK ((build_number > 0)),
  constraint app_releases_min_supported_version_check CHECK ((min_supported_version ~ '^[0-9]+(\.[0-9]+)*$'::text)),
  constraint app_releases_platform_check CHECK ((platform = 'android'::text)),
  constraint app_releases_track_check CHECK ((track = ANY (ARRAY['production'::text, 'preview'::text]))),
  constraint app_releases_pkey PRIMARY KEY (id),
  constraint app_releases_track_build_key UNIQUE (track, platform, build_number)
);

alter table public.admin_profiles add constraint admin_profiles_assigned_region_id_fkey FOREIGN KEY (assigned_region_id) REFERENCES regions(id) ON DELETE SET NULL;
alter table public.admin_profiles add constraint admin_profiles_id_fkey FOREIGN KEY (id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.application_roommates add constraint app_roommates_app_fkey FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;
alter table public.application_roommates add constraint app_roommates_student_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.applications add constraint applications_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;
alter table public.applications add constraint applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.category_synonyms add constraint category_synonyms_key_fkey FOREIGN KEY (key) REFERENCES place_categories(key) ON DELETE CASCADE;
alter table public.conversations add constraint conversations_last_message_sender_id_fkey FOREIGN KEY (last_message_sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.conversations add constraint conversations_participant_a_fkey FOREIGN KEY (participant_a) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.conversations add constraint conversations_participant_b_fkey FOREIGN KEY (participant_b) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.device_tokens add constraint device_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.landlord_contracts add constraint landlord_contracts_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES landlords(id) ON DELETE CASCADE;
alter table public.landlord_contracts add constraint landlord_contracts_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL;
alter table public.listing_photos add constraint listing_photos_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;
alter table public.listing_videos add constraint listing_videos_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;
alter table public.listing_videos add constraint listing_videos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES admin_profiles(id) ON DELETE SET NULL;
alter table public.listings add constraint listings_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES admin_profiles(id) ON DELETE RESTRICT;
alter table public.listings add constraint listings_estate_id_fkey FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE SET NULL;
alter table public.listings add constraint listings_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES landlords(id) ON DELETE SET NULL;
alter table public.living_preferences add constraint living_preferences_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.location_access_payments add constraint location_access_payments_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;
alter table public.location_access_payments add constraint location_access_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.messages add constraint messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
alter table public.messages add constraint messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.payment_attempts add constraint payment_attempts_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;
alter table public.payment_attempts add constraint payment_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.physical_rooms add constraint physical_rooms_assigned_pod_id_fkey FOREIGN KEY (assigned_pod_id) REFERENCES pods(id) ON DELETE SET NULL;
alter table public.physical_rooms add constraint physical_rooms_estate_id_fkey FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE;
alter table public.place_photos add constraint place_photos_place_id_fkey FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE;
alter table public.place_ratings add constraint place_ratings_place_id_fkey FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE;
alter table public.place_ratings add constraint place_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.places add constraint places_category_fkey FOREIGN KEY (category) REFERENCES place_categories(key) ON DELETE CASCADE;
alter table public.places add constraint places_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.pod_invitations add constraint pod_invitations_invitee_user_id_fkey FOREIGN KEY (invitee_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.pod_invitations add constraint pod_invitations_inviter_user_id_fkey FOREIGN KEY (inviter_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.pod_invitations add constraint pod_invitations_pod_id_fkey FOREIGN KEY (pod_id) REFERENCES pods(id) ON DELETE CASCADE;
alter table public.pod_members add constraint pod_members_pod_id_fkey FOREIGN KEY (pod_id) REFERENCES pods(id) ON DELETE CASCADE;
alter table public.pod_members add constraint pod_members_slot_credit_id_fkey FOREIGN KEY (slot_credit_id) REFERENCES slot_credits(id) ON DELETE CASCADE;
alter table public.pod_members add constraint pod_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.pods add constraint pods_estate_id_fkey FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE;
alter table public.pods add constraint pods_founder_user_id_fkey FOREIGN KEY (founder_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.pods add constraint pods_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL;
alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);
alter table public.referral_payments add constraint referral_payments_payout_to_fkey FOREIGN KEY (payout_to) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.referral_payments add constraint referral_payments_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE;
alter table public.referral_payments add constraint referral_payments_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.referral_withdrawal_requests add constraint referral_withdrawal_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.referrals add constraint referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.referrals add constraint referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.regions add constraint regions_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);
alter table public.regions add constraint regions_parent_region_id_fkey FOREIGN KEY (parent_region_id) REFERENCES regions(id) ON DELETE SET NULL;
alter table public.reviews add constraint reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.roommate_preferences add constraint roommate_preferences_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.saved_listings add constraint saved_listings_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;
alter table public.saved_listings add constraint saved_listings_place_id_fkey FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE;
alter table public.saved_listings add constraint saved_listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.slot_credits add constraint slot_credits_estate_id_fkey FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE;
alter table public.slot_credits add constraint slot_credits_linked_credit_id_fkey FOREIGN KEY (linked_credit_id) REFERENCES slot_credits(id) ON DELETE SET NULL;
alter table public.slot_credits add constraint slot_credits_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL;
alter table public.slot_credits add constraint slot_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.sra_verification_tokens add constraint sra_verification_tokens_used_by_profile_id_fkey FOREIGN KEY (used_by_profile_id) REFERENCES profiles(id);
alter table public.tour_bookings add constraint tour_bookings_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES admin_profiles(id) ON DELETE SET NULL;
alter table public.tour_bookings add constraint tour_bookings_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;
alter table public.tour_bookings add constraint tour_bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.bump_conversation_on_message()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  is_sender_a BOOLEAN;
  preview_text TEXT;
BEGIN
  preview_text := COALESCE(NULLIF(trim(NEW.body), ''), 'Shared a listing');

  UPDATE public.conversations
     SET last_message_at = to_timestamp(NEW.client_sent_at / 1000.0),
         last_message_preview = preview_text,
         last_message_sender_id = NEW.sender_id
   WHERE id = NEW.conversation_id;

  SELECT (c.participant_a = NEW.sender_id)
    INTO is_sender_a
    FROM public.conversations c
   WHERE c.id = NEW.conversation_id;

  IF FOUND THEN
    IF is_sender_a THEN
      UPDATE public.conversations
         SET unread_b = unread_b + 1
       WHERE id = NEW.conversation_id;
    ELSE
      UPDATE public.conversations
         SET unread_a = unread_a + 1
       WHERE id = NEW.conversation_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_listing(p_region_path uuid[])
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = auth.uid() AND ap.role = 'super_admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.role = 'regional_admin'
        AND ap.assigned_region_id = ANY(p_region_path)
    );
$function$;

CREATE OR REPLACE FUNCTION public.claim_payment_attempt(p_purchase_kind text, p_purchase_id uuid, p_user_id uuid, p_listing_id uuid)
 RETURNS TABLE(decision text, attempt_id uuid, reference text, authorization_url text, attempt_status text, amount_ngn numeric, is_new boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_attempt public.payment_attempts;
  v_amount NUMERIC;
  v_status TEXT;
  v_pod_verification TEXT;
  v_reference TEXT;
BEGIN
  IF p_purchase_kind NOT IN ('lodge', 'tour', 'location') THEN
    RETURN QUERY SELECT 'invalid_purchase', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, FALSE;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_purchase_kind || ':' || p_purchase_id::TEXT, 0));

  IF p_purchase_kind = 'lodge' THEN
    SELECT sc.amount_paid, sc.status::TEXT INTO v_amount, v_status
    FROM public.slot_credits sc
    WHERE sc.id = p_purchase_id AND sc.user_id = p_user_id AND sc.listing_id = p_listing_id;
    IF NOT FOUND THEN
      RETURN QUERY SELECT 'not_found', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, FALSE;
      RETURN;
    END IF;
    IF v_status IN ('paid_unmatched', 'matched', 'subletting') THEN
      RETURN QUERY SELECT 'already_paid', NULL::UUID, NULL::TEXT, NULL::TEXT, v_status, v_amount, FALSE;
      RETURN;
    END IF;
    SELECT p.verification_status INTO v_pod_verification
    FROM public.pod_members pm
    JOIN public.pods p ON p.id = pm.pod_id
    WHERE pm.slot_credit_id = p_purchase_id AND pm.user_id = p_user_id
    LIMIT 1;
    IF v_pod_verification IN ('pending_verification', 'rejected') THEN
      RETURN QUERY SELECT 'not_payable', NULL::UUID, NULL::TEXT, NULL::TEXT, v_pod_verification, v_amount, FALSE;
      RETURN;
    END IF;
    IF v_amount IS NULL OR v_amount <= 0 OR v_status = 'expired' THEN
      RETURN QUERY SELECT 'not_payable', NULL::UUID, NULL::TEXT, NULL::TEXT, v_status, v_amount, FALSE;
      RETURN;
    END IF;
  ELSIF p_purchase_kind = 'tour' THEN
    SELECT tb.status INTO v_status
    FROM public.tour_bookings tb
    WHERE tb.id = p_purchase_id AND tb.user_id = p_user_id AND tb.listing_id = p_listing_id;
    IF NOT FOUND THEN
      RETURN QUERY SELECT 'not_found', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, FALSE;
      RETURN;
    END IF;
    IF v_status = 'booked' THEN
      RETURN QUERY SELECT 'already_paid', NULL::UUID, NULL::TEXT, NULL::TEXT, v_status, 2000::NUMERIC, FALSE;
      RETURN;
    END IF;
    IF v_status <> 'pending_payment' THEN
      RETURN QUERY SELECT 'not_payable', NULL::UUID, NULL::TEXT, NULL::TEXT, v_status, 2000::NUMERIC, FALSE;
      RETURN;
    END IF;
    v_amount := 2000;
  ELSE
    IF EXISTS (
      SELECT 1 FROM public.location_access_payments lap
      WHERE lap.user_id = p_user_id AND lap.listing_id = p_listing_id
    ) THEN
      RETURN QUERY SELECT 'already_paid', NULL::UUID, NULL::TEXT, NULL::TEXT, 'paid', 500::NUMERIC, FALSE;
      RETURN;
    END IF;
    IF p_purchase_id <> p_listing_id THEN
      RETURN QUERY SELECT 'invalid_purchase', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, FALSE;
      RETURN;
    END IF;
    v_amount := 500;
  END IF;

  SELECT pa.* INTO v_attempt FROM public.payment_attempts pa
  WHERE pa.purchase_kind = p_purchase_kind AND pa.purchase_id = p_purchase_id
  FOR UPDATE;

  IF FOUND AND v_attempt.status = 'paid' THEN
    RETURN QUERY SELECT 'already_paid', v_attempt.id, v_attempt.reference,
      v_attempt.authorization_url, v_attempt.status, v_amount, FALSE;
    RETURN;
  END IF;

  IF FOUND AND v_attempt.status IN ('initializing', 'pending') THEN
    RETURN QUERY SELECT
      CASE WHEN v_attempt.authorization_url IS NULL THEN 'initializing' ELSE 'reuse' END,
      v_attempt.id, v_attempt.reference, v_attempt.authorization_url,
      v_attempt.status, v_amount, FALSE;
    RETURN;
  END IF;

  v_reference := 'GIDA-' || UPPER(p_purchase_kind) || '-' || REPLACE(gen_random_uuid()::TEXT, '-', '');
  IF FOUND THEN
    UPDATE public.payment_attempts pa SET
      user_id = p_user_id,
      listing_id = p_listing_id,
      reference = v_reference,
      authorization_url = NULL,
      status = 'initializing',
      created_at = NOW(),
      updated_at = NOW()
    WHERE pa.id = v_attempt.id
    RETURNING pa.* INTO v_attempt;
  ELSE
    INSERT INTO public.payment_attempts (purchase_kind, purchase_id, user_id, listing_id, reference, status)
    VALUES (p_purchase_kind, p_purchase_id, p_user_id, p_listing_id, v_reference, 'initializing')
    RETURNING * INTO v_attempt;
  END IF;

  RETURN QUERY SELECT 'new', v_attempt.id, v_attempt.reference, NULL::TEXT, v_attempt.status, v_amount, TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.disburse_withdrawal(p_request_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  -- Verify request exists and is still pending
  SELECT user_id INTO v_user_id
  FROM public.referral_withdrawal_requests
  WHERE id = p_request_id AND status = 'pending'
  FOR UPDATE; -- lock the row to prevent concurrent double-disburse

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found or already resolved';
  END IF;

  -- Mark all pending referral_payments for this user as paid
  UPDATE public.referral_payments
  SET status  = 'paid',
      paid_at = now()
  WHERE payout_to = v_user_id
    AND status    = 'pending';

  -- Mark the withdrawal request as paid
  UPDATE public.referral_withdrawal_requests
  SET status      = 'paid',
      resolved_at = now()
  WHERE id = p_request_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_review_rules()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  review_count INTEGER;
BEGIN
  IF NEW.review_number IS NULL THEN
    SELECT COUNT(*)
      INTO review_count
    FROM public.reviews
    WHERE listing_id = NEW.listing_id
      AND user_id = NEW.user_id;

    NEW.review_number := review_count + 1;
  END IF;

  IF NEW.review_number < 1 OR NEW.review_number > 3 THEN
    RAISE EXCEPTION 'review_number must be between 1 and 3.';
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*)
      INTO review_count
    FROM public.reviews
    WHERE listing_id = NEW.listing_id
      AND user_id = NEW.user_id;

    IF review_count >= 3 THEN
      RAISE EXCEPTION 'A user may only create up to 3 reviews per listing.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_single_active_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Expired credits are always allowed (rebooking after expiry must work).
  IF NEW.status = 'expired' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.slot_credits sc
    WHERE sc.user_id = NEW.user_id
      AND sc.listing_id = NEW.listing_id
      AND sc.status <> 'expired'
  ) THEN
    RAISE EXCEPTION 'You already have an active reservation for this property.';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.find_matching_users_for_listing(p_listing_id uuid, p_min_score numeric DEFAULT 70)
 RETURNS TABLE(user_id uuid, match_score numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_price             numeric;
  v_city              text;
  v_landmark          text;
  v_layout            text;
  v_has_borehole      boolean;
  v_has_generator     boolean;
  v_has_internet      boolean;
  v_has_fenced_gate   boolean;
  v_has_wardrobe      boolean;
BEGIN
  -- 1. Grab new listing details
  SELECT 
    l.price_amount,
    COALESCE(l.city, ''),
    COALESCE(l.location_landmark, ''),
    COALESCE(l.layout_type::text, ''),
    COALESCE(l.has_borehole, false),
    COALESCE(l.has_generator, false),
    COALESCE(l.has_internet, false),
    COALESCE(l.has_fenced_gate, false),
    COALESCE(l.has_wardrobe, false)
  INTO 
    v_price,
    v_city,
    v_landmark,
    v_layout,
    v_has_borehole,
    v_has_generator,
    v_has_internet,
    v_has_fenced_gate,
    v_has_wardrobe
  FROM public.listings l
  WHERE l.id = p_listing_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- 2. Query only users who have registered device tokens
  RETURN QUERY
  WITH user_scores AS (
    SELECT 
      lp.profile_id,
      ROUND(
        (
          -- 1. BUDGET MATCH [Max 35 pts]
          CASE 
            WHEN lp.max_budget IS NULL OR lp.max_budget <= 0 THEN 15
            WHEN v_price BETWEEN (lp.max_budget * 0.85) AND (lp.max_budget * 1.15) THEN 35
            WHEN v_price < (lp.max_budget * 0.85) THEN 25
            WHEN v_price BETWEEN (lp.max_budget * 1.15) AND (lp.max_budget * 1.30) THEN 10
            ELSE 0
          END +

          -- 2. AREA MATCH (FUT Minna Neighborhoods) [Max 25 pts]
          CASE 
            WHEN lp.preferred_area IS NULL OR LOWER(lp.preferred_area) = 'any' THEN 10
            WHEN LOWER(v_landmark) LIKE '%' || LOWER(lp.preferred_area) || '%' THEN 25
            WHEN LOWER(v_city) LIKE '%' || LOWER(lp.preferred_area) || '%' THEN 25
            ELSE 0
          END +

          -- 3. LAYOUT MATCH [Max 15 pts]
          CASE 
            WHEN lp.preferred_layout IS NULL OR LOWER(lp.preferred_layout) = 'any' THEN 5
            WHEN LOWER(v_layout) = LOWER(lp.preferred_layout) THEN 15
            ELSE 0
          END +

          -- 4. MUST-HAVE AMENITIES MATCH [Max 15 pts]
          CASE 
            WHEN lp.must_have_amenities IS NULL OR CARDINALITY(lp.must_have_amenities) = 0 THEN 10
            ELSE (
              (CASE WHEN 'borehole' = ANY(lp.must_have_amenities) AND v_has_borehole THEN 3 ELSE 0 END) +
              (CASE WHEN 'generator' = ANY(lp.must_have_amenities) AND v_has_generator THEN 3 ELSE 0 END) +
              (CASE WHEN 'internet' = ANY(lp.must_have_amenities) AND v_has_internet THEN 3 ELSE 0 END) +
              (CASE WHEN 'fenced' = ANY(lp.must_have_amenities) AND v_has_fenced_gate THEN 3 ELSE 0 END) +
              (CASE WHEN 'wardrobe' = ANY(lp.must_have_amenities) AND v_has_wardrobe THEN 3 ELSE 0 END)
            )
          END
        )::NUMERIC, 2
      ) AS score
    FROM public.living_preferences lp
    WHERE EXISTS (
      SELECT 1 FROM public.device_tokens dt WHERE dt.user_id = lp.profile_id
    )
  )
  SELECT 
    us.profile_id AS user_id,
    us.score AS match_score
  FROM user_scores us
  WHERE us.score >= p_min_score;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_details(p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(role text, assigned_region_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role, assigned_region_id 
  FROM public.admin_profiles 
  WHERE id = p_user_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_role(p_user_id uuid DEFAULT auth.uid())
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.admin_profiles WHERE id = p_user_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_pod_member_payment_statuses(p_pod_ids uuid[])
 RETURNS TABLE(pod_id uuid, user_id uuid, slot_credit_id uuid, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY (
    SELECT pm.pod_id, pm.user_id, pm.slot_credit_id, sc.status::TEXT
    FROM pod_members pm
    JOIN slot_credits sc ON sc.id = pm.slot_credit_id
    WHERE pm.pod_id = ANY(p_pod_ids)
      AND pm.pod_id IN (SELECT pod_id FROM pod_members WHERE user_id = auth.uid())
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_recommended_listings(p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, admin_id uuid, landlord_id uuid, estate_id uuid, title character varying, description text, category character varying, status character varying, featured boolean, price_amount numeric, lease_term character varying, layout_type property_layout_type, units_available integer, property_tier integer, abstract_slots_available integer, total_floors integer, is_shared_bathroom boolean, is_shared_kitchen boolean, size_sqft integer, location_landmark text, city character varying, campus character varying, latitude numeric, longitude numeric, has_borehole boolean, has_generator boolean, has_fenced_gate boolean, has_internet boolean, has_burglary boolean, has_cabinet boolean, has_wardrobe boolean, custom_features text[], primary_image text, number_of_bedrooms integer, number_of_bathrooms integer, max_roommates integer, rules text[], created_at timestamp with time zone, updated_at timestamp with time zone, images text[], relevance_score numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_max_budget NUMERIC;
  v_preferred_area TEXT;
  v_preferred_layout TEXT;
  v_must_have_amenities TEXT[];
BEGIN
  -- Fetch user preferences from living_preferences
  SELECT 
    max_budget, preferred_area, preferred_layout, must_have_amenities
  INTO 
    v_max_budget, v_preferred_area, v_preferred_layout, v_must_have_amenities
  FROM public.living_preferences 
  WHERE profile_id = p_user_id;

  RETURN QUERY
  SELECT 
    l.id,
    l.admin_id,
    l.landlord_id,
    l.estate_id,
    l.title,
    l.description,
    l.category,
    l.status,
    l.featured,
    l.price_amount,
    l.lease_term,
    l.layout_type,
    l.units_available,
    l.property_tier,
    l.abstract_slots_available,
    l.total_floors,
    l.is_shared_bathroom,
    l.is_shared_kitchen,
    l.size_sqft,
    l.location_landmark,
    l.city,
    l.campus,
    l.latitude,
    l.longitude,
    l.has_borehole,
    l.has_generator,
    l.has_fenced_gate,
    l.has_internet,
    l.has_burglary,
    l.has_cabinet,
    l.has_wardrobe,
    l.custom_features,
    l.primary_image,
    l.number_of_bedrooms,
    l.number_of_bathrooms,
    l.max_roommates,
    l.rules,
    l.created_at,
    l.updated_at,
    
    -- Subquery for image gallery
    COALESCE(
      (
        SELECT ARRAY_AGG(lp.image_url ORDER BY lp.display_order)
        FROM public.listing_photos lp
        WHERE lp.listing_id = l.id
      ),
      CASE WHEN l.primary_image IS NOT NULL THEN ARRAY[l.primary_image] ELSE '{}'::TEXT[] END
    ) AS images,

    ROUND(
      (
        -- 1. BUDGET MATCH [Max 35 pts]
        CASE 
          WHEN v_max_budget IS NULL OR v_max_budget <= 0 THEN 15
          WHEN l.price_amount BETWEEN (v_max_budget * 0.85) AND (v_max_budget * 1.15) THEN 35
          WHEN l.price_amount < (v_max_budget * 0.85) THEN 25
          WHEN l.price_amount BETWEEN (v_max_budget * 1.15) AND (v_max_budget * 1.30) THEN 10
          ELSE 0
        END +

        -- 2. AREA MATCH (FUT Minna Neighborhoods) [Max 25 pts]
        CASE 
          WHEN v_preferred_area IS NULL OR LOWER(v_preferred_area) = 'any' THEN 10
          WHEN LOWER(l.location_landmark) LIKE '%' || LOWER(v_preferred_area) || '%' THEN 25
          WHEN LOWER(l.city) LIKE '%' || LOWER(v_preferred_area) || '%' THEN 25
          ELSE 0
        END +

        -- 3. LAYOUT MATCH [Max 15 pts]
        CASE 
          WHEN v_preferred_layout IS NULL OR LOWER(v_preferred_layout) = 'any' THEN 5
          WHEN LOWER(l.layout_type::text) = LOWER(v_preferred_layout) THEN 15
          ELSE 0
        END +

        -- 4. MUST-HAVE AMENITIES MATCH [Max 15 pts]
        CASE 
          WHEN v_must_have_amenities IS NULL OR CARDINALITY(v_must_have_amenities) = 0 THEN 10
          ELSE (
            (CASE WHEN 'borehole' = ANY(v_must_have_amenities) AND l.has_borehole THEN 3 ELSE 0 END) +
            (CASE WHEN 'generator' = ANY(v_must_have_amenities) AND l.has_generator THEN 3 ELSE 0 END) +
            (CASE WHEN 'internet' = ANY(v_must_have_amenities) AND l.has_internet THEN 3 ELSE 0 END) +
            (CASE WHEN 'fenced' = ANY(v_must_have_amenities) AND l.has_fenced_gate THEN 3 ELSE 0 END) +
            (CASE WHEN 'wardrobe' = ANY(v_must_have_amenities) AND l.has_wardrobe THEN 3 ELSE 0 END)
          )
        END +

        -- 5. SAVED INTERACTION BOOST [Max 10 pts]
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM public.saved_listings sl 
            WHERE sl.user_id = p_user_id AND sl.listing_id = l.id
          ) THEN 10
          ELSE 0
        END
      )::NUMERIC, 2
    ) AS relevance_score

  FROM public.listings l
  WHERE l.status = 'available' 
    AND l.abstract_slots_available > 0
  ORDER BY relevance_score DESC, l.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_recommended_roommates(p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, full_name text, gender text, school text, campus text, city text, bio text, avatar_url text, religion character varying, birth_year integer, entry_year integer, program_duration integer, smoker_allowed boolean, sleep_schedule text, cleanliness_level text, guest_policy text, study_habitat text, personality_vibe text, religion_preference character varying, match_score numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_my_school TEXT;
  v_my_gender TEXT;
  v_my_religion VARCHAR;
  
  v_my_smoker BOOLEAN;
  v_my_sleep TEXT;
  v_my_cleanliness TEXT;
  v_my_guest TEXT;
  v_my_study TEXT;
  v_my_vibe TEXT;
  v_my_religion_pref VARCHAR;
BEGIN
  -- 1. Fetch current user's profile info
  SELECT school, gender, religion
  INTO v_my_school, v_my_gender, v_my_religion
  FROM public.profiles
  WHERE profiles.id = p_user_id;

  -- 2. Fetch current user's roommate preferences
  SELECT smoker_allowed, sleep_schedule, cleanliness_level, guest_policy, study_habitat, personality_vibe, religion_preference
  INTO v_my_smoker, v_my_sleep, v_my_cleanliness, v_my_guest, v_my_study, v_my_vibe, v_my_religion_pref
  FROM public.roommate_preferences
  WHERE profile_id = p_user_id;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.gender,
    p.school,
    p.campus,
    p.city,
    p.bio,
    p.avatar_url,
    p.religion,
    p.birth_year,
    p.entry_year,
    p.program_duration,
    rp.smoker_allowed,
    rp.sleep_schedule,
    rp.cleanliness_level,
    rp.guest_policy,
    rp.study_habitat,
    rp.personality_vibe,
    rp.religion_preference,

    ROUND(
      (
        -- 1. LIFESTYLE & HABITS MATCH [Max 60 pts]
        (CASE WHEN v_my_cleanliness IS NOT NULL AND LOWER(rp.cleanliness_level) = LOWER(v_my_cleanliness) THEN 15 ELSE 0 END) +
        (CASE WHEN v_my_sleep IS NOT NULL AND LOWER(rp.sleep_schedule) = LOWER(v_my_sleep) THEN 15 ELSE 0 END) +
        (CASE WHEN v_my_guest IS NOT NULL AND LOWER(rp.guest_policy) = LOWER(v_my_guest) THEN 15 ELSE 0 END) +
        (CASE WHEN v_my_study IS NOT NULL AND LOWER(rp.study_habitat) = LOWER(v_my_study) THEN 15 ELSE 0 END) +

        -- 2. PERSONALITY & RELIGIOUS ALIGNMENT [Max 30 pts]
        (CASE WHEN v_my_vibe IS NOT NULL AND LOWER(rp.personality_vibe) = LOWER(v_my_vibe) THEN 15 ELSE 0 END) +
        (CASE 
          WHEN v_my_religion_pref IS NULL OR LOWER(v_my_religion_pref) = 'any' THEN 15
          WHEN p.religion IS NOT NULL AND LOWER(p.religion) = LOWER(v_my_religion_pref) THEN 15
          ELSE 0 
        END) +

        -- 3. SMOKER ALIGNMENT & PROFILE QUALITY [Max 10 pts]
        (CASE WHEN v_my_smoker = rp.smoker_allowed THEN 5 ELSE 0 END) +
        (CASE WHEN p.avatar_url IS NOT NULL AND p.bio IS NOT NULL THEN 5 ELSE 0 END)
      )::NUMERIC, 2
    ) AS match_score

  FROM public.profiles p
  LEFT JOIN public.roommate_preferences rp ON rp.profile_id = p.id
  WHERE p.show_in_roommate_feed = true
    AND p.id <> p_user_id
    -- HARD FILTER: Must strictly belong to the exact same school
    AND (
      v_my_school IS NOT NULL 
      AND LOWER(p.school) = LOWER(v_my_school)
    )
  ORDER BY match_score DESC, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_tour_availability(p_listing_id uuid, p_admin_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(scheduled_date date, scheduled_time text, booked bigint, admin_unavailable boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH time_slots(scheduled_time) AS (
    VALUES
      ('10:00 AM'), ('11:30 AM'), ('01:00 PM'),
      ('02:30 PM'), ('04:00 PM'), ('05:30 PM')
  ),
  dates(d) AS (
    SELECT CURRENT_DATE + gs.days_ahead
    FROM generate_series(0, 13) AS gs(days_ahead)
  ),
  grid AS (
    SELECT d.d AS scheduled_date, s.scheduled_time AS scheduled_time
    FROM dates d CROSS JOIN time_slots s
  )
  SELECT
    g.scheduled_date,
    g.scheduled_time,
    count(t.id) AS booked,
    (p_admin_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.tour_bookings a
      WHERE a.admin_id = p_admin_id
        AND a.listing_id != p_listing_id
        AND a.scheduled_date = g.scheduled_date
        AND a.scheduled_time = g.scheduled_time
        AND a.status NOT IN ('cancelled', 'expired')
    )) AS admin_unavailable
  FROM grid g
  LEFT JOIN public.tour_bookings t
    ON t.listing_id = p_listing_id
   AND t.scheduled_date = g.scheduled_date
   AND t.scheduled_time = g.scheduled_time
   AND t.status NOT IN ('cancelled', 'expired')
  GROUP BY g.scheduled_date, g.scheduled_time
  ORDER BY g.scheduled_date, g.scheduled_time;
$function$;

CREATE OR REPLACE FUNCTION public.guard_listing_video_publication()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_total integer;
  v_ready integer;
BEGIN
  IF NEW.video_expected_count = 0 THEN
    NEW.published := true;
    RETURN NEW;
  END IF;

  SELECT count(*), count(*) FILTER (
    WHERE status = 'ready'
      AND hls_path IS NOT NULL
      AND poster_path IS NOT NULL
      AND preview_path IS NOT NULL
  ) INTO v_total, v_ready
  FROM public.listing_videos WHERE listing_id = NEW.id;

  NEW.published := v_total = NEW.video_expected_count AND v_ready = NEW.video_expected_count;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referral_code text;
  v_referrer_id uuid;
  v_new_code text;
  v_attempts int := 0;
BEGIN
  -- Mint a unique referral code for the new profile so every user has one to share.
  LOOP
    v_new_code := 'GIDA' || upper(substring(md5(gen_random_uuid()::text) from 1 for 4));
    -- Strip ambiguous characters to match the client-side generator alphabet.
    v_new_code := replace(replace(replace(replace(v_new_code, '0', '2'), '1', '3'), 'I', 'J'), 'O', 'P');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(referral_code) = lower(v_new_code));
    v_attempts := v_attempts + 1;
    IF v_attempts >= 10 THEN
      v_new_code := NULL;
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.profiles (id, email, full_name, referral_code, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    v_new_code,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code);

  v_referral_code := NULLIF(upper(trim(NEW.raw_user_meta_data->>'referral_code')), '');
  IF v_referral_code IS NOT NULL THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE lower(referral_code) = lower(v_referral_code)
      AND id <> NEW.id
    LIMIT 1;

    IF v_referrer_id IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_id, referred_id, referral_code)
      SELECT v_referrer_id, NEW.id, referral_code
      FROM public.profiles
      WHERE id = v_referrer_id
      ON CONFLICT (referred_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_user_email_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_active_booking(p_listing_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT sc.id
  FROM public.slot_credits sc
  WHERE sc.user_id = auth.uid()
    AND sc.listing_id = p_listing_id
    AND sc.status <> 'expired'
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.join_pod(p_group_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_code TEXT := UPPER(BTRIM(p_group_code));
  v_pod RECORD;
  v_target INTEGER;
  v_active INTEGER;
  v_rent BIGINT;
  v_share NUMERIC;
  v_new_intent INTEGER;
  v_finalized BOOLEAN;
  v_credit_id UUID;
  v_deadline TIMESTAMPTZ;
  v_invite_code TEXT;
  v_i INTEGER;
  -- Founder's locked share: read from the earliest non-expired member credit
  v_locked_share NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Please sign in to continue.';
  END IF;

  -- Serialize concurrent joins on the same pod row.
  SELECT * INTO v_pod FROM pods WHERE group_code = v_code FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite code not found. Ask your friend to share their invite code.';
  END IF;

  v_target := COALESCE(v_pod.target_occupancy, v_pod.property_tier);

  -- Truth over trust: recompute occupancy from actual members (self-healing).
  SELECT COALESCE(SUM(pm.intent_size), 0) INTO v_active
  FROM pod_members pm
  JOIN slot_credits sc ON sc.id = pm.slot_credit_id
  WHERE pm.pod_id = v_pod.id AND sc.status <> 'expired';

  IF EXISTS (
    SELECT 1 FROM pod_members pm
    JOIN slot_credits sc ON sc.id = pm.slot_credit_id
    WHERE pm.pod_id = v_pod.id AND pm.user_id = v_user_id AND sc.status <> 'expired'
  ) THEN
    RAISE EXCEPTION 'You are already a member of this group.';
  END IF;

  IF v_active >= v_target THEN
    RAISE EXCEPTION 'This group is already full. Pick another invite code or a lower occupancy.';
  END IF;

  -- Defense-in-depth: the partial unique index enforces this too; fail friendly first.
  IF EXISTS (
    SELECT 1 FROM slot_credits
    WHERE user_id = v_user_id AND listing_id = v_pod.listing_id AND status <> 'expired'
  ) THEN
    RAISE EXCEPTION 'You already have an active reservation for this property.';
  END IF;

  -- ✅ FIX: Read founder's locked share so every joiner pays exactly what the founder paid
  SELECT sc.amount_paid INTO v_locked_share
  FROM pod_members pm
  JOIN slot_credits sc ON sc.id = pm.slot_credit_id
  WHERE pm.pod_id = v_pod.id
    AND sc.status <> 'expired'
    AND sc.amount_paid IS NOT NULL
    AND sc.amount_paid > 0
  ORDER BY sc.created_at ASC, sc.id ASC
  LIMIT 1;

  -- ✅ FIX: Use founder's share if available; otherwise compute from price (should rarely happen)
  IF v_locked_share IS NOT NULL THEN
    v_share := v_locked_share;
  ELSE
    -- Fallback: read price from listings and compute equal share
    SELECT price_amount::NUMERIC INTO v_rent FROM listings WHERE id = v_pod.listing_id;
    v_share := ROUND(v_rent / NULLIF(v_target, 0), 2);
  END IF;

  v_new_intent := v_active + 1;
  v_finalized := v_new_intent >= v_target;
  v_deadline := NOW() + INTERVAL '3 days';

  -- Mirror generateInviteCode(): GIDA-POD- + 12 chars (no I/O/0/1 lookalikes).
  v_invite_code := 'GIDA-POD-';
  FOR v_i IN 1..12 LOOP
    v_invite_code := v_invite_code || SUBSTRING(
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' FROM FLOOR(RANDOM() * 32)::INT + 1 FOR 1
    );
  END LOOP;

  INSERT INTO slot_credits (
    user_id, estate_id, listing_id, property_tier, intent_size, target_occupancy,
    status, invite_code, payment_deadline, amount_paid
  ) VALUES (
    v_user_id, v_pod.estate_id, v_pod.listing_id, v_pod.property_tier, 1, v_target,
    'booked_pending_claim', v_invite_code, v_deadline, v_share
  ) RETURNING id INTO v_credit_id;

  INSERT INTO pod_members (pod_id, user_id, slot_credit_id, intent_size, amount_paid)
  VALUES (v_pod.id, v_user_id, v_credit_id, 1, v_share);

  -- Counter converges to truth here too; physical_room_id intentionally untouched
  UPDATE pods
  SET current_total_intent = v_new_intent,
      is_finalized = v_finalized
  WHERE id = v_pod.id;

  RETURN jsonb_build_object(
    'creditId', v_credit_id,
    'podId', v_pod.id,
    'amountPaid', v_share,
    'paymentDeadline', v_deadline,
    'isFinalized', v_finalized,
    'inviteCode', v_invite_code
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.listing_cover_preview_path(p_listing_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT lv.preview_path
  FROM public.listing_videos lv
  JOIN public.listings l ON l.id = lv.listing_id
  WHERE lv.listing_id = p_listing_id
    AND lv.status = 'ready'
    AND l.video_cover_enabled
  ORDER BY lv.display_order, lv.created_at
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id uuid, p_reader_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM public.conversations
     WHERE id = p_conversation_id
       AND (participant_a = p_reader_id OR participant_b = p_reader_id)
  ) THEN
    RAISE EXCEPTION 'READER_NOT_A_PARTICIPANT' USING ERRCODE = '22023';
  END IF;

  UPDATE public.messages
     SET read_at = NOW()
   WHERE conversation_id = p_conversation_id
     AND sender_id <> p_reader_id
     AND read_at IS NULL;

  UPDATE public.conversations
     SET unread_a = CASE WHEN participant_a = p_reader_id THEN 0 ELSE unread_a END,
         unread_b = CASE WHEN participant_b = p_reader_id THEN 0 ELSE unread_b END
   WHERE id = p_conversation_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reconcile_listing_after_video_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.reconcile_listing_video_publication(OLD.listing_id);
    RETURN OLD;
  END IF;
  PERFORM public.reconcile_listing_video_publication(NEW.listing_id);
  IF TG_OP = 'UPDATE' AND OLD.listing_id IS DISTINCT FROM NEW.listing_id THEN
    PERFORM public.reconcile_listing_video_publication(OLD.listing_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reconcile_listing_video_publication(p_listing_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_expected integer;
  v_total integer;
  v_ready integer;
  v_published boolean;
BEGIN
  SELECT video_expected_count INTO v_expected
  FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT count(*), count(*) FILTER (
    WHERE status = 'ready'
      AND hls_path IS NOT NULL
      AND poster_path IS NOT NULL
      AND preview_path IS NOT NULL
  ) INTO v_total, v_ready
  FROM public.listing_videos WHERE listing_id = p_listing_id;

  v_published := v_expected = 0 OR (v_total = v_expected AND v_ready = v_expected);
  UPDATE public.listings SET published = v_published
  WHERE id = p_listing_id AND published IS DISTINCT FROM v_published;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reconcile_pod_after_credit_expiry(p_slot_credit_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pod_id UUID;
  v_active INTEGER;
  v_target INTEGER;
BEGIN
  SELECT pm.pod_id INTO v_pod_id
  FROM public.pod_members pm
  WHERE pm.slot_credit_id = p_slot_credit_id
    AND (pm.user_id = auth.uid() OR auth.uid() IS NULL)
  LIMIT 1;

  IF v_pod_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(pm.intent_size), 0)
  INTO v_active
  FROM public.pod_members pm
  JOIN public.slot_credits sc ON sc.id = pm.slot_credit_id
  WHERE pm.pod_id = v_pod_id
    AND sc.status <> 'expired';

  SELECT COALESCE(p.target_occupancy, p.property_tier)
  INTO v_target
  FROM public.pods p
  WHERE p.id = v_pod_id;

  UPDATE public.pods
  SET current_total_intent = v_active,
      is_finalized = v_active >= COALESCE(v_target, property_tier)
  WHERE id = v_pod_id;

  RETURN v_pod_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_region_hierarchy()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  WITH RECURSIVE tree AS (
    SELECT id, parent_region_id, ARRAY[id]::uuid[] AS path
    FROM public.regions
    WHERE parent_region_id IS NULL

    UNION ALL

    SELECT r.id, r.parent_region_id, t.path || r.id
    FROM public.regions r
    JOIN tree t ON r.parent_region_id = t.id
  )
  UPDATE public.regions rg
  SET path = tree.path
  FROM tree
  WHERE rg.id = tree.id;

  UPDATE public.admin_profiles ap
  SET region_path = COALESCE(
    (SELECT r.path FROM public.regions r WHERE r.id = ap.assigned_region_id),
    '{}'::uuid[]
  );

  UPDATE public.listings l
  SET region_path = COALESCE(
    (SELECT ap.region_path FROM public.admin_profiles ap WHERE ap.id = l.admin_id),
    '{}'::uuid[]
  );
END $function$;

CREATE OR REPLACE FUNCTION public.request_withdrawal(p_bank_name text, p_account_number text, p_account_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id        uuid := auth.uid();
  v_pending_amount integer;
  v_request_id     uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate inputs
  IF trim(p_bank_name) = '' OR trim(p_account_number) = '' OR trim(p_account_name) = '' THEN
    RAISE EXCEPTION 'Bank details are required';
  END IF;

  -- Block if there is already a pending request (belt-and-suspenders with the unique index)
  IF EXISTS (
    SELECT 1 FROM public.referral_withdrawal_requests
    WHERE user_id = v_user_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a pending withdrawal request';
  END IF;

  -- Calculate real pending amount from referral_payments — never trust the client
  SELECT COALESCE(SUM(amount), 0)
  INTO v_pending_amount
  FROM public.referral_payments
  WHERE payout_to = v_user_id
    AND status    = 'pending';

  IF v_pending_amount <= 0 THEN
    RAISE EXCEPTION 'No pending earnings available to withdraw';
  END IF;

  INSERT INTO public.referral_withdrawal_requests (
    user_id, amount, bank_name, account_number, account_name, status
  ) VALUES (
    v_user_id, v_pending_amount, trim(p_bank_name), trim(p_account_number), trim(p_account_name), 'pending'
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reserve_slot_credit(p_user_id uuid, p_listing_id uuid, p_pod_id uuid DEFAULT NULL::uuid, p_intent_size integer DEFAULT 1, p_amount numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_tier INT;
  v_current_intent INT;
  v_target_pod_id UUID;
  v_slot_credit_id UUID;
  v_new_status VARCHAR(20);
BEGIN
  -- 1. Fetch listing tier
  SELECT property_tier INTO v_tier
  FROM public.listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND';
  END IF;

  -- 2. Handle Pod assignment & LOCK the Pod row for update
  IF p_pod_id IS NOT NULL THEN
    -- Lock existing pod row so no other user can modify it at this moment
    SELECT id, current_total_intent INTO v_target_pod_id, v_current_intent
    FROM public.pods
    WHERE id = p_pod_id AND listing_id = p_listing_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'POD_NOT_FOUND';
    END IF;

    -- Check capacity constraint
    IF (v_current_intent + p_intent_size) > v_tier THEN
      RAISE EXCEPTION 'SLOTS_EXCEEDED';
    END IF;

    -- Update existing pod intent
    UPDATE public.pods
    SET 
      current_total_intent = current_total_intent + p_intent_size,
      status = CASE WHEN (current_total_intent + p_intent_size) = v_tier THEN 'finalized' ELSE 'forming' END,
      updated_at = NOW()
    WHERE id = v_target_pod_id;

  ELSE
    -- No pod specified: Check if user intent exceeds room tier
    IF p_intent_size > v_tier THEN
      RAISE EXCEPTION 'INTENT_EXCEEDS_TIER';
    END IF;

    -- Create a brand new Pod
    v_new_status := CASE WHEN p_intent_size = v_tier THEN 'finalized' ELSE 'forming' END;
    
    INSERT INTO public.pods (listing_id, group_code, current_total_intent, tier, status)
    VALUES (
      p_listing_id,
      UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)), -- Generates 6-char Group Code
      p_intent_size,
      v_tier,
      v_new_status
    )
    RETURNING id INTO v_target_pod_id;
  END IF;

  -- 3. Record Pod Member
  INSERT INTO public.pod_members (pod_id, user_id, intent_size)
  VALUES (v_target_pod_id, p_user_id, p_intent_size)
  ON CONFLICT (pod_id, user_id) DO NOTHING;

  -- 4. Create the Slot Credit / Payment Record
  INSERT INTO public.slot_credits (user_id, listing_id, pod_id, intent_size, amount_paid, status)
  VALUES (p_user_id, p_listing_id, v_target_pod_id, p_intent_size, p_amount, 'booked_pending_claim')
  RETURNING id INTO v_slot_credit_id;

  -- Return successful response payload
  RETURN jsonb_build_object(
    'success', true,
    'pod_id', v_target_pod_id,
    'slot_credit_id', v_slot_credit_id,
    'message', 'Slot reserved successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Automatically rolls back all INSERTS/UPDATES in this execution context
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.reserve_tour(p_listing_id uuid, p_admin_id uuid, p_scheduled_date date, p_scheduled_time text)
 RETURNS tour_bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_slot_key text := p_listing_id::text || '|' || p_scheduled_date::text || '|' || p_scheduled_time;
  v_count int;
  v_row public.tour_bookings;
  v_latitude numeric;
  v_longitude numeric;
  v_guided_enabled boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT latitude, longitude, enable_guided_tour
    INTO v_latitude, v_longitude, v_guided_enabled
  FROM public.listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF v_latitude IS NULL OR v_longitude IS NULL THEN
    RAISE EXCEPTION 'no_location';
  END IF;

  -- This RPC books a guided (admin-accompanied) tour.
  IF NOT COALESCE(v_guided_enabled, true) THEN
    RAISE EXCEPTION 'tours_disabled';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_slot_key, 0));

  SELECT count(*) INTO v_count
  FROM public.tour_bookings
  WHERE listing_id = p_listing_id
    AND user_id = v_user_id
    AND status NOT IN ('cancelled', 'expired');

  IF v_count > 0 THEN
    RAISE EXCEPTION 'already_booked';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.tour_bookings
  WHERE listing_id = p_listing_id
    AND scheduled_date = p_scheduled_date
    AND scheduled_time = p_scheduled_time
    AND status NOT IN ('cancelled', 'expired');

  IF v_count >= 4 THEN
    RAISE EXCEPTION 'slot_full';
  END IF;

  IF p_admin_id IS NOT NULL THEN
    SELECT count(*) INTO v_count
    FROM public.tour_bookings
    WHERE admin_id = p_admin_id
      AND listing_id != p_listing_id
      AND scheduled_date = p_scheduled_date
      AND scheduled_time = p_scheduled_time
      AND status NOT IN ('cancelled', 'expired');
    IF v_count > 0 THEN
      RAISE EXCEPTION 'admin_unavailable';
    END IF;
  END IF;

  INSERT INTO public.tour_bookings (user_id, listing_id, admin_id, scheduled_date, scheduled_time)
  VALUES (v_user_id, p_listing_id, p_admin_id, p_scheduled_date, p_scheduled_time)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_listing_hero_video(p_listing_id uuid, p_video_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = p_listing_id
      AND (l.admin_id = auth.uid() OR public.can_manage_listing(l.region_path))
  ) THEN
    RAISE EXCEPTION 'You cannot manage this listing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.listing_videos lv
    WHERE lv.id = p_video_id
      AND lv.listing_id = p_listing_id
  ) THEN
    RAISE EXCEPTION 'That video does not belong to this listing';
  END IF;

  -- Renumber 0..n-1 with the chosen video first. Only changed rows are
  -- touched, so repeat saves are a no-op and the preview trigger only fires
  -- when the order actually moves.
  WITH ranked AS (
    SELECT
      id,
      row_number() OVER (
        ORDER BY (id = p_video_id) DESC, display_order, created_at
      ) - 1 AS new_order
    FROM public.listing_videos
    WHERE listing_id = p_listing_id
  )
  UPDATE public.listing_videos lv
  SET display_order = ranked.new_order
  FROM ranked
  WHERE lv.id = ranked.id
    AND lv.display_order IS DISTINCT FROM ranked.new_order;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_listing_videos_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_listing_video_cover()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.video_cover_enabled THEN
    SELECT lv.preview_path INTO NEW.video_preview_path
    FROM public.listing_videos lv
    WHERE lv.listing_id = NEW.id AND lv.status = 'ready'
    ORDER BY lv.display_order, lv.created_at
    LIMIT 1;
  ELSE
    NEW.video_preview_path := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_listing_video_preview()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_listing_id uuid;
  v_preview text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_listing_id := OLD.listing_id;
  ELSE
    v_listing_id := NEW.listing_id;
  END IF;

  v_preview := listing_cover_preview_path(v_listing_id);

  -- No-op when the listing itself is being deleted (cascade) or nothing changed.
  UPDATE public.listings
  SET video_preview_path = v_preview
  WHERE id = v_listing_id
    AND video_preview_path IS DISTINCT FROM v_preview;

  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_place_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_place_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_place_id := OLD.place_id;
  ELSE
    target_place_id := NEW.place_id;
  END IF;

  UPDATE public.places
  SET
    rating = COALESCE((
      SELECT AVG(rating)::numeric(3,2)
      FROM public.place_ratings
      WHERE place_id = target_place_id
    ), 0.00),
    rating_count = COALESCE((
      SELECT COUNT(*)
      FROM public.place_ratings
      WHERE place_id = target_place_id
    ), 0)
  WHERE id = target_place_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_message_reply()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  ref_conversation_id UUID;
BEGIN
  IF NEW.reply_to IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.reply_to->>'messageId' IS NULL THEN
    RAISE EXCEPTION 'REPLY_MISSING_MESSAGE_ID' USING ERRCODE = '22023';
  END IF;

  SELECT conversation_id INTO ref_conversation_id
    FROM public.messages
   WHERE id = (NEW.reply_to->>'messageId')::uuid;

  IF ref_conversation_id IS DISTINCT FROM NEW.conversation_id THEN
    RAISE EXCEPTION 'REPLY_TARGET_NOT_IN_CONVERSATION' USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$function$;


CREATE INDEX idx_admin_profiles_region ON public.admin_profiles USING btree (assigned_region_id);
CREATE INDEX idx_admin_profiles_region_path ON public.admin_profiles USING gin (region_path);
CREATE INDEX idx_admin_profiles_rls_lookup ON public.admin_profiles USING btree (id) INCLUDE (assigned_region_id);
CREATE INDEX idx_app_releases_latest ON public.app_releases USING btree (track, platform, build_number DESC);
CREATE INDEX idx_app_roommates_lookup ON public.application_roommates USING btree (application_id, student_id);
CREATE INDEX idx_applications_active_locks ON public.applications USING btree (listing_id, status) WHERE (status = 'active'::application_status);
CREATE INDEX idx_applications_expiring_locks ON public.applications USING btree (lock_expires_at) WHERE ((status <> ALL (ARRAY['cancelled'::application_status, 'declined'::application_status, 'expired'::application_status])) AND (lock_expires_at IS NOT NULL));
CREATE INDEX idx_applications_student_history ON public.applications USING btree (student_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations USING btree (last_message_at);
CREATE INDEX idx_conversations_participant_a ON public.conversations USING btree (participant_a);
CREATE INDEX idx_conversations_participant_b ON public.conversations USING btree (participant_b);
CREATE INDEX idx_device_tokens_token ON public.device_tokens USING btree (token);
CREATE INDEX idx_device_tokens_user_id ON public.device_tokens USING btree (user_id);
CREATE INDEX idx_listing_videos_listing ON public.listing_videos USING btree (listing_id, display_order);
CREATE INDEX idx_listings_active_region_path ON public.listings USING gin (region_path) WHERE ((status)::text = 'available'::text);
CREATE INDEX idx_listings_admin_id ON public.listings USING btree (admin_id);
CREATE INDEX idx_listings_admin_owner ON public.listings USING btree (admin_id);
CREATE INDEX idx_listings_estate_id ON public.listings USING btree (estate_id);
CREATE INDEX idx_listings_feed_lookup ON public.listings USING btree (campus, status) WHERE ((status)::text = 'available'::text);
CREATE INDEX idx_listings_geo_coords ON public.listings USING btree (latitude, longitude);
CREATE INDEX idx_listings_price_sorting ON public.listings USING btree (price_amount);
CREATE INDEX idx_listings_region_path ON public.listings USING gin (region_path);
CREATE INDEX idx_listings_rooms ON public.listings USING btree (number_of_bathrooms, number_of_bedrooms);
CREATE INDEX idx_listings_slots_available ON public.listings USING btree (abstract_slots_available) WHERE (abstract_slots_available > 0);
CREATE INDEX idx_living_preferences_area_budget ON public.living_preferences USING btree (lower(TRIM(BOTH FROM preferred_area)), max_budget);
CREATE INDEX idx_messages_client_sent_at ON public.messages USING btree (conversation_id, client_sent_at);
CREATE INDEX idx_messages_conversation_created_at ON public.messages USING btree (conversation_id, created_at);
CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);
CREATE INDEX idx_messages_unread ON public.messages USING btree (conversation_id) WHERE (read_at IS NULL);
CREATE INDEX idx_photos_gallery_order ON public.listing_photos USING btree (listing_id, display_order);
CREATE INDEX idx_place_photos_place_id ON public.place_photos USING btree (place_id);
CREATE INDEX idx_place_photos_sort_order ON public.place_photos USING btree (place_id, sort_order);
CREATE INDEX idx_place_ratings_place_id ON public.place_ratings USING btree (place_id);
CREATE INDEX idx_place_ratings_user_id ON public.place_ratings USING btree (user_id);
CREATE INDEX idx_places_category ON public.places USING btree (category);
CREATE INDEX idx_places_created_at ON public.places USING btree (created_at DESC);
CREATE INDEX idx_places_created_by ON public.places USING btree (created_by);
CREATE INDEX idx_profiles_roommate_feed ON public.profiles USING btree (show_in_roommate_feed) WHERE (show_in_roommate_feed = true);
CREATE INDEX idx_regions_parent_id ON public.regions USING btree (parent_region_id);
CREATE INDEX idx_regions_path ON public.regions USING gin (path);
CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at);
CREATE INDEX idx_reviews_listing_id ON public.reviews USING btree (listing_id);
CREATE INDEX idx_reviews_slot_id ON public.reviews USING btree (slot_id);
CREATE INDEX idx_reviews_user_id ON public.reviews USING btree (user_id);
CREATE INDEX idx_saved_listings_count ON public.saved_listings USING btree (listing_id);
CREATE INDEX idx_saved_listings_listing_id ON public.saved_listings USING btree (listing_id);
CREATE INDEX idx_waitlist_email ON public.waitlist USING btree (email);
CREATE INDEX location_access_payments_user_listing_idx ON public.location_access_payments USING btree (user_id, listing_id);
CREATE INDEX referral_payments_payout_to_idx ON public.referral_payments USING btree (payout_to);
CREATE INDEX referral_payments_referral_id_idx ON public.referral_payments USING btree (referral_id);
CREATE INDEX referral_payments_status_idx ON public.referral_payments USING btree (status);
CREATE INDEX referrals_referrer_id_idx ON public.referrals USING btree (referrer_id);
CREATE INDEX rwr_requested_idx ON public.referral_withdrawal_requests USING btree (requested_at DESC);
CREATE INDEX rwr_status_idx ON public.referral_withdrawal_requests USING btree (status);
CREATE INDEX rwr_user_id_idx ON public.referral_withdrawal_requests USING btree (user_id);
CREATE INDEX tour_bookings_availability_idx ON public.tour_bookings USING btree (listing_id, scheduled_date, scheduled_time, status);
CREATE UNIQUE INDEX idx_saved_listings_user_type_target ON public.saved_listings USING btree (user_id, type, COALESCE(place_id, listing_id));
CREATE UNIQUE INDEX pods_group_code_key ON public.pods USING btree (group_code);
CREATE UNIQUE INDEX profiles_referral_code_lower_uniq ON public.profiles USING btree (lower(referral_code)) WHERE (referral_code IS NOT NULL);
CREATE UNIQUE INDEX profiles_username_lower_uniq ON public.profiles USING btree (lower(username)) WHERE (username IS NOT NULL);
CREATE UNIQUE INDEX referral_payments_source_reference_unique ON public.referral_payments USING btree (source_reference) WHERE (source_reference IS NOT NULL);
CREATE UNIQUE INDEX rwr_one_pending_per_user ON public.referral_withdrawal_requests USING btree (user_id) WHERE (status = 'pending'::text);
CREATE UNIQUE INDEX slot_credits_user_listing_key ON public.slot_credits USING btree (user_id, listing_id) WHERE (status <> 'expired'::slot_credit_status);


-- Omitted webhook trigger "notify-apartment-match": in production it calls a hosted edge function
-- (and carries a shared secret). Local dev must not fire real notifications.
-- Omitted webhook trigger "send-message-push-webhook": in production it calls a hosted edge function
-- (and carries a shared secret). Local dev must not fire real notifications.
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE TRIGGER on_auth_user_email_update AFTER UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_user_email_update();
CREATE TRIGGER set_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_enforce_single_active_booking BEFORE INSERT ON public.slot_credits FOR EACH ROW EXECUTE FUNCTION enforce_single_active_booking();
CREATE TRIGGER trg_listing_videos_reconcile_publication AFTER INSERT OR DELETE OR UPDATE ON public.listing_videos FOR EACH ROW EXECUTE FUNCTION reconcile_listing_after_video_change();
CREATE TRIGGER trg_listing_videos_sync_preview AFTER INSERT OR DELETE OR UPDATE OF status, preview_path, display_order ON public.listing_videos FOR EACH ROW EXECUTE FUNCTION sync_listing_video_preview();
CREATE TRIGGER trg_listing_videos_updated_at BEFORE UPDATE ON public.listing_videos FOR EACH ROW EXECUTE FUNCTION set_listing_videos_updated_at();
CREATE TRIGGER trg_listings_guard_video_publication_insert BEFORE INSERT ON public.listings FOR EACH ROW EXECUTE FUNCTION guard_listing_video_publication();
CREATE TRIGGER trg_listings_guard_video_publication_update BEFORE UPDATE OF published, video_expected_count ON public.listings FOR EACH ROW EXECUTE FUNCTION guard_listing_video_publication();
CREATE TRIGGER trg_listings_sync_video_cover BEFORE UPDATE OF video_cover_enabled ON public.listings FOR EACH ROW WHEN ((old.video_cover_enabled IS DISTINCT FROM new.video_cover_enabled)) EXECUTE FUNCTION sync_listing_video_cover();
CREATE TRIGGER trg_messages_bump_conversation AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION bump_conversation_on_message();
CREATE TRIGGER trg_messages_validate_reply BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION validate_message_reply();
CREATE TRIGGER trg_places_updated_at BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reviews_rules BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION enforce_review_rules();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_update_place_rating AFTER INSERT OR DELETE OR UPDATE ON public.place_ratings FOR EACH ROW EXECUTE FUNCTION update_place_rating();

alter table public.profiles enable row level security;
alter table public.living_preferences enable row level security;
alter table public.sra_verification_tokens enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.saved_listings enable row level security;
alter table public.applications enable row level security;
alter table public.regions enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.landlords enable row level security;
alter table public.landlord_contracts enable row level security;
alter table public.application_roommates enable row level security;
alter table public.roommate_preferences enable row level security;
alter table public.estates enable row level security;
alter table public.slot_credits enable row level security;
alter table public.pods enable row level security;
alter table public.pod_members enable row level security;
alter table public.physical_rooms enable row level security;
alter table public.location_access_payments enable row level security;
alter table public.tour_bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.pod_invitations enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.waitlist enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_payments enable row level security;
alter table public.referral_withdrawal_requests enable row level security;
alter table public.places enable row level security;
alter table public.place_photos enable row level security;
alter table public.place_ratings enable row level security;
alter table public.listing_videos enable row level security;
alter table public.app_releases enable row level security;

create policy "admin_profiles_select_authenticated" on public.admin_profiles as permissive for select to authenticated using (true);
create policy "admin_profiles_select_policy" on public.admin_profiles as permissive for select to authenticated using (((id = auth.uid()) OR (get_admin_role(auth.uid()) = 'super_admin'::text)));
create policy "admin_profiles_write_policy" on public.admin_profiles as permissive for all to authenticated using ((get_admin_role(auth.uid()) = 'super_admin'::text)) with check ((get_admin_role(auth.uid()) = 'super_admin'::text));
create policy "Anyone can read app releases" on public.app_releases as permissive for select to anon, authenticated using (true);
create policy "Service role full access on app releases" on public.app_releases as permissive for all to service_role using (true) with check (true);
create policy "Invited students or primary applicant can update invite status" on public.application_roommates as permissive for update to public using (((auth.uid() = student_id) OR (auth.uid() IN ( SELECT a.student_id
   FROM applications a
  WHERE (a.id = application_roommates.application_id))))) with check (((auth.uid() = student_id) OR (auth.uid() IN ( SELECT a.student_id
   FROM applications a
  WHERE (a.id = application_roommates.application_id)))));
create policy "Primary applicant can invite roommates" on public.application_roommates as permissive for insert to public with check ((auth.uid() IN ( SELECT a.student_id
   FROM applications a
  WHERE (a.id = application_roommates.application_id))));
create policy "Primary applicant or invited student can remove invite" on public.application_roommates as permissive for delete to public using (((auth.uid() = student_id) OR (auth.uid() IN ( SELECT a.student_id
   FROM applications a
  WHERE (a.id = application_roommates.application_id)))));
create policy "Users can view roommate entries for their applications" on public.application_roommates as permissive for select to public using (((auth.uid() = student_id) OR (auth.uid() IN ( SELECT a.student_id
   FROM applications a
  WHERE (a.id = application_roommates.application_id)))));
create policy "Allow agents to process applications" on public.applications as permissive for update to authenticated using ((EXISTS ( SELECT 1
   FROM listings
  WHERE ((listings.id = applications.listing_id) AND (listings.admin_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM listings
  WHERE ((listings.id = applications.listing_id) AND (listings.admin_id = auth.uid())))));
create policy "Allow students to apply for a listing" on public.applications as permissive for insert to authenticated with check ((auth.uid() = student_id));
create policy "Allow students to cancel their own application" on public.applications as permissive for delete to authenticated using ((auth.uid() = student_id));
create policy "Allow users to view relevant applications" on public.applications as permissive for select to authenticated using (((auth.uid() = student_id) OR (EXISTS ( SELECT 1
   FROM listings
  WHERE ((listings.id = applications.listing_id) AND (listings.admin_id = auth.uid()))))));
create policy "Conversations are viewable by participants" on public.conversations as permissive for select to public using (((auth.uid() = participant_a) OR (auth.uid() = participant_b)));
create policy "Participants can create conversations" on public.conversations as permissive for insert to public with check (((auth.uid() = participant_a) OR (auth.uid() = participant_b)));
create policy "Participants can update conversations" on public.conversations as permissive for update to public using (((auth.uid() = participant_a) OR (auth.uid() = participant_b))) with check (((auth.uid() = participant_a) OR (auth.uid() = participant_b)));
create policy "Public read access for estates" on public.estates as permissive for select to public using (true);
create policy "estates_insert_authenticated" on public.estates as permissive for insert to authenticated with check (true);
create policy "estates_select_authenticated" on public.estates as permissive for select to authenticated using (true);
create policy "Allow administrative access to landlord contracts" on public.landlord_contracts as permissive for all to authenticated using ((EXISTS ( SELECT 1
   FROM admin_profiles
  WHERE (admin_profiles.id = auth.uid()))));
create policy "Allow administrative access to landlords" on public.landlords as permissive for all to authenticated using ((auth.uid() IS NOT NULL));
create policy "Allow agents to add photos to their own listings" on public.listing_photos as permissive for insert to authenticated with check ((EXISTS ( SELECT 1
   FROM listings
  WHERE ((listings.id = listing_photos.listing_id) AND (listings.admin_id = auth.uid())))));
create policy "Allow agents to delete their own listing photos" on public.listing_photos as permissive for delete to authenticated using ((EXISTS ( SELECT 1
   FROM listings
  WHERE ((listings.id = listing_photos.listing_id) AND (listings.admin_id = auth.uid())))));
create policy "Allow agents to update their own listing photos" on public.listing_photos as permissive for update to authenticated using ((EXISTS ( SELECT 1
   FROM listings
  WHERE ((listings.id = listing_photos.listing_id) AND (listings.admin_id = auth.uid())))));
create policy "Allow public read access to photos" on public.listing_photos as permissive for select to public using (true);
create policy "listing_photos_manage_by_listing_admin" on public.listing_photos as permissive for all to authenticated using ((EXISTS ( SELECT 1
   FROM listings l
  WHERE ((l.id = listing_photos.listing_id) AND ((l.admin_id = auth.uid()) OR can_manage_listing(l.region_path)))))) with check ((EXISTS ( SELECT 1
   FROM listings l
  WHERE ((l.id = listing_photos.listing_id) AND ((l.admin_id = auth.uid()) OR can_manage_listing(l.region_path))))));
create policy "listing_photos_published_read_guard" on public.listing_photos as restrictive for select to anon, authenticated using ((EXISTS ( SELECT 1
   FROM listings l
  WHERE ((l.id = listing_photos.listing_id) AND (l.published OR ((auth.uid() IS NOT NULL) AND ((l.admin_id = auth.uid()) OR can_manage_listing(l.region_path))))))));
create policy "listing_photos_select_published_or_admin" on public.listing_photos as permissive for select to anon, authenticated using ((EXISTS ( SELECT 1
   FROM listings l
  WHERE ((l.id = listing_photos.listing_id) AND (l.published OR ((auth.uid() IS NOT NULL) AND ((l.admin_id = auth.uid()) OR can_manage_listing(l.region_path))))))));
create policy "Admins can view videos of listings they manage" on public.listing_videos as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM listings l
  WHERE ((l.id = listing_videos.listing_id) AND ((l.admin_id = auth.uid()) OR can_manage_listing(l.region_path))))));
create policy "Service role full access on listing videos" on public.listing_videos as permissive for all to service_role using (true) with check (true);
create policy "listing_videos_published_read_guard" on public.listing_videos as restrictive for select to anon, authenticated using ((((status = 'ready'::text) AND (EXISTS ( SELECT 1
   FROM listings l
  WHERE ((l.id = listing_videos.listing_id) AND l.published)))) OR (EXISTS ( SELECT 1
   FROM listings l
  WHERE ((l.id = listing_videos.listing_id) AND (auth.uid() IS NOT NULL) AND ((l.admin_id = auth.uid()) OR can_manage_listing(l.region_path)))))));
create policy "listing_videos_select_published_or_admin" on public.listing_videos as permissive for select to anon, authenticated using ((((status = 'ready'::text) AND (EXISTS ( SELECT 1
   FROM listings l
  WHERE ((l.id = listing_videos.listing_id) AND l.published)))) OR (EXISTS ( SELECT 1
   FROM listings l
  WHERE ((l.id = listing_videos.listing_id) AND (auth.uid() IS NOT NULL) AND ((l.admin_id = auth.uid()) OR can_manage_listing(l.region_path)))))));
create policy "Allow agents to create listings" on public.listings as permissive for insert to authenticated with check ((auth.uid() = admin_id));
create policy "Allow agents to delete their own listings" on public.listings as permissive for delete to authenticated using ((auth.uid() = admin_id));
create policy "Allow agents to update their own listings" on public.listings as permissive for update to authenticated using ((auth.uid() = admin_id)) with check ((auth.uid() = admin_id));
create policy "Allow public read access to listings" on public.listings as permissive for select to public using ((((status)::text = 'available'::text) OR ((status)::text = 'rented'::text)));
create policy "listings_admin_select_policy" on public.listings as permissive for select to authenticated using ((((status)::text = 'available'::text) OR (( SELECT get_admin_details.role
   FROM get_admin_details(auth.uid()) get_admin_details(role, assigned_region_id)) = 'super_admin'::text) OR ((( SELECT get_admin_details.role
   FROM get_admin_details(auth.uid()) get_admin_details(role, assigned_region_id)) = 'field_admin'::text) AND (admin_id = auth.uid())) OR ((( SELECT get_admin_details.role
   FROM get_admin_details(auth.uid()) get_admin_details(role, assigned_region_id)) = 'regional_admin'::text) AND (( SELECT get_admin_details.assigned_region_id
   FROM get_admin_details(auth.uid()) get_admin_details(role, assigned_region_id)) = ANY (region_path)))));
create policy "listings_admin_write_policy" on public.listings as permissive for all to authenticated using (((( SELECT get_admin_details.role
   FROM get_admin_details(auth.uid()) get_admin_details(role, assigned_region_id)) = 'super_admin'::text) OR ((( SELECT get_admin_details.role
   FROM get_admin_details(auth.uid()) get_admin_details(role, assigned_region_id)) = 'field_admin'::text) AND (admin_id = auth.uid())) OR ((( SELECT get_admin_details.role
   FROM get_admin_details(auth.uid()) get_admin_details(role, assigned_region_id)) = 'regional_admin'::text) AND (( SELECT get_admin_details.assigned_region_id
   FROM get_admin_details(auth.uid()) get_admin_details(role, assigned_region_id)) = ANY (region_path))))) with check (((( SELECT get_admin_details.role
   FROM get_admin_details(auth.uid()) get_admin_details(role, assigned_region_id)) = 'super_admin'::text) OR ((( SELECT get_admin_details.role
   FROM get_admin_details(auth.uid()) get_admin_details(role, assigned_region_id)) = 'field_admin'::text) AND (admin_id = auth.uid())) OR ((( SELECT get_admin_details.role
   FROM get_admin_details(auth.uid()) get_admin_details(role, assigned_region_id)) = 'regional_admin'::text) AND (( SELECT get_admin_details.assigned_region_id
   FROM get_admin_details(auth.uid()) get_admin_details(role, assigned_region_id)) = ANY (region_path)))));
create policy "listings_published_read_guard" on public.listings as restrictive for select to anon, authenticated using ((published OR ((auth.uid() IS NOT NULL) AND ((admin_id = auth.uid()) OR can_manage_listing(region_path)))));
create policy "listings_select_published_or_admin" on public.listings as permissive for select to anon, authenticated using ((published OR ((auth.uid() IS NOT NULL) AND ((admin_id = auth.uid()) OR can_manage_listing(region_path)))));
create policy "Allow public read access to living preferences" on public.living_preferences as permissive for select to public using (true);
create policy "Allow users to manage their own living preferences" on public.living_preferences as permissive for all to public using ((auth.uid() = profile_id)) with check ((auth.uid() = profile_id));
create policy "location_access_payments_insert_lodge" on public.location_access_payments as permissive for insert to public with check (((auth.uid() = user_id) AND (method = 'lodge'::text) AND (EXISTS ( SELECT 1
   FROM slot_credits sc
  WHERE ((sc.listing_id = location_access_payments.listing_id) AND (sc.user_id = auth.uid()) AND (sc.status = 'paid_unmatched'::slot_credit_status))))));
create policy "location_access_payments_select_own" on public.location_access_payments as permissive for select to public using ((auth.uid() = user_id));
create policy "Messages are viewable by conversation participants" on public.messages as permissive for select to public using ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.participant_a = auth.uid()) OR (c.participant_b = auth.uid()))))));
create policy "Participants can send messages" on public.messages as permissive for insert to public with check (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.participant_a = auth.uid()) OR (c.participant_b = auth.uid())))))));
create policy "Authenticated users can read physical rooms" on public.physical_rooms as permissive for select to authenticated using (true);
create policy "Place photos are viewable by everyone" on public.place_photos as permissive for select to public using (true);
create policy "Users can manage photos on their own places" on public.place_photos as permissive for all to public using ((EXISTS ( SELECT 1
   FROM places
  WHERE ((places.id = place_photos.place_id) AND (places.created_by = auth.uid())))));
create policy "Place ratings are viewable by everyone" on public.place_ratings as permissive for select to public using (true);
create policy "Users can manage their own place ratings" on public.place_ratings as permissive for all to public using ((auth.uid() = user_id));
create policy "Places are viewable by everyone" on public.places as permissive for select to public using (true);
create policy "Users can delete their own places" on public.places as permissive for delete to public using ((auth.uid() = created_by));
create policy "Users can insert their own places" on public.places as permissive for insert to public with check ((auth.uid() = created_by));
create policy "Users can update their own places" on public.places as permissive for update to public using ((auth.uid() = created_by)) with check ((auth.uid() = created_by));
create policy "pod_invitations_insert_own" on public.pod_invitations as permissive for insert to authenticated with check ((auth.uid() = inviter_user_id));
create policy "pod_invitations_select_authenticated" on public.pod_invitations as permissive for select to authenticated using (true);
create policy "pod_invitations_update_own" on public.pod_invitations as permissive for update to authenticated using (((auth.uid() = inviter_user_id) OR (auth.uid() = invitee_user_id))) with check (((auth.uid() = inviter_user_id) OR (auth.uid() = invitee_user_id)));
create policy "Authenticated users can view pod members" on public.pod_members as permissive for select to authenticated using (true);
create policy "Users can insert themselves into pod members" on public.pod_members as permissive for insert to authenticated with check ((auth.uid() = user_id));
create policy "Users can remove themselves from pod members" on public.pod_members as permissive for delete to authenticated using ((auth.uid() = user_id));
create policy "pod_members_insert_own" on public.pod_members as permissive for insert to authenticated with check ((auth.uid() = user_id));
create policy "pod_members_select_authenticated" on public.pod_members as permissive for select to authenticated using (true);
create policy "Admins can update pod verification status" on public.pods as permissive for update to public using ((EXISTS ( SELECT 1
   FROM admin_profiles
  WHERE (admin_profiles.id = auth.uid())))) with check (true);
create policy "Authenticated users can view pods" on public.pods as permissive for select to authenticated using (true);
create policy "pods_insert_authenticated" on public.pods as permissive for insert to authenticated with check (true);
create policy "pods_select_authenticated" on public.pods as permissive for select to authenticated using (true);
create policy "pods_update_authenticated" on public.pods as permissive for update to authenticated using (true) with check (true);
create policy "Allow public read access" on public.profiles as permissive for select to public using (true);
create policy "Allow users to update their own profile" on public.profiles as permissive for update to authenticated using ((auth.uid() = id)) with check ((auth.uid() = id));
create policy "profiles_insert_own" on public.profiles as permissive for insert to authenticated with check ((id = auth.uid()));
create policy "Service role full access on referral payments" on public.referral_payments as permissive for all to service_role using (true) with check (true);
create policy "Users can read own referral payments" on public.referral_payments as permissive for select to authenticated using ((auth.uid() = payout_to));
create policy "Service role full access on withdrawal requests" on public.referral_withdrawal_requests as permissive for all to service_role using (true) with check (true);
create policy "Users can read own withdrawal requests" on public.referral_withdrawal_requests as permissive for select to authenticated using ((auth.uid() = user_id));
create policy "Referrers can read own referrals" on public.referrals as permissive for select to authenticated using ((auth.uid() = referrer_id));
create policy "Service role full access on referrals" on public.referrals as permissive for all to service_role using (true) with check (true);
create policy "Allow public read access to regions" on public.regions as permissive for select to public using (true);
create policy "Allow scoped insertion for authorized admins" on public.regions as permissive for insert to public with check (((EXISTS ( SELECT 1
   FROM admin_profiles
  WHERE ((admin_profiles.id = auth.uid()) AND (admin_profiles.role = 'super_admin'::text)))) OR ((EXISTS ( SELECT 1
   FROM admin_profiles
  WHERE ((admin_profiles.id = auth.uid()) AND (admin_profiles.role = 'regional_admin'::text) AND (admin_profiles.assigned_region_id = regions.parent_region_id)))) AND (created_by = auth.uid()))));
create policy "Allow super_admins to modify or delete regions" on public.regions as permissive for all to public using ((EXISTS ( SELECT 1
   FROM admin_profiles
  WHERE ((admin_profiles.id = auth.uid()) AND (admin_profiles.role = 'super_admin'::text)))));
create policy "Public reviews are viewable by anyone" on public.reviews as permissive for select to public using (true);
create policy "Users can create their own reviews" on public.reviews as permissive for insert to public with check ((auth.uid() = user_id));
create policy "Users can delete their own reviews" on public.reviews as permissive for delete to public using ((auth.uid() = user_id));
create policy "Users can update their own reviews" on public.reviews as permissive for update to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
create policy "Allow authenticated users to read roommate preferences" on public.roommate_preferences as permissive for select to authenticated using (true);
create policy "Allow users to delete their own roommate preferences" on public.roommate_preferences as permissive for delete to authenticated using ((auth.uid() = profile_id));
create policy "Allow users to insert their own roommate preferences" on public.roommate_preferences as permissive for insert to authenticated with check ((auth.uid() = profile_id));
create policy "Allow users to update their own roommate preferences" on public.roommate_preferences as permissive for update to authenticated using ((auth.uid() = profile_id)) with check ((auth.uid() = profile_id));
create policy "Allow users to remove their own saved listings" on public.saved_listings as permissive for delete to authenticated using ((auth.uid() = user_id));
create policy "Allow users to save a listing for themselves" on public.saved_listings as permissive for insert to authenticated with check ((auth.uid() = user_id));
create policy "Allow users to view their own saved listings" on public.saved_listings as permissive for select to authenticated using ((auth.uid() = user_id));
create policy "Users can create their own slot credits" on public.slot_credits as permissive for insert to authenticated with check ((auth.uid() = user_id));
create policy "Users can update their own slot credits" on public.slot_credits as permissive for update to authenticated using ((auth.uid() = user_id));
create policy "Users can view their own slot credits" on public.slot_credits as permissive for select to authenticated using ((auth.uid() = user_id));
create policy "slot_credits_insert_own" on public.slot_credits as permissive for insert to authenticated with check ((auth.uid() = user_id));
create policy "slot_credits_select_admin" on public.slot_credits as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM listings l
  WHERE ((l.id = slot_credits.listing_id) AND (l.admin_id = auth.uid())))));
create policy "slot_credits_select_own" on public.slot_credits as permissive for select to authenticated using ((auth.uid() = user_id));
create policy "slot_credits_update_admin" on public.slot_credits as permissive for update to authenticated using ((EXISTS ( SELECT 1
   FROM admin_profiles ap
  WHERE (ap.id = auth.uid())))) with check (true);
create policy "slot_credits_update_own" on public.slot_credits as permissive for update to authenticated using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
create policy "Allow public token checks" on public.sra_verification_tokens as permissive for select to authenticated using (true);
create policy "Allow token claiming" on public.sra_verification_tokens as permissive for update to authenticated using ((is_used = false)) with check (((is_used = true) AND (used_by_profile_id = auth.uid())));
create policy "Developer full access" on public.sra_verification_tokens as permissive for all to service_role using (true) with check (true);
create policy "tour_bookings_select_admins" on public.tour_bookings as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM listings l
  WHERE ((l.id = tour_bookings.listing_id) AND ((l.admin_id = auth.uid()) OR can_manage_listing(l.region_path))))));
create policy "tour_bookings_select_own" on public.tour_bookings as permissive for select to public using ((auth.uid() = user_id));
create policy "tour_bookings_update_admins" on public.tour_bookings as permissive for update to authenticated using ((EXISTS ( SELECT 1
   FROM listings l
  WHERE ((l.id = tour_bookings.listing_id) AND ((l.admin_id = auth.uid()) OR can_manage_listing(l.region_path)))))) with check ((status = ANY (ARRAY['pending_payment'::text, 'booked'::text, 'completed'::text, 'cancelled'::text, 'expired'::text])));
create policy "Anyone can join the waitlist" on public.waitlist as permissive for insert to anon, authenticated with check (true);
create policy "Service role full access on waitlist" on public.waitlist as permissive for all to service_role using (true) with check (true);
create policy "Allow authenticated users to upload avatars" on storage.objects as permissive for insert to authenticated with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Allow public read access to avatars" on storage.objects as permissive for select to public using ((bucket_id = 'avatars'::text));
create policy "Allow users to delete their own avatar" on storage.objects as permissive for delete to authenticated using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Allow users to update their own avatar" on storage.objects as permissive for update to authenticated using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))) with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "Anyone can view place photos" on storage.objects as permissive for select to public using ((bucket_id = 'place-photos'::text));
create policy "Authenticated users can delete place photos" on storage.objects as permissive for delete to authenticated using ((bucket_id = 'place-photos'::text));
create policy "Authenticated users can update place photos" on storage.objects as permissive for update to authenticated using ((bucket_id = 'place-photos'::text));
create policy "Authenticated users can upload place photos" on storage.objects as permissive for insert to authenticated with check ((bucket_id = 'place-photos'::text));
create policy "allow_upload_listing_images 1i0okip_0" on storage.objects as permissive for insert to authenticated with check ((bucket_id = 'listing-images'::text));
create policy "allow_upload_listing_images 1i0okip_1" on storage.objects as permissive for update to authenticated using ((bucket_id = 'listing-images'::text));
create policy "allow_upload_listing_images 1i0okip_2" on storage.objects as permissive for select to authenticated using ((bucket_id = 'listing-images'::text));
create policy "allow_upload_listing_images 1i0okip_3" on storage.objects as permissive for delete to authenticated using ((bucket_id = 'listing-images'::text));
create policy "allow_user_read 1i0okip_0" on storage.objects as permissive for select to public using ((bucket_id = 'listing-images'::text));

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('place-photos', 'place-photos', true) on conflict (id) do nothing;

alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.tour_bookings;
