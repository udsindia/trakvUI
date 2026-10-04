import { useState } from "react";
import { Chip, IconButton, Menu, MenuItem, Stack, Switch, Tooltip, Typography } from "@mui/material";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import LockRounded from "@mui/icons-material/LockRounded";
import LockOpenRounded from "@mui/icons-material/LockOpenRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import { DataTable, type DataTableColumn } from "@/shared/components/DataTable";
import type { EmployeeDeviceRow } from "@/modules/employees/employees.types";

type EmployeeTableContainerProps = {
  rows: EmployeeDeviceRow[];
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions: number[];
  paginationLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onToggleLeadEnabled: (employee: EmployeeDeviceRow) => void;
  onToggleCallRecordingSync: (employee: EmployeeDeviceRow) => void;
  onEdit: (employee: EmployeeDeviceRow) => void;
};

/** Plain text cell with an em-dash fallback, matching the other list tables. */
function TextCell({ value }: { value?: string }) {
  return (
    <Typography noWrap sx={{ fontSize: 12.5 }} variant="body2">
      {value || "—"}
    </Typography>
  );
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Sync is considered stale (worth a warning) once it's been over 48h since the last recording. */
function isSyncStale(lastSyncAt: string) {
  if (!lastSyncAt) return true;
  const last = new Date(lastSyncAt).getTime();
  if (Number.isNaN(last)) return true;
  return Date.now() - last > 48 * 60 * 60 * 1000;
}

function RowActionMenu({ onEdit }: { onEdit: () => void }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton size="small" onClick={(event) => setAnchorEl(event.currentTarget)}>
        <MoreVertRounded fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onEdit();
          }}
        >
          Edit
        </MenuItem>
      </Menu>
    </>
  );
}

export function EmployeeTableContainer({
  rows,
  page,
  pageCount,
  pageSize,
  pageSizeOptions,
  paginationLabel,
  onPageChange,
  onPageSizeChange,
  onToggleLeadEnabled,
  onToggleCallRecordingSync,
  onEdit,
}: EmployeeTableContainerProps) {
  const columns: DataTableColumn<EmployeeDeviceRow>[] = [
    {
      id: "employee",
      header: "Employee",
      minWidth: 220,
      render: (row) => (
        <Stack spacing={0.125}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} variant="body2">
            {row.name}
          </Typography>
          <Typography color="text.disabled" sx={{ fontSize: 10.5 }} variant="caption">
            {row.phone || row.email}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "employeeCode",
      header: "Employee Code",
      minWidth: 120,
      render: (row) => <TextCell value={row.employeeCode} />,
    },
    {
      id: "tags",
      header: "Tags",
      minWidth: 140,
      render: (row) =>
        row.tags.length ? (
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {row.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" sx={{ bgcolor: "#EEF2F6", color: "text.secondary" }} />
            ))}
          </Stack>
        ) : (
          <Stack
            alignItems="center"
            direction="row"
            spacing={0.25}
            sx={{ color: "primary.main", cursor: "pointer", fontSize: 11.5 }}
            onClick={() => onEdit(rows.find((r) => r.userId === row.userId)!)}
          >
            <AddRounded sx={{ fontSize: 14 }} />
            <Typography sx={{ fontSize: 11.5, fontWeight: 600 }} variant="caption">
              Add Tag
            </Typography>
          </Stack>
        ),
    },
    { id: "modelName", header: "Model Name", minWidth: 140, render: (row) => <TextCell value={row.modelName} /> },
    { id: "appVersion", header: "App Version", minWidth: 100, render: (row) => <TextCell value={row.appVersion} /> },
    {
      id: "registeredAt",
      header: "Registered Date",
      minWidth: 150,
      render: (row) => <TextCell value={formatDateTime(row.registeredAt)} />,
    },
    {
      id: "lastCallAt",
      header: "Last Call Time",
      minWidth: 150,
      render: (row) => <TextCell value={formatDateTime(row.lastCallAt)} />,
    },
    {
      id: "lastSyncAt",
      header: "Last Sync Time",
      minWidth: 150,
      render: (row) => <TextCell value={formatDateTime(row.lastSyncAt)} />,
    },
    {
      id: "leadEnabled",
      header: "Lead Enabled",
      minWidth: 100,
      align: "center",
      render: (row) => (
        <Switch checked={row.leadEnabled} size="small" onChange={() => onToggleLeadEnabled(row)} />
      ),
    },
    {
      id: "callRecordingSyncEnabled",
      header: "Call Recording Sync Enabled",
      minWidth: 150,
      align: "center",
      render: (row) => (
        <Stack alignItems="center" direction="row" spacing={0.5} sx={{ justifyContent: "center" }}>
          <Switch
            checked={row.callRecordingSyncEnabled}
            size="small"
            onChange={() => onToggleCallRecordingSync(row)}
          />
          {row.callRecordingSyncEnabled && isSyncStale(row.lastSyncAt) ? (
            <Tooltip title="No recording synced in the last 48 hours">
              <WarningAmberRounded color="warning" sx={{ fontSize: 16 }} />
            </Tooltip>
          ) : null}
          <Tooltip title={row.callRecordingSyncEnabled ? "Sync active" : "Sync disabled"}>
            {row.callRecordingSyncEnabled ? (
              <LockRounded color="success" sx={{ fontSize: 14 }} />
            ) : (
              <LockOpenRounded color="disabled" sx={{ fontSize: 14 }} />
            )}
          </Tooltip>
        </Stack>
      ),
    },
    {
      id: "action",
      header: "Action",
      minWidth: 60,
      align: "right",
      render: (row) => <RowActionMenu onEdit={() => onEdit(row)} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      emptyMessage="No employees yet. Add one from Settings → User Management."
      getRowKey={(row) => row.userId}
      page={page}
      pageCount={pageCount}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      paginationLabel={paginationLabel}
      rows={rows}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
