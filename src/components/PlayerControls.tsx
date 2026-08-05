import { useCallback, useRef, useState } from "react";
import clsx from "clsx";
import { IconButton } from "./IconButton";
import { Icon } from "./Icon";

function formatTime(t: number) {
  if (!Number.isFinite(t)) return "0:00.00";
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}

interface ScrubberProps {
  value: number;
  max: number;
  onSeek: (t: number) => void;
}

function Scrubber({ value, max, onSeek }: ScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hoverPct, setHoverPct] = useState<number | null>(null);

  const pctFromEvent = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  }, []);

  const pct = max > 0 ? Math.min(value / max, 1) : 0;

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  // The row is taller than the visible 4px track so the drag target stays
  // thumb-friendly; the extra height is transparent padding around the bar.
  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        onSeek(pctFromEvent(e.clientX) * max);
      }}
      onPointerMove={(e) => {
        setHoverPct(pctFromEvent(e.clientX));
        if (!dragging) return;
        // A drag can end without a pointerup — a cancelled touch gesture, or a
        // mouse released off-window. Either would leave `dragging` stuck on and
        // turn every later hover into a seek, so bail out when no button is held.
        if (e.pointerType === "mouse" && e.buttons === 0) {
          setDragging(false);
          return;
        }
        onSeek(pctFromEvent(e.clientX) * max);
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={() => setDragging(false)}
      onPointerLeave={() => setHoverPct(null)}
      className="group relative flex h-6 cursor-pointer touch-none items-center"
    >
      {/* track */}
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-surface-3">
        {hoverPct !== null && (
          <div
            className="absolute inset-y-0 left-0 bg-line-strong"
            style={{ width: `${hoverPct * 100}%` }}
          />
        )}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      {/* knob */}
      <div
        className={clsx(
          "pointer-events-none absolute h-3.5 w-3.5 rounded-full border-2 border-accent bg-surface shadow-sm transition-transform duration-100",
          dragging ? "scale-125" : "scale-90 group-hover:scale-110",
        )}
        style={{ left: `calc(${pct * 100}% - 7px)` }}
      />
    </div>
  );
}

interface Props {
  playing: boolean;
  currentTime: number;
  duration: number;
  frame: number;
  totalFrames: number;
  speed: number;
  speeds: readonly number[];
  /** Marks this transport as also driving the other pane. */
  linked?: boolean;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onStep: (dir: 1 | -1) => void;
  onSpeedChange: (s: number) => void;
}

export function PlayerControls({
  playing,
  currentTime,
  duration,
  frame,
  totalFrames,
  speed,
  speeds,
  linked,
  onTogglePlay,
  onSeek,
  onStep,
  onSpeedChange,
}: Props) {
  return (
    <div className="panel flex shrink-0 flex-col gap-0.5 px-2 py-1.5">
      {/* The clock rides beside the scrubber, which has spare width to give.
          That keeps the transport row down to two groups so it never wraps,
          however wide the frame number grows. */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Scrubber value={currentTime} max={duration} onSeek={onSeek} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] tabular-nums">
          {linked && <Icon name="link" size={12} className="shrink-0 text-accent-text" />}
          <span className="text-fg">{formatTime(currentTime)}</span>
          <span className="hidden text-faint sm:inline">/ {formatTime(duration)}</span>
          <span className="text-muted">
            f{frame}
            <span className="hidden text-faint sm:inline">/{totalFrames}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5">
        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            icon="stepBack"
            size="sm"
            label="Previous frame  ·  ←"
            onClick={() => onStep(-1)}
          />
          <button
            type="button"
            onClick={onTogglePlay}
            title={playing ? "Pause  ·  Space" : "Play  ·  Space"}
            aria-label={playing ? "Pause" : "Play"}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg shadow-sm transition-colors duration-100 hover:bg-accent-hover"
          >
            {/* nudge the play triangle so it reads optically centred */}
            <span className={clsx("inline-flex", !playing && "translate-x-px")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                {playing ? (
                  <>
                    <rect x="6.5" y="4.5" width="4" height="15" rx="1.2" />
                    <rect x="13.5" y="4.5" width="4" height="15" rx="1.2" />
                  </>
                ) : (
                  <path d="M7.5 4.8v14.4a.6.6 0 0 0 .92.5l11.3-7.2a.6.6 0 0 0 0-1l-11.3-7.2a.6.6 0 0 0-.92.5z" />
                )}
              </svg>
            </span>
          </button>
          <IconButton
            icon="stepForward"
            size="sm"
            label="Next frame  ·  →"
            onClick={() => onStep(1)}
          />
        </div>

        <div className="flex shrink-0 items-center gap-px rounded-md bg-surface-2 p-0.5">
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              aria-pressed={speed === s}
              className={clsx(
                "shrink-0 rounded px-1 py-1 font-mono text-[10px] leading-none tabular-nums transition-colors duration-100 sm:px-1.5",
                speed === s
                  ? "bg-surface text-accent-text shadow-sm"
                  : "text-faint hover:text-muted",
              )}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
