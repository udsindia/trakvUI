import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel
} from "@mui/material";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { applicationsApi } from "@/modules/applications/applicationsApi";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";
import type { ApplicationStage, UpdateVisaPayload } from "@/modules/applications/applicationForm.types";

const STAGES: ApplicationStage[] = [
  "Draft",
  "Submitted",
  "Processing",
  "Visa Applied",
  "Visa Approved",
  "Completed",
];

export function ApplicationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: application, isLoading, isError } = useQuery({
    queryKey: ["application", id],
    queryFn: () => applicationsApi.getApplicationById(id!),
    enabled: !!id,
  });

  const updateStageMutation = useMutation({
    mutationFn: (newStage: ApplicationStage) => applicationsApi.updateApplication(id!, { stage: newStage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const updateVisaMutation = useMutation({
    mutationFn: (visaDetails: UpdateVisaPayload) => applicationsApi.updateVisaDetails(id!, visaDetails),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", id] });
    },
  });

  const [visaForm, setVisaForm] = useState<UpdateVisaPayload>({
    passportNumber: "",
    passportExpiryDate: "",
    submissionDate: "",
    biometricsDate: "",
    interviewDate: "",
    financialDocumentsProvided: false,
    notes: "",
  });

  useEffect(() => {
    if (application?.visaDetails) {
      setVisaForm(application.visaDetails);
    }
  }, [application]);

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
  }

  if (isError || !application) {
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><Typography color="error">Application not found.</Typography></Box>;
  }

  const activeStep = STAGES.indexOf(application.stage) !== -1 ? STAGES.indexOf(application.stage) : STAGES.length;

  const handleVisaSave = () => {
    updateVisaMutation.mutate(visaForm);
  };

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
        minHeight: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` },
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader
          subtitle="Applications > Details"
          title={`Application: ${application.studentName}`}
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
            {/* Pipeline Stage */}
            <Card elevation={0} sx={{ border: "1px solid #e9eff5", borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" mb={3}>Lifecycle Pipeline</Typography>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {STAGES.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
                
                <Box mt={4} display="flex" alignItems="center" gap={2}>
                  <Typography variant="body2" fontWeight="bold">Change Stage:</Typography>
                  <TextField
                    select
                    size="small"
                    value={application.stage}
                    onChange={(e) => updateStageMutation.mutate(e.target.value as ApplicationStage)}
                    sx={{ width: 200 }}
                  >
                    {[...STAGES, "Visa Rejected"].map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </TextField>
                  {updateStageMutation.isPending && <CircularProgress size={20} />}
                </Box>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                {/* Details Section */}
                <Card elevation={0} sx={{ border: "1px solid #e9eff5", borderRadius: 3, height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" mb={2}>Student & Course Info</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={2}>
                      <Typography variant="body2"><strong>Name:</strong> {application.studentName}</Typography>
                      <Typography variant="body2"><strong>Email:</strong> {application.email}</Typography>
                      <Typography variant="body2"><strong>Phone:</strong> {application.phone}</Typography>
                      <Typography variant="body2"><strong>Country:</strong> {application.targetCountry}</Typography>
                      <Typography variant="body2"><strong>University:</strong> {application.targetUniversity}</Typography>
                      <Typography variant="body2"><strong>Course:</strong> {application.course}</Typography>
                      <Typography variant="body2"><strong>Intake:</strong> {application.intakeMonth} {application.intakeYear}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                {/* Visa Processing Section */}
                <Card elevation={0} sx={{ border: "1px solid #e9eff5", borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" mb={2}>Visa Processing Details</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={2.5}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Passport Number"
                            size="small"
                            value={visaForm.passportNumber}
                            onChange={(e) => setVisaForm({ ...visaForm, passportNumber: e.target.value })}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Passport Expiry"
                            type="date"
                            size="small"
                            value={visaForm.passportExpiryDate}
                            onChange={(e) => setVisaForm({ ...visaForm, passportExpiryDate: e.target.value })}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Visa Submission Date"
                            type="date"
                            size="small"
                            value={visaForm.submissionDate || ""}
                            onChange={(e) => setVisaForm({ ...visaForm, submissionDate: e.target.value })}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Biometrics Date"
                            type="date"
                            size="small"
                            value={visaForm.biometricsDate || ""}
                            onChange={(e) => setVisaForm({ ...visaForm, biometricsDate: e.target.value })}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={visaForm.financialDocumentsProvided}
                                onChange={(e) => setVisaForm({ ...visaForm, financialDocumentsProvided: e.target.checked })}
                              />
                            }
                            label="Financial Documents Provided"
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            label="Visa Notes"
                            multiline
                            rows={3}
                            size="small"
                            value={visaForm.notes}
                            onChange={(e) => setVisaForm({ ...visaForm, notes: e.target.value })}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </Grid>
                      </Grid>
                      
                      <Box display="flex" justifyContent="flex-end">
                        <Button
                          variant="contained"
                          onClick={handleVisaSave}
                          disabled={updateVisaMutation.isPending}
                        >
                          {updateVisaMutation.isPending ? "Saving..." : "Save Visa Details"}
                        </Button>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}
