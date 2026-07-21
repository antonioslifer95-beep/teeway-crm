"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Until mounted, server and first client render must be identical — the
  // resolved theme is only known on the client, so gate BOTH the icon and the
  // aria-label behind `mounted`. Otherwise the label mismatches on hydration
  // and React abandons the subtree, freezing the toggle. See next-themes docs.
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Alternar tema"
        className={cn(className)}
      >
        <MoonIcon />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(className)}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
