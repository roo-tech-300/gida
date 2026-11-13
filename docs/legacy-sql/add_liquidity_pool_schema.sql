-- Liquidity Pool Schema Migration for Gida Premium Real Estate
-- Enforces abstract inventory management, slot credits, pods, and minted rooms

  CREATE TABLE IF NOT EXISTS estates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    campus TEXT NOT NULL,
    property_tier INTEGER NOT NULL CHECK (property_tier >= 1),
    price_per_annum NUMERIC NOT NULL,
    physical_rooms_inventory INTEGER NOT NULL DEFAULT 0,
    abstract_slots_available INTEGER NOT NULL DEFAULT 0,
    primary_image TEXT,
    rules TEXT[] DEFAULT '{}',
    amenities TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TYPE slot_credit_status AS ENUM (
    'booked',
    'booked_pending_claim',
    'paid_unmatched',
    'matched',
    'subletting'
  );

  CREATE TABLE IF NOT EXISTS slot_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    estate_id UUID NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
    property_tier INTEGER NOT NULL,
    intent_size INTEGER NOT NULL CHECK (intent_size >= 1 AND intent_size <= property_tier),
    status slot_credit_status NOT NULL DEFAULT 'booked_pending_claim',
    linked_credit_id UUID REFERENCES slot_credits(id) ON DELETE SET NULL,
    invite_code TEXT UNIQUE,
    payment_deadline TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_odd_tier_intent CHECK (
      (property_tier % 2 = 0) OR (intent_size = 1 OR intent_size = property_tier)
    )
  );

  CREATE TYPE pod_gender_lock AS ENUM ('MALE', 'FEMALE', 'ANY');

  CREATE TABLE IF NOT EXISTS pods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estate_id UUID NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
    property_tier INTEGER NOT NULL,
    matched_gender pod_gender_lock NOT NULL DEFAULT 'ANY',
    current_total_intent INTEGER NOT NULL DEFAULT 0,
    is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
    physical_room_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS pod_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slot_credit_id UUID NOT NULL REFERENCES slot_credits(id) ON DELETE CASCADE,
    intent_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pod_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS physical_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estate_id UUID NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
    property_tier INTEGER NOT NULL,
    physical_door_number TEXT NOT NULL,
    gender_lock pod_gender_lock NOT NULL DEFAULT 'ANY',
    assigned_pod_id UUID REFERENCES pods(id) ON DELETE SET NULL,
    latecomer_slots_available INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
