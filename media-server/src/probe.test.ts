import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseProbe } from './probe.ts';

function ffprobeJson(video: Record<string, unknown>, withAudio = true, duration = '42.5'): string {
  const streams = [{ codec_type: 'video', width: 1920, height: 1080, r_frame_rate: '30000/1001', ...video }];
  if (withAudio) streams.push({ codec_type: 'audio' } as (typeof streams)[number]);
  return JSON.stringify({ streams, format: { duration } });
}

test('reads dimensions, duration, fps and audio', () => {
  const probe = parseProbe(ffprobeJson({}));
  assert.equal(probe.width, 1920);
  assert.equal(probe.height, 1080);
  assert.equal(probe.durationSeconds, 42.5);
  assert.equal(Math.round(probe.fps * 100) / 100, 29.97);
  assert.equal(probe.hasAudio, true);
});

test('swaps dimensions for phone videos recorded upright', () => {
  const fromSideData = parseProbe(ffprobeJson({ side_data_list: [{ rotation: -90 }] }));
  assert.deepEqual([fromSideData.width, fromSideData.height], [1080, 1920]);

  const fromTag = parseProbe(ffprobeJson({ tags: { rotate: '270' } }));
  assert.deepEqual([fromTag.width, fromTag.height], [1080, 1920]);

  const upsideDown = parseProbe(ffprobeJson({ side_data_list: [{ rotation: 180 }] }));
  assert.deepEqual([upsideDown.width, upsideDown.height], [1920, 1080]);
});

test('detects silent clips', () => {
  assert.equal(parseProbe(ffprobeJson({}, false)).hasAudio, false);
});

test('rejects files without video or duration', () => {
  assert.throws(() => parseProbe(JSON.stringify({ streams: [{ codec_type: 'audio' }] })), /no video stream/);
  assert.throws(() => parseProbe(ffprobeJson({}, true, 'N/A')), /duration/);
});
