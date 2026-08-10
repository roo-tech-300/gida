export type SlotCreditStatus =
  | 'booked'
  | 'booked_pending_claim'
  | 'paid_unmatched'
  | 'matched'
  | 'subletting';

export type PodStatus = 'forming' | 'finalized' | 'swept_latecomer';

export interface Estate {
  id: string;
  name: string;
  description?: string;
  campus: string;
  property_tier: number;
  price_per_annum: number;
  physical_rooms_inventory: number;
  abstract_slots_available: number;
  primary_image?: string;
  rules: string[];
  amenities: string[];
}

export interface SlotCredit {
  id: string;
  user_id: string;
  estate_id: string;
  property_tier: number;
  intent_size: number;
  target_occupancy: number;
  status: SlotCreditStatus;
  linked_credit_id?: string | null;
  invite_code?: string | null;
  created_at: string;
  payment_deadline: string;
  estate?: Estate;
}

export interface PodMember {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  intent_size: number;
  campus: string;
  major: string;
  cleanliness_score: number;
  sleep_schedule: string;
  slot_credit_id: string;
}

export interface Pod {
  id: string;
  estate_id: string;
  property_tier: number;
  matched_gender: 'MALE' | 'FEMALE' | 'ANY';
  members: PodMember[];
  current_total_intent: number;
  target_occupancy: number;
  is_finalized: boolean;
  physical_room_id?: string | null;
  created_at: string;
}

export interface PhysicalRoom {
  id: string;
  estate_id: string;
  property_tier: number;
  physical_door_number: string;
  gender_lock: 'NONE' | 'MALE' | 'FEMALE';
  assigned_pod_id?: string | null;
  latecomer_slots_available: number;
}
