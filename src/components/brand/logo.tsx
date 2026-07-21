import { cn } from "@/lib/utils";

/**
 * Teeway monogram — the TW seal (rounded square + T-bar + zigzag W).
 * Uses `currentColor` throughout so it inverts cleanly on dark vs light
 * surfaces just by setting text color. See teeway-guia-de-marca.html.
 */
export function Monogram({
  size = 28,
  strokeWidth = 3.5,
  className,
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <rect
        x="8"
        y="8"
        width="64"
        height="64"
        rx="16"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <rect x="22" y="24" width="36" height="6" rx="3" fill="currentColor" />
      <polyline
        points="27,34 34,54 40,40 46,54 53,34"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Wordmark lockup: lowercase "teeway" + spaced-out "MOBILITY" descriptor. */
export function Wordmark({
  className,
  descriptor = true,
}: {
  className?: string;
  descriptor?: boolean;
}) {
  return (
    <span className={cn("flex items-baseline gap-1.5", className)}>
      <span className="text-[17px] font-semibold leading-none tracking-tight">
        teeway
      </span>
      {descriptor && (
        <span className="text-[8px] font-medium leading-none tracking-[0.35em] opacity-55">
          MOBILITY
        </span>
      )}
    </span>
  );
}

/** Full horizontal lockup — monogram + wordmark. Inherits `currentColor`. */
export function Logo({
  className,
  monogramSize = 26,
  descriptor = true,
}: {
  className?: string;
  monogramSize?: number;
  descriptor?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Monogram size={monogramSize} />
      <Wordmark descriptor={descriptor} />
    </span>
  );
}
