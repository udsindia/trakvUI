import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { OnboardTenantFormValues } from "@/modules/sa-team/sa.types";
import { saTeamApi } from "@/modules/sa-team/saTeamApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

const STEPS = ["Consultancy Details", "Admin User", "Review", "Done"];
const SA_TEAL = "#0d7a7a";

const EMPTY: OnboardTenantFormValues = {
  consultancyName: "",
  registrationID: "",
  consultancyAddress: "",
  consultancyCity: "",
  consultancyState: "",
  consultancyCountry: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <Stack direction="row" spacing={2}>
      <Typography sx={{ minWidth: 160 }} color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

export function SaOnboardTenantPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardTenantFormValues>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const onboardMut = useMutation({
    mutationFn: saTeamApi.onboardTenant,
    onSuccess: () => setStep(3),
    onError: (err) => setError(getApiErrorMessage(err, "Onboarding failed. Check the details and try again.")),
  });

  function set(key: keyof OnboardTenantFormValues, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canGoNext() {
    if (step === 0) return !!form.consultancyName.trim();
    if (step === 1) return !!form.firstName.trim() && !!form.email.trim();
    return true;
  }

  function handleNext() {
    if (step === 2) {
      setError(null);
      onboardMut.mutate(form);
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <Stack spacing={4} sx={{ maxWidth: 680 }}>
      <Box>
        <Typography variant="h4">Onboard Tenant</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
          Manually register a new consultancy on the platform.
        </Typography>
      </Box>

      <Stepper activeStep={step}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {step === 3 ? (
        <Paper
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 4, textAlign: "center" }}
        >
          <CheckCircleRounded sx={{ color: "#2e7d32", fontSize: 56, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Tenant Onboarded!
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
            <strong>{form.consultancyName}</strong> has been registered. The admin user{" "}
            <strong>{form.email}</strong> will receive a set-password email.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" sx={{ bgcolor: SA_TEAL }} onClick={() => navigate("/sa/tenants")}>
              View Tenants
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setForm(EMPTY);
                setStep(0);
              }}
            >
              Onboard Another
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 4 }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {step === 0 && (
            <Stack spacing={2.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Consultancy Details
              </Typography>
              <TextField
                required
                label="Consultancy Name"
                value={form.consultancyName}
                onChange={(e) => set("consultancyName", e.target.value)}
              />
              <TextField
                label="Registration ID"
                value={form.registrationID}
                onChange={(e) => set("registrationID", e.target.value)}
              />
              <TextField
                label="Address"
                value={form.consultancyAddress}
                onChange={(e) => set("consultancyAddress", e.target.value)}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="City"
                  value={form.consultancyCity}
                  onChange={(e) => set("consultancyCity", e.target.value)}
                />
                <TextField
                  fullWidth
                  label="State"
                  value={form.consultancyState}
                  onChange={(e) => set("consultancyState", e.target.value)}
                />
              </Stack>
              <TextField
                label="Country"
                value={form.consultancyCountry}
                onChange={(e) => set("consultancyCountry", e.target.value)}
              />
            </Stack>
          )}

          {step === 1 && (
            <Stack spacing={2.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Admin User
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  required
                  fullWidth
                  label="First Name"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                />
              </Stack>
              <TextField
                required
                type="email"
                label="Email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
              <TextField
                label="Phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Stack>
          )}

          {step === 2 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Review Details
              </Typography>
              <ReviewRow label="Consultancy Name" value={form.consultancyName} />
              <ReviewRow label="Registration ID" value={form.registrationID} />
              <ReviewRow label="Address" value={form.consultancyAddress} />
              <ReviewRow label="City" value={form.consultancyCity} />
              <ReviewRow label="State" value={form.consultancyState} />
              <ReviewRow label="Country" value={form.consultancyCountry} />
              <Box sx={{ my: 1, borderTop: "1px solid", borderColor: "divider" }} />
              <ReviewRow label="Admin First Name" value={form.firstName} />
              <ReviewRow label="Admin Last Name" value={form.lastName} />
              <ReviewRow label="Admin Email" value={form.email} />
              <ReviewRow label="Admin Phone" value={form.phone} />
            </Stack>
          )}

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
            <Button
              variant="outlined"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
            <Button
              variant="contained"
              disabled={!canGoNext() || onboardMut.isPending}
              onClick={handleNext}
              sx={{ bgcolor: SA_TEAL, "&:hover": { bgcolor: "#0a6060" } }}
            >
              {onboardMut.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : step === 2 ? (
                "Confirm & Onboard"
              ) : (
                "Next"
              )}
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
