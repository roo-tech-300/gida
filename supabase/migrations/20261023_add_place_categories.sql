-- Migration: Add place categories and synonyms for search resolution
-- These tables power the Discover directory category chips and allow
-- free-form search terms (e.g. "restaurant") to resolve to canonical
-- categories (e.g. "food").

-- ---------------------------------------------------------------------------
-- place_categories: canonical categories that drive the UI chip rail.
-- ---------------------------------------------------------------------------
create table if not exists public.place_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  icon_key text not null,
  accent_color text not null,
  "order" int not null default 0
);

-- ---------------------------------------------------------------------------
-- category_synonyms: maps free-form search terms to the canonical key.
-- enables queries like "restaurant" -> "food".
-- ---------------------------------------------------------------------------
create table if not exists public.category_synonyms (
  id uuid primary key default gen_random_uuid(),
  key text not null references public.place_categories(key) on delete cascade,
  synonym text not null,
  is_primary boolean not null default true,
  constraint category_synonyms_key_synonym unique (key, synonym)
);

-- ---------------------------------------------------------------------------
-- Seed canonical categories (matches the current constants in
-- constants/place-categories.ts).
-- ---------------------------------------------------------------------------
insert into public.place_categories (key, label, icon_key, accent_color, "order") values
  ('food',    'Food',    'restaurant-outline', '#C97B3C', 1),
  ('cafe',    'Cafés',   'cafe-outline',       '#B98A5A', 2),
  ('nightlife','Nightlife','wine-outline',      '#8A6BC9', 3),
  ('chill',   'Chill Spots','leaf-outline',    '#4FA88B', 4),
  ('study',   'Study Spots','book-outline',    '#6B8FD1', 5),
  ('gym',     'Gyms',    'barbell-outline',   '#C96B6B', 6),
  ('shopping','Shopping','bag-handle-outline','#C9A06B', 7),
  ('health',  'Health',  'medkit-outline',    '#5FAFA0', 8),
  ('services','Services','construct-outline','#9A9AA8', 9);

-- ---------------------------------------------------------------------------
-- Seed useful synonyms so the search can resolve "restaurant", "cafe", etc.
-- ---------------------------------------------------------------------------
insert into public.category_synonyms (key, synonym, is_primary) values
  ('food',   'restaurant', true),
  ('food',   'bistro',     true),
  ('food',   'diner',      true),
  ('food',   'eatery',     false),
  ('cafe',   'coffee shop',true),
  ('cafe',   'cafeteria',  true),
  ('cafe',   'coffeehouse',false);