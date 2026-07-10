import { type PropertyListing } from '@/dummy/listings-mock';

export type SavedProperty = PropertyListing & {
  savedAt: string;
  note: string;
};

export const savedProperties: SavedProperty[] = [
  {
    id: 'obsidian-penthouse',
    title: 'The Obsidian Penthouse',
    location: 'Victoria Island, Lagos',
    price: 'N45m/year',
    beds: '4 Beds',
    baths: '4.5 Baths',
    size: '3,200 sqft',
    status: 'New Listing',
    category: 'Apartments',
    featured: true,
    image: require('@/dummy/images/houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.png'),
    savedAt: 'Saved yesterday',
    note: 'Priority shortlist',
  },
  {
    id: 'aura-lofts',
    title: 'Aura Lofts',
    location: 'Ikoyi, Lagos',
    price: 'N12m/year',
    beds: '2 Beds',
    baths: '2.5 Baths',
    size: '1,450 sqft',
    status: 'Reserved',
    category: 'Short Lets',
    featured: false,
    image: require('@/dummy/images/houses/Gemini_Generated_Image_1miazv1miazv1mia.png'),
    savedAt: 'Saved 3 days ago',
    note: 'For weekend stays',
  },
  {
    id: 'zenith-terraces',
    title: 'The Zenith Terraces',
    location: 'Lekki Phase 1, Lagos',
    price: 'N28m/year',
    beds: '3 Beds',
    baths: '3 Baths',
    size: '2,100 sqft',
    status: 'Recently Added',
    category: 'Duplexes',
    featured: false,
    image: require('@/dummy/images/houses/Gemini_Generated_Image_5d7v1i5d7v1i5d7v.png'),
    savedAt: 'Saved last week',
    note: 'Great for family living',
  },
];
