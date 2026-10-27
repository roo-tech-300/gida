import path from 'node:path';
import type { ProbeResult } from './probe.ts';

export interface Rung {
  name: string;
  /** Target length of the shorter side, so portrait clips get the same quality. */
  shortSide: number;
  videoKbps: number;
}

export interface Rendition extends Rung {
  width: number;
  height: number;
}

export const LADDER: readonly Rung[] = [
  { name: '360p', shortSide: 360, videoKbps: 700 },
  { name: '540p', shortSide: 540, videoKbps: 1400 },
  { name: '720p', shortSide: 720, videoKbps: 2800 },
];

const SEGMENT_SECONDS = 4;
const MAX_FPS = 30;
const AUDIO_KBPS = 96;
const PREVIEW_SECONDS = 8;
const PREVIEW_MAX_KBPS = 600;

function even(value: number): number {
  return Math.max(2, Math.round(value / 2) * 2);
}

function sizeFor(probe: ProbeResult, shortSide: number): { width: number; height: number } {
  const sourceShort = Math.min(probe.width, probe.height);
  const target = Math.min(shortSide, sourceShort);
  const scale = target / sourceShort;
  return { width: even(probe.width * scale), height: even(probe.height * scale) };
}

/** Never upscale: drop rungs above the source, but always keep at least one. */
export function selectRenditions(probe: ProbeResult): Rendition[] {
  const sourceShort = Math.min(probe.width, probe.height);
  const fitting = LADDER.filter((rung) => rung.shortSide <= sourceShort);
  const rungs = fitting.length > 0 ? fitting : [LADDER[0]];
  return rungs.map((rung) => ({ ...rung, ...sizeFor(probe, rung.shortSide) }));
}

function videoFilter(probe: ProbeResult, width: number, height: number): string {
  const fps = probe.fps > MAX_FPS ? `,fps=${MAX_FPS}` : '';
  return `scale=${width}:${height}${fps}`;
}

const H264 = ['-preset', 'veryfast', '-profile:v', 'main', '-pix_fmt', 'yuv420p'];

export function hlsArgs(input: string, outDir: string, probe: ProbeResult, renditions: Rendition[]): string[] {
  const labels = renditions.map((_, i) => `[v${i}]`);
  const split =
    renditions.length > 1
      ? `[0:v]split=${renditions.length}${renditions.map((_, i) => `[s${i}]`).join('')};`
      : '';
  const scales = renditions
    .map((r, i) => `[${renditions.length > 1 ? `s${i}` : '0:v'}]${videoFilter(probe, r.width, r.height)}${labels[i]}`)
    .join(';');

  const streams = renditions.flatMap((r, i) => {
    const video = [
      '-map', labels[i],
      `-b:v:${i}`, `${r.videoKbps}k`,
      `-maxrate:v:${i}`, `${Math.round(r.videoKbps * 1.07)}k`,
      `-bufsize:v:${i}`, `${Math.round(r.videoKbps * 1.5)}k`,
    ];
    const audio = probe.hasAudio ? ['-map', '0:a:0', `-c:a:${i}`, 'aac', `-b:a:${i}`, `${AUDIO_KBPS}k`, `-ac:a:${i}`, '2'] : [];
    return [...video, ...audio];
  });

  const streamMap = renditions
    .map((r, i) => (probe.hasAudio ? `v:${i},a:${i},name:${r.name}` : `v:${i},name:${r.name}`))
    .join(' ');

  return [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', input,
    '-filter_complex', split + scales,
    ...streams,
    '-c:v', 'libx264', ...H264,
    '-sc_threshold', '0',
    '-force_key_frames', `expr:gte(t,n_forced*${SEGMENT_SECONDS})`,
    '-f', 'hls',
    '-hls_time', String(SEGMENT_SECONDS),
    '-hls_playlist_type', 'vod',
    '-hls_flags', 'independent_segments',
    '-hls_segment_type', 'mpegts',
    '-hls_segment_filename', path.join(outDir, '%v', 'seg_%03d.ts'),
    '-master_pl_name', 'master.m3u8',
    '-var_stream_map', streamMap,
    path.join(outDir, '%v', 'index.m3u8'),
  ];
}

/** Short, silent, small MP4 that autoplays on feed cards. */
export function previewArgs(input: string, output: string, probe: ProbeResult): string[] {
  const { width, height } = sizeFor(probe, LADDER[0].shortSide);
  return [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-ss', '0',
    '-t', String(Math.min(PREVIEW_SECONDS, probe.durationSeconds)),
    '-i', input,
    '-an',
    '-vf', videoFilter(probe, width, height),
    '-c:v', 'libx264', ...H264,
    '-crf', '28',
    '-maxrate', `${PREVIEW_MAX_KBPS}k`,
    '-bufsize', `${PREVIEW_MAX_KBPS * 2}k`,
    '-movflags', '+faststart',
    output,
  ];
}

export function posterArgs(input: string, output: string, probe: ProbeResult): string[] {
  const { width, height } = sizeFor(probe, LADDER[LADDER.length - 1].shortSide);
  const at = Math.min(1, probe.durationSeconds / 2);
  return [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-ss', at.toFixed(2),
    '-i', input,
    '-frames:v', '1',
    '-vf', `scale=${width}:${height}`,
    '-q:v', '3',
    output,
  ];
}
