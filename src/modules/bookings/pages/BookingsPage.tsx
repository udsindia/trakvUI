import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Link,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRounded from "@mui/icons-material/RadioButtonUncheckedRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { SettingsPageHeader } from "@/modules/settings/components/SettingsPageHeader";
import { bookingsApi, type Booking, type BookingStatus } from "@/modules/bookings/bookingsApi";
import {
  groupByDay,
  rangeFor,
  summarize,
  timeRange,
  type BookingView,
} from "@/modules/bookings/bookingRange";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";
import { fromBackendLeadStage } from "@/modules/lead/leadStageMappers";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

/** The studio-bookings calendar, where sessions are created and edited. Optional. */
const CALENDAR_URL = import.meta.env.VITE_STUDIO_BOOKINGS_URL as string | undefined;

const STATUS_STYLE: Record<BookingStatus, { label: string; color: "success" | "warning" | "default" }> = {
  CONFIRMED: { label: "Confirmed", color: "success" },
  PENDING: { label: "Pending", color: "warning" },
  CANCELLED: { label: "Cancelled", color: "default" },
};

const cardSx = {
  border: "1px solid",
  borderColor: "#e9eff5",
  borderRadius: "12px",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
} as const;

function formatSentAt(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** One WhatsApp message a booking earns: a tick once it has gone out. */
function MessageMark({ label, sentAt }: { label: string; sentAt?: string | null }) {
  const sent = formatSentAt(sentAt);
  return (
    <Tooltip title={sent ? `${label} sent ${sent}` : `${label} not sent`}>
      <Stack alignItems="center" direction="row" spacing={0.5}>
        {sent ? (
          <CheckCircleRounded color="success" sx={{ fontSize: 15 }} />
        ) : (
          <RadioButtonUncheckedRounded sx={{ color: "text.disabled", fontSize: 15 }} />
        )}
        <Typography color={sent ? "text.primary" : "text.disabled"} sx={{ fontSize: 12 }}>
          {label}
        </Typography>
      </Stack>
    </Tooltip>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card elevation={0} sx={{ ...cardSx, flex: 1, minWidth: 0, p: { xs: 1.5, sm: 2 } }}>
      <Typography color="text.secondary" sx={{ fontSize: { xs: 11.5, sm: 12.5 }, fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 700, lineHeight: 1.3 }}>{value}</Typography>
      {hint ? (
        <Typography color="text.secondary" sx={{ fontSize: { xs: 11, sm: 12 } }}>
          {hint}
        </Typography>
      ) : null}
    </Card>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  const status = STATUS_STYLE[booking.status] ?? STATUS_STYLE.CONFIRMED;
  const cancelled = booking.status === "CANCELLED";

  return (
    <Box
      sx={{
        alignItems: { md: "center" },
        display: "grid",
        gap: { xs: 1, md: 2 },
        gridTemplateColumns: { xs: "1fr", md: "170px minmax(180px, 1.4fr) 90px 110px minmax(220px, 1.6fr)" },
        opacity: cancelled ? 0.6 : 1,
        px: 2.5,
        py: 1.75,
      }}
    >
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700, textDecoration: cancelled ? "line-through" : "none" }}>
          {timeRange(booking)}
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 12 }}>
          {booking.hours} {booking.hours === 1 ? "hour" : "hours"}
        </Typography>
      </Box>

      <Box sx={{ minWidth: 0 }}>
        {booking.leadId ? (
          <Link
            component={RouterLink}
            sx={{ fontSize: 14, fontWeight: 600 }}
            to={leadRoutePaths.details(booking.leadId)}
            underline="hover"
          >
            {booking.leadName || booking.clientName}
          </Link>
        ) : (
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{booking.clientName}</Typography>
        )}
        <Typography color="text.secondary" noWrap sx={{ fontSize: 12 }}>
          {[booking.phone, booking.leadStage ? fromBackendLeadStage(booking.leadStage, true) : "No lead"]
            .filter(Boolean)
            .join(" · ")}
        </Typography>
      </Box>

      <Box>
        <Chip color={status.color} label={status.label} size="small" variant={cancelled ? "outlined" : "filled"} />
      </Box>

      <Stack spacing={0.25}>
        <MessageMark label="Confirmation" sentAt={booking.confirmationSentAt} />
        <MessageMark label="Reminder" sentAt={booking.reminderSentAt} />
        {cancelled ? <MessageMark label="Cancellation" sentAt={booking.cancellationSentAt} /> : null}
      </Stack>

      <Typography
        color={booking.notes ? "text.primary" : "text.disabled"}
        sx={{ fontSize: 12.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {booking.notes || "No notes"}
      </Typography>
    </Box>
  );
}

