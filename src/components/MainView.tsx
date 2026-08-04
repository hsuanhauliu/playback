import { useCallback, useMemo, useRef, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { useLinkedTransport } from "../hooks/useLinkedTransport";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import type { DrawTool } from "../types";
import type { DrawingCanvasHandle } from "./DrawingCanvas";
import { VideoStage, type TransportOverride } from "./VideoStage";
import { DrawToolbar } from "./DrawToolbar";
import { UploadDropzone } from "./UploadDropzone";
import { Icon } from "./Icon";

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="flex min-h-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-faint">
      <Icon name="film" size={22} className="opacity-50" />
      <p className="text-xs">
        Pick a clip for slot <span className="font-mono font-semibold text-muted">{label}</span>
      </p>
    </div>
  );
}

export function MainView() {
  const clips = useAppStore((s) => s.clips);
  const mode = useAppStore((s) => s.mode);
  const activeClipId = useAppStore((s) => s.activeClipId);
  const compareClipIds = useAppStore((s) => s.compareClipIds);
  const syncPlayback = useAppStore((s) => s.syncPlayback);
  const addClips = useAppStore((s) => s.addClips);

  // Drawing settings are app-level: one palette drives whichever pane is focused.
  const [tool, setTool] = useState<DrawTool>("none");
  const [color, setColor] = useState("#00d492");
  const [lineWidth, setLineWidth] = useState(4);
  const [focusedSlot, setFocusedSlot] = useState<0 | 1>(0);

  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const videoRefs = useMemo(
    () => [videoRefA, videoRefB] as [typeof videoRefA, typeof videoRefB],
    [],
  );

  const drawingRefA = useRef<DrawingCanvasHandle>(null);
  const drawingRefB = useRef<DrawingCanvasHandle>(null);

  const [slotAId, slotBId] = compareClipIds;
  const clipA = clips.find((c) => c.id === slotAId);
  const clipB = clips.find((c) => c.id === slotBId);
  const linked = mode === "compare" && syncPlayback && Boolean(clipA && clipB);

  const link = useLinkedTransport(videoRefs, linked);

  // Undo/clear act on the pane that holds focus; single mode has only one.
  const activeDrawing = useCallback(() => {
    if (mode !== "compare") return drawingRefA.current;
    return (focusedSlot === 0 ? drawingRefA : drawingRefB).current;
  }, [mode, focusedSlot]);

  const handleUndo = useCallback(() => activeDrawing()?.undo(), [activeDrawing]);
  const handleClear = useCallback(() => activeDrawing()?.clear(), [activeDrawing]);

  // Drawing keys are global; each pane claims transport keys while focused.
  useKeyboardShortcuts({
    enabled: clips.length > 0,
    onTool: setTool,
    onUndo: handleUndo,
    onClear: handleClear,
  });

  const transportFor = useCallback(
    (slot: 0 | 1): TransportOverride | undefined =>
      linked
        ? {
            togglePlay: link.togglePlay,
            seek: (time) => link.seekFrom(slot, time),
            step: link.step,
            setSpeed: link.setSpeed,
          }
        : undefined,
    [linked, link],
  );

  if (clips.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <UploadDropzone onFiles={addClips} />
      </div>
    );
  }

  const drawingProps = { tool, color, lineWidth };

  const panes = [
    { clip: clipA, label: "A", videoRef: videoRefA, drawingRef: drawingRefA },
    { clip: clipB, label: "B", videoRef: videoRefB, drawingRef: drawingRefB },
  ] as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <DrawToolbar
        tool={tool}
        onToolChange={setTool}
        color={color}
        onColorChange={setColor}
        lineWidth={lineWidth}
        onLineWidthChange={setLineWidth}
        onClear={handleClear}
        onUndo={handleUndo}
        scope={mode === "compare" ? (focusedSlot === 0 ? "A" : "B") : undefined}
      />

      {mode === "single" ? (
        <div className="min-h-0 flex-1">
          <VideoStage
            clip={clips.find((c) => c.id === activeClipId) ?? clips[0]}
            drawingRef={drawingRefA}
            {...drawingProps}
          />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          {panes.map(({ clip, label, videoRef, drawingRef }, i) =>
            clip ? (
              <VideoStage
                key={clip.id}
                clip={clip}
                badge={label}
                split
                focused={focusedSlot === i}
                onFocus={() => setFocusedSlot(i as 0 | 1)}
                drawingRef={drawingRef}
                externalVideoRef={videoRef}
                transport={transportFor(i as 0 | 1)}
                {...drawingProps}
              />
            ) : (
              <EmptySlot key={label} label={label} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
