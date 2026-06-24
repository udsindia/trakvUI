import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AddRounded } from "@mui/icons-material";
import { Alert, Button, CircularProgress, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { AgencyTable } from "@/modules/super-admin/components/AgencyTable";
import { SuperAdminPageHeader } from "@/modules/super-admin/components/SuperAdminPageHeader";
import { agenciesService } from "@/modules/super-admin/agenciesService";
import { superAdminRoutePaths } from "@/modules/super-admin/superAdminRoutePaths";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

export function AgenciesListPage() {
  const queryClient = useQueryClient();

  const agenciesQuery = useQuery({
    queryKey: ["super-admin", "agencies"],
    queryFn: () => agenciesService.getAgencies(),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      agencyId,
      status,
    }: {
      agencyId: string;
      status: "active" | "inactive" | "suspended";
    }) => agenciesService.setStatus(agencyId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["super-admin", "agencies"] });
    },
  });

  return (
    <Stack spacing={3}>
      <SuperAdminPageHeader
        eyebrow="Platform · Agencies"
        subtitle="Create, verify, suspend, and manage consultancy tenants across the platform."
        title="Agency Management"
        actions={
          <Button
            component={RouterLink}
            startIcon={<AddRounded />}
            sx={{ textTransform: "none" }}
            to={superAdminRoutePaths.createAgency}
            variant="contained"
          >
            Create Agency
          </Button>
        }
      />

      {agenciesQuery.isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : null}

      {agenciesQuery.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(agenciesQuery.error, "Unable to load agencies.")}
        </Alert>
      ) : null}

      {statusMutation.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(statusMutation.error, "Unable to update agency status.")}
        </Alert>
      ) : null}

      {agenciesQuery.data ? (
        <AgencyTable
          agencies={agenciesQuery.data}
          onActivate={(agency) =>
            statusMutation.mutate({ agencyId: agency.id, status: "active" })
          }
          onDeactivate={(agency) =>
            statusMutation.mutate({ agencyId: agency.id, status: "inactive" })
          }
          onSuspend={(agency) =>
            statusMutation.mutate({ agencyId: agency.id, status: "suspended" })
          }
        />
      ) : null}
    </Stack>
  );
}
