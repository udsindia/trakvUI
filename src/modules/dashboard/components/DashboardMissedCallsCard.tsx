import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import PhoneMissedRounded from "@mui/icons-material/PhoneMissedRounded";
import { callRecordsDetailsPath } from "@/modules/call-records/callRecordsRoutePaths";
import { callRecordsService } from "@/modules/call-records/callRecordsService";

const MAX_ROWS = 5;

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  return new Date(value).toLocaleString("en-IN");
}

/**
 * Self-contained, same pattern as RecentActivitiesCard — its own query rather than riding the
 * main dashboard aggregation, so it doesn't need a backend dashboard-KPI change to ship. Reuses
 * the Call Records listing (already scoped: managers see the tenant, everyone else their own)
 * and just filters to the missed ones.
 */
export function DashboardMissedCallsCard() {
  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ["call-records"],
    queryFn: () => callRecordsService.list(),
  });

  const missedCalls = recordings.filter((r) => r.direction === "MISSED").slice(0, MAX_ROWS);
  const missedTodayCount = recordings.filter((r) => {
    if (r.direction !== "MISSED") return false;
    const started = new Date(r.startedAt);
    const now = new Date();
    return (
      started.getFullYear() === now.getFullYear() &&
      started.getMonth() === now.getMonth() &&
      started.getDate() === now.getDate()
    );
  }).length;

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "#e2e8f0",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "#f1f5f9",
          justifyContent: "space-between",
          px: 2.5,
          py: 2,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
            Missed Calls
          </Typography>
          {missedTodayCount > 0 ? (
            <Box
              sx={{
                bgcolor: "#FEF2F2",
                borderRadius: "999px",
                color: "error.main",
                fontSize: 11,
                fontWeight: 700,
                px: 1,
                py: 0.25,
              }}
            >
              {missedTodayCount} today
            </Box>
          ) : null}
        </Stack>
        <Button
          component={RouterLink}
          size="small"
          sx={{ textTransform: "none" }}
          to={callRecordsDetailsPath({ direction: "MISSED" })}
          variant="outlined"
        >
          View All
        </Button>
      </Stack>
      <Box sx={{ px: 2.5, py: 1 }}>
        {isLoading ? (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            Loading…
          </Typography>
        ) : missedCalls.length ? (
          missedCalls.map((call) => (
            <Stack
              direction="row"
              key={call.id}
              spacing={1.5}
              sx={{
                alignItems: "center",
                borderBottom: "1px solid",
                borderColor: "#f8fafc",
                py: 1.5,
                "&:last-child": { borderBottom: "none" },
              }}
            >
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: "#FEF2F2",
                  borderRadius: "8px",
                  display: "flex",
                  height: 36,
                  justifyContent: "center",
                  width: 36,
                }}
              >
                <PhoneMissedRounded sx={{ color: "error.main", fontSize: 18 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{call.employeeName}</Typography>
                <Typography sx={{ color: "#64748b", fontSize: 12, mt: 0.25 }}>{call.phoneNumber}</Typography>
              </Box>
              <Typography sx={{ color: "#94a3b8", fontSize: 11, whiteSpace: "nowrap" }}>
                {formatRelativeTime(call.startedAt)}
              </Typography>
            </Stack>
          ))
        ) : (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            No missed calls.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
