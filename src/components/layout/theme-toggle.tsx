"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
