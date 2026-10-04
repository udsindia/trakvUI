import { useQuery } from "@tanstack/react-query";
import { Box, ButtonBase, Paper, Skeleton, Stack, Typography } from "@mui/material";
import PhoneCallbackRounded from "@mui/icons-material/PhoneCallbackRounded";
import PhoneForwardedRounded from "@mui/icons-material/PhoneForwardedRounded";
import PhoneMissedRounded from "@mui/icons-material/PhoneMissedRounded";
import PhoneRounded from "@mui/icons-material/PhoneRounded";
import TimerOutlined from "@mui/icons-material/TimerOutlined";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import type { ReactNode } from "react";
import { callRecordsService } from "@/modules/call-records/callRecordsService";
import type { CallDirection, CallSummaryPeriod } from "@/modules/call-records/callRecords.types";

const REFRESH_MS = 30_000;

/** 568 -> "0h 9m 28s", the way the call dashboards phone teams already read. */
function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

/** A stat on a card. Opens the details page for that period (and direction) when it has an onOpen. */
function Tile({
  color,
  icon,
  label,
  onOpen,
  value,
}: {
  color: string;
  icon: ReactNode;
  label: string;
  onOpen?: () => void;
  value: string | number;
}) {
  const content = (
    <>
      <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{value}</Typography>
      <Stack alignItems="center" direction="row" spacing={0.5} sx={{ color, mt: 0.25 }}>
        <Box sx={{ display: "flex", "& svg": { fontSize: 15 } }}>{icon}</Box>
        <Typography noWrap sx={{ color: "text.secondary", fontSize: 12 }}>
          {label}
        </Typography>
      </Stack>
    </>
  );
  const sx = {
    alignItems: "flex-start",
    bgcolor: "#f8fafc",
    borderRadius: "8px",
    display: "block",
    minWidth: 0,
    px: 1.5,
    py: 1.25,
    textAlign: "left",
  } as const;

  return onOpen ? (
    <ButtonBase
      aria-label={`${label}: ${value}. Show these calls`}
      sx={{ ...sx, "&:hover": { bgcolor: "#eef2ff" } }}
      onClick={onOpen}
    >
      {content}
    </ButtonBase>
  ) : (
    <Box sx={sx}>{content}</Box>
  );
}

function PeriodCard({
  onOpen,
  period,
}: {
  onOpen: (periodKey: string, direction?: CallDirection) => void;
  period: CallSummaryPeriod;
}) {
  return (
    <Paper
      elevation={0}
      sx={{ border: "1px solid", borderColor: "#e2e8f0", borderRadius: "10px", flex: 1, minWidth: 0, p: 2 }}
    >
      <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
        <Stack alignItems="baseline" direction="row" flexWrap="wrap" spacing={1}>
          <Typography sx={{ fontSize: 17, fontWeight: 700 }}>{period.label}</Typography>
          <Typography color="text.secondary" variant="caption">
            {period.rangeLabel}
          </Typography>
        </Stack>
        <ButtonBase
          aria-label={`View all ${period.label} calls`}
          sx={{ borderRadius: "6px", color: "primary.main", flexShrink: 0, fontSize: 13, fontWeight: 600, px: 0.75, py: 0.25 }}
          onClick={() => onOpen(period.key)}
        >
          View all
          <ChevronRightRounded sx={{ fontSize: 18 }} />
        </ButtonBase>
      </Stack>
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr 1fr" }}>
        <Tile
          color="#2563eb"
          icon={<PhoneRounded />}
          label="Total Calls"
          value={period.totalCalls}
          onOpen={() => onOpen(period.key)}
        />
        <Tile
          color="#2563eb"
          icon={<TimerOutlined />}
          label="Call Duration"
          value={formatDuration(period.totalDurationSeconds)}
        />
        <Tile
          color="#16a34a"
          icon={<PhoneCallbackRounded />}
          label="Incoming"
          value={period.incoming.calls}
          onOpen={() => onOpen(period.key, "INCOMING")}
        />
        <Tile
          color="#16a34a"
          icon={<TimerOutlined />}
          label="Incoming Duration"
          value={formatDuration(period.incoming.durationSeconds)}
        />
        <Tile
          color="#ea580c"
          icon={<PhoneForwardedRounded />}
          label="Outgoing"
          value={period.outgoing.calls}
          onOpen={() => onOpen(period.key, "OUTGOING")}
        />
        <Tile
          color="#ea580c"
          icon={<TimerOutlined />}
          label="Outgoing Duration"
          value={formatDuration(period.outgoing.durationSeconds)}
        />
        <Tile
          color="#dc2626"
          icon={<PhoneMissedRounded />}
          label="Missed"
          value={period.missedCalls}
          onOpen={() => onOpen(period.key, "MISSED")}
        />
      </Box>
    </Paper>
  );
}

/**
 * Today / Yesterday / Last Week call totals. "View all" and the Total / Incoming / Outgoing / Missed
 * tiles open the details page for that period (and direction) via onOpen.
 */
export function CallSummaryCards({
  onOpen,
}: {
  onOpen: (periodKey: string, direction?: CallDirection) => void;
}) {
  const { data: periods, isLoading } = useQuery({
    queryKey: ["call-records", "summary"],
    queryFn: callRecordsService.getSummary,
    refetchInterval: REFRESH_MS,
  });

  if (isLoading) {
    return (
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} height={250} sx={{ borderRadius: "10px", flex: 1, transform: "none" }} variant="rounded" />
        ))}
      </Stack>
    );
  }

  if (!periods?.length) {
    return null;
  }

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      {periods.map((period) => (
        <PeriodCard key={period.key} period={period} onOpen={onOpen} />
      ))}
    </Stack>
  );
}
