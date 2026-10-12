import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import type { TenantSummary } from "@/modules/sa-team/sa.types";
import { saTeamApi, type TenantDetailsInput } from "@/modules/sa-team/saTeamApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type TenantEditDialogProps = {
  open: boolean;
  tenant: TenantSummary;
  onClose: () => void;
  onSaved: (updated: TenantSummary) => void;
};

const blankToNull = (value: string) => (value.trim() ? value.trim() : null);

/**
 * Corrects the details a tenant gave at onboarding. Plan and suspension have their own
 * controls in the drawer and are not edited here. The registration ID must stay unique;
 * the server says so if it is not.
 */
export function TenantEditDialog({ open, tenant, onClose, onSaved }: TenantEditDialogProps) {
  const [form, setForm] = useState({
    name: tenant.name ?? "",
    regId: tenant.regId ?? "",
    address: tenant.address ?? "",
    city: tenant.city ?? "",
    state: tenant.state ?? "",
    country: tenant.country ?? "",
  });

  const save = useMutation({
    mutationFn: () => {
      const details: TenantDetailsInput = {
        name: form.name.trim(),
        regId: blankToNull(form.regId),
        address: blankToNull(form.address),
        city: blankToNull(form.city),
        state: blankToNull(form.state),
        country: blankToNull(form.country),
      };
      return saTeamApi.updateTenantDetails(tenant.id, details);
    },
    onSuccess: onSaved,
  });

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: event.target.value }));

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={save.isPending ? undefined : onClose}>
      <DialogTitle>Edit tenant details</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Consultancy name" required size="small" value={form.name} onChange={set("name")} />
          <TextField label="Registration ID" size="small" value={form.regId} onChange={set("regId")} />
          <TextField label="Address" size="small" multiline minRows={2} value={form.address} onChange={set("address")} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="City" size="small" fullWidth value={form.city} onChange={set("city")} />
            <TextField label="State" size="small" fullWidth value={form.state} onChange={set("state")} />
          </Stack>
          <TextField label="Country" size="small" value={form.country} onChange={set("country")} />
          {save.isError ? (
            <Alert severity="error">{getApiErrorMessage(save.error, "Could not save the tenant's details.")}</Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={save.isPending} onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!form.name.trim() || save.isPending}
          onClick={() => save.mutate()}
          sx={{ textTransform: "none" }}
        >
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
