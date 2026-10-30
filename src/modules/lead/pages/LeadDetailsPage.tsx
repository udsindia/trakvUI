import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { leadApi } from "@/modules/lead/leadApi";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";
import { joinPhoneNumber } from "@/shared/utils/phone";
import { LeadActivityTimeline } from "@/modules/lead/components/LeadActivityTimeline";
import { AddTaskForRecordButton } from "@/modules/activities/components/AddTaskForRecordButton";
import { selectIsStudioTenant } from "@/app/auth/authSlice";
import { useAppSelector } from "@/app/store/hooks";
import { leadStagesFor } from "@/modules/lead/components/LeadTableContainer";
import { fromBackendLeadStage } from "@/modules/lead/leadStageMappers";
import { useLeadStageChange } from "@/modules/lead/hooks/useLeadStageChange";
import { LeadNoteComposer } from "@/modules/lead/components/LeadNoteComposer";
import {
  INTEREST_LEVELS,
  bookingFrequencyLabel,
  interestLevelOption,
} from "@/modules/lead/studioLeadFields";

const stageColor: Record<string, { backgroundColor: string; color: string }> = {
  New: { backgroundColor: "#DEF1F0", color: "#0B6B6B" },
  Contacted: { backgroundColor: "#E4EDFC", color: "#0F5AD4" },
  Qualified: { backgroundColor: "#F3E7F8", color: "#7B1FA2" },
  Prospective: { backgroundColor: "#FDEEDD", color: "#B35A00" },
  Negotiation: { backgroundColor: "#FBF0DA", color: "#8A5B08" },
  Quoted: { backgroundColor: "#FDEEDD", color: "#B35A00" },
  Enrolled: { backgroundColor: "#E1F5EC", color: "#0B7A57" },
  Booked: { backgroundColor: "#E1F5EC", color: "#0B7A57" },
  Dead: { backgroundColor: "#E8EBEE", color: "#4A5A66" },
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
  const canLogActivity = hasPermissions([PERMISSIONS.ACTIVITY_LOG]);
  const queryClient = useQueryClient();
  const [interestSaving, setInterestSaving] = useState(false);
  const [interestError, setInterestError] = useState<string | null>(null);

  const { data: lead, isLoading, isError } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => leadApi.getLeadDetails(id!),
    enabled: !!id,
  });

  const fullName = lead ? [lead.firstName, lead.lastName].filter(Boolean).join(" ") : "";
  const { requestStageChange, dialogs, lastMessage, clearLastMessage } = useLeadStageChange();
  const isStudio = useAppSelector(selectIsStudioTenant);
  const stageOptions = leadStagesFor(isStudio);
  const stage =
    isStudio && lead?.leadStage ? fromBackendLeadStage(lead.leadStage, true) : humanizeStage(lead?.leadStage);
  const chipStyle = stageColor[stage] ?? {};
  const phone = lead
    ? joinPhoneNumber(lead.phoneCountryCode, lead.phone) || "—"
    : "—";
  const interest = interestLevelOption(lead?.interestLevel);

  // Set straight from the page: it is a judgement made while reading the lead, and sending
  // someone to the edit form for one dropdown is how it stops being kept up to date.
  const changeInterest = async (value: string) => {
    if (!lead) return;
    setInterestSaving(true);
    setInterestError(null);
    try {
      await leadApi.updateLead(lead.id, { interestLevel: value });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lead", lead.id] }),
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
      ]);
    } catch {
      setInterestError("The interest level could not be saved. Please try again.");
    } finally {
      setInterestSaving(false);
    }
  };
  const countries = lead?.destinationCountries?.length ? lead.destinationCountries.join(", ") : "—";
  const intake = lead && (lead.targetIntakeMonth || lead.targetIntakeYear)
    ? [lead.targetIntakeMonth, lead.targetIntakeYear].filter(Boolean).join(" ")
    : "—";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0, height: `calc(100vh - ${NAVBAR_HEIGHT}px)`, overflow: "auto", px: { xs: 2, md: 3 }, py: 2 }}>
      {dialogs}
      <Snackbar
        autoHideDuration={3000}
        message={lastMessage}
        open={Boolean(lastMessage)}
        onClose={clearLastMessage}
      />
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
                {/*
                  The stage lived only on the list, so reading a lead and then moving it
                  meant going back out to find the row again. It is a dropdown here, going
                  through the same dialogs the list uses.
                */}
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                {isStudio ? (
                  <TextField
                    select
                    disabled={!canEdit || interestSaving}
                    label="Interest"
                    size="small"
                    sx={{
                      minWidth: 170,
                      "& .MuiSelect-select": interest ? { color: interest.color, fontWeight: 600 } : {},
                    }}
                    value={interest?.value ?? ""}
                    onChange={(event) => void changeInterest(event.target.value)}
                  >
                    <MenuItem value="">
                      <em>Not judged yet</em>
                    </MenuItem>
                    {INTEREST_LEVELS.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        {level.label}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : null}
                <TextField
                  select
                  label={isStudio ? "Stage" : undefined}
                  size="small"
                  sx={{ minWidth: 170 }}
                  value={stage}
                  onChange={(event) =>
                    void requestStageChange({
                      leadId: lead.id,
                      leadName: fullName || "this lead",
                      stage: event.target.value,
                    })
                  }
                >
                  {stageOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                  {/* A stage the pipeline no longer offers still has to render its own
                      current value, or the dropdown would show empty. */}
                  {stageOptions.includes(stage) ? null : (
                    <MenuItem value={stage}>{stage}</MenuItem>
                  )}
                </TextField>
                </Stack>
              </Stack>
              {interestError ? (
                <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setInterestError(null)}>
                  {interestError}
                </Alert>
              ) : null}

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 6, md: 3 }}><Field label="Phone">{phone}</Field></Grid>
                {isStudio ? (
                  <>
                    <Grid size={{ xs: 6, md: 3 }}><Field label="Requirement">{lead.serviceRequirement}</Field></Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Field label="One-time or Recurring">{bookingFrequencyLabel(lead.bookingFrequency)}</Field>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid size={{ xs: 6, md: 3 }}><Field label="Countries of Interest">{countries}</Field></Grid>
                    <Grid size={{ xs: 6, md: 3 }}><Field label="Intake">{intake}</Field></Grid>
                  </>
                )}
                <Grid size={{ xs: 6, md: 3 }}><Field label="Score">{lead.score ?? "—"}</Field></Grid>
                {isStudio ? null : (
                  <>
                    <Grid size={{ xs: 6, md: 3 }}><Field label="Field of Study">{lead.fieldOfStudy}</Field></Grid>
                    <Grid size={{ xs: 6, md: 3 }}><Field label="Study Level">{lead.currentStudyLevel}</Field></Grid>
                  </>
                )}
                <Grid size={{ xs: 6, md: 3 }}><Field label="Lead Source">{lead.sourceName}</Field></Grid>
                {lead.college ? (
                  <Grid size={{ xs: 6, md: 3 }}><Field label="College">{lead.college}</Field></Grid>
                ) : null}
                <Grid size={{ xs: 6, md: 3 }}><Field label="Assigned Agent">{lead.assignedToName}</Field></Grid>
                {isStudio ? null : (
                <Grid size={{ xs: 6, md: 3 }}>
                  <Field label="English Proficiency">
                    {lead.englishProficiencyTest
                      ? [lead.englishProficiencyTest, lead.englishProficiencyTestScore].filter(Boolean).join(" — ")
                      : "—"}
                  </Field>
                </Grid>
                )}
                <Grid size={{ xs: 6, md: 3 }}><Field label="WhatsApp Available">{lead.isWhatsAppAvailable ? "Yes" : "No"}</Field></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Field label="Created">{formatDateTime(lead.createdAt)}</Field></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Field label="Last Activity">{formatDateTime(lead.lastActivityAt)}</Field></Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: "12px" }}>
            <CardContent>
              {/* The lead's standing description. The WhatsApp chat's answers land here too;
                  dated notes go on the timeline below. */}
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>
                {isStudio ? "Enquiry details" : "Notes"}
              </Typography>
              <Typography color={lead.notes ? "text.primary" : "text.disabled"} sx={{ fontSize: 13.5, whiteSpace: "pre-wrap" }}>
                {lead.notes || "No notes for this lead."}
              </Typography>
            </CardContent>
          </Card>

          {/*
            Under the notes, because they answer the same question from two directions:
            the note is what someone wrote about this lead, this is what has been done to
            it. The students and applications pages carry the same pairing.
          */}
          <Card variant="outlined" sx={{ borderRadius: "12px" }}>
            <CardContent>
              <Stack
                direction="row"
                sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                  Notes, Tasks &amp; Activity
                </Typography>
                <AddTaskForRecordButton
                  entityId={lead.id}
                  entityType="LEAD"
                  label={`${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "This lead"}
                />
              </Stack>
              {canLogActivity ? (
                <>
                  <LeadNoteComposer leadId={lead.id} />
                  <Divider sx={{ my: 2 }} />
                </>
              ) : null}
              <LeadActivityTimeline leadId={lead.id} />
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
