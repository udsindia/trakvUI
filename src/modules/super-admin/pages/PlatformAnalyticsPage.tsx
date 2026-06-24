import { useQuery } from "@tanstack/react-query";
import { Alert, Grid, LinearProgress, Stack } from "@mui/material";
import {
  PlatformBarChart,
  PlatformKpiGrid,
  PlatformPanelCard,
} from "@/modules/super-admin/components/PlatformCharts";
import { SuperAdminPageHeader } from "@/modules/super-admin/components/SuperAdminPageHeader";
import { platformService } from "@/modules/super-admin/platformService";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

export function PlatformAnalyticsPage() {
  const analyticsQuery = useQuery({
    queryKey: ["super-admin", "analytics"],
    queryFn: () => platformService.getAnalytics(),
  });

  const analytics = analyticsQuery.data;

  return (
    <Stack spacing={2}>
      {analyticsQuery.isLoading ? <LinearProgress /> : null}

      <SuperAdminPageHeader
        eyebrow="Platform · Analytics"
        subtitle="Cross-tenant CRM metrics — leads, agencies, visas, and country-wise applications."
        title="Platform Analytics"
      />

      {analyticsQuery.isError ? (
        <Alert severity="warning">
          {getApiErrorMessage(analyticsQuery.error, "Unable to load platform analytics.")}
        </Alert>
      ) : null}

      {analytics ? (
        <>
          <PlatformKpiGrid kpis={analytics.kpis} />

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <PlatformPanelCard title="Lead Trends">
                <PlatformBarChart points={analytics.leadTrends} />
              </PlatformPanelCard>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <PlatformPanelCard title="Agency Growth">
                <PlatformBarChart points={analytics.agencyGrowth} />
              </PlatformPanelCard>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <PlatformPanelCard title="Visa Success Ratio">
                <PlatformBarChart points={analytics.visaSuccessRatio} valueSuffix="%" />
              </PlatformPanelCard>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <PlatformPanelCard title="Country-wise Applications">
                <PlatformBarChart points={analytics.countryApplications} />
              </PlatformPanelCard>
            </Grid>
          </Grid>
        </>
      ) : null}
    </Stack>
  );
}
