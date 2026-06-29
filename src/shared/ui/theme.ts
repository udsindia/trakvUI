import { createTheme } from "@mui/material/styles";

/** Colors for the left navigation panel — lets each theme restyle it fully. */
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

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#007A87",
      dark: "#005F6B",
      light: "#15A6B8",
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
    sidebar: {
      bg: "#ffffff",
      text: "#6B7280",
      mutedText: "#9CA3AF",
      strongText: "#111827",
      activeBg: "linear-gradient(135deg, #007A87, #15A6B8)",
      activeText: "#ffffff",
      activeShadow: "0 3px 10px rgba(0,122,135,.2)",
      hoverBg: "#F0F9FA",
      hoverText: "#007A87",
      brandGradient: "linear-gradient(135deg, #007A87, #15A6B8)",
    },
    success: {
      main: "#10B981",
    },
    error: {
      main: "#EF4444",
    },
    warning: {
      main: "#F59E0B",
    },
    info: {
      main: "#0EA5E9",
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Public Sans", "Segoe UI", sans-serif',
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

