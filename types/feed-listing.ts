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
  };
}
