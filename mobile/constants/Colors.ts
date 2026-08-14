export const palette = {
  dark: {
    background: "#000000",
    foreground: "#e7e9ea",
    card: "#16181c",
    muted: "#16181c",
    mutedForeground: "#71767b",
    border: "#2f3336",
    primary: "#1d9bf0",
    primaryForeground: "#ffffff",
    hover: "rgba(231, 233, 234, 0.03)",
  },
  light: {
    background: "#ffffff",
    foreground: "#0f1419",
    card: "#ffffff",
    muted: "#eff3f4",
    mutedForeground: "#536471",
    border: "#eff3f4",
    primary: "#1d9bf0",
    primaryForeground: "#ffffff",
    hover: "rgba(15, 20, 25, 0.03)",
  },
} as const

export type ThemeName = keyof typeof palette
export type ThemeColors = (typeof palette)[ThemeName]

const Colors = {
  light: {
    ...palette.light,
    text: palette.light.foreground,
    tint: palette.light.primary,
    tabIconDefault: palette.light.mutedForeground,
    tabIconSelected: palette.light.primary,
  },
  dark: {
    ...palette.dark,
    text: palette.dark.foreground,
    tint: palette.dark.primary,
    tabIconDefault: palette.dark.mutedForeground,
    tabIconSelected: palette.dark.primary,
  },
}

export default Colors
