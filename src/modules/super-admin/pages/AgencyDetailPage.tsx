import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  AgencyStatusChip,
  formatAgencyLocation,
  formatDate,
  SubscriptionChip,
  VerificationChip,
} from "@/modules/super-admin/components/AgencyStatusChip";
import { SuperAdminPageHeader } from "@/modules/super-admin/components/SuperAdminPageHeader";
import { agenciesService } from "@/modules/super-admin/agenciesService";
import { superAdminRoutePaths } from "@/modules/super-admin/superAdminRoutePaths";
import type { SubscriptionPlan } from "@/modules/super-admin/superAdmin.types";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

const PLAN_OPTIONS: SubscriptionPlan[] = ["trial", "starter", "professional", "enterprise"];

export function AgencyDetailPage() {
  const { agencyId = "" } = useParams();
  const queryClient = useQueryClient();
  const [trialEndsAt, setTrialEndsAt] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>("professional");
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState("");

  const agencyQuery = useQuery({
    enabled: Boolean(agencyId),
    queryKey: ["super-admin", "agencies", agencyId],
    queryFn: () => agenciesService.getAgency(agencyId),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["super-admin", "agencies"] });
    await queryClient.invalidateQueries({ queryKey: ["super-admin", "agencies", agencyId] });
  };

  const statusMutation = useMutation({
    mutationFn: (status: "active" | "inactive" | "suspended") =>
      agenciesService.setStatus(agencyId, status),
    onSuccess: invalidate,
  });

  const verifyMutation = useMutation({
    mutationFn: (verificationStatus: "verified" | "rejected") =>
      agenciesService.verifyAgency(agencyId, verificationStatus),
    onSuccess: invalidate,
  });

  const trialMutation = useMutation({
    mutationFn: () => agenciesService.updateTrial(agencyId, { trialEndsAt }),
    onSuccess: invalidate,
  });

  const subscriptionMutation = useMutation({
    mutationFn: () =>
      agenciesService.updateSubscription(agencyId, {
        plan: subscriptionPlan,
        subscriptionEndsAt,
      }),
    onSuccess: invalidate,
  });

  const agency = agencyQuery.data;
  const mutationError =
    statusMutation.error ??
    verifyMutation.error ??
    trialMutation.error ??
    subscriptionMutation.error;

  if (agencyQuery.isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (agencyQuery.isError || !agency) {
    return (
      <Alert severity="error">
        {getApiErrorMessage(agencyQuery.error, "Unable to load agency details.")}
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <SuperAdminPageHeader
        eyebrow="Platform · Agencies"
        title={agency.name}
        subtitle={`Registered ${formatDate(agency.createdAt)} · ${formatAgencyLocation(agency)}`}
        actions={
          <Button
            component={RouterLink}
            sx={{ textTransform: "none" }}
            to={superAdminRoutePaths.agencies}
            variant="outlined"
          >
            Back to Agencies
          </Button>
        }
      />

      {mutationError ? (
        <Alert severity="error">
          {getApiErrorMessage(mutationError, "Unable to update agency.")}
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
              <CardContent>
                <Typography sx={{ fontWeight: 700, mb: 2 }} variant="h6">
                  Agency Profile
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography color="text.secondary" variant="caption">
                      Registration ID
                    </Typography>
                    <Typography>{agency.registrationId}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography color="text.secondary" variant="caption">
                      Address
                    </Typography>
                    <Typography>{agency.address || "—"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography color="text.secondary" variant="caption">
                      Users
                    </Typography>
                    <Typography>{agency.userCount}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography color="text.secondary" variant="caption">
                      Students
                    </Typography>
                    <Typography>{agency.studentCount}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography color="text.secondary" variant="caption">
                      Applications
                    </Typography>
                    <Typography>{agency.applicationCount}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
              <CardContent>
                <Typography sx={{ fontWeight: 700, mb: 2 }} variant="h6">
                  Admin Contact
                </Typography>
                <Typography>
                  {agency.admin.firstName} {agency.admin.lastName}
                </Typography>
                <Typography color="text.secondary">{agency.admin.email}</Typography>
                <Typography color="text.secondary">{agency.admin.phone}</Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
              <CardContent>
                <Typography sx={{ fontWeight: 700, mb: 1.5 }} variant="subtitle1">
                  Status & Verification
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
                  <AgencyStatusChip status={agency.status} />
                  <VerificationChip status={agency.verificationStatus} />
                  <SubscriptionChip plan={agency.subscriptionPlan} />
                </Stack>
                <Stack spacing={1}>
                  {agency.status !== "suspended" ? (
                    <Button
                      color="error"
                      disabled={statusMutation.isPending}
                      sx={{ textTransform: "none" }}
                      variant="outlined"
                      onClick={() => statusMutation.mutate("suspended")}
                    >
                      Suspend Agency
                    </Button>
                  ) : (
                    <Button
                      disabled={statusMutation.isPending}
                      sx={{ textTransform: "none" }}
                      variant="contained"
                      onClick={() => statusMutation.mutate("active")}
                    >
                      Activate Agency
                    </Button>
                  )}
                  {agency.status === "active" ? (
                    <Button
                      disabled={statusMutation.isPending}
                      sx={{ textTransform: "none" }}
                      variant="outlined"
                      onClick={() => statusMutation.mutate("inactive")}
                    >
                      Deactivate Agency
                    </Button>
                  ) : agency.status === "inactive" ? (
                    <Button
                      disabled={statusMutation.isPending}
                      sx={{ textTransform: "none" }}
                      variant="outlined"
                      onClick={() => statusMutation.mutate("active")}
                    >
                      Reactivate Agency
                    </Button>
                  ) : null}
                  {agency.verificationStatus === "pending" ? (
                    <>
                      <Divider />
                      <Button
                        disabled={verifyMutation.isPending}
                        sx={{ textTransform: "none" }}
                        variant="contained"
                        onClick={() => verifyMutation.mutate("verified")}
                      >
                        Verify Agency
                      </Button>
                      <Button
                        color="error"
                        disabled={verifyMutation.isPending}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                        onClick={() => verifyMutation.mutate("rejected")}
                      >
                        Reject Verification
                      </Button>
                    </>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
              <CardContent>
                <Typography sx={{ fontWeight: 700, mb: 1.5 }} variant="subtitle1">
                  Trial Management
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">
                  Current trial ends: {formatDate(agency.trialEndsAt)}
                </Typography>
                <TextField
                  fullWidth
                  label="Trial End Date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ mb: 1.5 }}
                  type="date"
                  value={trialEndsAt || agency.trialEndsAt || ""}
                  onChange={(event) => setTrialEndsAt(event.target.value)}
                />
                <Button
                  disabled={trialMutation.isPending || !trialEndsAt}
                  fullWidth
                  sx={{ textTransform: "none" }}
                  variant="outlined"
                  onClick={() => trialMutation.mutate()}
                >
                  Update Trial
                </Button>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
              <CardContent>
                <Typography sx={{ fontWeight: 700, mb: 1.5 }} variant="subtitle1">
                  Subscription Management
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">
                  Current plan ends: {formatDate(agency.subscriptionEndsAt)}
                </Typography>
                <TextField
                  fullWidth
                  label="Plan"
                  select
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ mb: 1.5 }}
                  value={subscriptionPlan}
                  onChange={(event) => setSubscriptionPlan(event.target.value as SubscriptionPlan)}
                >
                  {PLAN_OPTIONS.map((plan) => (
                    <MenuItem key={plan} value={plan}>
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Subscription End Date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ mb: 1.5 }}
                  type="date"
                  value={subscriptionEndsAt || agency.subscriptionEndsAt || ""}
                  onChange={(event) => setSubscriptionEndsAt(event.target.value)}
                />
                <Button
                  disabled={subscriptionMutation.isPending || !subscriptionEndsAt}
                  fullWidth
                  sx={{ textTransform: "none" }}
                  variant="contained"
                  onClick={() => subscriptionMutation.mutate()}
                >
                  Update Subscription
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
