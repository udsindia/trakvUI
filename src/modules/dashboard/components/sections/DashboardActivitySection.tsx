import { Link as RouterLink } from "react-router-dom";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import PhoneRounded from "@mui/icons-material/PhoneRounded";
import CalendarTodayRounded from "@mui/icons-material/CalendarTodayRounded";
import ChatRounded from "@mui/icons-material/ChatRounded";
import MailRounded from "@mui/icons-material/MailRounded";
import NoteRounded from "@mui/icons-material/NoteRounded";
import DescriptionRounded from "@mui/icons-material/DescriptionRounded";
import { PanelCard, PanelLink } from "@/modules/dashboard/components/PanelCard";
import { activityService } from "@/modules/activities/activityService";
import type { ActivityType } from "@/modules/activities/types/types";

type ActivityIconConfig = {
  bg: string;
  color: string;
  Icon: React.ElementType;
};

const ACTIVITY_STYLES: Record<ActivityType, ActivityIconConfig> = {
  CALL: { bg: "rgba(0,122,135,.12)", color: "#007A87", Icon: PhoneRounded },
  MEETING: { bg: "rgba(139,92,246,.12)", color: "#8B5CF6", Icon: CalendarTodayRounded },
  WHATSAPP: { bg: "rgba(16,185,129,.12)", color: "#10B981", Icon: ChatRounded },
  EMAIL: { bg: "rgba(14,165,233,.12)", color: "#0EA5E9", Icon: MailRounded },
  NOTE: { bg: "rgba(245,130,13,.12)", color: "#F5820D", Icon: NoteRounded },
  DOCUMENT: { bg: "rgba(100,116,139,.12)", color: "#64748B", Icon: DescriptionRounded },
};

const DUE_STYLES = {
  overdue: { bgcolor: "#FEE2E2", color: "#991B1B" },
  today: { bgcolor: "#FEF3C7", color: "#92400E" },
  later: { bgcolor: "#F1F5F9", color: "#64748B" },
};

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getDueBadge(dueDate: string): { label: string; tone: keyof typeof DUE_STYLES } {
  const today = new Date().toISOString().slice(0, 10);
  if (dueDate < today) return { label: "Overdue", tone: "overdue" };
  if (dueDate === today) return { label: "Today", tone: "today" };
  return { label: "Upcoming", tone: "later" };
}

function EmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center", py: 3 }}>
      <Typography sx={{ color: "text.disabled", fontSize: 12 }}>{message}</Typography>
    </Box>
  );
}

export function DashboardActivitySection() {
  const { data: activityFeed, isLoading: loadingActivities } = useQuery({
    queryKey: ["dashboard-activity-feed"],
    queryFn: () => activityService.getActivityFeed({ limit: 7 }),
    staleTime: 30_000,
    retry: 1,
  });

  const { data: taskBoard, isLoading: loadingTasks } = useQuery({
    queryKey: ["dashboard-task-board"],
    queryFn: () => activityService.getTaskBoard(),
    staleTime: 30_000,
    retry: 1,
  });

  const today = new Date().toISOString().slice(0, 10);
  const urgentTasks = (taskBoard?.tasks ?? [])
    .filter((t) => t.dueDate <= today && t.status !== "DONE" && t.status !== "CANCELLED")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const activities = activityFeed?.items ?? [];

  return (
    <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} sx={{ height: "100%", minHeight: 0 }}>
      <Stack sx={{ flex: 6, minHeight: 0, minWidth: 0 }}>
        <PanelCard
          action={
            <PanelLink>
              <RouterLink style={{ color: "inherit", textDecoration: "none" }} to="/activities/feed">
                All →
              </RouterLink>
            </PanelLink>
          }
          grow
          title="Recent Activity"
        >
          {loadingActivities ? (
            <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center", py: 3 }}>
              <CircularProgress size={20} />
            </Box>
          ) : activities.length > 0 ? (
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {activities.map((activity) => {
                const styles = ACTIVITY_STYLES[activity.type] ?? ACTIVITY_STYLES.NOTE;
                const { Icon } = styles;

                return (
                  <Stack
                    direction="row"
                    key={activity.id}
                    spacing={1}
                    sx={{
                      borderBottom: "1px solid #F8FAFC",
                      py: 0.875,
                      "&:last-child": { borderBottom: "none" },
                    }}
                  >
                    <Box
                      sx={{
                        alignItems: "center",
                        bgcolor: styles.bg,
                        borderRadius: "50%",
                        color: styles.color,
                        display: "flex",
                        flexShrink: 0,
                        height: 26,
                        justifyContent: "center",
                        width: 26,
                      }}
                    >
                      <Icon sx={{ fontSize: 13 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 11, lineHeight: 1.4 }}>{activity.title}</Typography>
                      {activity.description && activity.description !== "No activity notes recorded." && (
                        <Typography noWrap sx={{ color: "text.secondary", fontSize: 9, mt: 0.125 }}>
                          {activity.description}
                        </Typography>
                      )}
                      <Typography sx={{ color: "text.disabled", fontSize: 9, mt: 0.125 }}>
                        {timeAgo(activity.occurredAt)}
                        {activity.agent?.name ? ` · ${activity.agent.name}` : ""}
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Box>
          ) : (
            <EmptyState message="No recent activity" />
          )}
        </PanelCard>
      </Stack>

      <Stack spacing={1} sx={{ flex: 4, minHeight: 0, minWidth: 0 }}>
        {/* <PanelCard action={<PanelLink>View all →</PanelLink>} title="⚠ Needs Attention">
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: 80 }}>
            <Typography sx={{ color: "text.disabled", fontSize: 12, textAlign: "center" }}>
              Attention alerts
              <br />
              coming soon
            </Typography>
          </Box>
        </PanelCard> */}

        <PanelCard
          action={
            <PanelLink>
              <RouterLink style={{ color: "inherit", textDecoration: "none" }} to="/activities/tasks">
                All tasks →
              </RouterLink>
            </PanelLink>
          }
          grow
          title="Tasks Due Today"
        >
          {loadingTasks ? (
            <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center", py: 3 }}>
              <CircularProgress size={20} />
            </Box>
          ) : urgentTasks.length > 0 ? (
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {urgentTasks.map((task) => {
                const { label, tone } = getDueBadge(task.dueDate);

                return (
                  <Stack
                    direction="row"
                    key={task.id}
                    spacing={0.875}
                    sx={{
                      alignItems: "center",
                      borderBottom: "1px solid #F8FAFC",
                      py: 0.75,
                      "&:last-child": { borderBottom: "none" },
                    }}
                  >
                    <Box
                      sx={{
                        border: "2px solid",
                        borderColor: "divider",
                        borderRadius: 0.5,
                        flexShrink: 0,
                        height: 15,
                        width: 15,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap sx={{ fontSize: 11, fontWeight: 600 }}>
                        {task.title}
                      </Typography>
                      <Typography sx={{ color: "text.disabled", fontSize: 9, mt: 0.125 }}>
                        {task.assignedAgent.name}
                        {task.linkedLead.name && task.linkedLead.name !== "No linked lead"
                          ? ` · ${task.linkedLead.name}`
                          : ""}
                      </Typography>
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        ...DUE_STYLES[tone],
                        borderRadius: 1.25,
                        fontSize: 9,
                        fontWeight: 700,
                        px: 0.75,
                        py: 0.25,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </Box>
                  </Stack>
                );
              })}
            </Box>
          ) : (
            <EmptyState message="No tasks due today" />
          )}
        </PanelCard>
      </Stack>
    </Stack>
  );
}
