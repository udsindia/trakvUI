import SaveRounded from "@mui/icons-material/SaveRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { TenantSummary } from "@/modules/sa-team/sa.types";
import { saTeamApi } from "@/modules/sa-team/saTeamApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

const SA_TEAL = "#0d7a7a";

const EMPTY_FORM = {
  pageId: "",
  formId: "",
  accessToken: "",
  isActive: true,
};

export function SaMetaAdsConfigPage() {
  const [selectedTenant, setSelectedTenant] = useState<TenantSummary | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ["sa", "tenants"],
    queryFn: saTeamApi.listTenants,
  });

  const configsQuery = useQuery({
    queryKey: ["sa", "ads-config", selectedTenant?.id],
    queryFn: () => saTeamApi.getTenantAdsConfig(selectedTenant!.id),
    enabled: !!selectedTenant,
  });

  const existingMeta = configsQuery.data?.find((c) => c.channel === "META");

  useEffect(() => {
    if (existingMeta) {
      setForm({
        pageId: existingMeta.metaPageId ?? "",
        formId: existingMeta.metaFormId ?? "",
        accessToken: "",
        isActive: existingMeta.isActive,
      });
    } else if (configsQuery.isFetched) {
      setForm(EMPTY_FORM);
    }
  }, [existingMeta, configsQuery.isFetched]);

  const saveMut = useMutation({
    mutationFn: () =>
      saTeamApi.saveTenantMetaAdsConfig(selectedTenant!.id, {
        pageId: form.pageId,
        formId: form.formId || undefined,
        accessToken: form.accessToken,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      setSnack({ msg: "Meta Ads config saved", severity: "success" });
      setForm((f) => ({ ...f, accessToken: "" }));
    },
    onError: (err) =>
      setSnack({ msg: getApiErrorMessage(err, "Failed to save config"), severity: "error" }),
  });

  function set(key: keyof typeof EMPTY_FORM, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSave =
    !!selectedTenant && !!form.pageId.trim() && !!form.accessToken.trim();

  return (
    <Stack spacing={4} sx={{ maxWidth: 700 }}>
      <Box>
        <Typography variant="h4">Meta Ads Config</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
          Configure Meta Lead Ads integration for a specific tenant.
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
          {configsQuery.isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Meta Lead Ads — {selectedTenant.name}
              </Typography>
              {existingMeta && (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Config exists for Page ID: <strong>{existingMeta.metaPageId}</strong>.
                  Enter a new access token to update it.
                </Alert>
              )}

              <TextField
                required
                label="Meta Page ID"
                value={form.pageId}
                onChange={(e) => set("pageId", e.target.value)}
                helperText="Facebook Page ID from Meta Business Suite"
              />
              <TextField
                label="Meta Lead Form ID"
                value={form.formId}
                onChange={(e) => set("formId", e.target.value)}
                helperText="Optional — filter to a specific lead form"
              />
              <TextField
                required
                label="Access Token"
                type="password"
                value={form.accessToken}
                onChange={(e) => set("accessToken", e.target.value)}
                helperText="Page access token with leads_retrieval permission"
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
