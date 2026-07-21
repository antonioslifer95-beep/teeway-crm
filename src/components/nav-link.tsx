"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Nav link for the dark inverted top bar — the bar is a dark surface in both
 * light and dark themes, so colors are keyed to white regardless of theme.
 */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "relative py-1 text-sm transition-colors",
        isActive ? "text-white" : "text-white/55 hover:text-white",
      )}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-[17px] left-0 right-0 h-px bg-white" />
      )}
    </Link>
  );
}
