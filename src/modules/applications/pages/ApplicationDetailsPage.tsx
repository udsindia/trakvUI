import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { applicationsApi } from "@/modules/applications/applicationsApi";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";

const TERMINAL_OUTCOMES = [
  "OFFER_ACCEPTED",
  "ENROLLED",
  "OFFER_DECLINED",
  "VISA_REJECTED",
  "REJECTED",
  "WITHDRAWN",
];

const outcomeColor: Record<string, "default" | "success" | "info" | "warning" | "error"> = {
  IN_PROGRESS: "info",
  OFFER_ACCEPTED: "success",
  ENROLLED: "success",
  OFFER_DECLINED: "warning",
  WITHDRAWN: "default",
  VISA_REJECTED: "error",
  REJECTED: "error",
};

function humanize(value?: string | null) {
  return value ? value.replace(/_/g, " ") : "";
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function ApplicationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [moveNote, setMoveNote] = useState("");
  const [closeOutcome, setCloseOutcome] = useState("");
  const [closeReason, setCloseReason] = useState("");

  const { data: application, isLoading, isError } = useQuery({
    queryKey: ["application", id],
    queryFn: () => applicationsApi.getApplicationById(id!),
    enabled: !!id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["application", id, "history"],
    queryFn: () => applicationsApi.getHistory(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["application", id] });
    queryClient.invalidateQueries({ queryKey: ["applications"] });
  };

  const moveMutation = useMutation({
    mutationFn: (note: string) => applicationsApi.moveStage(id!, note),
    onSuccess: () => {
      invalidate();
      setMoveNote("");
    },
  });

  const closeMutation = useMutation({
    mutationFn: (vars: { outcome: string; reason: string }) =>
      applicationsApi.closeApplication(id!, vars.outcome, vars.reason),
    onSuccess: () => {
      invalidate();
      setCloseOutcome("");
      setCloseReason("");
    },
  });

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
  }
  if (isError || !application) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <Typography color="error">Application not found.</Typography>
      </Box>
    );
  }

  const stages = [...application.stages].sort((a, b) => a.stageOrder - b.stageOrder);
  const currentStage = stages.find((s) => s.id === application.currentStageId);
  const currentIndex = currentStage ? stages.indexOf(currentStage) : -1;
  const isClosed = application.outcome !== "IN_PROGRESS";
  const nextStage = currentStage
    ? stages.find((s) => s.stageOrder === currentStage.stageOrder + 1)
    : stages[0];
  const canMove = !isClosed && Boolean(nextStage) && moveNote.trim().length >= 10;

  const errorMessage = (e: unknown): string => {
    const anyE = e as { response?: { data?: { message?: string } }; message?: string };
    return anyE?.response?.data?.message ?? anyE?.message ?? "Something went wrong";
  };

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        minHeight: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` },
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader
          subtitle="Applications > Details"
          title={`${application.universityName} — ${application.courseName}`}
          actions={
            <Button variant="outlined" onClick={() => navigate(applicationsRoutePaths.dashboard)}>
              Back to List
            </Button>
          }
        />
      </Box>

      <Box sx={{ bgcolor: "#fcfdff", flex: 1, overflow: "auto", px: { xs: 2, md: 3.5 }, py: { xs: 2.5, md: 3.5 } }}>
        <Box sx={{ marginInline: "auto", maxWidth: 1000, width: "100%" }}>
          <Stack spacing={4}>
            {/* Lifecycle pipeline */}
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                  <Typography variant="h6">Lifecycle Pipeline</Typography>
                  <Chip
                    label={humanize(application.outcome)}
                    color={outcomeColor[application.outcome] ?? "default"}
                    size="small"
                  />
                </Stack>
                {stages.length > 0 ? (
                  <Stepper
                    activeStep={currentIndex < 0 ? 0 : currentIndex}
                    alternativeLabel
                    sx={{
                      // Cleared milestones read steel-teal; the stage in play
                      // takes the brand orange so "where are we now" is instant.
                      "& .MuiStepIcon-root.Mui-completed": { color: "secondary.main" },
                      "& .MuiStepIcon-root.Mui-active": { color: "primary.main" },
                      "& .MuiStepConnector-line": { borderColor: "divider" },
                      "& .MuiStepLabel-label": { fontSize: 11, fontWeight: 600 },
                      "& .MuiStepLabel-label.Mui-active": { fontWeight: 700 },
                    }}
                  >
                    {stages.map((s) => (
                      <Step key={s.id} completed={Boolean(s.exitedAt)}>
                        <StepLabel>{s.stageName}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    This application has no stages.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              {/* Read-only application info */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" mb={2}>Application Info</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1.5}>
                      <Typography variant="body2"><strong>University:</strong> {application.universityName}</Typography>
                      <Typography variant="body2"><strong>Course:</strong> {application.courseName}</Typography>
                      <Typography variant="body2"><strong>Study Level:</strong> {humanize(application.studyLevel) || "—"}</Typography>
                      <Typography variant="body2"><strong>Country:</strong> {application.destinationCountry || "—"}</Typography>
                      <Typography variant="body2"><strong>Intake:</strong> {application.intakeMonth} {application.intakeYear}</Typography>
                      <Typography variant="body2"><strong>Tuition (INR):</strong> {application.tuitionFeeInr ?? "—"}</Typography>
                      <Typography variant="body2"><strong>Application Fee (INR):</strong> {application.applicationFeeInr ?? 0}</Typography>
                      {application.notes && (
                        <Typography variant="body2"><strong>Notes:</strong> {application.notes}</Typography>
                      )}
                      {isClosed && application.outcomeReason && (
                        <Typography variant="body2"><strong>Outcome reason:</strong> {application.outcomeReason}</Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Actions: move stage / close */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2}>Update Stage</Typography>
                    <Divider sx={{ mb: 2 }} />

                    {isClosed ? (
                      <Alert severity="info">
                        This application is closed ({humanize(application.outcome)}) and is read-only.
                      </Alert>
                    ) : (
                      <Stack spacing={3}>
                        {/* Move to next stage */}
                        <Stack spacing={1.5}>
                          <Typography variant="subtitle2">
                            {nextStage ? `Move to: ${nextStage.stageName}` : "Already at the final stage"}
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            size="small"
                            label="Note"
                            placeholder="What changed? (min 10 characters)"
                            value={moveNote}
                            onChange={(e) => setMoveNote(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            disabled={!nextStage}
                          />
                          {moveMutation.isError && (
                            <Alert severity="error">{errorMessage(moveMutation.error)}</Alert>
                          )}
                          <Box display="flex" justifyContent="flex-end">
                            <Button
                              variant="contained"
                              disabled={!canMove || moveMutation.isPending}
                              onClick={() => moveMutation.mutate(moveNote.trim())}
                            >
                              {moveMutation.isPending ? "Moving..." : "Move to Next Stage"}
                            </Button>
                          </Box>
                        </Stack>

                        <Divider />

                        {/* Close application */}
                        <Stack spacing={1.5}>
                          <Typography variant="subtitle2">Close application</Typography>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Outcome"
                            value={closeOutcome}
                            onChange={(e) => setCloseOutcome(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                          >
                            <MenuItem disabled value="">Select outcome</MenuItem>
                            {TERMINAL_OUTCOMES.map((o) => (
                              <MenuItem key={o} value={o}>{humanize(o)}</MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            fullWidth
                            size="small"
                            label="Reason"
                            value={closeReason}
                            onChange={(e) => setCloseReason(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                          {closeMutation.isError && (
                            <Alert severity="error">{errorMessage(closeMutation.error)}</Alert>
                          )}
                          <Box display="flex" justifyContent="flex-end">
                            <Button
                              variant="outlined"
                              color="error"
                              disabled={!closeOutcome || closeMutation.isPending}
                              onClick={() => closeMutation.mutate({ outcome: closeOutcome, reason: closeReason })}
                            >
                              {closeMutation.isPending ? "Closing..." : "Close Application"}
                            </Button>
                          </Box>
                        </Stack>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Stage history */}
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>Stage History</Typography>
                <Divider sx={{ mb: 2 }} />
                {history.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">No history yet.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {history.map((h) => (
                      <Box key={h.id}>
                        <Typography variant="body2" fontWeight={600}>
                          {h.fromStageName ? `${h.fromStageName} → ` : ""}{h.toStageName}
                        </Typography>
                        {h.note && (
                          <Typography variant="body2" color="text.secondary">{h.note}</Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(h.changedAt)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}
