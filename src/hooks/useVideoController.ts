import { useCallback, useEffect, useRef, useState } from "react";
import { pauseMedia, playMedia, resumeIfUnintended } from "../lib/media";

export const SPEEDS = [0.1, 0.25, 0.5, 1] as const;
export const DEFAULT_FPS = 30;

export function useVideoController(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    // Skipped when another controller owns this element (e.g. synced compare).
    if (!video || !enabled) return;

    const onLoaded = () => setDuration(video.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      // Undo a pause the app never asked for (Chrome power-saving on silent
      // clips, which a seek can trigger).
      resumeIfUnintended(video);
    };
    const onTime = () => setCurrentTime(video.currentTime);
    // Keeps the readout honest when a linked pane drives this element.
    const onRate = () => setSpeed(video.playbackRate);

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ratechange", onRate);

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
      video.currentTime = Math.min(Math.max(time, 0), video.duration || 0);
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
    togglePlay,
    seek,
    stepFrame,
    changeSpeed,
    speeds: SPEEDS,
  };
}
