export type PropertyCategory = 'Apartments' | 'Duplexes' | 'Short Lets' | 'Land';

export type PropertyListing = {
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
  image: number;
  category: PropertyCategory;
  featured: boolean;
};

export const discoverFilters: PropertyCategory[] = ['Apartments', 'Duplexes', 'Short Lets', 'Land'];

export const discoverListings: PropertyListing[] = [
  {
    id: 'obsidian-penthouse',
    title: 'The Obsidian Penthouse',
    location: 'Victoria Island, Lagos',
    price: 'N45m/year',
    beds: '4 Beds',
    baths: '4.5 Baths',
    size: '3,200 sqft',
    floor: '62nd Fl',
    status: 'New Listing',
    description:
      'Redefining modern luxury, The Obsidian Penthouse offers an unparalleled residential experience. Featuring triple-height ceilings, a private wrap-around terrace, and custom interiors by renowned architect Zaha Hadid. Residents enjoy exclusive access to the building\'s private wellness club, 24/7 concierge, and a direct-access helipad.',
    amenities: ['Smart Home OS', 'Wine Cellar', 'Private Elevator', 'Sky Garden'],
    photoCount: 24,
    hasVirtualTour: true,
    category: 'Apartments',
    featured: true,
    image: require('@/dummy/images/houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.png'),
  },
  {
    id: 'aura-lofts',
    title: 'Aura Lofts',
    location: 'Ikoyi, Lagos',
    price: 'N12m/year',
    beds: '2 Beds',
    baths: '2.5 Baths',
    size: '1,450 sqft',
    floor: '14th Fl',
    status: 'Reserved',
    description:
      'Contemporary living redefined at Aura Lofts. These thoughtfully designed spaces feature floor-to-ceiling windows, Italian marble finishes, and a state-of-the-art fitness centre. Located in the heart of Ikoyi, you\'re steps away from premium dining and retail.',
    amenities: ['Fitness Centre', 'Co-Working Lounge', 'Rooftop Pool', '24hr Security'],
    photoCount: 18,
    hasVirtualTour: false,
    category: 'Short Lets',
    featured: false,
    image: require('@/dummy/images/houses/Gemini_Generated_Image_1miazv1miazv1mia.png'),
  },
  {
    id: 'zenith-terraces',
    title: 'The Zenith Terraces',
    location: 'Lekki Phase 1, Lagos',
    price: 'N28m/year',
    beds: '3 Beds',
    baths: '3 Baths',
    size: '2,100 sqft',
    floor: '8th Fl',
    status: 'Recently Added',
    description:
      'The Zenith Terraces combine suburban tranquillity with urban convenience. Each unit boasts a private garden terrace, smart home automation, and premium Bosch kitchen appliances. The gated community includes a children\'s play area, jogging track, and dedicated parking.',
    amenities: ['Private Terrace', 'Smart Home', 'Bosch Kitchen', 'Gated Community'],
    photoCount: 15,
    hasVirtualTour: true,
    category: 'Duplexes',
    featured: false,
    image: require('@/dummy/images/houses/Gemini_Generated_Image_5d7v1i5d7v1i5d7v.png'),
  },
];
