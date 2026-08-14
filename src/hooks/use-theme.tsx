"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "cl_theme_v2";

let current: Theme | null = null;
const listeners = new Set<() => void>();

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function readTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

function getSnapshot(): Theme {
  if (current == null) {
    current = readTheme();
    applyTheme(current);
  }
  return current;
}

function getServerSnapshot(): Theme {
  return "dark";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function writeTheme(next: Theme) {
  current = next;
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
  listeners.forEach((listener) => listener());
}

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: writeTheme,
      toggle: () => writeTheme(theme === "dark" ? "light" : "dark"),
    }),
    [theme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
