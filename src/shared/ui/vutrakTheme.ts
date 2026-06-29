import { createTheme } from "@mui/material/styles";

/**
 * VUTrak application theme.
 *
 * A steel-teal canvas with an orange-gradient CTA system and a deep-teal
 * navigation panel. Derived from the VUTrak brand CSS.
 */

/** Colors for the left navigation panel — consumed by Sidebar.tsx. */
export interface SidebarPalette {
  bg: string;
  text: string;
  mutedText: string;
  strongText: string;
  activeBg: string;
  activeText: string;
  activeShadow: string;
  hoverBg: string;
  hoverText: string;
  brandGradient: string;
}

declare module "@mui/material/styles" {
  interface Palette {
    sidebar: SidebarPalette;
  }
  interface PaletteOptions {
    sidebar?: SidebarPalette;
  }
}

// ── Palette tokens ───────────────────────────────────────────────────────────
const STEEL_TEAL = {
  canvas: "#F0F6F8", // steel-teal-50  — layout canvas background
  divider: "#E1EDF1", // steel-teal-100 — structural dividers
  500: "#388CA9",
  600: "#2B7B97", // primary structural navigation frame base
  700: "#226279",
  900: "#11333F",
};

const ORANGE = {
  light: "#FF9E42", // gradient start
  main: "#F38118", // gradient mid — primary CTA
  dark: "#D96F0E", // gradient end
};

const TEXT = {
  dark: "#1E293B", // high-contrast headers & row text
  muted: "#64748B", // secondary subtext
};

export const vutrakTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: ORANGE.main,
      light: ORANGE.light,
      dark: ORANGE.dark,
      contrastText: "#ffffff",
    },
    secondary: {
      main: STEEL_TEAL[600],
      light: STEEL_TEAL[500],
      dark: STEEL_TEAL[700],
    },
    background: {
      default: STEEL_TEAL.canvas,
      paper: "#ffffff",
    },
    text: {
      primary: TEXT.dark,
      secondary: TEXT.muted,
    },
    divider: STEEL_TEAL.divider,
    // Deep steel-teal navigation panel with light text + orange active state.
    sidebar: {
      bg: STEEL_TEAL[900], // #11333F
      text: "rgba(255,255,255,0.72)",
      mutedText: "rgba(255,255,255,0.45)",
      strongText: "#ffffff",
      activeBg: `linear-gradient(135deg, ${ORANGE.light} 0%, ${ORANGE.main} 50%, ${ORANGE.dark} 100%)`,
      activeText: "#ffffff",
      activeShadow: "0 4px 14px rgba(243,129,24,0.30)",
      hoverBg: "rgba(255,255,255,0.08)",
      hoverText: ORANGE.light,
      brandGradient: `linear-gradient(135deg, ${ORANGE.light}, ${ORANGE.dark})`,
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Public Sans", "Segoe UI", sans-serif',
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    // Primary CTA — glossy orange gradient (.vutrak-btn-primary)
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: `linear-gradient(135deg, ${ORANGE.light} 0%, ${ORANGE.main} 50%, ${ORANGE.dark} 100%)`,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 14px rgba(243,129,24,0.25)",
          textShadow: "0 1px 1px rgba(0,0,0,0.15)",
          border: `1px solid ${ORANGE.dark}`,
          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          "&:hover": {
            background: "linear-gradient(135deg, #FFAE59 0%, #FF952B 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 18px rgba(255,149,43,0.35)",
            borderColor: ORANGE.main,
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(1px)",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
          },
        },
      },
    },
  },
});
