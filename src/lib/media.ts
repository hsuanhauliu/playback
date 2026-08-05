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
  INTENTIONAL.add(video);
  video.pause();
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
  if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

  const now = Date.now();
  const recent = (RESUMES.get(video) ?? []).filter((t) => now - t < RESUME_WINDOW_MS);
  if (recent.length >= MAX_RESUMES) return;
  recent.push(now);
  RESUMES.set(video, recent);

  void video.play().catch(() => undefined);
}
