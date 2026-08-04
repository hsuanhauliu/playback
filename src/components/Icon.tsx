import type { JSX } from "react";

export type IconName =
  | "cursor"
  | "pen"
  | "line"
  | "arrow"
  | "rect"
  | "ellipse"
  | "angle"
  | "eraser"
  | "undo"
  | "trash"
  | "play"
  | "pause"
  | "stepBack"
  | "stepForward"
  | "upload"
  | "menu"
  | "close"
  | "chevronUp"
  | "chevronLeft"
  | "chevronRight"
  | "film"
  | "single"
  | "compare"
  | "link";

const PATHS: Record<IconName, JSX.Element> = {
  cursor: <path d="M5 3l6.5 15.5 2.2-6.8 6.8-2.2L5 3z" />,
  pen: (
    <>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
      <path d="M14.5 5.5l4 4" />
    </>
  ),
  line: <path d="M5 19L19 5" />,
  arrow: (
    <>
      <path d="M5 19L19 5" />
      <path d="M11 5h8v8" />
    </>
  ),
  rect: <rect x="3.5" y="5.5" width="17" height="13" rx="2" />,
  ellipse: <circle cx="12" cy="12" r="8.5" />,
  angle: (
    <>
      <path d="M4 19h16" />
      <path d="M4 19L17 6" />
      <path d="M11.5 19a7.5 7.5 0 0 0-2.2-5.3" />
    </>
  ),
  eraser: (
    <>
      <path d="M19 19h-9l-4.6-4.6a1.5 1.5 0 0 1 0-2.12l8.4-8.4a1.5 1.5 0 0 1 2.12 0l5.2 5.2a1.5 1.5 0 0 1 0 2.12L13.5 19" />
      <path d="M8.8 8.8l6.4 6.4" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h9a6.5 6.5 0 0 1 0 13h-2.5" />
    </>
  ),
  trash: (
    <>
      <path d="M3.5 6.5h17" />
      <path d="M8.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h4.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="M18.5 6.5l-.9 13a2 2 0 0 1-2 1.9H8.4a2 2 0 0 1-2-1.9l-.9-13" />
    </>
  ),
  play: <path d="M7.5 4.8v14.4a.6.6 0 0 0 .92.5l11.3-7.2a.6.6 0 0 0 0-1l-11.3-7.2a.6.6 0 0 0-.92.5z" />,
  pause: (
    <>
      <rect x="6.5" y="4.5" width="4" height="15" rx="1.2" />
      <rect x="13.5" y="4.5" width="4" height="15" rx="1.2" />
    </>
  ),
  stepBack: (
    <>
      <path d="M18.5 5.2v13.6a.5.5 0 0 1-.78.42l-9.6-6.8a.5.5 0 0 1 0-.84l9.6-6.8a.5.5 0 0 1 .78.42z" />
      <rect x="4" y="4.5" width="2.6" height="15" rx="1.1" />
    </>
  ),
  stepForward: (
    <>
      <path d="M5.5 5.2v13.6a.5.5 0 0 0 .78.42l9.6-6.8a.5.5 0 0 0 0-.84l-9.6-6.8a.5.5 0 0 0-.78.42z" />
      <rect x="17.4" y="4.5" width="2.6" height="15" rx="1.1" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4.5" />
      <path d="M7.5 9L12 4.5 16.5 9" />
      <path d="M4 16.5v2a2.5 2.5 0 0 0 2.5 2.5h11a2.5 2.5 0 0 0 2.5-2.5v-2" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </>
  ),
  chevronUp: <path d="M6 14.5l6-6 6 6" />,
  chevronLeft: <path d="M14.5 6l-6 6 6 6" />,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  link: (
    <>
      <path d="M10 13.5a4.5 4.5 0 0 0 6.8.5l2.7-2.7a4.5 4.5 0 0 0-6.4-6.4l-1.5 1.5" />
      <path d="M14 10.5a4.5 4.5 0 0 0-6.8-.5l-2.7 2.7a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5" />
    </>
  ),
  film: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M8 4.5v15" />
      <path d="M16 4.5v15" />
      <path d="M2.5 12h19" />
    </>
  ),
  single: <rect x="3.5" y="5.5" width="17" height="13" rx="2" />,
  compare: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M12 5.5v13" />
    </>
  ),
};

const FILLED = new Set<IconName>(["play", "pause", "stepBack", "stepForward", "cursor"]);

interface Props {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 16, className, strokeWidth = 1.75 }: Props) {
  const filled = FILLED.has(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={filled ? undefined : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
