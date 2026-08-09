import type { SxProps, Theme } from "@mui/material";

/**
 * Single source of truth for list-table sizing/density across the app.
 *
 * Apply to any MUI `<Table sx={dataTableSx}>` (and drop `size="small"`) so every
 * list — Leads, Applications, Users, Roles, SA tables, Universities — shares the
 * same tinted sticky-header ground and the same 12.5px / 8px-padding body cells.
 * The shared `DataTable` component also builds on this.
 */
export const dataTableSx: SxProps<Theme> = {
  "& .MuiTableHead-root .MuiTableCell-root": {
    bgcolor: "#F7FAFC",
    lineHeight: 1.3,
    py: 0.5,
  },
  "& .MuiTableBody-root .MuiTableCell-root": {
    fontSize: 12.5,
    py: 1,
  },
};

/** The bordered card that wraps a list table. */
export const dataTablePaperSx: SxProps<Theme> = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: "12px",
  overflow: "hidden",
};

/** Unified pagination control styling (used by DataTable's footer and any standalone footer). */
export const dataTablePaginationSx: SxProps<Theme> = {
  "& .MuiPaginationItem-root": {
    borderRadius: "9px",
    fontSize: 12,
    height: 28,
    minWidth: 28,
  },
  "& .Mui-selected": {
    bgcolor: "#2f87b7 !important",
    color: "common.white",
  },
};
