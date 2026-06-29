import { createTheme } from "@mui/material/styles";

/**
 * "UI Max" — dark variant.
 *
 * Per the ui-ux-pro-max rule (dark mode uses lightened tonal variants, not
 * inverted light values), the teal and orange are brightened for legibility on
 * dark surfaces, and contrast is re-checked independently:
 *   • text #E6F0F2 on card #16242B = 13.7:1   • secondary #9FB4BC = 7.4:1
 *   • teal #2AB5C6 = 6.5:1   • orange #FF9E42 = 7.7:1  (all AA+)
 */

const TEAL = { main: "#2AB5C6", light: "#5BD0DE", dark: "#15A6B8" };
const ORANGE = { light: "#FFB870", main: "#FF9E42", dark: "#E87722" };

export const uiMaxDarkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: TEAL.main, light: TEAL.light, dark: TEAL.dark, contrastText: "#06222A" },
    secondary: { main: ORANGE.main, light: ORANGE.light, dark: ORANGE.dark, contrastText: "#1A0E03" },
    background: { default: "#0E1A1F", paper: "#16242B" },
    text: { primary: "#E6F0F2", secondary: "#9FB4BC", disabled: "#6B7E86" },
    divider: "rgba(255,255,255,0.10)",
    success: { main: "#22C55E" },
    warning: { main: "#FBBF24" },
    error: { main: "#F87171" },
    info: { main: TEAL.main },
    // Sidebar stays a deep teal panel; teal active pill + orange hover.
    sidebar: {
      bg: "linear-gradient(180deg,#102E37,#0A2027 60%,#07191F)",
      text: "rgba(255,255,255,0.70)",
      mutedText: "rgba(255,255,255,0.45)",
      strongText: "#ffffff",
      activeBg: "linear-gradient(135deg,#118A99,#00707D)",
      activeText: "#ffffff",
      activeShadow: "0 6px 16px rgba(0,0,0,.45)",
      hoverBg: "rgba(255,255,255,0.06)",
      hoverText: ORANGE.main,
      brandGradient: "linear-gradient(135deg,#2AB5C6,#0E6E7B)",
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Public Sans", "Segoe UI", sans-serif',
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    // Primary CTA — orange gradient (reads well on dark; teal stays the accent).
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: `linear-gradient(135deg, ${ORANGE.light} 0%, ${ORANGE.main} 52%, ${ORANGE.dark} 100%)`,
          color: "#1A0E03",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 20px rgba(0,0,0,0.4)",
          border: `1px solid ${ORANGE.dark}`,
          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          "&:hover": {
            background: "linear-gradient(135deg, #FFC68A 0%, #FF9E42 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 12px 26px rgba(0,0,0,0.5)",
            borderColor: ORANGE.main,
            transform: "translateY(-1px)",
          },
          "&:active": { transform: "translateY(0)" },
        },
      },
    },
  },
});
