export type PropertyCategory = 'Apartments' | 'Duplexes' | 'Short Lets' | 'Land';

export type PropertyListing = {
  id: string;
  title: string;
  location: string;
  price: string;
  beds: string;
  baths: string;
  size: string;
  floor?: string;
  status: string;
  description?: string;
  amenities?: string[];
  photoCount?: number;
  hasVirtualTour?: boolean;
  image: number;
  category: PropertyCategory;
  featured: boolean;
};

export const discoverFilters: PropertyCategory[] = ['Apartments', 'Duplexes', 'Short Lets', 'Land'];

export const discoverListings: PropertyListing[] = [
  {
    id: 'the-solo-studio',
    title: 'The Solo Studio (Tier 1)',
    location: 'Victoria Island, Lagos',
    price: 'N18m/year',
    beds: '1 Bed',
    baths: '1 Bath',
    size: '650 sqft',
    floor: '4th Fl',
    status: 'New Listing',
    description:
      'Executive private studio crafted for solo academic excellence. Features biometric smart access, integrated workstation, high-speed fiber internet, and immediate auto-minting to a physical room without needing co-tenants.',
    amenities: ['Fiber Internet', 'Biometric Access', 'Backup Power', 'Study Station'],
    photoCount: 12,
    hasVirtualTour: true,
    category: 'Apartments',
    featured: true,
    image: require('@/dummy/images/houses/Gemini_Generated_Image_5j0rak5j0rak5j0r.png'),
  },
  {
    id: 'aura-twin-lofts',
    title: 'Aura Twin Lofts (Tier 2)',
    location: 'Ikoyi, Lagos',
    price: 'N12m/year',
    beds: '2 Beds',
    baths: '2.5 Baths',
    size: '1,450 sqft',
    floor: '14th Fl',
    status: 'Available',
    description:
      'Contemporary living redefined at Aura Twin Lofts. Designed specifically for optimal 2-person matching pods, featuring equal-sized ensuite master chambers, Italian marble finishes, and an expansive shared study lounge.',
    amenities: ['Fitness Centre', 'Co-Working Lounge', 'Rooftop Pool', '24hr Security'],
    photoCount: 18,
    hasVirtualTour: false,
    category: 'Short Lets',
    featured: false,
    image: require('@/dummy/images/houses/Gemini_Generated_Image_1wlh0m1wlh0m1wlh.png'),
  },
  {
    id: 'zenith-tri-terraces',
    title: 'The Zenith Terraces (Tier 3)',
    location: 'Lekki Phase 1, Lagos',
    price: 'N28m/year',
    beds: '3 Beds',
    baths: '3 Baths',
    size: '2,100 sqft',
    floor: '8th Fl',
    status: 'Recently Added',
    description:
      'The Zenith Terraces combine suburban tranquillity with urban convenience. Built as a Tier 3 collaborative property, it showcases Gida\'s Odd-Tier Rule—requiring students to purchase exactly 1 slot or perform a 100% buyout to ensure zero leftover vacancies.',
    amenities: ['Private Terrace', 'Smart Home OS', 'Bosch Kitchen', 'Gated Community'],
    photoCount: 15,
    hasVirtualTour: true,
    category: 'Duplexes',
    featured: false,
    image: require('@/dummy/images/houses/Gemini_Generated_Image_5d7v1i5d7v1i5d7v.png'),
  },
  {
    id: 'obsidian-penthouse',
    title: 'The Obsidian Penthouse (Tier 4)',
    location: 'Victoria Island, Lagos',
    price: 'N45m/year',
    beds: '4 Beds',
    baths: '4.5 Baths',
    size: '3,200 sqft',
    floor: '62nd Fl',
    status: 'Featured',
    description:
      'Redefining modern luxury, The Obsidian Penthouse offers an unparalleled residential experience. Designed for 4-person matching pods with custom interiors by renowned architects, a private wellness club, and 24/7 concierge.',
    amenities: ['Smart Home OS', 'Wine Cellar', 'Private Elevator', 'Sky Garden'],
    photoCount: 24,
    hasVirtualTour: true,
    category: 'Apartments',
    featured: true,
    image: require('@/dummy/images/houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.png'),
  },
  {
    id: 'emerald-quintet',
    title: 'Emerald Quintet Suites (Tier 5)',
    location: 'Banana Island, Lagos',
    price: 'N55m/year',
    beds: '5 Beds',
    baths: '5.5 Baths',
    size: '4,100 sqft',
    floor: '12th Fl',
    status: 'Available',
    description:
      'Ultra-luxury 5-bedroom waterfront residence designed for large academic groups or communal student housing pools. Enforces Odd-Tier protection rules while offering private sea-view balconies for all five occupants.',
    amenities: ['Waterfront View', 'Olympic Pool', 'Private Cinema', 'Chef Kitchen'],
    photoCount: 20,
    hasVirtualTour: true,
    category: 'Duplexes',
    featured: false,
    image: require('@/dummy/images/houses/Gemini_Generated_Image_1miazv1miazv1mia.png'),
  },
  {
    id: 'royal-hexa-manor',
    title: 'Royal Hexa Manor (Tier 6)',
    location: 'Eko Atlantic, Lagos',
    price: 'N65m/year',
    beds: '6 Beds',
    baths: '6.5 Baths',
    size: '5,000 sqft',
    floor: '20th Fl',
    status: 'Exclusive',
    description:
      'The pinnacle of collaborative student luxury in Eko Atlantic. A expansive 6-bedroom grand duplex engineered for 6-person matching pods, allowing flexible combinations of friend pairs, single travelers, or complete student society buyouts.',
    amenities: ['Private Elevator', 'Helipad Access', '24/7 Butler Service', 'Game Lounge'],
    photoCount: 30,
    hasVirtualTour: true,
    category: 'Apartments',
    featured: true,
    image: require('@/dummy/images/houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.png'),
  },
];
