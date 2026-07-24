import { createTheme } from "@mui/material/styles";

/**
 * VUTrak application theme — "Meridian" design language in VUTrak brand colours.
 *
 * Brand identity is unchanged: a steel-teal canvas, deep-teal navigation panel and
 * the orange-gradient CTA system. What the Meridian pass adds is the *design
 * language* around it:
 *
 *  - an editorial serif (Georgia) reserved for display text and data figures,
 *    set against a clean system-ui body face
 *  - hairline card structure instead of heavy drop shadows
 *  - denser vertical rhythm, tuned for 13–14" laptops
 *  - tabular numerals wherever figures line up in columns
 *
 * Fonts are deliberately system-resident (no webfont request), so nothing can
 * silently fall back to a different face at runtime.
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
  /**
   * Hairline for rules and control borders *inside* the dark panel. The global
   * `divider` token is tuned for the light canvas and reads as a harsh bright
   * line against the deep teal, so dark-surface chrome must use this instead.
   */
  line: string;
  /** Resting surface for the user chip / inset blocks in the panel. */
  inset: string;
}

declare module "@mui/material/styles" {
  interface Palette {
    sidebar: SidebarPalette;
  }
  interface PaletteOptions {
    sidebar?: SidebarPalette;
  }
  interface TypographyVariants {
    /** Large editorial figure — KPI values, totals, scores. */
    figure: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    figure?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    figure: true;
  }
}

// ── Type ─────────────────────────────────────────────────────────────────────
/** Editorial display face. System-resident on Windows/macOS/iOS. */
export const SERIF = 'Georgia, "Iowan Old Style", "Times New Roman", serif';
/** UI / body face. */
export const SANS =
  'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
/** Reference identifiers, course IDs, portal references. */
export const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

// ── Palette tokens ───────────────────────────────────────────────────────────
const STEEL_TEAL = {
  canvas: "#F0F6F8", // steel-teal-50  — layout canvas background
  surfaceAlt: "#F7FAFC", // subtle raised/zebra surface
  surfaceMuted: "#E7F0F4", // input wells, inactive segments
  divider: "#E1EDF1", // structural hairlines
  dividerStrong: "#CBDFE6", // control borders
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
  faint: "#94A3B8", // labels, captions, disabled
};

/** Semantic status colours — deliberately separate from the orange brand accent. */
const STATUS = {
  success: "#0E9F6E",
  warning: "#C4830D",
  error: "#DC4B4B",
  info: "#0F5AD4",
};

const GRADIENT = `linear-gradient(135deg, ${ORANGE.light} 0%, ${ORANGE.main} 52%, ${ORANGE.dark} 100%)`;

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
    success: { main: STATUS.success },
    warning: { main: STATUS.warning },
    error: { main: STATUS.error },
    info: { main: STATUS.info },
    background: {
      default: STEEL_TEAL.canvas,
      paper: "#ffffff",
    },
    text: {
      primary: TEXT.dark,
      secondary: TEXT.muted,
      disabled: TEXT.faint,
    },
    divider: STEEL_TEAL.divider,
    // Deep steel-teal navigation panel with light text + orange active state.
    sidebar: {
      bg: STEEL_TEAL[900], // #11333F
      text: "rgba(255,255,255,0.74)",
      mutedText: "rgba(255,255,255,0.42)",
      strongText: "#ffffff",
      activeBg: GRADIENT,
      activeText: "#ffffff",
      activeShadow: "0 4px 14px rgba(243,129,24,0.30)",
      hoverBg: "rgba(255,255,255,0.08)",
      hoverText: ORANGE.light,
      brandGradient: `linear-gradient(135deg, ${ORANGE.light}, ${ORANGE.dark})`,
      line: "rgba(255,255,255,0.10)",
      inset: "rgba(255,255,255,0.06)",
    },
  },
  shape: {
    // Meridian is more architectural than the previous 16px pill-ish radius.
    borderRadius: 12,
  },
  typography: {
    fontFamily: SANS,
    // Display sizes carry the serif; section-level headings stay sans so that
    // card titles and form labels remain quiet and utilitarian.
    h1: { fontFamily: SERIF, fontWeight: 600, letterSpacing: "-0.5px" },
    h2: { fontFamily: SERIF, fontWeight: 600, letterSpacing: "-0.45px" },
    h3: { fontFamily: SERIF, fontWeight: 600, letterSpacing: "-0.4px" },
    h4: { fontFamily: SERIF, fontWeight: 600, letterSpacing: "-0.35px" },
    h5: { fontFamily: SERIF, fontWeight: 600, letterSpacing: "-0.3px" },
    h6: { fontWeight: 700, letterSpacing: "-0.1px" },
    subtitle1: { fontWeight: 700, letterSpacing: "-0.1px" },
    subtitle2: { fontWeight: 700 },
    button: { fontWeight: 700, letterSpacing: 0 },
    /** Large editorial figure — use for KPI values and headline numbers. */
    figure: {
      fontFamily: SERIF,
      fontWeight: 600,
      fontSize: 30,
      lineHeight: 1.05,
      letterSpacing: "-0.8px",
      fontVariantNumeric: "tabular-nums",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: STEEL_TEAL.canvas,
        },
        // Figures line up in columns all over this product.
        "th, td": {
          fontVariantNumeric: "tabular-nums",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        // Hairline structure rather than stacked shadows.
        outlined: {
          borderColor: STEEL_TEAL.divider,
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${STEEL_TEAL.divider}`,
          borderRadius: 12,
          boxShadow: "0 1px 2px rgba(16,40,52,.05)",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 18,
          "&:last-child": { paddingBottom: 18 },
        },
      },
    },
    // Primary CTA — glossy orange gradient (.vutrak-btn-primary)
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 9,
          textTransform: "none",
          paddingTop: 8,
          paddingBottom: 8,
        },
        containedPrimary: {
          background: GRADIENT,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 13px rgba(243,129,24,0.28)",
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
          // Without this the gradient keeps painting a disabled button bright
          // orange, so it reads as clickable while its label greys out.
          "&.Mui-disabled": {
            background: STEEL_TEAL.surfaceMuted,
            borderColor: STEEL_TEAL.dividerStrong,
            boxShadow: "none",
            color: TEXT.faint,
            transform: "none",
          },
        },
        outlined: {
          borderColor: STEEL_TEAL.dividerStrong,
          color: TEXT.dark,
          "&:hover": {
            borderColor: STEEL_TEAL[600],
            color: STEEL_TEAL[600],
            background: "transparent",
          },
        },
      },
    },
    // Denser, hairline-ruled tables.
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: STEEL_TEAL.divider,
          padding: "10px 14px",
        },
        head: {
          backgroundColor: STEEL_TEAL.surfaceAlt,
          color: TEXT.faint,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.9px",
          textTransform: "uppercase",
          lineHeight: 1.6,
          whiteSpace: "nowrap",
          borderBottomColor: STEEL_TEAL.dividerStrong,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": { borderBottom: 0 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 700,
          fontSize: 10.5,
          height: 22,
        },
        label: { paddingLeft: 9, paddingRight: 9 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: STEEL_TEAL.dividerStrong,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: STEEL_TEAL[900],
          fontSize: 11,
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: STEEL_TEAL.divider },
      },
    },
  },
});
