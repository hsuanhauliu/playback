import { useCallback, useRef } from "react";
import clsx from "clsx";
import type { Clip, DrawTool } from "../types";
import { useVideoController } from "../hooks/useVideoController";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { DrawingCanvas, type DrawingCanvasHandle } from "./DrawingCanvas";
import { PlayerControls } from "./PlayerControls";

/** Replaces this pane's own transport actions when panes are linked. */
export interface TransportOverride {
  togglePlay: () => void;
  seek: (time: number) => void;
  step: (direction: 1 | -1, frames?: number) => void;
  setSpeed: (speed: number) => void;
}

interface Props {
  clip: Clip;
  /** Drawing settings come from the single shared toolbar. */
  tool: DrawTool;
  color: string;
  lineWidth: number;
  /** Lets the parent drive undo/clear for whichever pane holds focus. */
  drawingRef?: React.RefObject<DrawingCanvasHandle | null>;
  /** Slot marker shown over the video in compare mode. */
  badge?: string;
  /** Whether this stage holds focus, and is visually highlighted. */
  focused?: boolean;
  onFocus?: () => void;
  /** True when more than one stage is on screen. */
  split?: boolean;
  /** Supplied by the parent so it can reach this element for linking. */
  externalVideoRef?: React.RefObject<HTMLVideoElement | null>;
  transport?: TransportOverride;
}

export function VideoStage({
  clip,
  tool,
  color,
  lineWidth,
  drawingRef,
  badge,
  focused = true,
  onFocus,
  split,
  externalVideoRef,
  transport,
}: Props) {
  const ownVideoRef = useRef<HTMLVideoElement>(null);
  const ownDrawingRef = useRef<DrawingCanvasHandle>(null);
  const videoRef = externalVideoRef ?? ownVideoRef;
  const canvasHandle = drawingRef ?? ownDrawingRef;

  // Always tracks this element so the pane shows its own clock, even while a
  // linked pane is the one issuing the commands.
  const controller = useVideoController(videoRef);
  const { stepFrame, changeSpeed, speeds } = controller;

  const togglePlay = transport?.togglePlay ?? controller.togglePlay;
  const seek = transport?.seek ?? controller.seek;
  const setSpeed = transport?.setSpeed ?? changeSpeed;
  const step = useCallback(
    (direction: 1 | -1, frames = 1) =>
      transport ? transport.step(direction, frames) : stepFrame(direction, frames),
    [transport, stepFrame],
  );

  const handleSpeedIndex = useCallback(
    (index: number) => {
      const next = speeds[index];
      if (next !== undefined) setSpeed(next);
    },
    [speeds, setSpeed],
  );

  // Drawing keys are owned by the parent alongside the shared toolbar; this
  // stage claims transport keys while it holds focus.
  useKeyboardShortcuts({
    enabled: focused,
    onTogglePlay: togglePlay,
    onStep: step,
    onSpeedIndex: handleSpeedIndex,
  });

  return (
    <div onPointerDown={onFocus} className="flex h-full min-h-0 min-w-0 flex-col gap-1.5">
      <div
        className={clsx(
          "relative min-h-0 flex-1 overflow-hidden rounded-xl bg-black transition-all",
          split && focused ? "ring-2 ring-accent" : "ring-1 ring-line",
        )}
      >
        <video
          ref={videoRef}
          src={clip.url}
          className="h-full w-full object-contain"
          playsInline
          preload="metadata"
        />
        <DrawingCanvas
          ref={canvasHandle}
          tool={tool}
          color={color}
          lineWidth={lineWidth}
          className="absolute inset-0 h-full w-full"
        />

        {badge && (
          <span
            className={clsx(
              "pointer-events-none absolute left-2.5 top-2.5 inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 font-mono text-[11px] font-semibold backdrop-blur-sm transition-colors",
              focused ? "bg-accent text-accent-fg" : "bg-black/55 text-white/70",
            )}
          >
            {badge}
          </span>
        )}
        <span className="pointer-events-none absolute right-2.5 top-2.5 max-w-[60%] truncate rounded-md bg-black/45 px-2 py-1 text-[11px] text-white/80 backdrop-blur-sm">
          {clip.name}
        </span>
      </div>

      <PlayerControls
        playing={controller.playing}
        currentTime={controller.currentTime}
        duration={controller.duration}
        frame={controller.frame}
        totalFrames={controller.totalFrames}
        speed={controller.speed}
        speeds={controller.speeds}
        linked={Boolean(transport)}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onStep={step}
        onSpeedChange={setSpeed}
      />
    </div>
  );
}
