import { createTheme } from "@mui/material/styles";

/**
 * "Murali" brand theme.
 *
 * Centered on the steel-teal #267B98 navigation panel from the source CSS, with
 * the panel fading into a deeper teal gradient toward the bottom of the sidebar.
 * Selected via the in-app theme switch; fully swappable at runtime.
 */

const TEAL = {
  base: "#267B98", // primary structural navigation frame base
  light: "#3AA0C0",
  dark: "#18596E",
  deep: "#103D4D", // bottom gradient anchor
};

// Orange CTA accent — buttons stay orange even though the panel is teal.
const ORANGE = {
  light: "#FF9A4D",
  main: "#E87722",
  dark: "#C8610F",
};

export const muraliTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: TEAL.base,
      light: TEAL.light,
      dark: TEAL.dark,
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#F5820D",
    },
    background: {
      default: "#F0F4F8",
      paper: "#ffffff",
    },
    text: {
      primary: "#111827",
      secondary: "#6B7280",
      disabled: "#9CA3AF",
    },
    divider: "#E5E7EB",
    // Steel-teal panel with a gradient fade toward the bottom.
    sidebar: {
      bg: `linear-gradient(180deg, ${TEAL.base} 0%, ${TEAL.base} 62%, ${TEAL.dark} 88%, ${TEAL.deep} 100%)`,
      text: "rgba(255,255,255,0.80)",
      mutedText: "rgba(255,255,255,0.50)",
      strongText: "#ffffff",
      activeBg:
        "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.10))",
      activeText: "#ffffff",
      activeShadow: "0 3px 10px rgba(0,0,0,0.18)",
      hoverBg: "rgba(255,255,255,0.08)",
      hoverText: "#ffffff",
      brandGradient: `linear-gradient(135deg, ${TEAL.light}, ${TEAL.dark})`,
    },
  },
  shape: {
    borderRadius: 10,
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
    // Primary CTA — orange (#E87722) gradient, on the teal-panel theme.
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: `linear-gradient(135deg, ${ORANGE.light} 0%, ${ORANGE.main} 50%, ${ORANGE.dark} 100%)`,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 14px rgba(232,119,34,0.25)",
          textShadow: "0 1px 1px rgba(0,0,0,0.15)",
          border: `1px solid ${ORANGE.dark}`,
          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          "&:hover": {
            background: `linear-gradient(135deg, #FFA862 0%, #F5851F 100%)`,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 18px rgba(245,133,31,0.35)",
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
