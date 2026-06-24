import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  PlatformBarChart,
  PlatformKpiGrid,
  PlatformPanelCard,
} from "@/modules/super-admin/components/PlatformCharts";
import {
  AgencyStatusChip,
  formatDate,
  SubscriptionChip,
} from "@/modules/super-admin/components/AgencyStatusChip";
import { SuperAdminPageHeader } from "@/modules/super-admin/components/SuperAdminPageHeader";
import { platformService } from "@/modules/super-admin/platformService";
import { superAdminRoutePaths } from "@/modules/super-admin/superAdminRoutePaths";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

export function PlatformDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["super-admin", "dashboard"],
    queryFn: () => platformService.getDashboard(),
  });

  const dashboard = dashboardQuery.data;

  return (
    <Stack spacing={2}>
      {dashboardQuery.isLoading ? <LinearProgress /> : null}

      <SuperAdminPageHeader
        eyebrow="Platform"
        subtitle="Bird's-eye view of agencies, revenue, and system health across the CRM."
        title={dashboard?.greeting ?? "Platform Overview"}
      />

      {dashboardQuery.isError ? (
        <Alert severity="warning">
          {getApiErrorMessage(dashboardQuery.error, "Unable to load platform dashboard.")}
        </Alert>
      ) : null}

      {dashboard ? (
        <>
          <PlatformKpiGrid kpis={dashboard.kpis} />

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <PlatformPanelCard title="Agency Growth">
                <PlatformBarChart points={dashboard.agencyGrowth} />
              </PlatformPanelCard>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <PlatformPanelCard title="Revenue Trend">
                <PlatformBarChart points={dashboard.revenueTrend} valueSuffix="L" />
              </PlatformPanelCard>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <PlatformPanelCard title="Visa Success Ratio">
                <PlatformBarChart points={dashboard.visaSuccessRatio} valueSuffix="%" />
              </PlatformPanelCard>
            </Grid>
          </Grid>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <PlatformPanelCard title="Latest Agencies">
                <Stack spacing={1}>
                  {dashboard.latestAgencies.map((agency) => (
                    <Box
                      key={agency.id}
                      component={RouterLink}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        color: "inherit",
                        display: "block",
                        p: 1.25,
                        textDecoration: "none",
                        "&:hover": { bgcolor: "#F0F9FA" },
                      }}
                      to={superAdminRoutePaths.agencyDetail(agency.id)}
                    >
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                        <Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{agency.name}</Typography>
                          <Typography color="text.secondary" sx={{ fontSize: 10 }}>
                            {agency.admin.email}
                          </Typography>
                        </Box>
                        <AgencyStatusChip status={agency.status} />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </PlatformPanelCard>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <PlatformPanelCard title="Recent Tickets">
                <Stack spacing={1}>
                  {dashboard.recentTickets.map((ticket) => (
                    <Box
                      key={ticket.id}
                      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.25 }}
                    >
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                        <Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{ticket.subject}</Typography>
                          <Typography color="text.secondary" sx={{ fontSize: 10 }}>
                            {ticket.agencyName}
                          </Typography>
                        </Box>
                        <Chip
                          color={ticket.priority === "high" ? "error" : ticket.priority === "medium" ? "warning" : "default"}
                          label={ticket.priority}
                          size="small"
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </PlatformPanelCard>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <PlatformPanelCard title="System Alerts">
                <Stack spacing={1}>
                  {dashboard.systemAlerts.map((alert) => (
                    <Alert key={alert.id} severity={alert.severity} sx={{ py: 0.5 }}>
                      <Typography sx={{ fontSize: 11 }}>{alert.message}</Typography>
                    </Alert>
                  ))}
                </Stack>
              </PlatformPanelCard>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <PlatformPanelCard title="Expiring Subscriptions">
                <Stack spacing={1}>
                  {dashboard.expiringSubscriptions.length === 0 ? (
                    <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                      No subscriptions expiring in the next 30 days.
                    </Typography>
                  ) : (
                    dashboard.expiringSubscriptions.map((agency) => (
                      <Box
                        key={agency.id}
                        component={RouterLink}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                          color: "inherit",
                          display: "block",
                          p: 1.25,
                          textDecoration: "none",
                          "&:hover": { bgcolor: "#F0F9FA" },
                        }}
                        to={superAdminRoutePaths.agencyDetail(agency.id)}
                      >
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                          <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{agency.name}</Typography>
                            <Typography color="text.secondary" sx={{ fontSize: 10 }}>
                              Ends {formatDate(agency.subscriptionEndsAt ?? agency.trialEndsAt)}
                            </Typography>
                          </Box>
                          <SubscriptionChip plan={agency.subscriptionPlan} />
                        </Stack>
                      </Box>
                    ))
                  )}
                </Stack>
              </PlatformPanelCard>
            </Grid>
          </Grid>
        </>
      ) : dashboardQuery.isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : null}
    </Stack>
  );
}
