/**
 * Chrome pauses "video-only" media — clips with no audio track, or muted ones
 * — on its own to save power, and seeking can trigger it. Silent footage is
 * the norm for form review, so a jump could stop playback outright with
 * nothing in the app having asked for it.
 *
 * These helpers mark the pauses the app *did* ask for, so an unexplained one
 * can be told apart and undone.
 */

const INTENTIONAL = new WeakSet<HTMLMediaElement>();
const RESUMES = new WeakMap<HTMLMediaElement, number[]>();

/** Give up after this many auto-resumes in the window, so we never loop. */
const MAX_RESUMES = 3;
const RESUME_WINDOW_MS = 4000;

/** Pause on the app's behalf; suppresses the auto-resume guard. */
export function pauseMedia(video: HTMLMediaElement) {
  // Only mark when a `pause` event will actually follow. Pausing an already
  // paused element fires nothing, so the marker would never be consumed — and
  // the next genuine unintended pause would be mistaken for ours and left
  // stopped for good.
  if (!video.paused) INTENTIONAL.add(video);
  video.pause();
}

/** Drop any stale marker; call when playback starts. */
export function clearPauseIntent(video: HTMLMediaElement) {
  INTENTIONAL.delete(video);
}

/** Play on the app's behalf, swallowing the benign autoplay rejection. */
export function playMedia(video: HTMLMediaElement) {
  INTENTIONAL.delete(video);
  return video.play().catch(() => undefined);
}

/**
 * Call from a `pause` event listener. Resumes only when the app did not ask
 * for the pause and the page is genuinely on screen — a backgrounded tab is
 * left alone so real power saving still works.
 */
export function resumeIfUnintended(video: HTMLMediaElement) {
  // Ours: consume the marker and stand down.
  if (INTENTIONAL.delete(video)) return;
  if (video.ended) return;
  // Never play() into an in-flight seek. Firefox aborts the seek and can leave
  // the element wedged with no further frames; the `seeked` handler is the one
  // that restores playback once the jump has actually landed.
  if (video.seeking) return;
  if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

  const now = Date.now();
  const recent = (RESUMES.get(video) ?? []).filter((t) => now - t < RESUME_WINDOW_MS);
  if (recent.length >= MAX_RESUMES) return;
  recent.push(now);
  RESUMES.set(video, recent);

  void video.play().catch(() => undefined);
}

const PENDING_SEEK = new WeakMap<HTMLMediaElement, number>();

/**
 * Seek with at most one request in flight.
 *
 * Chrome and Safari quietly coalesce overlapping seeks, so assigning
 * `currentTime` on every pointermove is survivable there. Firefox does not —
 * a second seek issued while the first is still running can leave the element
 * stuck in `seeking` and never presenting another frame, which reads as a
 * permanent freeze. Newer targets are queued and applied on `seeked`.
 */
export function seekMedia(video: HTMLMediaElement, time: number) {
  if (!Number.isFinite(video.duration)) return;
  const target = Math.min(Math.max(time, 0), video.duration);

  if (video.seeking) {
    PENDING_SEEK.set(video, target);
    return;
  }
  video.currentTime = target;
}

/**
 * Apply any target queued during the last seek. Returns true when that started
 * another seek, meaning the caller should wait for the next `seeked`.
 */
const RECOVERIES = new WeakMap<HTMLMediaElement, number[]>();
const RECOVERY_WINDOW_MS = 15000;
const MAX_RECOVERIES = 3;

/**
 * Rebuild a media element whose decoder has died.
 *
 * Firefox on macOS decodes through VideoToolbox, and seeking can hand it data
 * it rejects — `NS_ERROR_DOM_MEDIA_DECODE_ERR` from `AppleVTDecoder`. Once
 * that fires the element is finished: it never presents another frame, so the
 * player looks frozen for good. The only way back is to reload the resource
 * and restore the position. Safari and Chrome use different decode paths and
 * generally do not hit this.
 *
 * Returns false when the failure is not a recoverable decode error, or when
 * reloading has already been tried too many times.
 */
export function recoverFromDecodeError(video: HTMLMediaElement) {
  if (video.error?.code !== MediaError.MEDIA_ERR_DECODE) return false;

  const now = Date.now();
  const recent = (RECOVERIES.get(video) ?? []).filter((t) => now - t < RECOVERY_WINDOW_MS);
  if (recent.length >= MAX_RECOVERIES) return false;
  recent.push(now);
  RECOVERIES.set(video, recent);

  const resumeAt = video.currentTime;
  const wasPlaying = !video.paused;

  const restore = () => {
    // Nudge back a hair: replaying the exact frame that killed the decoder
    // tends to kill it again.
    seekMedia(video, Math.max(0, resumeAt - 0.1));
    if (wasPlaying) void playMedia(video);
  };
  video.addEventListener("loadedmetadata", restore, { once: true });

  // Re-creates the decode pipeline from the same object URL.
  video.load();
  return true;
}

export function flushPendingSeek(video: HTMLMediaElement) {
  const next = PENDING_SEEK.get(video);
  if (next === undefined) return false;
  PENDING_SEEK.delete(video);
  if (Math.abs(video.currentTime - next) > 1 / 120) {
    video.currentTime = next;
    return true;
  }
  return false;
}
