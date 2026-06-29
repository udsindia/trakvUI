import BusinessRounded from "@mui/icons-material/BusinessRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import PauseCircleRounded from "@mui/icons-material/PauseCircleRounded";
import VerifiedRounded from "@mui/icons-material/VerifiedRounded";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { saAuthService } from "@/modules/sa-team/saAuthService";
import { saTeamApi } from "@/modules/sa-team/saTeamApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import { SA_PERMISSIONS } from "@/modules/sa-team/SA_PERMISSIONS";

const SA_TEAL = "#0d7a7a";

function StatCard({
  label,
  value,
  isLoading,
  color,
}: {
  label: string;
  value: number | undefined;
  isLoading: boolean;
  color?: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3 }}
    >
      <Typography color="text.secondary" variant="overline">
        {label}
      </Typography>
      {isLoading ? (
        <CircularProgress size={24} sx={{ display: "block", mt: 1 }} />
      ) : (
        <Typography sx={{ fontWeight: 700, color: color ?? SA_TEAL }} variant="h3">
          {value ?? 0}
        </Typography>
      )}
    </Paper>
  );
}

export function SaDashboardPage() {
  const navigate = useNavigate();
  const session = saAuthService.restore();
  const canViewTenants = saAuthService.hasPermission(SA_PERMISSIONS.TENANTS_VIEW);

  const statsQuery = useQuery({
    queryKey: ["sa", "dashboard"],
    queryFn: saTeamApi.getDashboardStats,
    enabled: canViewTenants,
  });

  const stats = statsQuery.data;

  return (
    <Stack spacing={4}>
      <Box>
        <Typography color="text.secondary" variant="overline">
          Super Admin Portal
        </Typography>
        <Typography variant="h4">Dashboard</Typography>
        {session && (
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
            Signed in as <strong>{session.email}</strong> ·{" "}
            {session.role.replace(/_/g, " ")}
          </Typography>
        )}
      </Box>

      {statsQuery.isError && (
        <Alert severity="error">
          {getApiErrorMessage(statsQuery.error, "Unable to load dashboard data.")}
        </Alert>
      )}

      {canViewTenants && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Tenants"
              value={stats?.totalTenants}
              isLoading={statsQuery.isLoading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Active Tenants"
              value={stats?.activeTenants}
              isLoading={statsQuery.isLoading}
              color="#2e7d32"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Suspended Tenants"
              value={stats?.inactiveTenants}
              isLoading={statsQuery.isLoading}
              color="#c62828"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Trial Tenants"
              value={stats?.trialPlanTenants}
              isLoading={statsQuery.isLoading}
              color="#e65100"
            />
          </Grid>
        </Grid>
      )}

      {canViewTenants && stats && (
        <Box>
          <Typography gutterBottom color="text.secondary" variant="overline">
            Plan Distribution
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: "Starter", value: stats.starterPlanTenants },
              { label: "Trial", value: stats.trialPlanTenants },
              { label: "Pro", value: stats.proPlanTenants },
              { label: "Enterprise", value: stats.enterprisePlanTenants },
            ].map(({ label, value }) => (
              <Grid key={label} size={{ xs: 6, sm: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 2,
                    textAlign: "center",
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }} variant="h5">
                    {value}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Box>
        <Typography gutterBottom sx={{ fontWeight: 600 }} variant="subtitle1">
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          {canViewTenants && (
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
              >
                <CardActionArea onClick={() => navigate("/sa/tenants")} sx={{ p: 3 }}>
                  <CardContent sx={{ p: 0 }}>
                    <BusinessRounded sx={{ color: SA_TEAL, fontSize: 36, mb: 1 }} />
                    <Typography sx={{ fontWeight: 700 }} variant="h6">
                      Tenants
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      View, suspend, and manage all tenant accounts
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          )}
          {saAuthService.hasPermission(SA_PERMISSIONS.TENANTS_ONBOARD) && (
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
              >
                <CardActionArea onClick={() => navigate("/sa/onboard")} sx={{ p: 3 }}>
                  <CardContent sx={{ p: 0 }}>
                    <VerifiedRounded sx={{ color: SA_TEAL, fontSize: 36, mb: 1 }} />
                    <Typography sx={{ fontWeight: 700 }} variant="h6">
                      Onboard Tenant
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Manually register a new tenant on the platform
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          )}
          {saAuthService.hasPermission(SA_PERMISSIONS.USERS_MANAGE) && (
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
              >
                <CardActionArea onClick={() => navigate("/sa/team")} sx={{ p: 3 }}>
                  <CardContent sx={{ p: 0 }}>
                    <GroupsRounded sx={{ color: SA_TEAL, fontSize: 36, mb: 1 }} />
                    <Typography sx={{ fontWeight: 700 }} variant="h6">
                      SA Team
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Manage SA portal users and their roles
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          )}
          {!canViewTenants && !saAuthService.hasPermission(SA_PERMISSIONS.USERS_MANAGE) && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" icon={<PauseCircleRounded />}>
                You don&apos;t have permission to view tenant or team data.
                Contact an SA Owner to update your role.
              </Alert>
            </Grid>
          )}
        </Grid>
      </Box>
    </Stack>
  );
}
