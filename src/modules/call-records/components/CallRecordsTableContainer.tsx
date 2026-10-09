import { Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import CallReceivedRounded from "@mui/icons-material/CallReceivedRounded";
import CallMadeRounded from "@mui/icons-material/CallMadeRounded";
import PhoneMissedRounded from "@mui/icons-material/PhoneMissedRounded";
import { DataTable, type DataTableColumn } from "@/shared/components/DataTable";
import type { CallRecordingRow } from "@/modules/call-records/callRecords.types";

type CallRecordsTableContainerProps = {
  rows: CallRecordingRow[];
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions: number[];
  paginationLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onPlay: (recording: CallRecordingRow) => void;
};

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

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const directionStyles: Record<string, { color: "success" | "info" | "error"; icon: typeof CallReceivedRounded }> = {
  INCOMING: { color: "success", icon: CallReceivedRounded },
  OUTGOING: { color: "info", icon: CallMadeRounded },
  MISSED: { color: "error", icon: PhoneMissedRounded },
};

export function CallRecordsTableContainer({
  rows,
  page,
  pageCount,
  pageSize,
  pageSizeOptions,
  paginationLabel,
  onPageChange,
  onPageSizeChange,
  onPlay,
}: CallRecordsTableContainerProps) {
  const columns: DataTableColumn<CallRecordingRow>[] = [
    {
      id: "employee",
      header: "Employee",
      minWidth: 180,
      render: (row) => (
        <Stack spacing={0.125}>
          <Typography noWrap sx={{ fontSize: 12.5 }} variant="body2">
            {row.employeeName || "—"}
          </Typography>
          {row.matchedContactLabel ? (
            <Typography color="text.disabled" noWrap sx={{ fontSize: 10.5 }} variant="caption">
              {row.matchedContactLabel}
            </Typography>
          ) : null}
        </Stack>
      ),
    },
    {
      id: "phoneNumber",
      header: "Caller Number",
      minWidth: 140,
      render: (row) => <TextCell value={row.phoneNumber} />,
    },
    {
      id: "direction",
      header: "Direction",
      minWidth: 110,
      render: (row) => {
        const style = directionStyles[row.direction] ?? directionStyles.INCOMING;
        const Icon = style.icon;
        return (
          <Chip
            color={style.color}
            icon={<Icon sx={{ fontSize: 14 }} />}
            label={row.direction}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      id: "startedAt",
      header: "Date / Time",
      minWidth: 150,
      render: (row) => <TextCell value={formatDateTime(row.startedAt)} />,
    },
    {
      id: "duration",
      header: "Duration",
      minWidth: 80,
      render: (row) => (row.direction === "MISSED" ? <TextCell /> : <TextCell value={formatDuration(row.durationSeconds)} />),
    },
    {
      id: "status",
      header: "Status",
      minWidth: 100,
      render: (row) => (
        <Chip
          color={row.status === "UPLOADED" ? "success" : row.status === "MISSED" ? "warning" : "error"}
          label={row.status === "MISSED" ? "Missed" : row.status}
          size="small"
          sx={{ textTransform: "capitalize" }}
        />
      ),
    },
    {
      id: "play",
      header: "",
      minWidth: 50,
      align: "right",
      render: (row) =>
        row.direction === "MISSED" ? null : (
          <Tooltip title="Play recording">
            <IconButton size="small" onClick={() => onPlay(row)}>
              <PlayArrowRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      emptyMessage="No call recordings yet."
      getRowKey={(row) => row.id}
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
