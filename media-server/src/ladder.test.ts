import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hlsArgs, posterArgs, previewArgs, selectRenditions } from './ladder.ts';
import type { ProbeResult } from './probe.ts';

const landscape1080: ProbeResult = { width: 1920, height: 1080, durationSeconds: 60, fps: 30, hasAudio: true };
const portrait1080: ProbeResult = { ...landscape1080, width: 1080, height: 1920 };

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

test('1080p sources get all three renditions', () => {
  const renditions = selectRenditions(landscape1080);
  assert.deepEqual(
    renditions.map((r) => [r.name, r.width, r.height]),
    [['360p', 640, 360], ['540p', 960, 540], ['720p', 1280, 720]],
  );
});

test('portrait clips scale by their short side', () => {
  const renditions = selectRenditions(portrait1080);
  assert.deepEqual(renditions.at(-1), { name: '720p', shortSide: 720, videoKbps: 2800, width: 720, height: 1280 });
});

test('small sources are never upscaled', () => {
  const renditions = selectRenditions({ ...landscape1080, width: 960, height: 540 });
  assert.deepEqual(renditions.map((r) => r.name), ['360p', '540p']);

  const tiny = selectRenditions({ ...landscape1080, width: 426, height: 240 });
  assert.deepEqual(tiny.map((r) => [r.name, r.width, r.height]), [['360p', 426, 240]]);
});

test('hls args map one video and audio stream per rendition', () => {
  const args = hlsArgs('in.mp4', '/out', landscape1080, selectRenditions(landscape1080));
  assert.equal(
    valueAfter(args, '-filter_complex'),
    '[0:v]split=3[s0][s1][s2];[s0]scale=640:360[v0];[s1]scale=960:540[v1];[s2]scale=1280:720[v2]',
  );
  assert.equal(valueAfter(args, '-var_stream_map'), 'v:0,a:0,name:360p v:1,a:1,name:540p v:2,a:2,name:720p');
  assert.equal(args.filter((arg) => arg === '0:a:0').length, 3);
  assert.equal(args.at(-1), '/out/%v/index.m3u8');
});

test('hls args skip audio for silent clips and cap frame rate', () => {
  const probe: ProbeResult = { ...landscape1080, hasAudio: false, fps: 60 };
  const args = hlsArgs('in.mp4', '/out', probe, selectRenditions({ ...probe, width: 640, height: 360 }));
  assert.equal(valueAfter(args, '-filter_complex'), '[0:v]scale=640:360,fps=30[v0]');
  assert.equal(valueAfter(args, '-var_stream_map'), 'v:0,name:360p');
  assert.equal(args.includes('0:a:0'), false);
});

test('preview is silent, at most 8s, and web-optimised', () => {
  const args = previewArgs('in.mp4', 'preview.mp4', { ...portrait1080, durationSeconds: 5 });
  assert.equal(valueAfter(args, '-t'), '5');
  assert.equal(valueAfter(args, '-vf'), 'scale=360:640');
  assert.ok(args.includes('-an'));
  assert.equal(valueAfter(args, '-movflags'), '+faststart');
});

test('poster grabs a frame at 1s, or halfway through very short clips', () => {
  assert.equal(valueAfter(posterArgs('in.mp4', 'p.jpg', landscape1080), '-ss'), '1.00');
  assert.equal(valueAfter(posterArgs('in.mp4', 'p.jpg', { ...landscape1080, durationSeconds: 1 }), '-ss'), '0.50');
});
