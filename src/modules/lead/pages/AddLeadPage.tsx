import { useMemo } from "react";
import { Box, Paper } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { AlertBanner } from "@/modules/lead/components/AlertBanner";
import { LeadForm } from "@/modules/lead/components/LeadForm";
import { leadFormOptions } from "@/modules/lead/leadForm.options";
import type { AgentOption } from "@/modules/lead/leadForm.types";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { useLeadFormController } from "@/modules/lead/useLeadFormController";
import { usersService } from "@/modules/settings/usersService";

export function AddLeadPage() {
  const { tenant } = useAuth();
  const tenantId = tenant?.tenantId ?? "";

  // Real team members (counsellors) added via User Management, so the
  // "Assigned Agent" field reflects who actually exists in the tenant.
  const usersQuery = useQuery({
    enabled: Boolean(tenantId),
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

  const options = useMemo(
    () => ({ ...leadFormOptions, agentOptions }),
    [agentOptions],
  );

  const { form, handleCancel, handleFormSubmit } = useLeadFormController(agentOptions);

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
