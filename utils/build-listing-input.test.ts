import type { CreateListingData } from '@/context/create-listing-context';
import { buildListingInput } from '@/utils/build-listing-input';
import type { PickedVideo } from '@/utils/pick-listing-video';

const pickedVideo: PickedVideo = {
  file: { uri: 'file:///clip.mp4', name: 'clip.mp4', type: 'video/mp4' },
  fileName: 'clip.mp4',
  mimeType: 'video/mp4',
  durationSeconds: 30,
};

function wizard(step5: Partial<CreateListingData['step5']> = {}): CreateListingData {
  return {
    step1: {
      title: ' Sunrise Lodge ', description: '', landlordId: null, layoutType: 'flat', price: '450,000',
      term: 'per_annum', units: 2, bedrooms: 3, bathrooms: 2, isStoreyBuilding: false, totalFloors: 2,
      sizeValue: '100', sizeUnit: 'sqm',
    },
    step2: {
      selectedSchool: 'FUT Minna', selectedCampus: null, landmark: 'Gidan Kwano', coords: null,
      regionPath: [], transferAdminId: null, enableSelfGuidedTour: true, enableGuidedTour: false,
    },
    step3: { selectedAmenities: ['has_borehole'], featuresList: [] },
    step4: { rulesList: [], maxRoommates: 2 },
    step5: { hero: null, gallery: [], ...step5 },
  };
}

describe('buildListingInput', () => {
  it('maps the wizard answers to a listings row', () => {
    const input = buildListingInput(wizard(), null);
    expect(input).toMatchObject({
      title: 'Sunrise Lodge',
      price_amount: 450000,
      number_of_bedrooms: 3,
      size_sqft: 1076,
      campus: 'FUT Minna',
      has_borehole: true,
      has_generator: false,
      region_path: null,
      enable_guided_tour: false,
    });
  });

  it('uses the video cover only when the cover itself is a video', () => {
    expect(buildListingInput(wizard(), null).video_cover_enabled).toBe(false);
    expect(
      buildListingInput(wizard({ hero: { kind: 'photo', uri: 'file:///hero.jpg' } }), null).video_cover_enabled,
    ).toBe(false);
    expect(
      buildListingInput(wizard({ hero: { kind: 'video', video: pickedVideo } }), null).video_cover_enabled,
    ).toBe(true);
  });
});
