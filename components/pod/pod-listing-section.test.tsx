import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { PodListingSection } from '@/components/pod/pod-listing-section';
import { makeDbListing } from '@/dummy/listing-fixture';
import { useListingPhotos } from '@/hooks/use-listing-photos';

jest.mock('expo-image', () => ({
  Image: () => null,
}));

jest.mock('@/hooks/use-listing-photos', () => ({
  useListingPhotos: jest.fn(() => ({ data: [] })),
  fetchListingPhotos: jest.fn(),
}));

const mockUseListingPhotos = useListingPhotos as jest.Mock;

const listing = makeDbListing({
  id: 'listing-section-1',
  title: 'Sunrise Lodge',
  description: 'A quiet lodge a short walk from campus.',
  location_landmark: 'Gidan Kwano',
  city: 'Minna',
  number_of_bedrooms: 2,
  number_of_bathrooms: 1,
  size_sqft: 420,
});

describe('PodListingSection', () => {
  beforeEach(() => {
    mockUseListingPhotos.mockReturnValue({ data: [] });
  });

  it('renders location, key facts, amenities, and description', async () => {
    const { getByText } = await render(<PodListingSection listing={listing} />);

    expect(getByText('Gidan Kwano, Minna')).toBeTruthy();
    expect(getByText('2 Beds')).toBeTruthy();
    expect(getByText('1 Bath')).toBeTruthy();
    expect(getByText('420 sqft')).toBeTruthy();
    expect(getByText('Borehole Water')).toBeTruthy();
    expect(getByText('Generator')).toBeTruthy();
    expect(getByText('Fenced Gate')).toBeTruthy();
    expect(getByText('Burglary Proof')).toBeTruthy();
    expect(getByText('Cabinets')).toBeTruthy();
    expect(getByText('Wardrobe')).toBeTruthy();
    expect(getByText('A quiet lodge a short walk from campus.')).toBeTruthy();
  });

  it('opens the full-screen gallery when a lodge photo is pressed', async () => {
    mockUseListingPhotos.mockReturnValue({ data: ['https://cdn.example.com/lodge.jpg'] });
    const { getAllByPressable, getByText } = await render(<PodListingSection listing={listing} />);

    fireEvent.press(getAllByPressable()[0]);
    expect(getByText('1 / 1')).toBeTruthy();
  });
});
