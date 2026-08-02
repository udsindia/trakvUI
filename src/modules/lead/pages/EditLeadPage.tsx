import { useMemo } from "react";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { AlertBanner } from "@/modules/lead/components/AlertBanner";
import { LeadForm } from "@/modules/lead/components/LeadForm";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { leadApi, type BackendLead } from "@/modules/lead/leadApi";
import { leadFormOptions } from "@/modules/lead/leadForm.options";
import type { AgentOption, LeadFormValues } from "@/modules/lead/leadForm.types";
import { useLeadFormController } from "@/modules/lead/useLeadFormController";
import { usersService } from "@/modules/settings/usersService";

const MONTH_INDEX: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

/** month name + year → "YYYY-MM-01" for the native date input; "" when unknown. */
function toIntakeDate(month: string | null, year: number | null): string {
  if (!month || !year) return "";
  const mm = MONTH_INDEX[month.trim().toLowerCase()];
  return mm ? `${year}-${mm}-01` : "";
}

function displayName(lead: BackendLead): string {
  const last = lead.lastName?.trim();
  return last && last !== lead.firstName ? `${lead.firstName} ${last}` : lead.firstName;
}

export function EditLeadPage() {
  const { id = "" } = useParams();
  const { tenant, hasPermissions } = useAuth();
  const tenantId = tenant?.tenantId ?? "";
  const canAssign = hasPermissions([PERMISSIONS.LEAD_ASSIGN]);

  // Identity / source / agent / countries come from the list row (already cached);
  // intake / courses / notes come from the detail endpoint. Together they prefill the form.
  const leadsQuery = useQuery({ queryKey: ["leads"], queryFn: leadApi.getLeads });
  const detailsQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ["lead", id, "details"],
    queryFn: () => leadApi.getLeadDetails(id),
  });
  const usersQuery = useQuery({
    enabled: Boolean(tenantId) && canAssign,
    queryKey: ["settings", "users", tenantId],
    queryFn: () => usersService.getUsers(tenantId),
  });

  const backendLead = useMemo(
    () => leadsQuery.data?.find((lead) => lead.id === id),
    [leadsQuery.data, id],
  );

  const agentOptions: AgentOption[] = useMemo(() => {
    const base = (usersQuery.data ?? [])
      .filter((user) => user.active)
      .map((user) => ({ agentId: user.id, agentName: user.name }));
    // Ensure the lead's current agent is always selectable even if inactive / not in the list.
    if (backendLead?.assignedToId && !base.some((a) => a.agentId === backendLead.assignedToId)) {
      base.unshift({
        agentId: backendLead.assignedToId,
        agentName: backendLead.assignedToName || "Current agent",
      });
    }
    return base;
  }, [usersQuery.data, backendLead]);

  const initialValues: LeadFormValues | undefined = useMemo(() => {
    if (!backendLead || !detailsQuery.data) return undefined;
    return {
      agent: backendLead.assignedToId ?? "",
      countries: backendLead.destinationCountries ?? [],
      courses: detailsQuery.data.courseInterests ?? [],
      email: backendLead.email ?? "",
      intakeDate: toIntakeDate(detailsQuery.data.targetIntakeMonth, detailsQuery.data.targetIntakeYear),
      name: displayName(backendLead),
      notes: detailsQuery.data.notes ?? "",
      phone: backendLead.phone ?? "",
      source: backendLead.sourceName ?? "",
      tags: [],
    };
  }, [backendLead, detailsQuery.data]);

  const { form, handleCancel, handleFormSubmit } = useLeadFormController(agentOptions, {
    leadId: id,
    initialValues,
  });

  // Ensure the current source is always a selectable option.
  const options = useMemo(() => {
    const sourceOptions = backendLead?.sourceName && !leadFormOptions.sourceOptions.includes(backendLead.sourceName)
      ? [backendLead.sourceName, ...leadFormOptions.sourceOptions]
      : leadFormOptions.sourceOptions;
    return { ...leadFormOptions, agentOptions, sourceOptions };
  }, [agentOptions, backendLead]);

  const isLoading = leadsQuery.isLoading || detailsQuery.isLoading;
  const notFound = !isLoading && !backendLead;

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
        minHeight: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 20}px)` },
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader subtitle="CRM > Leads" title="Edit Lead" />
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
          {isLoading || !initialValues ? (
            notFound ? (
              <Typography color="error" variant="body2">
                Lead not found, or you don't have access to it.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={32} />
              </Box>
            )
          ) : (
            <>
              <Box sx={{ mb: 2.5 }}>
                <AlertBanner />
              </Box>
              <LeadForm
                canAssign={canAssign}
                form={form}
                mode="edit"
                options={options}
                onCancel={handleCancel}
                onSubmit={handleFormSubmit}
              />
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
