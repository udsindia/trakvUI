import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Paper, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { LeadForm } from "@/modules/lead/components/LeadForm";
import { leadFormOptions } from "@/modules/lead/leadForm.options";
import { useCountryCatalog } from "@/modules/lead/useCountryCatalog";
import type { AgentOption } from "@/modules/lead/leadForm.types";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { leadApi } from "@/modules/lead/leadApi";
import {
  mapLeadDetailsToFormValues,
  useLeadFormController,
} from "@/modules/lead/useLeadFormController";
import { usersService } from "@/modules/settings/usersService";

export function EditLeadPage() {
  const { id } = useParams<{ id: string }>();
  const { tenant, hasPermissions } = useAuth();
  const tenantId = tenant?.tenantId ?? "";
  const canAssign = hasPermissions([PERMISSIONS.LEAD_ASSIGN]);

  const leadQuery = useQuery({
    queryKey: ["lead", id],
    queryFn: () => leadApi.getLeadDetails(id!),
    enabled: !!id,
  });

  const usersQuery = useQuery({
    enabled: Boolean(tenantId) && canAssign,
    queryKey: ["settings", "users", tenantId],
    queryFn: () => usersService.getUsers(tenantId),
  });

  const agentOptions: AgentOption[] = useMemo(
    () =>
      (usersQuery.data ?? [])
        .filter((user) => user.active)
        .map((user) => ({ agentId: user.id, agentName: user.name })),
    [usersQuery.data],
  );

  const { form, handleCancel, handleFormSubmit, isEditing } = useLeadFormController({
    agentOptions,
    editingLeadId: id,
  });

  // Pre-fill once the lead loads (the form starts with blank defaults synchronously).
  useEffect(() => {
    if (leadQuery.data) {
      form.reset(mapLeadDetailsToFormValues(leadQuery.data));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadQuery.data]);

  // The catalogue is the server's own list, so the form can only offer countries the
  // server will accept. Static options stand in until it loads, or if the call fails.
  const countryCatalog = useCountryCatalog();

  const options = useMemo(
    () => ({
      ...leadFormOptions,
      agentOptions,
      countryOptions: countryCatalog.data?.length
        ? countryCatalog.data
        : leadFormOptions.countryOptions,
    }),
    [agentOptions, countryCatalog.data],
  );

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "#e9eff5",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        minHeight: {
          lg: `calc(100vh - ${NAVBAR_HEIGHT + 20}px)`,
        },
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader subtitle="CRM > Leads > Edit" title="Edit Lead" />
      </Box>

      <Box
        sx={{
          bgcolor: "#fcfdff",
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          px: { xs: 2, md: 3.5 },
          py: { xs: 2.5, md: 3.5 },
        }}
      >
        <Box sx={{ marginInline: "auto", maxWidth: 920, width: "100%" }}>
          {leadQuery.isLoading ? (
            <Stack alignItems="center" sx={{ py: 8 }}>
              <CircularProgress />
            </Stack>
          ) : leadQuery.isError || !leadQuery.data ? (
            <Alert severity="error">
              This lead could not be loaded, or you don&apos;t have access to it.
            </Alert>
          ) : (
            <LeadForm
              canAssign={canAssign}
              form={form}
              isEditing={isEditing}
              options={options}
              onCancel={handleCancel}
              onSubmit={handleFormSubmit}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
}
