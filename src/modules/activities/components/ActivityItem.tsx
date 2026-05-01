import { memo, type ReactNode } from "react";
import CallRounded from "@mui/icons-material/CallRounded";
import ChatRounded from "@mui/icons-material/ChatRounded";
import DescriptionRounded from "@mui/icons-material/DescriptionRounded";
import EventRounded from "@mui/icons-material/EventRounded";
import MailOutlineRounded from "@mui/icons-material/MailOutlineRounded";
import StickyNote2Rounded from "@mui/icons-material/StickyNote2Rounded";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type {
  Activity,
  ActivityStatus,
  ActivityType,
} from "@/modules/activities/types/types";

type ActivityItemProps = {
  activity: Activity;
};

const activityTypeConfig: Record<
  ActivityType,
  { color: string; icon: ReactNode }
> = {
  CALL: {
    color: "#3182ce",
    icon: <CallRounded fontSize="small" />,
  },
  MEETING: {
    color: "#22c55e",
    icon: <EventRounded fontSize="small" />,
  },
  WHATSAPP: {
    color: "#16a34a",
    icon: <ChatRounded fontSize="small" />,
  },
  EMAIL: {
    color: "#f59e0b",
    icon: <MailOutlineRounded fontSize="small" />,
  },
  NOTE: {
    color: "#64748b",
    icon: <StickyNote2Rounded fontSize="small" />,
  },
  DOCUMENT: {
    color: "#0ea5e9",
    icon: <DescriptionRounded fontSize="small" />,
  },
};

const statusChipStyles: Record<ActivityStatus, { background: string; color: string }> = {
  Completed: {
    background: "#e0f2fe",
    color: "#0369a1",
  },
  Scheduled: {
    background: "#dcfce7",
    color: "#15803d",
  },
  Sent: {
    background: "#fef3c7",
    color: "#b45309",
  },
  Internal: {
    background: "#e2e8f0",
    color: "#475569",
  },
  Contract: {
    background: "#cffafe",
    color: "#0f766e",
  },
};

function formatMetadata(activity: Activity) {
  switch (activity.type) {
    case "CALL":
      return `Duration: ${activity.duration ?? 0} minutes  •  Agent: ${activity.agent}`;
    case "MEETING":
      return `Location: ${activity.location ?? "Not specified"}  •  Agent: ${activity.agent}`;
    case "WHATSAPP":
      return `Contact: ${activity.contact ?? "Not shared"}  •  Agent: ${activity.agent}`;
    case "EMAIL":
      return `Subject: ${activity.subject ?? "General update"}  •  Agent: ${activity.agent}`;
    case "NOTE":
      return `Category: ${activity.category ?? "General"}  •  Agent: ${activity.agent}`;
    case "DOCUMENT":
      return `File Size: ${activity.fileSize ?? "Unknown"}  •  Agent: ${activity.agent}`;
    default:
      return `Agent: ${activity.agent}`;
  }
}

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function ActivityItemComponent({ activity }: ActivityItemProps) {
  const typeConfig = activityTypeConfig[activity.type];
  const chipStyle = statusChipStyles[activity.status];

  return (
    <Paper
      component="article"
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: alpha("#0f172a", 0.08),
        borderRadius: 3,
        p: { xs: 2, sm: 2.5 },
        transition: (theme) =>
          theme.transitions.create(["box-shadow", "transform"], {
            duration: theme.transitions.duration.shorter,
          }),
        "&:hover": {
          boxShadow: "0 18px 36px rgba(15, 23, 42, 0.08)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between" }}
      >
        <Stack direction="row" spacing={1.75} sx={{ alignItems: "flex-start", minWidth: 0 }}>
          <Box
            sx={{
              alignItems: "center",
              bgcolor: alpha(typeConfig.color, 0.14),
              borderRadius: "50%",
              color: typeConfig.color,
              display: "inline-flex",
              flexShrink: 0,
              height: 42,
              justifyContent: "center",
              mt: 0.25,
              width: 42,
            }}
          >
            {typeConfig.icon}
          </Box>

          <Stack spacing={0.75} sx={{ minWidth: 0 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ alignItems: { sm: "center" } }}
            >
              <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
                {activity.title}
              </Typography>
              <Chip
                label={activity.status}
                size="small"
                sx={{
                  alignSelf: "flex-start",
                  bgcolor: chipStyle.background,
                  color: chipStyle.color,
                  fontSize: 11,
                  fontWeight: 700,
                  height: 24,
                }}
              />
            </Stack>

            <Typography color="text.primary" variant="body2">
              {activity.description}
            </Typography>

            <Typography color="text.secondary" variant="caption">
              {formatMetadata(activity)}
            </Typography>
          </Stack>
        </Stack>

        <Typography
          color="text.secondary"
          sx={{ flexShrink: 0, fontWeight: 600, whiteSpace: "nowrap" }}
          variant="body2"
        >
          {formatTime(activity.timestamp)}
        </Typography>
      </Stack>
    </Paper>
  );
}

export const ActivityItem = memo(ActivityItemComponent);
