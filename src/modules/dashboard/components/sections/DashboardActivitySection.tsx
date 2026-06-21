import { Link as RouterLink } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import CheckRounded from "@mui/icons-material/CheckRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import DescriptionRounded from "@mui/icons-material/DescriptionRounded";
import SchoolRounded from "@mui/icons-material/SchoolRounded";
import PersonAddRounded from "@mui/icons-material/PersonAddRounded";
import { PanelCard, PanelLink } from "@/modules/dashboard/components/PanelCard";

const ACTIVITIES = [
  { tone: "success", icon: CheckRounded, text: "Priya Sharma moved to Qualified by Anjali Singh", time: "2 min ago" },
  { tone: "secondary", icon: null, text: "WhatsApp sent to Rohan Mehta — follow-up", time: "18 min ago · automated" },
  { tone: "primary", icon: TrendingUpRounded, text: "New lead Karan Singh captured via Meta Ads", time: "1 hour ago" },
  { tone: "info", icon: DescriptionRounded, text: "Application created — Divya Nair · Uni of Melbourne", time: "2 hours ago · Ravi Kumar" },
  { tone: "purple", icon: SchoolRounded, text: "Ananya Patel enrolled — visa approved 🎉", time: "Yesterday 4:30pm" },
  { tone: "danger", icon: WarningAmberRounded, text: "Lead Amit Verma uncontacted for 5 days — no activity", time: "System alert · 6 hours ago" },
  { tone: "secondary", icon: PersonAddRounded, text: "New lead Sana Khan assigned to Meena Joshi", time: "Yesterday 3:12pm" },
];

const ATTENTION_ITEMS = [
  { tone: "danger", name: "Amit Verma", detail: "Lead · No contact · Meta Ads", days: "5 days", urgent: true },
  { tone: "danger", name: "Karan Singh", detail: "Lead · Unassigned · Walk-in", days: "3 days", urgent: true },
  { tone: "warning", name: "Rohan Mehta", detail: "Lead · No follow-up", days: "4 days", urgent: false },
  { tone: "info", name: "Sana Khan", detail: "Student · Documents pending", days: "Missing docs", urgent: false },
];

const TASKS = [
  { title: "Call Rohan Mehta — admission follow-up", sub: "Lead · Assigned to Anjali Singh", due: "Overdue", dueTone: "overdue" },
  { title: "Send SOP documents to Priya Sharma", sub: "Lead · Assigned to Ravi Kumar", due: "11:00 AM", dueTone: "today" },
  { title: "Review Karan Singh offer letter", sub: "Application · Meena Joshi", due: "2:00 PM", dueTone: "today" },
  { title: "Visa docs follow-up — Divya Nair", sub: "Student · Suresh Pillai", due: "4:00 PM", dueTone: "today" },
  { title: "Team performance check-in", sub: "Internal", due: "Tomorrow", dueTone: "later" },
];

const DOT_STYLES = {
  primary: { bg: "rgba(0,122,135,.1)", color: "primary.main" },
  secondary: { bg: "rgba(245,130,13,.1)", color: "secondary.main" },
  success: { bg: "rgba(16,185,129,.1)", color: "success.main" },
  info: { bg: "rgba(14,165,233,.1)", color: "info.main" },
  purple: { bg: "rgba(139,92,246,.1)", color: "#8B5CF6" },
  danger: { bg: "rgba(239,68,68,.1)", color: "error.main" },
};

const DUE_STYLES = {
  overdue: { bgcolor: "#FEE2E2", color: "#991B1B" },
  today: { bgcolor: "#FEF3C7", color: "#92400E" },
  later: { bgcolor: "#F1F5F9", color: "text.disabled" },
};

export function DashboardActivitySection() {
  return (
    <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} sx={{ height: "100%", minHeight: 0 }}>
      <Stack sx={{ flex: 6, minHeight: 0, minWidth: 0 }}>
        <PanelCard action={<PanelLink>All →</PanelLink>} grow title="Recent Activity">
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {ACTIVITIES.map((activity) => {
              const styles = DOT_STYLES[activity.tone as keyof typeof DOT_STYLES];
              const Icon = activity.icon;

              return (
                <Stack
                  direction="row"
                  key={activity.text}
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
                    {Icon ? <Icon sx={{ fontSize: 13 }} /> : "💬"}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, lineHeight: 1.4 }}>{activity.text}</Typography>
                    <Typography sx={{ color: "text.disabled", fontSize: 9, mt: 0.125 }}>{activity.time}</Typography>
                  </Box>
                </Stack>
              );
            })}
          </Box>
        </PanelCard>
      </Stack>

      <Stack spacing={1} sx={{ flex: 4, minHeight: 0, minWidth: 0 }}>
        <PanelCard
          action={<PanelLink>View all →</PanelLink>}
          title="⚠ Needs Attention"
        >
          <Box sx={{ maxHeight: 160, overflowY: "auto" }}>
            {ATTENTION_ITEMS.map((item) => (
              <Stack
                direction="row"
                key={item.name}
                spacing={1}
                sx={{
                  alignItems: "center",
                  borderBottom: "1px solid #F8FAFC",
                  py: 0.75,
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Box
                  sx={{
                    bgcolor:
                      item.tone === "danger"
                        ? "error.main"
                        : item.tone === "warning"
                          ? "warning.main"
                          : "info.main",
                    borderRadius: "50%",
                    flexShrink: 0,
                    height: 8,
                    width: 8,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{item.name}</Typography>
                  <Typography sx={{ color: "text.disabled", fontSize: 9, mt: 0.125 }}>{item.detail}</Typography>
                </Box>
                <Box
                  component="span"
                  sx={{
                    bgcolor: item.urgent ? "#FEE2E2" : "#FEF3C7",
                    borderRadius: 10,
                    color: item.urgent ? "#991B1B" : "#92400E",
                    fontSize: 9,
                    fontWeight: 700,
                    px: 0.875,
                    py: 0.25,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.days}
                </Box>
              </Stack>
            ))}
          </Box>
        </PanelCard>

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
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {TASKS.map((task) => (
              <Stack
                direction="row"
                key={task.title}
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
                    cursor: "pointer",
                    flexShrink: 0,
                    height: 15,
                    width: 15,
                    "&:hover": { borderColor: "primary.main" },
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{task.title}</Typography>
                  <Typography sx={{ color: "text.disabled", fontSize: 9, mt: 0.125 }}>{task.sub}</Typography>
                </Box>
                <Box
                  component="span"
                  sx={{
                    ...DUE_STYLES[task.dueTone as keyof typeof DUE_STYLES],
                    borderRadius: 1.25,
                    fontSize: 9,
                    fontWeight: 700,
                    px: 0.75,
                    py: 0.25,
                    whiteSpace: "nowrap",
                  }}
                >
                  {task.due}
                </Box>
              </Stack>
            ))}
          </Box>
        </PanelCard>
      </Stack>
    </Stack>
  );
}
