import type { QueryClient } from '@tanstack/react-query';
import { runListingVideoUpload, type ListingVideoUploadOutcome } from '@/services/run-listing-video-upload';
import { uploadQueuedVideos } from '@/services/upload-queued-videos';
import { clearUpload, getUpload } from '@/utils/listing-video-upload-store';
import type { PickedVideo } from '@/utils/pick-listing-video';

jest.mock('@/services/run-listing-video-upload', () => ({ runListingVideoUpload: jest.fn() }));
jest.mock('@/hooks/use-listing-videos', () => ({
  listingVideosQueryKey: (listingId: string) => ['listing-videos', listingId],
}));

const runUpload = runListingVideoUpload as jest.MockedFunction<typeof runListingVideoUpload>;
const queryClient = { invalidateQueries: jest.fn().mockResolvedValue(undefined) } as unknown as QueryClient;

function video(fileName: string): PickedVideo {
  return { file: { uri: `file:///${fileName}`, name: fileName, type: 'video/mp4' }, fileName, mimeType: 'video/mp4', durationSeconds: 30 };
}

function outcomes(...results: ListingVideoUploadOutcome[]) {
  results.forEach((result) => runUpload.mockResolvedValueOnce(result));
}

beforeEach(() => {
  runUpload.mockReset();
  clearUpload('l1');
});

describe('uploadQueuedVideos', () => {
  it('uploads one at a time, labelling each with its place in the queue', async () => {
    outcomes({ kind: 'done' }, { kind: 'done' });
    await uploadQueuedVideos('l1', [video('a.mp4'), video('b.mp4')], queryClient);
    expect(runUpload.mock.calls.map(([, , label]) => label)).toEqual(['a.mp4 (1 of 2)', 'b.mp4 (2 of 2)']);
    expect(getUpload('l1')).toBeNull();
  });

  it('keeps going after a failure and reports it at the end', async () => {
    outcomes({ kind: 'failed', message: 'Network problem.' }, { kind: 'done' });
    await uploadQueuedVideos('l1', [video('a.mp4'), video('b.mp4')], queryClient);
    expect(runUpload).toHaveBeenCalledTimes(2);
    expect(getUpload('l1')).toEqual({ status: 'failed', fileName: 'a.mp4', error: 'Network problem.' });
  });

  it('summarises several failures', async () => {
    outcomes({ kind: 'failed', message: 'Too long.' }, { kind: 'failed', message: 'Offline.' }, { kind: 'done' });
    await uploadQueuedVideos('l1', [video('a.mp4'), video('b.mp4'), video('c.mp4')], queryClient);
    expect(getUpload('l1')).toMatchObject({ status: 'failed', fileName: '2 videos' });
  });

  it('stops the queue when the admin cancels', async () => {
    outcomes({ kind: 'canceled' });
    await uploadQueuedVideos('l1', [video('a.mp4'), video('b.mp4')], queryClient);
    expect(runUpload).toHaveBeenCalledTimes(1);
  });
});
