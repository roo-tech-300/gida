import { supabase } from '@/lib/supabase';
import { derivePropertyTier } from '@/utils/liquidity-math';
import type { Estate } from '@/types/liquidity';
import type { DbListing } from '@/types/feed-listing';

function estateFromListing(listing: DbListing): Estate {
  const tier = derivePropertyTier(listing.property_tier, listing.max_roommates);
  return {
    id: `est-${listing.id.slice(0, 8)}`,
    name: listing.title,
    description: listing.description ?? '',
    campus: listing.campus ?? listing.city,
    property_tier: tier,
    price_per_annum: listing.price_amount,
    physical_rooms_inventory: listing.units_available,
    abstract_slots_available: listing.abstract_slots_available ?? listing.units_available * tier,
    primary_image: listing.primary_image ?? undefined,
    rules: listing.rules,
    amenities: listing.custom_features ?? [],
  };
}

async function findExistingEstate(estate: Estate): Promise<string | undefined> {
  try {
    const { data, error } = await supabase
      .from('estates')
      .select('id')
      .eq('name', estate.name)
      .eq('campus', estate.campus)
      .maybeSingle();
    if (!error && data) return data.id;
  } catch (error) {
    console.error('[LiquidityEstate] Failed to look up existing estate:', error);
  }
  return undefined;
}

async function createEstateFromListing(estate: Estate): Promise<string | undefined> {
  try {
    const { data, error } = await supabase
      .from('estates')
      .insert({
        name: estate.name,
        description: estate.description,
        campus: estate.campus,
        property_tier: estate.property_tier,
        price_per_annum: estate.price_per_annum,
        physical_rooms_inventory: estate.physical_rooms_inventory,
        abstract_slots_available: estate.abstract_slots_available,
        primary_image: estate.primary_image ?? null,
        rules: estate.rules,
        amenities: estate.amenities,
      })
      .select()
      .maybeSingle();
    if (!error && data) return data.id;
    console.warn('[LiquidityEstate] Estate insert skipped, using local fallback:', error?.message ?? 'no data');
  } catch (error) {
    console.error('[LiquidityEstate] Exception during estate creation:', error);
  }
  return undefined;
}

export async function resolveEstateForListing(listing: DbListing): Promise<{ estateId: string; estate: Estate }> {
  if (listing.estate_id) {
    try {
      const { data, error } = await supabase.from('estates').select('*').eq('id', listing.estate_id).maybeSingle();
      if (!error && data) {
        return { estateId: data.id, estate: data as Estate };
      }
    } catch (error) {
      console.error('[LiquidityEstate] Failed to fetch estate for listing:', error);
    }
    return { estateId: listing.estate_id, estate: estateFromListing(listing) };
  }

  const estate = estateFromListing(listing);
  const existingId = await findExistingEstate(estate);
  if (existingId) {
    return { estateId: existingId, estate };
  }

  const createdId = await createEstateFromListing(estate);
  return { estateId: createdId ?? estate.id, estate };
}
