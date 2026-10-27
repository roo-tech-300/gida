import type { DbListing } from '@/types/feed-listing';

/**
 * A complete listing row. Fixtures for pods and feeds only declare the fields
 * they exercise; everything else gets a realistic default so the object still
 * satisfies `DbListing` (which the join flow requires end to end).
 */
export function makeDbListing(overrides: Partial<DbListing> = {}): DbListing {
  return {
    id: 'listing-1',
    title: 'Sunrise Lodge',
    description: 'A quiet lodge a short walk from campus.',
    price_amount: 1_200_000,
    slashed_price: null,
    location_landmark: 'Gidan Kwano',
    city: 'Minna',
    category: 'Self Contain',
    layout_type: 'self_contain',
    number_of_bedrooms: 2,
    number_of_bathrooms: 1,
    size_sqft: 420,
    total_floors: 1,
    primary_image: null,
    status: 'available',
    featured: false,
    custom_features: [],
    is_shared_bathroom: false,
    is_shared_kitchen: false,
    has_borehole: true,
    has_generator: true,
    has_fenced_gate: true,
    has_internet: false,
    has_burglary: true,
    has_cabinet: true,
    has_wardrobe: true,
    landlord_id: 'landlord-1',
    admin_id: 'admin-1',
    lease_term: 'per_annum',
    units_available: 1,
    latitude: 9.5836,
    longitude: 6.5478,
    campus: 'FUT Minna',
    rules: [],
    max_roommates: 3,
    estate_id: 'estate-1',
    property_tier: 3,
    region_path: ['Niger', 'Minna'],
    ...overrides,
  };
}
