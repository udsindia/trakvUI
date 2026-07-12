import { alpha, type SxProps, type Theme } from "@mui/material/styles";

export const universitiesPagePaperSx: SxProps<Theme> = {
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "#e9eff5",
  borderRadius: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
};

export const universitiesContentSx: SxProps<Theme> = {
  bgcolor: "#fcfdff",
  flex: 1,
  minHeight: 0,
  minWidth: 0,
};

export const sectionCardSx: SxProps<Theme> = {
  border: "1px solid",
  borderColor: "#edf2f7",
  borderRadius: 2,
  boxShadow: "none",
};

export const sectionCardHeaderSx: SxProps<Theme> = {
  borderBottom: "1px solid",
  borderColor: "#edf2f7",
  px: 2.25,
  py: 1.75,
};

export const tagChipSx: SxProps<Theme> = {
  bgcolor: "#f8fbfe",
  border: "1px solid",
  borderColor: "#edf2f7",
  fontSize: 11,
  fontWeight: 600,
};

export function getRequirementStatusSx(status: "met" | "warn" | "miss"): SxProps<Theme> {
  return (theme) => {
    const palette =
      status === "met"
        ? theme.palette.success
        : status === "warn"
          ? theme.palette.warning
          : theme.palette.error;

    return {
      bgcolor: alpha(palette.main, 0.12),
      color: palette.dark,
    };
  };
}

export function getEligibilityChipSx(
  status: "eligible" | "partial" | "not-eligible",
): SxProps<Theme> {
  return (theme) => {
    if (status === "not-eligible") {
      return {
        bgcolor: alpha(theme.palette.error.main, 0.1),
        color: theme.palette.error.dark,
        fontWeight: 700,
        fontSize: 10,
      };
    }

    if (status === "partial") {
      return {
        bgcolor: alpha(theme.palette.warning.main, 0.12),
        color: theme.palette.warning.dark,
        fontWeight: 700,
        fontSize: 10,
      };
    }

    return {
      bgcolor: alpha(theme.palette.success.main, 0.12),
      color: theme.palette.success.dark,
      fontWeight: 700,
      fontSize: 10,
    };
  };
}
