import { Link as RouterLink } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import type { DashboardApplicationPipelineDto } from "@/modules/dashboard/dashboard.types";
import { PanelCard, PanelLink } from "@/modules/dashboard/components/PanelCard";
import { PipelineBars } from "@/modules/dashboard/components/PipelineBars";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";

const DEMO_APPLICATIONS = [
  { name: "Priya Sharma", uni: "Uni of Melbourne · MBA", status: "Offer Rcvd", statusTone: "offer", date: "Today" },
  { name: "Divya Nair", uni: "Monash University · CS", status: "In Review", statusTone: "review", date: "Yesterday" },
  { name: "Karan Singh", uni: "RMIT · Engineering", status: "Submitted", statusTone: "submitted", date: "18 Jun" },
  { name: "Ananya Patel", uni: "ANU · Data Science", status: "Accepted", statusTone: "accepted", date: "17 Jun" },
  { name: "Amit Verma", uni: "Deakin · IT", status: "Visa / CAS", statusTone: "visa", date: "15 Jun" },
];

const STATUS_STYLES = {
  submitted: { bgcolor: "#EEF2FF", color: "#4338CA" },
  review: { bgcolor: "#FEF3C7", color: "#92400E" },
  offer: { bgcolor: "#DCFCE7", color: "#166534" },
  accepted: { bgcolor: "#D1FAE5", color: "#065F46" },
  visa: { bgcolor: "#F0FDF4", color: "#14532D" },
};

const DEMO_COUNTRIES = [
  { flag: "🇦🇺", name: "Australia", count: 41, width: 100 },
  { flag: "🇬🇧", name: "UK", count: 28, width: 68 },
  { flag: "🇨🇦", name: "Canada", count: 20, width: 49 },
  { flag: "🇺🇸", name: "USA", count: 12, width: 29 },
  { flag: "🇩🇪", name: "Germany", count: 8, width: 19 },
];

type DashboardApplicationsSectionProps = {
  pipeline?: DashboardApplicationPipelineDto;
};

export function DashboardApplicationsSection({ pipeline }: DashboardApplicationsSectionProps) {
  const defaultStages = [
    { label: "Submitted", count: 89, color: "#007A87" },
    { label: "In Review", count: 64, color: "#1393A0" },
    { label: "Offer Rcvd", count: 43, color: "#10B981" },
    { label: "Accepted", count: 30, color: "#F5820D" },
    { label: "Visa / CAS", count: 19, color: "#8B5CF6" },
  ];

  return (
    <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} sx={{ height: "100%", minHeight: 0 }}>
      <Stack spacing={1} sx={{ flex: 6, minHeight: 0, minWidth: 0 }}>
        <PanelCard
          action={<PanelLink>All applications →</PanelLink>}
          title="Application Status"
        >
          <PipelineBars stages={pipeline?.stages ?? defaultStages} />
        </PanelCard>

        <PanelCard
          action={
            <PanelLink>
              <RouterLink style={{ color: "inherit", textDecoration: "none" }} to={applicationsRoutePaths.dashboard}>
                View all →
              </RouterLink>
            </PanelLink>
          }
          grow
          title="Recent Applications"
        >
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {DEMO_APPLICATIONS.map((app) => (
              <Stack
                direction="row"
                key={app.name}
                spacing={1}
                sx={{
                  alignItems: "center",
                  borderBottom: "1px solid #F8FAFC",
                  py: 0.75,
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{app.name}</Typography>
                  <Typography sx={{ color: "text.disabled", fontSize: 9 }}>{app.uni}</Typography>
                </Box>
                <Box
                  component="span"
                  sx={{
                    ...STATUS_STYLES[app.statusTone as keyof typeof STATUS_STYLES],
                    borderRadius: 10,
                    fontSize: 9,
                    fontWeight: 700,
                    px: 0.875,
                    py: 0.25,
                    whiteSpace: "nowrap",
                  }}
                >
                  {app.status}
                </Box>
                <Typography sx={{ color: "text.disabled", fontSize: 9, whiteSpace: "nowrap" }}>{app.date}</Typography>
              </Stack>
            ))}
          </Box>
        </PanelCard>
      </Stack>

      <Stack spacing={1} sx={{ flex: 4, minHeight: 0, minWidth: 0 }}>
        <PanelCard title="Student Snapshot">
          <Box
            sx={{
              display: "grid",
              gap: 0.625,
              gridTemplateColumns: "repeat(3, 1fr)",
              mb: 0.875,
            }}
          >
            {[
              { value: "347", label: "Active" },
              { value: "19", label: "Visa Stage" },
              { value: "30", label: "Enrolled" },
            ].map((cell) => (
              <Box key={cell.label} sx={{ bgcolor: "#F0F9FA", borderRadius: 1.75, p: "6px 8px" }}>
                <Typography sx={{ color: "primary.main", fontSize: 14, fontWeight: 800 }}>{cell.value}</Typography>
                <Typography sx={{ color: "text.disabled", fontSize: 8, mt: 0.125 }}>{cell.label}</Typography>
              </Box>
            ))}
          </Box>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography sx={{ color: "text.disabled", fontSize: 9 }}>Avg processing time</Typography>
            <Typography sx={{ color: "primary.main", fontSize: 11, fontWeight: 700 }}>18 days</Typography>
          </Stack>
        </PanelCard>

        <PanelCard grow title="Top Destinations">
          <Stack spacing={0.75}>
            {DEMO_COUNTRIES.map((country) => (
              <Stack direction="row" key={country.name} spacing={0.875} sx={{ alignItems: "center" }}>
                <Typography sx={{ fontSize: 13 }}>{country.flag}</Typography>
                <Typography sx={{ flex: 1, fontSize: 10, fontWeight: 600 }}>{country.name}</Typography>
                <Box sx={{ bgcolor: "#F1F5F9", borderRadius: 0.5, height: 5, overflow: "hidden", width: 60 }}>
                  <Box
                    sx={{
                      background: "linear-gradient(90deg, #007A87, #15A6B8)",
                      borderRadius: 0.5,
                      height: "100%",
                      width: `${country.width}%`,
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: 10, fontWeight: 700, textAlign: "right", width: 20 }}>
                  {country.count}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </PanelCard>
      </Stack>
    </Stack>
  );
}
