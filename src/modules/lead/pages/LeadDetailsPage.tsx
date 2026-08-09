import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
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
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { leadApi } from "@/modules/lead/leadApi";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";

const stageColor: Record<string, { backgroundColor: string; color: string }> = {
  New: { backgroundColor: "#DEF1F0", color: "#0B6B6B" },
  Contacted: { backgroundColor: "#E4EDFC", color: "#0F5AD4" },
  Qualified: { backgroundColor: "#F3E7F8", color: "#7B1FA2" },
  Proposal: { backgroundColor: "#FDEEDD", color: "#B35A00" },
  Negotiation: { backgroundColor: "#FBF0DA", color: "#8A5B08" },
  Converted: { backgroundColor: "#E1F5EC", color: "#0B7A57" },
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
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Button
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate(leadRoutePaths.dashboard)}
          sx={{ textTransform: "none" }}
        >
          Back to Leads
        </Button>
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
                <Grid size={{ xs: 6, md: 3 }}><Field label="Assigned Agent">{lead.assignedToName}</Field></Grid>
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
