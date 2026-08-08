import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearPauseIntent,
  flushPendingSeek,
  pauseMedia,
  playMedia,
  recoverFromDecodeError,
  resumeIfUnintended,
  seekMedia,
} from "../lib/media";

export const SPEEDS = [0.1, 0.25, 0.5, 1] as const;
export const DEFAULT_FPS = 30;

/** How playback failed, when it has. */
export type MediaFailure = "unsupported" | "decode" | null;

export function useVideoController(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  /**
   * `unsupported` — the browser cannot open the file at all (container or
   * codec it does not implement). `decode` — it opened, but the decoder failed
   * and reloading stopped helping. Null while healthy.
   */
  const [mediaError, setMediaError] = useState<MediaFailure>(null);
  const rafRef = useRef<number | null>(null);
  const resumeAfterSeek = useRef(false);
  const seekRunActive = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    // Skipped when another controller owns this element (e.g. synced compare).
    if (!video || !enabled) return;

    const onLoaded = () => setDuration(video.duration || 0);
    const onPlay = () => {
      clearPauseIntent(video);
      setPlaying(true);
    };
    const onPause = () => {
      setPlaying(false);
      // Undo a pause the app never asked for (Chrome power-saving on silent
      // clips, which a seek can trigger).
      resumeIfUnintended(video);
    };
    const onTime = () => setCurrentTime(video.currentTime);
    // Keeps the readout honest when a linked pane drives this element.
    const onRate = () => setSpeed(video.playbackRate);

    // Jumping to a new timestamp must not silently stop playback. Remember
    // whether it was running when the seek began, and put it back afterwards
    // if anything stopped it along the way. A drag produces a run of seeks, so
    // the intent is captured once at the start and held until the run settles.
    const onSeeking = () => {
      if (seekRunActive.current) return;
      seekRunActive.current = true;
      resumeAfterSeek.current = !video.paused;
    };
    const onSeeked = () => {
      // A newer target queued mid-seek: apply it and wait for that one.
      if (flushPendingSeek(video)) return;
      seekRunActive.current = false;
      if (resumeAfterSeek.current && video.paused && !video.ended) {
        void playMedia(video);
      }
      resumeAfterSeek.current = false;
    };

    // A dead decoder never presents another frame, so without this the player
    // simply sits there looking frozen. Rebuild it; only report a failure once
    // reloading has stopped helping.
    const onError = () => {
      const code = video.error?.code;

      // The browser cannot open this container/codec — nothing to retry.
      // `canPlayType` is no help here: Firefox answers "maybe" for
      // video/quicktime and then fails, Chrome answers "" and plays it fine.
      // The error event is the only trustworthy signal.
      if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        setMediaError("unsupported");
        return;
      }
      if (recoverFromDecodeError(video)) {
        setMediaError(null);
        return;
      }
      if (code === MediaError.MEDIA_ERR_DECODE) setMediaError("decode");
    };
    const onLoadStart = () => setMediaError(null);

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ratechange", onRate);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.addEventListener("loadstart", onLoadStart);

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setCurrentTime(video.currentTime);
      if ("requestVideoFrameCallback" in video) {
        video.requestVideoFrameCallback(tick);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    if ("requestVideoFrameCallback" in video) {
      video.requestVideoFrameCallback(tick);
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("ratechange", onRate);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      video.removeEventListener("loadstart", onLoadStart);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [videoRef, enabled]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      // Replay from the top when parked at the end.
      if (video.duration && video.currentTime >= video.duration - 1e-3) {
        video.currentTime = 0;
      }
      void playMedia(video);
    } else {
      pauseMedia(video);
    }
  }, [videoRef]);

  const seek = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;
      seekMedia(video, time);
    },
    [videoRef],
  );

  /** Step by a number of frames; negative direction steps backwards. */
  const stepFrame = useCallback(
    (direction: 1 | -1, frames = 1) => {
      const video = videoRef.current;
      if (!video) return;
      pauseMedia(video);
      seek(video.currentTime + (direction * frames) / DEFAULT_FPS);
    },
    [videoRef, seek],
  );

  const changeSpeed = useCallback(
    (value: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = value;
      setSpeed(value);
    },
    [videoRef],
  );

  return {
    playing,
    speed,
    currentTime,
    duration,
    frame: Math.round(currentTime * DEFAULT_FPS),
    totalFrames: Math.round(duration * DEFAULT_FPS),
    mediaError,
    togglePlay,
    seek,
    stepFrame,
    changeSpeed,
    speeds: SPEEDS,
  };
}
