import { useRef, useState } from "react";
import clsx from "clsx";
import { Icon } from "./Icon";

interface Props {
  onFiles: (files: File[]) => void;
}

const SHORTCUTS: [string, string][] = [
  ["Space", "Play / pause"],
  ["← →", "Step one frame"],
  ["⇧ ← →", "Step ten frames"],
  ["1 – 8", "Select tool"],
];

export function UploadDropzone({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("video/"));
    if (files.length) onFiles(files);
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <button
        type="button"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-10 transition-colors duration-150",
          dragging
            ? "border-accent bg-accent-soft"
            : "border-line-strong bg-surface/50 hover:border-accent hover:bg-surface",
        )}
      >
        <span
          className={clsx(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-150",
            dragging ? "bg-accent text-accent-fg" : "bg-accent-soft text-accent-text",
          )}
        >
          <Icon name="upload" size={22} />
        </span>
        <span className="text-center">
          <span className="block text-sm font-medium text-fg">
            {dragging ? "Drop to import" : "Drop footage here"}
          </span>
          <span className="mt-0.5 block text-xs text-faint">
            or click to browse · MP4, MOV, WebM
          </span>
        </span>
      </button>

      <dl className="grid w-full grid-cols-[auto_1fr] gap-x-3 gap-y-2 sm:grid-cols-[auto_1fr_auto_1fr] sm:gap-x-4">
        {SHORTCUTS.map(([keys, desc]) => (
          <div key={keys} className="contents">
            <dt className="justify-self-start rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] leading-4 text-muted">
              {keys}
            </dt>
            <dd className="self-center text-[11px] text-faint">{desc}</dd>
          </div>
        ))}
      </dl>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
