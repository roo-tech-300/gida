import type { CreateListingData } from '@/context/create-listing-context';
import type { CreateListingInput } from '@/services/listing-service';

const SQM_TO_SQFT = 10.7639;

/** Parses the size field into square feet, or null when it is empty/invalid. */
export function parseSizeSqft(value: string, unit: 'sqft' | 'sqm'): number | null {
  const num = parseFloat(value.replace(/,/g, ''));
  if (Number.isNaN(num)) return null;
  return unit === 'sqm' ? Math.round(num * SQM_TO_SQFT) : Math.round(num);
}

type Owner = { adminId: string; city: string };

/** Maps the wizard's form state to the payload the listings table expects. */
export function buildListingInput(data: CreateListingData, owner: Owner): CreateListingInput {
  const { step1, step2, step3, step4 } = data;
  const has = (key: string): boolean => step3.selectedAmenities.includes(key);
  const isFlat = step1.layoutType === 'flat';

  return {
    admin_id: step2.transferAdminId ?? owner.adminId,
    title: step1.title.trim(),
    description: step1.description.trim() || null,
    landlord_id: step1.landlordId,
    category: 'student_housing',
    layout_type: step1.layoutType!,
    price_amount: parseFloat(step1.price.replace(/,/g, '')),
    lease_term: 'per_annum',
    units_available: step1.units,
    number_of_bedrooms: isFlat ? step1.bedrooms : 0,
    number_of_bathrooms: isFlat ? step1.bathrooms : step1.layoutType === 'self_contain' ? 1 : 0,
    max_roommates: step4.maxRoommates,
    property_tier: step4.maxRoommates,
    rules: step4.rulesList,
    location_landmark: step2.landmark.trim(),
    city: owner.city,
    campus: step2.selectedCampus || step2.selectedSchool,
    latitude: step2.coords?.latitude ?? null,
    longitude: step2.coords?.longitude ?? null,
    is_shared_bathroom: has('is_shared_bathroom'),
    is_shared_kitchen: has('is_shared_kitchen'),
    has_borehole: has('has_borehole'),
    has_generator: has('has_generator'),
    has_fenced_gate: has('has_fenced_gate'),
    has_internet: has('has_internet'),
    has_burglary: has('has_burglary'),
    has_cabinet: has('has_cabinet'),
    has_wardrobe: has('has_wardrobe'),
    custom_features: step3.featuresList,
    size_sqft: parseSizeSqft(step1.sizeValue, step1.sizeUnit),
    total_floors: step1.isStoreyBuilding ? step1.totalFloors : null,
    region_path: step2.regionPath.length > 0 ? step2.regionPath : null,
    enable_self_guided_tour: step2.enableSelfGuidedTour,
    enable_guided_tour: step2.enableGuidedTour,
  };
}

/** Returns the first problem that blocks publishing, or null when the form is valid. */
export function validateListingForm(data: CreateListingData): string | null {
  const { step1, step2, step4, step5 } = data;
  if (!step1.title.trim()) return 'Title is required. Go back to step 1.';
  if (!step1.landlordId) return 'Please select a landlord in step 1.';
  if (!step1.layoutType) return 'Please select a layout type in step 1.';
  if (!step1.price) return 'Please enter a price in step 1.';
  if (step4.maxRoommates < 1 || step4.maxRoommates > 4) return 'Max roommates must be between 1 and 4 in step 4.';
  if (!step2.coords) return 'Please lock the GPS location in step 2.';
  if (!step2.selectedSchool) return 'Please select a school in step 2.';
  if (!step5.heroImage && step5.galleryImages.length === 0) return 'Please add at least one photo.';
  return null;
}
