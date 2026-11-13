import type { CreateListingData } from '@/context/create-listing-context';
import { buildListingInput, parseSizeSqft, validateListingForm } from './listing-input';

function makeData(overrides: Partial<CreateListingData['step1']> = {}): CreateListingData {
  return {
    step1: {
      title: ' Sunrise Lodge ', description: '', landlordId: 'l1', layoutType: 'flat', price: '350,000',
      term: 'per_annum', units: 2, bedrooms: 3, bathrooms: 2, isStoreyBuilding: true, totalFloors: 4,
      sizeValue: '100', sizeUnit: 'sqm', ...overrides,
    },
    step2: {
      selectedSchool: 'FUT Minna', selectedCampus: null, landmark: ' Gidan Kwano ',
      coords: { latitude: 9.6, longitude: 6.5 }, regionPath: [], transferAdminId: null,
      enableSelfGuidedTour: true, enableGuidedTour: false,
    },
    step3: { selectedAmenities: ['has_borehole'], featuresList: ['Tiled'] },
    step4: { rulesList: ['No smoking'], maxRoommates: 3 },
    step5: { heroImage: 'file://hero.jpg', galleryImages: [] },
  };
}

describe('parseSizeSqft', () => {
  it('converts sqm to sqft and rounds', () => {
    expect(parseSizeSqft('100', 'sqm')).toBe(1076);
    expect(parseSizeSqft('1,200', 'sqft')).toBe(1200);
  });

  it('returns null for empty or invalid input', () => {
    expect(parseSizeSqft('', 'sqft')).toBeNull();
    expect(parseSizeSqft('abc', 'sqm')).toBeNull();
  });
});

describe('buildListingInput', () => {
  const owner = { adminId: 'admin-1', city: 'Minna' };

  it('maps the form to a listing payload', () => {
    const input = buildListingInput(makeData(), owner);
    expect(input).toMatchObject({
      admin_id: 'admin-1', title: 'Sunrise Lodge', price_amount: 350000, number_of_bedrooms: 3,
      number_of_bathrooms: 2, has_borehole: true, has_generator: false, total_floors: 4,
      location_landmark: 'Gidan Kwano', campus: 'FUT Minna', region_path: null, size_sqft: 1076,
    });
  });

  it('uses fixed bedroom/bathroom counts for non-flat layouts', () => {
    expect(buildListingInput(makeData({ layoutType: 'self_contain' }), owner)).toMatchObject({
      number_of_bedrooms: 0, number_of_bathrooms: 1,
    });
    expect(buildListingInput(makeData({ layoutType: 'single_room' }), owner)).toMatchObject({
      number_of_bedrooms: 0, number_of_bathrooms: 0,
    });
  });

  it('prefers the transfer admin over the signed-in admin', () => {
    const data = makeData();
    data.step2.transferAdminId = 'admin-2';
    expect(buildListingInput(data, owner).admin_id).toBe('admin-2');
  });
});

describe('validateListingForm', () => {
  it('accepts a complete form', () => {
    expect(validateListingForm(makeData())).toBeNull();
  });

  it('reports the first blocking problem', () => {
    expect(validateListingForm(makeData({ title: '  ' }))).toMatch(/Title is required/);
    expect(validateListingForm(makeData({ landlordId: null }))).toMatch(/landlord/);
    const data = makeData();
    data.step5 = { heroImage: null, galleryImages: [] };
    expect(validateListingForm(data)).toMatch(/at least one photo/);
    const far = makeData();
    far.step4.maxRoommates = 5;
    expect(validateListingForm(far)).toMatch(/between 1 and 4/);
  });
});