export function BookingsPage() {
  const [view, setView] = useState<BookingView>("upcoming");
  const [search, setSearch] = useState("");
  // Fixed per view for the life of the page, so the query key stays stable between renders.
  const range = useMemo(() => rangeFor(view), [view]);

  const { data: bookings = [], isLoading, isError, error } = useQuery({
    queryKey: ["bookings", view, range.from, range.to],
    queryFn: () => bookingsApi.list(range),
  });

  const query = search.trim().toLowerCase();
  const visible = useMemo(() => {
    const matching = query
      ? bookings.filter((b) =>
          `${b.clientName} ${b.leadName ?? ""} ${b.phone ?? ""} ${b.notes ?? ""}`.toLowerCase().includes(query),
        )
      : bookings;
    // Past sessions read newest first; upcoming soonest first, as the API sends them.
    return view === "past" ? [...matching].reverse() : matching;
  }, [bookings, query, view]);

  const days = useMemo(() => groupByDay(visible), [visible]);
  const summary = useMemo(() => summarize(bookings), [bookings]);

  return (
    <Stack spacing={3}>
      <SettingsPageHeader
        actions={
          CALENDAR_URL ? (
            <Button
              endIcon={<OpenInNewRounded />}
              href={CALENDAR_URL}
              rel="noopener noreferrer"
              size="small"
              sx={{ textTransform: "none" }}
              target="_blank"
              variant="outlined"
            >
              Open booking calendar
            </Button>
          ) : undefined
        }
        eyebrow="Studio"
        title="Bookings"
      />

      {view === "upcoming" ? (
        <Stack direction="row" spacing={{ xs: 1, sm: 2 }}>
          <SummaryCard label="Today" value={summary.todaySessions} hint="sessions" />
          <SummaryCard label="Next 7 days" value={summary.weekSessions} hint={`${summary.weekHours}h booked`} />
          <SummaryCard label="Pending" value={summary.pending} hint="to confirm" />
        </Stack>
      ) : null}

      <Stack alignItems={{ sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          onChange={(_, next: BookingView | null) => next && setView(next)}
        >
          <ToggleButton sx={{ px: 2, textTransform: "none" }} value="upcoming">
            Upcoming
          </ToggleButton>
          <ToggleButton sx={{ px: 2, textTransform: "none" }} value="past">
            Past 60 days
          </ToggleButton>
        </ToggleButtonGroup>

        <TextField
          placeholder="Search client, phone or notes"
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: { sm: 280 } }}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Stack>

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : isError ? (
        <Alert severity="error">{getApiErrorMessage(error, "Could not load bookings.")}</Alert>
      ) : days.length === 0 ? (
        <Card elevation={0} sx={{ ...cardSx, p: 4, textAlign: "center" }}>
          <Typography sx={{ fontWeight: 600 }}>
            {query ? "No bookings match your search." : view === "upcoming" ? "No upcoming sessions." : "No sessions in the past 60 days."}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>
            Sessions appear here as soon as they are saved in the booking calendar.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {days.map((group) => {
            const hours = group.bookings
              .filter((b) => b.status !== "CANCELLED")
              .reduce((sum, b) => sum + b.hours, 0);
            return (
              <Card elevation={0} key={group.day} sx={cardSx}>
                <Stack
                  alignItems="baseline"
                  direction="row"
                  justifyContent="space-between"
                  sx={{ bgcolor: "#F0F6F8", px: 2.5, py: 1.25 }}
                >
                  <Typography sx={{ color: "#1A4C5E", fontSize: 14, fontWeight: 700 }}>{group.label}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
                    {group.bookings.length} {group.bookings.length === 1 ? "session" : "sessions"} · {hours}h
                  </Typography>
                </Stack>
                {group.bookings.map((booking, index) => (
                  <Box key={booking.id}>
                    {index > 0 ? <Divider /> : null}
                    <BookingRow booking={booking} />
                  </Box>
                ))}
              </Card>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
