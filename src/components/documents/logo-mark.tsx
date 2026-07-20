export function LogoMark({ size = 56, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="64"
        height="64"
        rx="16"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
      <rect x="22" y="24" width="36" height="6" rx="3" fill={color} />
      <polyline
        points="27,34 34,54 40,40 46,54 53,34"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoMarkFilled({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true">
      <rect x="8" y="8" width="64" height="64" rx="16" fill="#16181C" />
      <rect x="22" y="24" width="36" height="6" rx="3" fill="#FFFFFF" />
      <polyline
        points="27,34 34,54 40,40 46,54 53,34"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
