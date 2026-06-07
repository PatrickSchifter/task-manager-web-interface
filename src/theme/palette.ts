import { PaletteOptions } from "@mui/material";

// Cor extra usada como acento (ex.: cards de big numbers do dashboard).
// Registrada no tema para evitar hex soltos pelos componentes.
declare module "@mui/material/styles" {
  interface Palette {
    indigo: Palette["primary"];
  }
  interface PaletteOptions {
    indigo?: PaletteOptions["primary"];
  }
}

export const palette: PaletteOptions = {
  mode: "dark",

  primary: {
    main: "#3882F6",
    light: "#60A5FA",
    dark: "#2563EB",
    contrastText: "#FFFFFF",
  },

  secondary: {
    main: "#8B5CF6",
    light: "#A78BFA",
    dark: "#7C3AED",
    contrastText: "#FFFFFF",
  },

  indigo: {
    main: "#6366F1",
    contrastText: "#FFFFFF",
  },

  success: {
    main: "#22C55E",
  },

  warning: {
    main: "#F59E0B",
  },

  error: {
    main: "#EF4444",
  },

  info: {
    main: "#3882F6",
  },

  background: {
    default: "#050816",
    paper: "#111827",
  },

  text: {
    primary: "#FFFFFF",
    secondary: "#9CA3AF",
    disabled: "#6B7280",
  },

  divider: "rgba(255,255,255,0.08)",
};
