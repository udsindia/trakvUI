import { createTheme } from "@mui/material/styles";

/**
 * "UI Max" theme — the finalized VUTrak brand system (ui-ux-pro-max tuned).
 *
 * Primary teal #007A87 (text-safe, AA), orange as the CTA + hover accent, and a
 * deep-teal sidebar with a TEAL active pill + ORANGE hover. Contrast-checked:
 *   • #007A87 on white = 5.08:1 (AA text)   • #15A6B8 = accent/graphics only
 *   • orange hover #FF9E42 on the dark sidebar = 6.5:1
 */

const TEAL = { main: "#007A87", dark: "#005F6B", bright: "#15A6B8", deep: "#0E2D38" };
const ORANGE = { light: "#FF9E42", main: "#E87722", dark: "#D96F0E" };

export const uiMaxTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: TEAL.main, dark: TEAL.dark, light: TEAL.bright, contrastText: "#ffffff" },
    secondary: { main: ORANGE.main, dark: ORANGE.dark, light: ORANGE.light, contrastText: "#ffffff" },
    background: { default: "#EEF4F7", paper: "#ffffff" },
    text: { primary: "#0E2731", secondary: "#566A72", disabled: "#8597A0" },
    divider: "#E4EDF0",
    success: { main: "#0E9F6E" },
    warning: { main: "#F59E0B" },
    error: { main: "#E5484D" },
    info: { main: TEAL.bright },
    // Deep-teal navigation panel: teal active pill, orange hover.
    sidebar: {
      bg: "linear-gradient(180deg,#143C4A 0%,#0E2D38 60%,#0A2530 100%)",
      text: "rgba(255,255,255,0.72)",
      mutedText: "rgba(255,255,255,0.50)",
      strongText: "#ffffff",
      activeBg: "linear-gradient(135deg,#0E8D9C,#00707D)",
      activeText: "#ffffff",
      activeShadow: "0 6px 16px rgba(0,122,135,.34)",
      hoverBg: "rgba(255,255,255,0.06)",
      hoverText: ORANGE.light,
      brandGradient: "linear-gradient(135deg,#15A6B8,#005F6B)",
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
    // Primary CTA — orange gradient (teal stays the accent/active color elsewhere).
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: `linear-gradient(135deg, ${ORANGE.light} 0%, ${ORANGE.main} 52%, ${ORANGE.dark} 100%)`,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 20px rgba(232,119,34,0.26)",
          textShadow: "0 1px 1px rgba(0,0,0,0.14)",
          border: `1px solid ${ORANGE.dark}`,
          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          "&:hover": {
            background: "linear-gradient(135deg, #FFA862 0%, #F5851F 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.45), 0 12px 26px rgba(232,119,34,0.4)",
            borderColor: ORANGE.main,
            transform: "translateY(-1px)",
          },
          "&:active": { transform: "translateY(0)" },
        },
      },
    },
  },
});
