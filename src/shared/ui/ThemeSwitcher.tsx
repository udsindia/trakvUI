import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import PaletteRounded from "@mui/icons-material/PaletteRounded";
import {
  Divider,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import type { AppMode, AppThemeName } from "@/shared/ui/themeConfig";
import { THEME_LABELS } from "@/shared/ui/themeConfig";

const THEME_NAMES = Object.keys(THEME_LABELS) as AppThemeName[];

type ThemeSwitcherProps = {
  value: AppThemeName;
  onChange: (value: AppThemeName) => void;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  darkAvailable: boolean;
};

/**
 * Floating dev/testing control: A/B the brand themes and toggle light/dark live.
 * Choices persist via AppProviders. Remove once a theme is finalized.
 */
export function ThemeSwitcher({
  value,
  onChange,
  mode,
  onModeChange,
  darkAvailable,
}: ThemeSwitcherProps) {
  const isDark = mode === "dark";
  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        p: 1,
        borderRadius: 3,
        zIndex: (theme) => theme.zIndex.tooltip + 10,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Stack spacing={0.75}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ px: 0.5 }}>
            <PaletteRounded fontSize="small" color="action" />
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              Theme
            </Typography>
          </Stack>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={value}
            onChange={(_, next: AppThemeName | null) => {
              if (next) onChange(next);
            }}
          >
            {THEME_NAMES.map((name) => (
              <ToggleButton key={name} value={name} sx={{ textTransform: "none", px: 1.5 }}>
                {THEME_LABELS[name]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Divider flexItem orientation="vertical" />

        <Tooltip
          title={
            !darkAvailable
              ? "This theme has no dark mode"
              : isDark
                ? "Switch to light"
                : "Switch to dark"
          }
        >
          <span>
            <IconButton
              size="small"
              disabled={!darkAvailable}
              onClick={() => onModeChange(isDark ? "light" : "dark")}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
            >
              {isDark ? <LightModeRounded fontSize="small" /> : <DarkModeRounded fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Paper>
  );
}
