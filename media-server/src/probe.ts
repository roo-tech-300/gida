export interface ProbeResult {
  /** Display dimensions, i.e. after applying the phone's rotation metadata. */
  width: number;
  height: number;
  durationSeconds: number;
  fps: number;
  hasAudio: boolean;
}

interface FfprobeStream {
  codec_type?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  tags?: { rotate?: string };
  side_data_list?: { rotation?: number }[];
}

interface FfprobeOutput {
  streams?: FfprobeStream[];
  format?: { duration?: string };
}

function parseFrameRate(raw: string | undefined): number {
  if (!raw) return 30;
  const [num, den] = raw.split('/').map(Number);
  const fps = den ? num / den : num;
  return Number.isFinite(fps) && fps > 0 ? fps : 30;
}

function rotationOf(stream: FfprobeStream): number {
  const fromSideData = stream.side_data_list?.find((entry) => entry.rotation !== undefined)?.rotation;
  const raw = fromSideData ?? Number(stream.tags?.rotate ?? 0);
  return Math.abs(raw) % 180;
}

/** Parses `ffprobe -print_format json -show_streams -show_format` output. */
export function parseProbe(json: string): ProbeResult {
  const output = JSON.parse(json) as FfprobeOutput;
  const video = output.streams?.find((stream) => stream.codec_type === 'video');
  if (!video?.width || !video.height) throw new Error('File has no video stream');

  const sideways = rotationOf(video) === 90;
  const durationSeconds = Number(output.format?.duration);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error('Could not read video duration');
  }

  return {
    width: sideways ? video.height : video.width,
    height: sideways ? video.width : video.height,
    durationSeconds,
    fps: parseFrameRate(video.r_frame_rate),
    hasAudio: Boolean(output.streams?.some((stream) => stream.codec_type === 'audio')),
  };
}
