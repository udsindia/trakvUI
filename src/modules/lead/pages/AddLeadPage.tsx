import { Box, Paper } from "@mui/material";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { AlertBanner } from "@/modules/lead/components/AlertBanner";
import { LeadForm } from "@/modules/lead/components/LeadForm";
import { leadFormOptions } from "@/modules/lead/leadForm.options";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { useLeadFormController } from "@/modules/lead/useLeadFormController";

export function AddLeadPage() {
  const { form, handleCancel, handleFormSubmit } = useLeadFormController();

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "#e9eff5",
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: {
          lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)`,
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
            options={leadFormOptions}
            onCancel={handleCancel}
            onSubmit={handleFormSubmit}
          />
        </Box>
      </Box>
    </Paper>
  );
}
