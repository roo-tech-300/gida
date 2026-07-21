export type FeedListing = {
  id: string;
  title: string;
  location: string;
  price: string;
  beds: string;
  baths: string;
  size: string;
  floor: string;
  status: string;
  description: string;
  amenities: string[];
  photoCount: number;
  hasVirtualTour: boolean;
  image: string;
  category: string;
  featured: boolean;
  layoutType: string;
  latitude?: number;
  longitude?: number;
  locationFee?: number;
  isLocationUnlocked?: boolean;
};

export type DbListing = {
  id: string;
  title: string;
  description: string | null;
  price_amount: number;
  location_landmark: string;
  city: string;
  category: string;
  layout_type: string;
  number_of_bedrooms: number;
  number_of_bathrooms: number;
  size_sqft: number | null;
  total_floors: number | null;
  primary_image: string | null;
  status: string | null;
  featured: boolean | null;
  custom_features: string[] | null;
  is_shared_bathroom: boolean;
  is_shared_kitchen: boolean;
  has_borehole: boolean;
  has_generator: boolean;
  has_fenced_gate: boolean;
  has_internet: boolean;
  has_burglary: boolean;
  has_cabinet: boolean;
  has_wardrobe: boolean;
  landlord_id: string | null;
  admin_id: string;
  lease_term: string;
  units_available: number;
  latitude: number;
  longitude: number;
  campus: string | null;
  rules: string[];
  max_roommates: number;
};

const amenityMap: { key: keyof DbListing; label: string }[] = [
  { key: 'is_shared_bathroom', label: 'Shared Bathroom' },
  { key: 'is_shared_kitchen', label: 'Shared Kitchen' },
  { key: 'has_borehole', label: 'Borehole Water' },
  { key: 'has_generator', label: 'Generator' },
  { key: 'has_fenced_gate', label: 'Fenced Gate' },
  { key: 'has_internet', label: 'Internet' },
  { key: 'has_burglary', label: 'Burglary Proof' },
  { key: 'has_cabinet', label: 'Cabinets' },
  { key: 'has_wardrobe', label: 'Wardrobe' },
];

export function mapDbToFeedListing(item: DbListing): FeedListing {
  const loc = [item.location_landmark, item.city].filter(Boolean).join(', ');

  const booleanAmenities = amenityMap
    .filter((a) => item[a.key])
    .map((a) => a.label);

  const allAmenities = [...(item.custom_features || []), ...booleanAmenities];

  return {
    id: item.id,
    title: item.title,
    location: loc,
    price: `₦${(item.price_amount || 0).toLocaleString('en-US')}/year`,
    beds: item.number_of_bedrooms > 0 ? `${item.number_of_bedrooms} Beds` : '',
    baths: item.number_of_bathrooms > 0 ? `${item.number_of_bathrooms} Baths` : '',
    size: item.size_sqft ? `${item.size_sqft.toLocaleString('en-US')} sqft` : '',
    floor: item.total_floors ? `${item.total_floors} Floors` : 'Ground',
    status: item.status || 'Available',
    description: item.description || '',
    amenities: allAmenities,
    photoCount: 0,
    hasVirtualTour: false,
    image: item.primary_image || '',
    category: item.category || '',
    featured: item.featured || false,
    layoutType: item.layout_type,
    latitude: Number(item.latitude) || 6.5244,
    longitude: Number(item.longitude) || 3.3792,
    locationFee: 500,
    isLocationUnlocked: false,
  };
}

const amenityBooleans: (keyof DbListing)[] = [
  'is_shared_bathroom',
  'is_shared_kitchen',
  'has_borehole',
  'has_generator',
  'has_fenced_gate',
  'has_internet',
  'has_burglary',
  'has_cabinet',
  'has_wardrobe',
];

export function dbToListingForm(item: DbListing) {
  const layoutType = item.layout_type as 'self_contain' | 'single_room' | 'flat';
  const priceDigits = String(Math.round(item.price_amount));
  const sizeDigits = item.size_sqft ? String(item.size_sqft) : '';

  return {
    step1: {
      title: item.title,
      description: item.description || '',
      landlordId: item.landlord_id,
      layoutType,
      price: priceDigits ? Number(priceDigits).toLocaleString('en-US') : '',
      term: item.lease_term as 'per_semester' | 'per_annum',
      units: item.units_available,
      bedrooms: item.number_of_bedrooms,
      bathrooms: item.number_of_bathrooms,
      isStoreyBuilding: item.total_floors !== null && item.total_floors > 1,
      totalFloors: item.total_floors || 2,
      sizeValue: sizeDigits ? Number(sizeDigits).toLocaleString('en-US') : '',
      sizeUnit: 'sqft' as const,
    },
    step2: {
      selectedSchool: item.campus,
      selectedCampus: item.campus,
      landmark: item.location_landmark,
      coords: { latitude: Number(item.latitude), longitude: Number(item.longitude) },
    },
    step3: {
      selectedAmenities: amenityBooleans.filter((key) => item[key]),
      featuresList: item.custom_features || [],
    },
    step4: {
      rulesList: item.rules || [],
      maxRoommates: item.max_roommates,
      noLimit: item.max_roommates >= 999,
    },
    step5: {
      heroImage: item.primary_image,
      galleryImages: [] as string[],
    },
  };
}
