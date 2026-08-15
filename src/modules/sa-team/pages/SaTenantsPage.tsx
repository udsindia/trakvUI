import BlockRounded from "@mui/icons-material/BlockRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SA_PERMISSIONS } from "@/modules/sa-team/SA_PERMISSIONS";
import type { TenantSummary } from "@/modules/sa-team/sa.types";
import { saAuthService } from "@/modules/sa-team/saAuthService";
import { saTeamApi } from "@/modules/sa-team/saTeamApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import { dataTableSx } from "@/shared/ui/tableStyles";

const SA_TEAL = "#0d7a7a";
const PLANS = ["STARTER", "TRIAL", "PRO", "ENTERPRISE"];

function PlanChip({ plan }: { plan: string }) {
  const colorMap: Record<string, "default" | "primary" | "warning" | "success"> = {
    STARTER: "default",
    TRIAL: "warning",
    PRO: "primary",
    ENTERPRISE: "success",
  };
  return (
    <Chip
      label={plan}
      size="small"
      color={colorMap[plan] ?? "default"}
      variant="outlined"
    />
  );
}

function TenantDrawer({
  tenant,
  onClose,
}: {
  tenant: TenantSummary | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [snack, setSnack] = useState<string | null>(null);
  const canSuspend = saAuthService.hasPermission(SA_PERMISSIONS.TENANTS_SUSPEND);
  const canChangePlan = saAuthService.hasPermission(SA_PERMISSIONS.PLAN_MANAGE);
  const [selectedPlan, setSelectedPlan] = useState(tenant?.plan ?? "");

  const suspendMut = useMutation({
    mutationFn: () => saTeamApi.suspendTenant(tenant!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sa", "tenants"] });
      queryClient.invalidateQueries({ queryKey: ["sa", "dashboard"] });
      setSnack("Tenant suspended");
      onClose();
    },
    onError: (err) => setSnack(getApiErrorMessage(err, "Failed to suspend tenant")),
  });

  const reactivateMut = useMutation({
    mutationFn: () => saTeamApi.reactivateTenant(tenant!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sa", "tenants"] });
      queryClient.invalidateQueries({ queryKey: ["sa", "dashboard"] });
      setSnack("Tenant reactivated");
      onClose();
    },
    onError: (err) => setSnack(getApiErrorMessage(err, "Failed to reactivate tenant")),
  });

  const planMut = useMutation({
    mutationFn: (plan: string) => saTeamApi.updateTenantPlan(tenant!.id, plan),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["sa", "tenants"] });
      queryClient.invalidateQueries({ queryKey: ["sa", "dashboard"] });
      setSnack(`Plan updated to ${updated.plan}`);
    },
    onError: (err) => setSnack(getApiErrorMessage(err, "Failed to update plan")),
  });

  if (!tenant) return null;

  return (
    <>
      <Drawer anchor="right" open={!!tenant} onClose={onClose} PaperProps={{ sx: { width: 380, p: 3 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{tenant.name}</Typography>
            <Button size="small" onClick={onClose} startIcon={<CloseRounded />}>
              Close
            </Button>
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <Row label="Admin Email" value={tenant.adminEmail ?? "—"} />
            <Row label="Slug" value={tenant.slug} />
            <Row label="Plan" value={<PlanChip plan={tenant.plan} />} />
            <Row
              label="Status"
              value={
                <Chip
                  label={tenant.active ? "Active" : "Suspended"}
                  size="small"
                  color={tenant.active ? "success" : "error"}
                />
              }
            />
            {tenant.city && <Row label="City" value={tenant.city} />}
            {tenant.state && <Row label="State" value={tenant.state} />}
            {tenant.country && <Row label="Country" value={tenant.country} />}
            {tenant.regId && <Row label="Reg ID" value={tenant.regId} />}
            <Row
              label="Created"
              value={new Date(tenant.createdAt).toLocaleDateString()}
            />
          </Stack>

          {canChangePlan && (
            <Box>
              <Typography gutterBottom variant="subtitle2">
                Change Plan
              </Typography>
              <Stack direction="row" spacing={1}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Plan</InputLabel>
                  <Select
                    label="Plan"
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                  >
                    {PLANS.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  disabled={selectedPlan === tenant.plan || planMut.isPending}
                  onClick={() => planMut.mutate(selectedPlan)}
                >
                  {planMut.isPending ? <CircularProgress size={16} /> : "Update"}
                </Button>
              </Stack>
            </Box>
          )}

          {canSuspend && (
            <Box>
              {tenant.active ? (
                <Button
                  fullWidth
                  color="error"
                  variant="outlined"
                  startIcon={<BlockRounded />}
                  disabled={suspendMut.isPending}
                  onClick={() => suspendMut.mutate()}
                >
                  {suspendMut.isPending ? "Suspending..." : "Suspend Tenant"}
                </Button>
              ) : (
                <Button
                  fullWidth
                  color="success"
                  variant="outlined"
                  startIcon={<CheckCircleRounded />}
                  disabled={reactivateMut.isPending}
                  onClick={() => reactivateMut.mutate()}
                >
                  {reactivateMut.isPending ? "Reactivating..." : "Reactivate Tenant"}
                </Button>
              )}
            </Box>
          )}
        </Stack>
      </Drawer>

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        message={snack}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

export function SaTenantsPage() {
  const [selected, setSelected] = useState<TenantSummary | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ["sa", "tenants"],
    queryFn: saTeamApi.listTenants,
  });

  if (tenantsQuery.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (tenantsQuery.isError) {
    return (
      <Alert severity="error">
        {getApiErrorMessage(tenantsQuery.error, "Failed to load tenants.")}
      </Alert>
    );
  }

  const tenants = tenantsQuery.data ?? [];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Tenants</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
          {tenants.length} tenant{tenants.length !== 1 ? "s" : ""} registered
        </Typography>
      </Box>

      <Box sx={{ overflowX: "auto" }}>
        <Table sx={dataTableSx}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Admin Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Slug</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((t) => (
              <TableRow
                key={t.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => setSelected(t)}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: SA_TEAL }}>
                    {t.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {t.adminEmail ?? "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {t.slug}
                  </Typography>
                </TableCell>
                <TableCell>
                  <PlanChip plan={t.plan} />
                </TableCell>
                <TableCell>
                  <Chip
                    label={t.active ? "Active" : "Suspended"}
                    size="small"
                    color={t.active ? "success" : "error"}
                  />
                </TableCell>
                <TableCell>{t.city ?? "—"}</TableCell>
                <TableCell>{t.country ?? "—"}</TableCell>
                <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {tenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  No tenants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <TenantDrawer
        key={selected?.id ?? "none"}
        tenant={selected}
        onClose={() => setSelected(null)}
      />
    </Stack>
  );
}
