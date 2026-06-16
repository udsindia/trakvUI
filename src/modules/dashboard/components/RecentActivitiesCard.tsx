import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { ActivityType } from "@/modules/activities/types/types";
import type { DashboardActivityDto } from "@/modules/dashboard/dashboard.types";

const ACTIVITY_META: Record<
  ActivityType,
  { bg: string; color: string; icon: string; label: string }
> = {
  CALL: { bg: "#ede9fe", color: "#7c3aed", icon: "📞", label: "CALL" },
  MEETING: { bg: "#dbeafe", color: "#1d4ed8", icon: "🤝", label: "MEETING" },
  WHATSAPP: { bg: "#ccfbf1", color: "#0d9488", icon: "💬", label: "WHATSAPP" },
  EMAIL: { bg: "#fef3c7", color: "#d97706", icon: "✉️", label: "EMAIL" },
  NOTE: { bg: "#f1f5f9", color: "#64748b", icon: "📝", label: "NOTE" },
  DOCUMENT: { bg: "#fee2e2", color: "#dc2626", icon: "📄", label: "DOCUMENT" },
};

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  return new Date(value).toLocaleString("en-IN");
}

function ActivityRow({ activity }: { activity: DashboardActivityDto }) {
  const meta = ACTIVITY_META[activity.type] ?? ACTIVITY_META.NOTE;

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: "flex-start",
        borderBottom: "1px solid",
        borderColor: "#f8fafc",
        py: 1.75,
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          bgcolor: meta.bg,
          borderRadius: 1.25,
          display: "flex",
          fontSize: 16,
          height: 36,
          justifyContent: "center",
          width: 36,
        }}
      >
        {meta.icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{activity.title}</Typography>
        <Typography sx={{ color: "#64748b", fontSize: 12, mt: 0.25 }}>{activity.description}</Typography>
        <Typography sx={{ color: "#94a3b8", fontSize: 11, mt: 0.5 }}>
          {formatRelativeTime(activity.occurredAt)}
        </Typography>
      </Box>
      <Chip
        label={meta.label}
        size="small"
        sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700 }}
      />
    </Stack>
  );
}

export function RecentActivitiesCard({ activities }: { activities: DashboardActivityDto[] }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "#e2e8f0",
        borderRadius: 2,
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
        <Box>
          <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
            Recent Activities
          </Typography>
        </Box>
        <Button component={RouterLink} size="small" sx={{ textTransform: "none" }} to="/activities/feed" variant="outlined">
          View All
        </Button>
      </Stack>
      <Box sx={{ px: 2.5, py: 1 }}>
        {activities.length ? (
          activities.map((activity) => <ActivityRow activity={activity} key={activity.id} />)
        ) : (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            No recent activities yet.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
