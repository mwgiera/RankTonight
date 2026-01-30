import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#FFFFFF",
    textSecondary: "#8A92A3",
    buttonText: "#FFFFFF",
    tabIconDefault: "#8A92A3",
    tabIconSelected: "#FF6B2C",
    link: "#FF6B2C",
    primary: "#FF6B2C",
    success: "#00C853",
    warning: "#FFC107",
    danger: "#F44336",
    backgroundRoot: "#0A0E14",
    backgroundDefault: "#1A1F2E",
    backgroundSecondary: "#252B3D",
    backgroundTertiary: "#2A3142",
    border: "#2A3142",
    textTertiary: "#5A5F6E",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#8A92A3",
    buttonText: "#FFFFFF",
    tabIconDefault: "#8A92A3",
    tabIconSelected: "#FF6B2C",
    link: "#FF6B2C",
    primary: "#FF6B2C",
    success: "#00C853",
    warning: "#FFC107",
    danger: "#F44336",
    backgroundRoot: "#0A0E14",
    backgroundDefault: "#1A1F2E",
    backgroundSecondary: "#252B3D",
    backgroundTertiary: "#2A3142",
    border: "#2A3142",
    textTertiary: "#5A5F6E",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  hero: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "700" as const,
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
