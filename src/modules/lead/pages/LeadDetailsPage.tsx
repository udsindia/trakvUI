import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { leadApi } from "@/modules/lead/leadApi";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";

const stageColor: Record<string, { backgroundColor: string; color: string }> = {
  New: { backgroundColor: "#DEF1F0", color: "#0B6B6B" },
  Contacted: { backgroundColor: "#E4EDFC", color: "#0F5AD4" },
  Qualified: { backgroundColor: "#F3E7F8", color: "#7B1FA2" },
  Prospective: { backgroundColor: "#FDEEDD", color: "#B35A00" },
  Negotiation: { backgroundColor: "#FBF0DA", color: "#8A5B08" },
  Enrolled: { backgroundColor: "#E1F5EC", color: "#0B7A57" },
  Lost: { backgroundColor: "#FBE5E5", color: "#C0392F" },
  Archived: { backgroundColor: "#EEF2F6", color: "#55707C" },
};

function humanizeStage(raw?: string | null) {
  if (!raw) return "—";
  const s = raw.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

// Matches the "New Lead" quick-action button in the top bar (Topbar.tsx's
// primaryButtonSx), so the two "start a lead action" buttons read as one style.
const editLeadButtonSx = {
  background: (theme: Theme) =>
    `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 52%, ${theme.palette.primary.dark} 100%)`,
  border: "1px solid",
  borderColor: "primary.dark",
  borderRadius: "9px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 4px 13px rgba(243,129,24,.28)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  px: 1.75,
  py: 0.85,
  textTransform: "none",
  whiteSpace: "nowrap",
  "&:hover": {
    background: "linear-gradient(135deg, #FFAE59 0%, #FF952B 100%)",
    borderColor: "primary.main",
  },
} as const;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13.5 }}>{children || "—"}</Typography>
    </Stack>
  );
}

export function LeadDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermissions } = useAuth();
  const canEdit = hasPermissions([PERMISSIONS.LEAD_MANAGE]);

  const { data: lead, isLoading, isError } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => leadApi.getLeadDetails(id!),
    enabled: !!id,
  });

  const fullName = lead ? [lead.firstName, lead.lastName].filter(Boolean).join(" ") : "";
  const stage = humanizeStage(lead?.leadStage);
  const chipStyle = stageColor[stage] ?? {};
  const phone = lead
    ? [lead.countryCode, lead.phone].filter(Boolean).join(" ").trim() || "—"
    : "—";
  const countries = lead?.destinationCountries?.length ? lead.destinationCountries.join(", ") : "—";
  const intake = lead && (lead.targetIntakeMonth || lead.targetIntakeYear)
    ? [lead.targetIntakeMonth, lead.targetIntakeYear].filter(Boolean).join(" ")
    : "—";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0, height: `calc(100vh - ${NAVBAR_HEIGHT}px)`, overflow: "auto", px: { xs: 2, md: 3 }, py: 2 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Button
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate(leadRoutePaths.dashboard)}
          sx={{ textTransform: "none" }}
        >
          Back to Leads
        </Button>
        {canEdit && id ? (
          <Button
            startIcon={<EditRounded sx={{ fontSize: 16 }} />}
            onClick={() => navigate(leadRoutePaths.edit(id))}
            sx={editLeadButtonSx}
          >
            Edit Lead
          </Button>
        ) : null}
      </Stack>

      <PageHeader subtitle="CRM > Leads > Details" title={fullName || "Lead"} />

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : isError || !lead ? (
        <Alert severity="error">This lead could not be loaded, or you don't have access to it.</Alert>
      ) : (
        <Stack spacing={2}>
          <Card variant="outlined" sx={{ borderRadius: "12px" }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
                <Stack spacing={0.25}>
                  <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{fullName}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 13 }}>{lead.email || "—"}</Typography>
                </Stack>
                <Chip label={stage} size="small" sx={{ ...chipStyle, fontWeight: 600 }} />
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 6, md: 3 }}><Field label="Phone">{phone}</Field></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Field label="Countries of Interest">{countries}</Field></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Field label="Intake">{intake}</Field></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Field label="Score">{lead.score ?? "—"}</Field></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Field label="Field of Study">{lead.fieldOfStudy}</Field></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Field label="Study Level">{lead.currentStudyLevel}</Field></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Field label="Lead Source">{lead.sourceName}</Field></Grid>
                {lead.college ? (
                  <Grid size={{ xs: 6, md: 3 }}><Field label="College">{lead.college}</Field></Grid>
                ) : null}
                <Grid size={{ xs: 6, md: 3 }}><Field label="Assigned Agent">{lead.assignedToName}</Field></Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Field label="English Proficiency">
                    {lead.englishProficiencyTest
                      ? [lead.englishProficiencyTest, lead.englishProficiencyTestScore].filter(Boolean).join(" — ")
                      : "—"}
                  </Field>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}><Field label="WhatsApp Available">{lead.isWhatsAppAvailable ? "Yes" : "No"}</Field></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Field label="Created">{formatDateTime(lead.createdAt)}</Field></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Field label="Last Activity">{formatDateTime(lead.lastActivityAt)}</Field></Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: "12px" }}>
            <CardContent>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>Notes</Typography>
              <Typography color={lead.notes ? "text.primary" : "text.disabled"} sx={{ fontSize: 13.5, whiteSpace: "pre-wrap" }}>
                {lead.notes || "No notes for this lead."}
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
