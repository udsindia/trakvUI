import type { Theme } from "@mui/material/styles";
import { geminiTheme } from "@/shared/ui/geminiTheme";
import { muraliTheme } from "@/shared/ui/muraliTheme";
import { appTheme } from "@/shared/ui/theme";
import { uiMaxTheme } from "@/shared/ui/uiMaxTheme";
import { uiMaxDarkTheme } from "@/shared/ui/uiMaxDarkTheme";

export type AppThemeName = "default" | "gemini" | "murali" | "uimax";
export type AppMode = "light" | "dark";

// ─────────────────────────────────────────────────────────────────────────────
//  THEME SWITCH
//
//  The active theme is swappable LIVE from the in-app toggle (bottom-right) and
//  the choice is remembered in localStorage. Initial value resolves as:
//      saved choice (localStorage) → VITE_APP_THEME env var → DEFAULT_THEME
//
//  Once you finalize a theme: set DEFAULT_THEME below to the winner and (if you
//  like) remove the <ThemeSwitcher/> from AppProviders.tsx.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_THEME: AppThemeName = "uimax";
const STORAGE_KEY = "trakv.theme";
const MODE_KEY = "trakv.mode";

export const THEMES: Record<AppThemeName, Theme> = {
  default: appTheme,
  gemini: geminiTheme,
  murali: muraliTheme,
  uimax: uiMaxTheme,
};

/**
 * Dark variants. Only themes listed here have a real dark mode; any other theme
 * stays light even when dark mode is on (so we never ship inverted light values).
 */
const DARK_THEMES: Partial<Record<AppThemeName, Theme>> = {
  uimax: uiMaxDarkTheme,
};

/** True when the active theme actually has a dark variant to toggle. */
export function supportsDark(name: AppThemeName): boolean {
  return name in DARK_THEMES;
}

export const THEME_LABELS: Record<AppThemeName, string> = {
  default: "Default",
  gemini: "Gemini",
  murali: "Murali",
  uimax: "UI Max",
};

function isThemeName(value: unknown): value is AppThemeName {
  return (
    value === "default" || value === "gemini" || value === "murali" || value === "uimax"
  );
}

/** Resolves the theme to show on first load. */
export function getInitialThemeName(): AppThemeName {
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isThemeName(saved)) return saved;
  }
  const env = import.meta.env.VITE_APP_THEME;
  if (isThemeName(env)) return env;
  return DEFAULT_THEME;
}

/** Persists the live toggle choice so it survives reloads. */
export function saveThemeName(name: AppThemeName): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, name);
  }
}

/** Initial light/dark mode: saved choice → OS preference → light. */
export function getInitialMode(): AppMode {
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  }
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function saveMode(mode: AppMode): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(MODE_KEY, mode);
  }
}

/** Resolves the active MUI theme for the chosen brand + mode. */
export function resolveTheme(name: AppThemeName, mode: AppMode = "light"): Theme {
  if (mode === "dark" && DARK_THEMES[name]) return DARK_THEMES[name] as Theme;
  return THEMES[name] ?? appTheme;
}
