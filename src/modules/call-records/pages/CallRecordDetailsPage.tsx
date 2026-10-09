import { useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, Chip, CircularProgress, Stack } from "@mui/material";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import { SettingsPageHeader } from "@/modules/settings/components/SettingsPageHeader";
import { CallRecordingPlayerDialog } from "@/modules/call-records/components/CallRecordingPlayerDialog";
import { CallRecordsTableContainer } from "@/modules/call-records/components/CallRecordsTableContainer";
import { callRecordsRoutePaths } from "@/modules/call-records/callRecordsRoutePaths";
import { callRecordsService } from "@/modules/call-records/callRecordsService";
import type { CallDirection, CallRecordingRow } from "@/modules/call-records/callRecords.types";
import { GlobalSearchBar } from "@/shared/components/GlobalSearchBar";

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const DIRECTION_CHIPS: { label: string; value: CallDirection | null }[] = [
  { label: "All", value: null },
  { label: "Incoming", value: "INCOMING" },
  { label: "Outgoing", value: "OUTGOING" },
  { label: "Missed", value: "MISSED" },
];

const DIRECTION_LABELS: Record<CallDirection, string> = {
  INCOMING: "Incoming",
  OUTGOING: "Outgoing",
  MISSED: "Missed",
};

function parseDirection(value: string | null): CallDirection | null {
  return value === "INCOMING" || value === "OUTGOING" || value === "MISSED" ? value : null;
}

/**
 * The calls behind a summary card or tile. The filters live in the URL (?period=today&direction=MISSED)
 * so a card's "View all" is a plain link, the browser Back button returns to the cards, and a filtered
 * view can be bookmarked or shared.
 */
export function CallRecordDetailsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const periodKey = searchParams.get("period");
  const direction = parseDirection(searchParams.get("direction"));

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [playing, setPlaying] = useState<CallRecordingRow | null>(null);

  // The summary supplies each period's exact date range (and is already cached from the cards page).
  const { data: periods = [], isLoading: periodsLoading } = useQuery({
    queryKey: ["call-records", "summary"],
    queryFn: callRecordsService.getSummary,
  });
  const period = periodKey ? periods.find((candidate) => candidate.key === periodKey) ?? null : null;
  const waitingForPeriod = Boolean(periodKey) && periodsLoading;

  const {
    data: recordings = [],
    isLoading: recordingsLoading,
    isError,
  } = useQuery({
    queryKey: period ? ["call-records", "range", period.from, period.to] : ["call-records"],
    queryFn: () => callRecordsService.list(period ? { from: period.from, to: period.to } : undefined),
    enabled: !waitingForPeriod,
  });
  const isLoading = waitingForPeriod || recordingsLoading;

  const query = searchQuery.trim().toLowerCase();
  const filteredRows = useMemo(
    () =>
      recordings.filter((recording) => {
        if (direction && recording.direction !== direction) return false;
        if (!query) return true;
        const haystack = `${recording.employeeName} ${recording.phoneNumber} ${recording.matchedContactLabel}`.toLowerCase();
        return haystack.includes(query);
      }),
    [recordings, direction, query],
  );

  const updateFilters = (next: { period?: string | null; direction?: CallDirection | null }) => {
    const params = new URLSearchParams(searchParams);
    if ("period" in next) {
      if (next.period) params.set("period", next.period);
      else params.delete("period");
    }
    if ("direction" in next) {
      if (next.direction) params.set("direction", next.direction);
      else params.delete("direction");
    }
    setSearchParams(params, { replace: true });
    setPage(1);
  };

  const visibleCount = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(visibleCount / pageSize));
  const clampedPage = Math.max(1, Math.min(page, pageCount));
  const pagedRows = filteredRows.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);
  const pageStart = visibleCount === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const pageEnd = visibleCount === 0 ? 0 : Math.min(clampedPage * pageSize, visibleCount);
  const paginationLabel =
    visibleCount === 0
      ? "Showing 0 of 0 recordings"
      : `Showing ${pageStart}-${pageEnd} of ${visibleCount} recordings`;

  const title = [period?.label, direction ? DIRECTION_LABELS[direction] : null].filter(Boolean).join(" · ") || "All calls";

  return (
    <Stack spacing={3}>
      <SettingsPageHeader
        actions={
          <Button
            component={RouterLink}
            size="small"
            startIcon={<ArrowBackRounded />}
            sx={{ textTransform: "none" }}
            to={callRecordsRoutePaths.list}
            variant="outlined"
          >
            Back to VuTrak
          </Button>
        }
        eyebrow={period ? `VuTrak · ${period.rangeLabel}` : "VuTrak · Call Records"}
        title={title}
      />

      <Stack alignItems={{ xs: "stretch", md: "center" }} direction={{ xs: "column", md: "row" }} spacing={1.5}>
        <GlobalSearchBar
          placeholder="Search employee, phone number…"
          value={searchQuery}
          onSearch={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          sx={{ width: { xs: "100%", sm: 320 } }}
        />
        <Stack direction="row" flexWrap="wrap" gap={1}>
          <Chip
            color={period ? "default" : "primary"}
            label="All time"
            variant={period ? "outlined" : "filled"}
            onClick={() => updateFilters({ period: null })}
          />
          {periods.map((candidate) => (
            <Chip
              key={candidate.key}
              color={candidate.key === periodKey ? "primary" : "default"}
              label={candidate.label}
              variant={candidate.key === periodKey ? "filled" : "outlined"}
              onClick={() => updateFilters({ period: candidate.key })}
            />
          ))}
        </Stack>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {DIRECTION_CHIPS.map((chip) => (
            <Chip
              key={chip.label}
              color={chip.value === direction ? "primary" : "default"}
              label={chip.label}
              variant={chip.value === direction ? "filled" : "outlined"}
              onClick={() => updateFilters({ direction: chip.value })}
            />
          ))}
        </Stack>
      </Stack>

      {isLoading ? (
        <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      ) : isError ? (
        <Alert severity="error">Failed to load call records.</Alert>
      ) : (
        <CallRecordsTableContainer
          page={clampedPage}
          pageCount={pageCount}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          paginationLabel={paginationLabel}
          rows={pagedRows}
          onPageChange={(nextPage) => setPage(Math.max(1, Math.min(nextPage, pageCount)))}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
          onPlay={setPlaying}
        />
      )}

      <CallRecordingPlayerDialog recording={playing} onClose={() => setPlaying(null)} />
    </Stack>
  );
}
