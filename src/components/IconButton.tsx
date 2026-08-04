import clsx from "clsx";
import { Icon, type IconName } from "./Icon";

type Variant = "ghost" | "active" | "accent";
type Size = "sm" | "md" | "lg";

const BOX: Record<Size, string> = {
  sm: "h-7 w-7 rounded-md",
  md: "h-8 w-8 rounded-lg",
  lg: "h-10 w-10 rounded-full",
};

const GLYPH: Record<Size, number> = { sm: 14, md: 16, lg: 18 };

const VARIANT: Record<Variant, string> = {
  ghost: "text-muted hover:text-fg hover:bg-surface-3",
  active: "bg-accent-soft text-accent-text ring-1 ring-inset ring-accent-ring",
  accent: "bg-accent text-accent-fg hover:bg-accent-hover shadow-sm",
};

interface Props {
  icon: IconName;
  label: string;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  className?: string;
  disabled?: boolean;
}

export function IconButton({
  icon,
  label,
  onClick,
  variant = "ghost",
  size = "md",
  className,
  disabled,
}: Props) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center transition-colors duration-100 disabled:pointer-events-none disabled:opacity-40",
        BOX[size],
        VARIANT[variant],
        className,
      )}
    >
      <Icon name={icon} size={GLYPH[size]} />
    </button>
  );
}
