import { useCallback, useEffect, useRef } from "react";
import { DEFAULT_FPS } from "./useVideoController";
import { pauseMedia, playMedia } from "../lib/media";

type VideoRef = React.RefObject<HTMLVideoElement | null>;

/** Followers are nudged back into place once they drift past this many seconds. */
const DRIFT_TOLERANCE = 0.08;

const clamp = (value: number, lo: number, hi: number) => Math.min(Math.max(value, lo), hi);

/**
 * Links two players so a transport action on either applies to both, while
 * each keeps its own clock. The clips are held a fixed distance apart rather
 * than forced to the same timestamp, so footage of the same movement shot at
 * different moments stays aligned.
 *
 * The gap is captured from wherever the clips already sit the moment linking
 * is switched on: scrub each one to the same point of the movement with Sync
 * off, then turn it on to lock that alignment in.
 */
export function useLinkedTransport(refs: [VideoRef, VideoRef], linked: boolean) {
  /** secondsOf(B) - secondsOf(A). */
  const gapRef = useRef(0);

  const pair = useCallback(() => {
    const [a, b] = [refs[0].current, refs[1].current];
    return a && b ? ([a, b] as const) : null;
  }, [refs]);

  // Capture the alignment the user scrubbed to, at the moment linking begins.
  useEffect(() => {
    if (!linked) return;
    const both = pair();
    if (both) gapRef.current = both[1].currentTime - both[0].currentTime;
  }, [linked, pair]);

  const seekFrom = useCallback(
    (source: 0 | 1, time: number) => {
      const both = pair();
      if (!both) return;
      const gap = gapRef.current;
      const targets = source === 0 ? [time, time + gap] : [time - gap, time];
      both.forEach((video, i) => {
        if (!Number.isFinite(video.duration)) return;
        video.currentTime = clamp(targets[i], 0, video.duration);
      });
    },
    [pair],
  );

  // Shifting both by the same delta preserves the gap without recomputing it.
  const step = useCallback(
    (direction: 1 | -1, frames = 1) => {
      const both = pair();
      if (!both) return;
      const delta = (direction * frames) / DEFAULT_FPS;
      both.forEach((video) => {
        pauseMedia(video);
        if (!Number.isFinite(video.duration)) return;
        video.currentTime = clamp(video.currentTime + delta, 0, video.duration);
      });
    },
    [pair],
  );

  const togglePlay = useCallback(() => {
    const both = pair();
    if (!both) return;

    if (both.some((v) => !v.paused)) {
      both.forEach(pauseMedia);
      return;
    }

    // Parked at the end: restart as a group, keeping the gap intact by
    // putting whichever clip leads back at zero.
    const atEnd = both.every(
      (v) => Number.isFinite(v.duration) && v.currentTime >= v.duration - 1e-3,
    );
    if (atEnd) {
      const gap = gapRef.current;
      const starts = gap >= 0 ? [0, gap] : [-gap, 0];
      both.forEach((video, i) => {
        video.currentTime = clamp(starts[i], 0, video.duration || 0);
      });
    }
    both.forEach((v) => void playMedia(v));
  }, [pair]);

  const setSpeed = useCallback(
    (value: number) => {
      pair()?.forEach((v) => {
        v.playbackRate = value;
      });
    },
    [pair],
  );

  // Hold the gap steady during playback, and stop as a pair when either
  // clip runs out so they never come apart.
  useEffect(() => {
    if (!linked) return;
    let raf = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const both = pair();
      if (both) {
        const [a, b] = both;
        if (!a.paused && !b.paused) {
          const want = a.currentTime + gapRef.current;
          if (
            want >= 0 &&
            Number.isFinite(b.duration) &&
            want <= b.duration &&
            Math.abs(b.currentTime - want) > DRIFT_TOLERANCE
          ) {
            b.currentTime = want;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const both = pair();
    const onEnded = () => both?.forEach(pauseMedia);
    both?.forEach((v) => v.addEventListener("ended", onEnded));

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      both?.forEach((v) => v.removeEventListener("ended", onEnded));
    };
  }, [linked, pair]);

  return { togglePlay, seekFrom, step, setSpeed };
}
