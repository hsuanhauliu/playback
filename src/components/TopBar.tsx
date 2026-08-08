import { useRef } from "react";
import clsx from "clsx";
import { useAppStore } from "../store/useAppStore";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";

function Wordmark({ className }: { className?: string }) {
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-accent-fg">
        <Icon name="mark" size={15} />
      </div>
      <span className="text-[13px] font-semibold tracking-tight text-fg">Playback</span>
    </div>
  );
}

interface Props {
  open: boolean;
  onToggle: () => void;
}

export function TopBar({ open, onToggle }: Props) {
  const clips = useAppStore((s) => s.clips);
  const mode = useAppStore((s) => s.mode);
  const activeClipId = useAppStore((s) => s.activeClipId);
  const addClips = useAppStore((s) => s.addClips);
  const removeClip = useAppStore((s) => s.removeClip);
  const setActiveClip = useAppStore((s) => s.setActiveClip);
  const setMode = useAppStore((s) => s.setMode);
  const compareClipIds = useAppStore((s) => s.compareClipIds);
  const setCompareClip = useAppStore((s) => s.setCompareClip);
  const syncPlayback = useAppStore((s) => s.syncPlayback);
  const setSyncPlayback = useAppStore((s) => s.setSyncPlayback);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("video/"));
    if (files.length) addClips(files);
  };

  if (!open) {
    // Kept in flow rather than floated: an overlay here would sit on top of
    // the per-pane drawing toolbars in compare mode.
    return (
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-2 py-1.5">
        <Wordmark className="shrink-0 opacity-60" />
        <div className="ml-auto">
          <IconButton icon="menu" label="Show menu" onClick={onToggle} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-20 bg-black/50 backdrop-blur-[2px] md:hidden"
        onClick={onToggle}
      />
      <header className="fixed inset-x-0 top-0 z-30 flex shrink-0 flex-col gap-2.5 border-b border-line bg-surface/95 px-3 py-2.5 shadow-lg backdrop-blur-xl md:static md:bg-surface md:shadow-none">
        {/* Rendered on both rows; exactly one row is visible per breakpoint. */}
        {(() => {
          const controls = (
            <>
              <div className="flex shrink-0 items-center gap-0.5 rounded-lg bg-surface-2 p-0.5">
                {(
                  [
                    { id: "single", label: "Single", icon: "single" },
                    { id: "compare", label: "Compare", icon: "compare" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    aria-pressed={mode === m.id}
                    className={clsx(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-100",
                      mode === m.id
                        ? "bg-surface text-fg shadow-sm"
                        : "text-faint hover:text-muted",
                    )}
                  >
                    <Icon name={m.icon} size={14} />
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-fg shadow-sm transition-colors duration-100 hover:bg-accent-hover"
              >
                <Icon name="upload" size={14} />
                Import
              </button>

              {mode === "compare" && (
                <button
                  type="button"
                  onClick={() => setSyncPlayback(!syncPlayback)}
                  aria-pressed={syncPlayback}
                  title="Link both transports, holding the clips at their current offset. Turn off to re-align."
                  className={clsx(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-100",
                    syncPlayback
                      ? "border-accent-ring bg-accent-soft text-accent-text"
                      : "border-line bg-surface-2 text-faint hover:text-muted",
                  )}
                >
                  <Icon name="link" size={14} />
                  Sync
                </button>
              )}
            </>
          );

          return (
            <>
              <div className="flex items-center gap-2">
                <Wordmark className="shrink-0" />
                <span className="mx-1 hidden h-5 w-px bg-line md:block" aria-hidden />
                <div className="hidden items-center gap-2 md:flex">{controls}</div>
                {/* Wrapped in a span: `hidden` on the button itself would
                    collide with its own `inline-flex` display utility. */}
                <div className="ml-auto shrink-0">
                  <span className="hidden md:block">
                    <IconButton icon="chevronUp" label="Hide menu" onClick={onToggle} />
                  </span>
                  <span className="block md:hidden">
                    <IconButton icon="close" label="Close menu" onClick={onToggle} />
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 md:hidden">{controls}</div>
            </>
          );
        })()}

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {clips.length > 0 && (
          <div className="scrollbar-none -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5">
            {clips.map((clip) => {
              const isActive =
                mode === "single"
                  ? activeClipId === clip.id
                  : compareClipIds.includes(clip.id);
              const slot =
                compareClipIds[0] === clip.id ? "A" : compareClipIds[1] === clip.id ? "B" : null;

              return (
                <div
                  key={clip.id}
                  className={clsx(
                    "group flex shrink-0 items-center gap-1.5 rounded-lg border py-1 pl-2 pr-1 text-xs transition-colors duration-100",
                    isActive
                      ? "border-accent-ring bg-accent-soft text-accent-text"
                      : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  <Icon name="film" size={13} className="shrink-0 opacity-70" />
                  <button
                    type="button"
                    className="max-w-36 truncate"
                    title={clip.name}
                    onClick={() => {
                      if (mode === "single") {
                        setActiveClip(clip.id);
                      } else {
                        if (compareClipIds.includes(clip.id)) return;
                        setCompareClip(compareClipIds[0] === null ? 0 : 1, clip.id);
                      }
                    }}
                  >
                    {clip.name}
                  </button>
                  {mode === "compare" && slot && (
                    <span className="shrink-0 rounded bg-accent px-1 font-mono text-[10px] font-semibold text-accent-fg">
                      {slot}
                    </span>
                  )}
                  <IconButton
                    icon="close"
                    label={`Remove ${clip.name}`}
                    size="sm"
                    onClick={() => removeClip(clip.id)}
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  />
                </div>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
}
