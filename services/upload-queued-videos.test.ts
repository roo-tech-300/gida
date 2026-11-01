import type { QueryClient } from '@tanstack/react-query';
import { runListingVideoUpload, type ListingVideoUploadOutcome } from '@/services/run-listing-video-upload';
import { setListingHeroVideo } from '@/services/listing-video-service';
import { uploadQueuedVideos } from '@/services/upload-queued-videos';
import { clearUpload, getUpload } from '@/utils/listing-video-upload-store';
import type { PickedVideo } from '@/utils/pick-listing-video';

jest.mock('@/services/run-listing-video-upload', () => ({ runListingVideoUpload: jest.fn() }));
jest.mock('@/services/listing-video-service', () => ({ setListingHeroVideo: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/hooks/use-listing-videos', () => ({
  listingVideosQueryKey: (listingId: string) => ['listing-videos', listingId],
}));

const runUpload = runListingVideoUpload as jest.MockedFunction<typeof runListingVideoUpload>;
const setHero = setListingHeroVideo as jest.MockedFunction<typeof setListingHeroVideo>;
const queryClient = { invalidateQueries: jest.fn().mockResolvedValue(undefined) } as unknown as QueryClient;

function video(fileName: string): PickedVideo {
  return { file: { uri: `file:///${fileName}`, name: fileName, type: 'video/mp4' }, fileName, mimeType: 'video/mp4', durationSeconds: 30 };
}

function outcomes(...results: ListingVideoUploadOutcome[]) {
  results.forEach((result) => runUpload.mockResolvedValueOnce(result));
}

beforeEach(() => {
  runUpload.mockReset();
  setHero.mockClear();
  clearUpload('l1');
});

describe('uploadQueuedVideos', () => {
  it('uploads one at a time, labelling each with its place in the queue', async () => {
    outcomes({ kind: 'done', videoId: 'v1' }, { kind: 'done', videoId: 'v2' });
    const summary = await uploadQueuedVideos('l1', [video('a.mp4'), video('b.mp4')], queryClient);
    expect(runUpload.mock.calls.map(([, , label]) => label)).toEqual(['a.mp4 (1 of 2)', 'b.mp4 (2 of 2)']);
    expect(summary).toEqual({ uploaded: 2, failed: 0, canceled: false });
    expect(getUpload('l1')).toBeNull();
  });

  it('moves the cover video to the front after it uploads', async () => {
    outcomes({ kind: 'done', videoId: 'hero-id' }, { kind: 'done', videoId: 'other-id' });
    await uploadQueuedVideos('l1', [video('hero.mp4'), video('other.mp4')], queryClient, { heroIndex: 0 });
    expect(setHero).toHaveBeenCalledTimes(1);
    expect(setHero).toHaveBeenCalledWith('l1', 'hero-id');
  });

  it('keeps going after a failure and reports it at the end', async () => {
    outcomes({ kind: 'failed', message: 'Network problem.' }, { kind: 'done', videoId: 'v2' });
    await uploadQueuedVideos('l1', [video('a.mp4'), video('b.mp4')], queryClient);
    expect(runUpload).toHaveBeenCalledTimes(2);
    expect(getUpload('l1')).toEqual({ status: 'failed', fileName: 'a.mp4', error: 'Network problem.' });
  });

  it('summarises several failures', async () => {
    outcomes(
      { kind: 'failed', message: 'Too long.' },
      { kind: 'failed', message: 'Offline.' },
      { kind: 'done', videoId: 'v3' },
    );
    await uploadQueuedVideos('l1', [video('a.mp4'), video('b.mp4'), video('c.mp4')], queryClient);
    expect(getUpload('l1')).toMatchObject({ status: 'failed', fileName: '2 videos' });
  });

  it('stops the queue when the admin cancels', async () => {
    outcomes({ kind: 'canceled' });
    await uploadQueuedVideos('l1', [video('a.mp4'), video('b.mp4')], queryClient);
    expect(runUpload).toHaveBeenCalledTimes(1);
  });
});
