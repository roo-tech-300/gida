import type { AuthProfile } from '@/context/auth-context';
import type { CreateListingData } from '@/context/create-listing-context';
import type { CreateListingInput } from '@/services/listing-service';

function parseSizeSqft(step1: CreateListingData['step1']): number | null {
  const num = parseFloat(step1.sizeValue.replace(/,/g, ''));
  if (isNaN(num)) return null;
  return step1.sizeUnit === 'sqm' ? Math.round(num * 10.7639) : Math.round(num);
}

/** Maps the listing wizard's answers to the listings row it creates or updates. */
export function buildListingInput(data: CreateListingData, profile: AuthProfile | null): CreateListingInput {
  const { step1, step2, step3, step4, step5 } = data;
  const isFlat = step1.layoutType === 'flat';
  const bedroomCount = isFlat ? step1.bedrooms : 0;
  const bathroomCount = isFlat ? step1.bathrooms : step1.layoutType === 'self_contain' ? 1 : 0;
  const hasAmenity = (key: string) => step3.selectedAmenities.includes(key);

  return {
    admin_id: step2.transferAdminId ?? profile?.id ?? '',
    title: step1.title.trim(),
    description: step1.description.trim() || null,
    landlord_id: step1.landlordId,
    category: 'student_housing',
    layout_type: step1.layoutType!,
    price_amount: parseFloat(step1.price.replace(/,/g, '')),
    lease_term: 'per_annum',
    units_available: step1.units,
    number_of_bedrooms: bedroomCount,
    number_of_bathrooms: bathroomCount,
    max_roommates: step4.maxRoommates,
    property_tier: step4.maxRoommates,
    rules: step4.rulesList,
    location_landmark: step2.landmark.trim(),
    city: profile?.city || 'Minna',
    campus: step2.selectedCampus || step2.selectedSchool,
    latitude: step2.coords?.latitude ?? null,
    longitude: step2.coords?.longitude ?? null,
    is_shared_bathroom: hasAmenity('is_shared_bathroom'),
    is_shared_kitchen: hasAmenity('is_shared_kitchen'),
    has_borehole: hasAmenity('has_borehole'),
    has_generator: hasAmenity('has_generator'),
    has_fenced_gate: hasAmenity('has_fenced_gate'),
    has_internet: hasAmenity('has_internet'),
    has_burglary: hasAmenity('has_burglary'),
    has_cabinet: hasAmenity('has_cabinet'),
    has_wardrobe: hasAmenity('has_wardrobe'),
    custom_features: step3.featuresList,
    size_sqft: parseSizeSqft(step1),
    total_floors: step1.isStoreyBuilding ? step1.totalFloors : null,
    region_path: step2.regionPath.length > 0 ? step2.regionPath : null,
    enable_self_guided_tour: step2.enableSelfGuidedTour,
    enable_guided_tour: step2.enableGuidedTour,
    video_cover_enabled: step5.videoCoverEnabled,
  };
}
