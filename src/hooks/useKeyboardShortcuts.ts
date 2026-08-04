import { useEffect } from "react";
import type { DrawTool } from "../types";

export const TOOL_KEYS: DrawTool[] = [
  "none",
  "pen",
  "line",
  "arrow",
  "rect",
  "ellipse",
  "angle",
  "erase",
];

/**
 * Handlers are individually optional: a key with no handler falls through
 * untouched, so transport and drawing keys can live on separate owners
 * (a shared transport plus per-pane tools) without double-firing.
 */
interface Handlers {
  enabled: boolean;
  onTogglePlay?: () => void;
  onStep?: (dir: 1 | -1, frames: number) => void;
  onSpeedIndex?: (index: number) => void;
  onTool?: (tool: DrawTool) => void;
  onUndo?: () => void;
  onClear?: () => void;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function useKeyboardShortcuts({
  enabled,
  onTogglePlay,
  onStep,
  onSpeedIndex,
  onTool,
  onUndo,
  onClear,
}: Handlers) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        if (!onUndo) return;
        e.preventDefault();
        onUndo();
        return;
      }
      if (mod) return;

      switch (e.key) {
        case " ":
        case "k":
          if (!onTogglePlay) return;
          e.preventDefault();
          onTogglePlay();
          return;
        case "ArrowLeft":
        case "j":
          if (!onStep) return;
          e.preventDefault();
          onStep(-1, e.shiftKey ? 10 : 1);
          return;
        case "ArrowRight":
        case "l":
          if (!onStep) return;
          e.preventDefault();
          onStep(1, e.shiftKey ? 10 : 1);
          return;
        case "Backspace":
        case "Delete":
          if (!onClear) return;
          e.preventDefault();
          onClear();
          return;
      }

      // 1–8 select a drawing tool, 9/0 unused; Shift+1–4 pick playback speed.
      if (/^[1-8]$/.test(e.key) && !e.shiftKey) {
        if (!onTool) return;
        e.preventDefault();
        onTool(TOOL_KEYS[Number(e.key) - 1]);
        return;
      }
      if (/^[!@#$]$/.test(e.key)) {
        if (!onSpeedIndex) return;
        e.preventDefault();
        onSpeedIndex("!@#$".indexOf(e.key));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onTogglePlay, onStep, onSpeedIndex, onTool, onUndo, onClear]);
}
