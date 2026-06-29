import SaveRounded from "@mui/icons-material/SaveRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  isEmbeddedSignupConfigured,
  launchEmbeddedSignup,
} from "@/modules/sa-team/metaEmbeddedSignup";
import type { TenantSummary } from "@/modules/sa-team/sa.types";
import { saTeamApi } from "@/modules/sa-team/saTeamApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

const SA_TEAL = "#0d7a7a";

const EMPTY_FORM = {
  phoneNumberId: "",
  wabaId: "",
  accessToken: "",
  webhookVerifyToken: "",
  welcomeTemplateName: "welcome_lead",
  tenantDisplayName: "",
  isActive: false,
};

export function SaWhatsAppConfigPage() {
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<TenantSummary | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);
  const embeddedSignupAvailable = isEmbeddedSignupConfigured();

  const tenantsQuery = useQuery({
    queryKey: ["sa", "tenants"],
    queryFn: saTeamApi.listTenants,
  });

  const configQuery = useQuery({
    queryKey: ["sa", "whatsapp-config", selectedTenant?.id],
    queryFn: () => saTeamApi.getTenantWhatsAppConfig(selectedTenant!.id),
    enabled: !!selectedTenant,
  });

  useEffect(() => {
    if (configQuery.data) {
      const c = configQuery.data;
      setForm({
        phoneNumberId: c.phoneNumberId ?? "",
        wabaId: c.wabaId ?? "",
        accessToken: "",
        webhookVerifyToken: c.webhookVerifyToken ?? "",
        welcomeTemplateName: c.welcomeTemplateName ?? "welcome_lead",
        tenantDisplayName: c.tenantDisplayName ?? "",
        isActive: c.isActive,
      });
    } else if (configQuery.isFetched && !configQuery.data) {
      setForm(EMPTY_FORM);
    }
  }, [configQuery.data, configQuery.isFetched]);

  const saveMut = useMutation({
    mutationFn: () =>
      saTeamApi.saveTenantWhatsAppConfig(selectedTenant!.id, {
        phoneNumberId: form.phoneNumberId,
        wabaId: form.wabaId || undefined,
        accessToken: form.accessToken,
        webhookVerifyToken: form.webhookVerifyToken,
        welcomeTemplateName: form.welcomeTemplateName || undefined,
        tenantDisplayName: form.tenantDisplayName || undefined,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      setSnack({ msg: "WhatsApp config saved", severity: "success" });
      setForm((f) => ({ ...f, accessToken: "" }));
    },
    onError: (err) =>
      setSnack({ msg: getApiErrorMessage(err, "Failed to save config"), severity: "error" }),
  });

  const connectMut = useMutation({
    mutationFn: async () => {
      const result = await launchEmbeddedSignup();
      return saTeamApi.exchangeWhatsAppEmbeddedSignup(selectedTenant!.id, {
        code: result.code,
        wabaId: result.wabaId,
        phoneNumberId: result.phoneNumberId,
        tenantDisplayName: selectedTenant!.name,
      });
    },
    onSuccess: () => {
      setSnack({ msg: "WhatsApp connected via Embedded Signup", severity: "success" });
      queryClient.invalidateQueries({
        queryKey: ["sa", "whatsapp-config", selectedTenant?.id],
      });
    },
    onError: (err) =>
      setSnack({ msg: getApiErrorMessage(err, "Embedded Signup failed"), severity: "error" }),
  });

  function set(key: keyof typeof EMPTY_FORM, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSave =
    !!selectedTenant &&
    !!form.phoneNumberId.trim() &&
    !!form.accessToken.trim() &&
    !!form.webhookVerifyToken.trim();

  return (
    <Stack spacing={4} sx={{ maxWidth: 700 }}>
      <Box>
        <Typography variant="h4">WhatsApp Config</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
          Configure WhatsApp Business integration for a specific tenant.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Select Tenant
        </Typography>
        <Autocomplete
          options={tenantsQuery.data ?? []}
          getOptionLabel={(opt) => `${opt.name} (${opt.slug})`}
          loading={tenantsQuery.isLoading}
          value={selectedTenant}
          onChange={(_, v) => {
            setSelectedTenant(v);
            setForm(EMPTY_FORM);
          }}
          renderInput={(params) => (
            <TextField {...params} placeholder="Search tenant..." size="small" />
          )}
        />
      </Paper>

      {selectedTenant && (
        <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Automated Setup (Embedded Signup)
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Let the tenant connect their own WhatsApp Business account through
              Meta's popup. The token and IDs are captured and saved automatically —
              no manual entry needed.
            </Typography>
            {embeddedSignupAvailable ? (
              <Button
                variant="contained"
                startIcon={
                  connectMut.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <WhatsAppIcon />
                  )
                }
                disabled={connectMut.isPending}
                onClick={() => connectMut.mutate()}
                sx={{ bgcolor: "#25D366", "&:hover": { bgcolor: "#1da851" }, alignSelf: "flex-start" }}
              >
                {connectMut.isPending ? "Connecting..." : "Connect WhatsApp"}
              </Button>
            ) : (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                Set <strong>VITE_META_APP_ID</strong> and{" "}
                <strong>VITE_META_WA_CONFIG_ID</strong> in the frontend env to enable
                the Embedded Signup button.
              </Alert>
            )}
          </Stack>
        </Paper>
      )}

      {selectedTenant && (
        <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3 }}>
          {configQuery.isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                WhatsApp Business Config — {selectedTenant.name}
              </Typography>
              {configQuery.data && (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Config exists. Token masked: <strong>{configQuery.data.accessTokenMasked}</strong>
                  . Enter a new token to replace it.
                </Alert>
              )}

              <TextField
                required
                label="Phone Number ID"
                value={form.phoneNumberId}
                onChange={(e) => set("phoneNumberId", e.target.value)}
                helperText="From Meta WABA dashboard"
              />
              <TextField
                label="WABA ID"
                value={form.wabaId}
                onChange={(e) => set("wabaId", e.target.value)}
              />
              <TextField
                required
                label="Access Token"
                type="password"
                value={form.accessToken}
                onChange={(e) => set("accessToken", e.target.value)}
                helperText="System user permanent token from Meta"
              />
              <TextField
                required
                label="Webhook Verify Token"
                value={form.webhookVerifyToken}
                onChange={(e) => set("webhookVerifyToken", e.target.value)}
                helperText="Random string — paste in Meta Webhook setup"
              />

              <Divider />

              <TextField
                label="Welcome Template Name"
                value={form.welcomeTemplateName}
                onChange={(e) => set("welcomeTemplateName", e.target.value)}
              />
              <TextField
                label="Tenant Display Name"
                value={form.tenantDisplayName}
                onChange={(e) => set("tenantDisplayName", e.target.value)}
                helperText="Used as header {{1}} in template messages"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={(e) => set("isActive", e.target.checked)}
                    sx={{ "& .MuiSwitch-thumb": { bgcolor: form.isActive ? SA_TEAL : undefined } }}
                  />
                }
                label="Active"
              />

              <Button
                variant="contained"
                startIcon={saveMut.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
                disabled={!canSave || saveMut.isPending}
                onClick={() => saveMut.mutate()}
                sx={{ bgcolor: SA_TEAL, "&:hover": { bgcolor: "#0a6060" }, alignSelf: "flex-start" }}
              >
                {saveMut.isPending ? "Saving..." : "Save Config"}
              </Button>
            </Stack>
          )}
        </Paper>
      )}

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack?.severity ?? "info"} onClose={() => setSnack(null)}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
