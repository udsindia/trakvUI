import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { SERIF } from "@/shared/ui/vutrakTheme";

/**
 * Split-screen authentication layout.
 *
 * A deep steel-teal brand panel (serif wordmark, value proposition, a faint
 * "meridian" motif) sits beside the form column. The brand panel is hidden
 * below `md`, where a compact inline wordmark stands in above the form so the
 * page never loses its identity.
 *
 * This is a pure presentation shell — it renders whatever form `children` are
 * passed and knows nothing about auth state.
 */

type AuthShellAccent = "brand" | "admin";

type AuthShellProps = {
  /** Small tracked label above the wordmark, e.g. "Education CRM". */
  eyebrow: string;
  wordmark: string;
  /** Marketing headline on the brand panel. */
  headline: string;
  /** Supporting sentence under the headline. */
  subhead: string;
  /** Value points listed on the brand panel. */
  points?: string[];
  /**
   * "brand" → orange glyph (tenant app). "admin" → teal glyph + a
   * PLATFORM ADMIN badge, so the super-admin portal reads as a different place.
   */
  accent?: AuthShellAccent;
  /** Footer note at the base of the brand panel. */
  footnote?: string;
  children: ReactNode;
};

const GLYPH_GRADIENTS: Record<AuthShellAccent, string> = {
  brand: "linear-gradient(135deg, #FF9E42, #D96F0E)",
  admin: "linear-gradient(135deg, #388CA9, #226279)",
};

function Glyph({ accent, size = 34 }: { accent: AuthShellAccent; size?: number }) {
  return (
    <Box
      sx={{
        alignItems: "center",
        background: GLYPH_GRADIENTS[accent],
        borderRadius: `${Math.round(size * 0.28)}px`,
        color: "#fff",
        display: "flex",
        flexShrink: 0,
        fontFamily: SERIF,
        fontSize: size * 0.5,
        fontWeight: 600,
        height: size,
        justifyContent: "center",
        width: size,
      }}
    >
      V
    </Box>
  );
}

/**
 * Centered brand lockup for auth pages that don't fit the split layout —
 * e.g. the wide registration form. Keeps the same glyph + serif wordmark
 * identity as the split panel.
 */
export function AuthBrandLockup({
  accent = "brand",
  wordmark,
  eyebrow,
}: {
  accent?: AuthShellAccent;
  wordmark: string;
  eyebrow: string;
}) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Glyph accent={accent} size={32} />
      <Box sx={{ textAlign: "left" }}>
        <Typography sx={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, letterSpacing: "-0.2px", lineHeight: 1.1 }}>
          {wordmark}
        </Typography>
        <Typography
          sx={{
            color: "text.disabled",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.3,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </Typography>
      </Box>
    </Stack>
  );
}

export function AuthShell({
  eyebrow,
  wordmark,
  headline,
  subhead,
  points = [],
  accent = "brand",
  footnote,
  children,
}: AuthShellProps) {
  return (
    <Box
      sx={{
        bgcolor: "background.default",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.05fr) minmax(0, 1fr)" },
        minHeight: "100vh",
      }}
    >
      {/* ── Brand panel ─────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: (theme) => theme.palette.sidebar.bg,
          color: "#fff",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          p: { md: 5, lg: 7 },
          position: "relative",
        }}
      >
        {/* Faint meridian motif — a nod to the study-abroad subject, not a
            gradient hero. Sits behind the content, clipped by the panel. */}
        <Box
          aria-hidden
          sx={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "50%",
            bottom: -160,
            height: 520,
            position: "absolute",
            right: -140,
            width: 520,
            "&::before, &::after": {
              bgcolor: "rgba(255,255,255,0.06)",
              content: '""',
              position: "absolute",
            },
            "&::before": { inset: "0 50% 0 50%", width: "1px" },
            "&::after": { inset: "50% 0 50% 0", height: "1px" },
          }}
        />
        <Box
          aria-hidden
          sx={{
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "50%",
            bottom: -40,
            height: 300,
            position: "absolute",
            right: 20,
            width: 300,
          }}
        />

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", position: "relative" }}>
          <Glyph accent={accent} />
          <Box>
            <Typography
              sx={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, letterSpacing: "-0.3px", lineHeight: 1.1 }}
            >
              {wordmark}
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: 1.3,
                textTransform: "uppercase",
              }}
            >
              {eyebrow}
            </Typography>
          </Box>
          {accent === "admin" ? (
            <Box
              sx={{
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: "6px",
                color: "rgba(255,255,255,0.75)",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 1,
                ml: 1,
                px: 1,
                py: 0.5,
                textTransform: "uppercase",
              }}
            >
              Platform Admin
            </Box>
          ) : null}
        </Stack>

        <Box sx={{ position: "relative", maxWidth: 420 }}>
          <Typography
            sx={{
              fontFamily: SERIF,
              fontSize: { md: 30, lg: 36 },
              fontWeight: 600,
              letterSpacing: "-0.8px",
              lineHeight: 1.15,
              textWrap: "balance",
            }}
          >
            {headline}
          </Typography>
          <Typography
            sx={{ color: "rgba(255,255,255,0.62)", fontSize: 13.5, lineHeight: 1.6, mt: 2 }}
          >
            {subhead}
          </Typography>

          {points.length > 0 ? (
            <Stack spacing={1.25} sx={{ mt: 3.5 }}>
              {points.map((point) => (
                <Stack direction="row" key={point} spacing={1.25} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      bgcolor: accent === "admin" ? "#63B8CF" : "#FF9E42",
                      borderRadius: "50%",
                      flexShrink: 0,
                      height: 5,
                      width: 5,
                    }}
                  />
                  <Typography sx={{ color: "rgba(255,255,255,0.82)", fontSize: 12.5, fontWeight: 500 }}>
                    {point}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          ) : null}
        </Box>

        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 11, position: "relative" }}>
          {footnote ?? `© ${new Date().getFullYear()} VUTrak`}
        </Typography>
      </Box>

      {/* ── Form column ─────────────────────────────────────────────── */}
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          px: { xs: 3, sm: 5 },
          py: { xs: 5, md: 4 },
        }}
      >
        <Box sx={{ maxWidth: 380, width: "100%" }}>
          {/* Compact wordmark for small screens, where the brand panel is hidden. */}
          <Stack
            direction="row"
            spacing={1.25}
            sx={{ alignItems: "center", display: { xs: "flex", md: "none" }, mb: 3.5 }}
          >
            <Glyph accent={accent} size={30} />
            <Typography sx={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, letterSpacing: "-0.2px" }}>
              {wordmark}
            </Typography>
          </Stack>

          {children}
        </Box>
      </Box>
    </Box>
  );
}
