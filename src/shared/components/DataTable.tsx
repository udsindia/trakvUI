import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";
import { dataTablePaginationSx, dataTableSx } from "@/shared/ui/tableStyles";
import {
  Box,
  Checkbox,
  Divider,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

export type DataTableColumn<T> = {
  /** Stable key for the column. */
  id: string;
  header: ReactNode;
  align?: "left" | "center" | "right";
  /** Minimum column width in px (keeps columns from collapsing before the table scrolls). */
  minWidth?: number;
  cellSx?: SxProps<Theme>;
  render: (row: T) => ReactNode;
};

/** Optional leading checkbox column + row selection wiring. */
export type DataTableSelection<T> = {
  isSelected: (row: T) => boolean;
  onToggleRow: (row: T) => void;
  allSelected: boolean;
  indeterminate: boolean;
  onToggleAll: (checked: boolean) => void;
  disabled?: boolean;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  page: number;
  pageCount: number;
  paginationLabel: string;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
  /**
   * Width the table is laid out at. Below the container's width the table
   * horizontally scrolls rather than reflowing (see notes on responsiveness).
   */
  minWidth?: number;
  selection?: DataTableSelection<T>;
  /** Rendered inside the Paper, above the table (e.g. a bulk-selection action strip). */
  toolbar?: ReactNode;
  rowSx?: (row: T) => SxProps<Theme>;
  /**
   * Makes each row clickable (e.g. to open a detail page). Clicks on interactive
   * controls inside the row — buttons, links, inputs/checkboxes — are ignored so
   * per-row actions and selection still work.
   */
  onRowClick?: (row: T) => void;
};

const DEFAULT_MIN_WIDTH = 900;

/**
 * Shared, column-config-driven table used by the Leads and Applications lists
 * (and available to any future list). Owns the single source of truth for the
 * list "chrome": the bordered Paper shell, the scrollable sticky-header table,
 * the unified cell typography/density, the empty state, and the pagination
 * footer — so the modules can't drift apart on sizing again.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  page,
  pageCount,
  paginationLabel,
  onPageChange,
  emptyMessage = "No records found.",
  minWidth = DEFAULT_MIN_WIDTH,
  selection,
  toolbar,
  rowSx,
  onRowClick,
}: DataTableProps<T>) {
  const colSpan = columns.length + (selection ? 1 : 0);

  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "12px",
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minHeight: 0,
          overflow: "auto",
        }}
      >
        {toolbar}

        <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <Table stickyHeader sx={{ minWidth, ...dataTableSx }}>
            <TableHead>
              <TableRow>
                {selection ? (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selection.allSelected}
                      disabled={selection.disabled || rows.length === 0}
                      indeterminate={selection.indeterminate}
                      size="small"
                      sx={{
                        color: "#CBDFE6",
                        "&.Mui-checked": { color: "primary.main" },
                        "&.MuiCheckbox-indeterminate": { color: "primary.main" },
                      }}
                      onChange={(event) => selection.onToggleAll(event.target.checked)}
                    />
                  </TableCell>
                ) : null}
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align}>
                    {column.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((row) => (
                <TableRow
                  hover
                  key={getRowKey(row)}
                  selected={selection?.isSelected(row) ?? false}
                  sx={{ ...(onRowClick ? { cursor: "pointer" } : null), ...(rowSx?.(row) as object) }}
                  onClick={
                    onRowClick
                      ? (event) => {
                          // Let per-row controls (buttons, links, checkboxes) act on their own.
                          if ((event.target as HTMLElement).closest('button, a, input, [role="button"]')) {
                            return;
                          }
                          onRowClick(row);
                        }
                      : undefined
                  }
                >
                  {selection ? (
                    <TableCell padding="checkbox" sx={{ minWidth: 30, maxWidth: 40 }}>
                      <Checkbox
                        checked={selection.isSelected(row)}
                        size="small"
                        sx={{
                          color: "#CBDFE6",
                          "&.Mui-checked": { color: "primary.main" },
                        }}
                        onChange={() => selection.onToggleRow(row)}
                      />
                    </TableCell>
                  ) : null}
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align}
                      sx={{ minWidth: column.minWidth, ...(column.cellSx as object) }}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} sx={{ py: 6, textAlign: "center" }}>
                    <Typography color="text.secondary" variant="body2">
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ alignItems: { md: "center" }, justifyContent: "space-between", px: 2, py: 1 }}
        >
          <Typography color="text.secondary" sx={{ fontSize: 12 }} variant="body2">
            {paginationLabel}
          </Typography>

          <Box sx={{ alignSelf: { xs: "flex-start", md: "center" } }}>
            <Pagination
              count={pageCount}
              page={Math.max(1, Math.min(page, pageCount || 1))}
              shape="rounded"
              sx={dataTablePaginationSx}
              onChange={onPageChange ? (_, value) => onPageChange(value) : undefined}
            />
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
