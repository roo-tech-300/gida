import { useEffect, useRef } from 'react';
import type { PropertyVideoSurfaceProps } from './property-video-surface';

type HlsInstance = import('hls.js').default;

const HLS_MIME = 'application/vnd.apple.mpegurl';

/**
 * Web version: Safari (and most mobile browsers) play HLS natively; elsewhere
 * hls.js is loaded on demand, so it never bloats the main bundle.
 */
export function PropertyVideoSurface({ url, onError }: PropertyVideoSurfaceProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Kept in a ref so a new callback identity doesn't restart playback.
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: HlsInstance | null = null;
    let cancelled = false;

    const fail = (reason: unknown) => {
      console.error('[PropertyVideoSurface] Playback failed:', url, reason);
      if (!cancelled) onErrorRef.current();
    };
    const play = () => {
      video.play().catch((reason: unknown) => {
        // Autoplay blocked: the controls are visible, so the student can press play.
        console.error('[PropertyVideoSurface] Autoplay was blocked:', reason);
      });
    };

    if (video.canPlayType(HLS_MIME)) {
      video.src = url;
      play();
    } else {
      import('hls.js')
        .then(({ default: HlsPlayer }) => {
          if (cancelled) return;
          if (!HlsPlayer.isSupported()) {
            fail('HLS is not supported in this browser');
            return;
          }
          hls = new HlsPlayer({ capLevelToPlayerSize: true });
          hls.on(HlsPlayer.Events.ERROR, (_event, data) => {
            if (data.fatal) fail(data.details);
          });
          hls.loadSource(url);
          hls.attachMedia(video);
          play();
        })
        .catch(fail);
    }

    return () => {
      cancelled = true;
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [url]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      onError={() => onErrorRef.current()}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: 'black' }}
    />
  );
}
