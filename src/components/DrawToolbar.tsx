import clsx from "clsx";
import type { DrawTool } from "../types";
import { Icon, type IconName } from "./Icon";
import { IconButton } from "./IconButton";

const TOOLS: { id: DrawTool; label: string; icon: IconName; key: string }[] = [
  { id: "none", label: "Select", icon: "cursor", key: "1" },
  { id: "pen", label: "Freehand", icon: "pen", key: "2" },
  { id: "line", label: "Line", icon: "line", key: "3" },
  { id: "arrow", label: "Arrow", icon: "arrow", key: "4" },
  { id: "rect", label: "Rectangle", icon: "rect", key: "5" },
  { id: "ellipse", label: "Ellipse", icon: "ellipse", key: "6" },
  { id: "angle", label: "Angle", icon: "angle", key: "7" },
  { id: "erase", label: "Erase", icon: "eraser", key: "8" },
];

/* Concrete hex values — these are painted onto a canvas, which cannot
   resolve CSS custom properties. */
const COLORS = [
  { value: "#00d492", label: "Green" },
  { value: "#ff4d4d", label: "Red" },
  { value: "#ffc53d", label: "Amber" },
  { value: "#4d9dff", label: "Blue" },
  { value: "#ffffff", label: "White" },
  { value: "#0b0b0b", label: "Black" },
];

const WIDTHS = [
  { value: 2, dot: 4 },
  { value: 4, dot: 7 },
  { value: 7, dot: 10 },
];

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-line" aria-hidden />;
}

interface Props {
  tool: DrawTool;
  onToolChange: (tool: DrawTool) => void;
  color: string;
  onColorChange: (color: string) => void;
  lineWidth: number;
  onLineWidthChange: (width: number) => void;
  onClear: () => void;
  onUndo: () => void;
  /** Slot that undo/clear will act on, when more than one pane is open. */
  scope?: string;
}

export function DrawToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  lineWidth,
  onLineWidthChange,
  onClear,
  onUndo,
  scope,
}: Props) {
  return (
    <div className="panel scrollbar-none flex shrink-0 items-center gap-1 overflow-x-auto px-1.5 py-1.5">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          title={`${t.label}  ·  ${t.key}`}
          aria-label={t.label}
          aria-pressed={tool === t.id}
          onClick={() => onToolChange(t.id)}
          className={clsx(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-100",
            tool === t.id
              ? "bg-accent-soft text-accent-text ring-1 ring-inset ring-accent-ring"
              : "text-muted hover:bg-surface-3 hover:text-fg",
          )}
        >
          <Icon name={t.icon} size={16} />
        </button>
      ))}

      <Divider />

      <div className="flex shrink-0 items-center gap-1">
        {COLORS.map((c) => (
          <button
            key={c.label}
            type="button"
            title={c.label}
            aria-label={c.label}
            aria-pressed={color === c.value}
            onClick={() => onColorChange(c.value)}
            className={clsx(
              "relative h-6 w-6 shrink-0 rounded-full transition-transform duration-100",
              color === c.value ? "scale-100" : "scale-90 hover:scale-100",
            )}
          >
            <span
              className="absolute inset-1 rounded-full ring-1 ring-inset ring-black/20"
              style={{ background: c.value }}
            />
            {color === c.value && (
              <span
                className="absolute inset-0 rounded-full"
                style={{ color: c.value, boxShadow: "inset 0 0 0 2px currentColor" }}
              />
            )}
          </button>
        ))}
      </div>

      <Divider />

      <div className="flex shrink-0 items-center gap-0.5 rounded-lg bg-surface-2 p-0.5">
        {WIDTHS.map((w) => (
          <button
            key={w.value}
            type="button"
            title={`Stroke ${w.value}px`}
            aria-label={`Stroke ${w.value} pixels`}
            aria-pressed={lineWidth === w.value}
            onClick={() => onLineWidthChange(w.value)}
            className={clsx(
              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-100",
              lineWidth === w.value ? "bg-surface text-fg shadow-sm" : "text-faint hover:text-muted",
            )}
          >
            <span
              className="rounded-full bg-current"
              style={{ width: w.dot, height: w.dot }}
            />
          </button>
        ))}
      </div>

      <Divider />

      {scope && (
        <span
          title={`Undo and clear act on pane ${scope}`}
          className="ml-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-accent-soft px-1.5 font-mono text-[11px] font-semibold text-accent-text ring-1 ring-inset ring-accent-ring"
        >
          {scope}
        </span>
      )}
      <IconButton
        icon="undo"
        label={scope ? `Undo on ${scope}  ·  ⌘Z` : "Undo  ·  ⌘Z"}
        onClick={onUndo}
      />
      <IconButton
        icon="trash"
        label={scope ? `Clear ${scope}  ·  Delete` : "Clear all  ·  Delete"}
        onClick={onClear}
      />
    </div>
  );
}
