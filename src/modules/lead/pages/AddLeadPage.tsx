import { useMemo } from "react";
import { Box, Paper } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { AlertBanner } from "@/modules/lead/components/AlertBanner";
import { LeadForm } from "@/modules/lead/components/LeadForm";
import { leadFormOptions } from "@/modules/lead/leadForm.options";
import { useCountryCatalog } from "@/modules/lead/useCountryCatalog";
import type { AgentOption } from "@/modules/lead/leadForm.types";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { useLeadFormController } from "@/modules/lead/useLeadFormController";
import { usersService } from "@/modules/settings/usersService";

export function AddLeadPage() {
  const { tenant, hasPermissions } = useAuth();
  const tenantId = tenant?.tenantId ?? "";
  // Only users who can assign leads see (and need) the agent list; others
  // (e.g. counsellors) can't read the team endpoint, so don't fetch it.
  const canAssign = hasPermissions([PERMISSIONS.LEAD_ASSIGN]);

  // Real team members (counsellors) added via User Management, so the
  // "Assigned Agent" field reflects who actually exists in the tenant.
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

  const { form, handleCancel, handleFormSubmit } = useLeadFormController({ agentOptions });

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
          // Topbar height + the <main> wrapper's vertical padding (py:1.25 → 20px).
          lg: `calc(100vh - ${NAVBAR_HEIGHT + 20}px)`,
        },
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader subtitle="CRM > Leads" title="Add New Lead" />
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
        <Box
          sx={{
            marginInline: "auto",
            maxWidth: 920,
            width: "100%",
          }}
        >
          <Box sx={{ mb: 2.5 }}>
            <AlertBanner />
          </Box>
          <LeadForm
            canAssign={canAssign}
            form={form}
            options={options}
            onCancel={handleCancel}
            onSubmit={handleFormSubmit}
          />
        </Box>
      </Box>
    </Paper>
  );
}
