import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { saTeamApi, type TenantWipeReport } from "@/modules/sa-team/saTeamApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type TenantWipeDialogProps = {
  open: boolean;
  /**
   * "wipe" clears the tenant's records and keeps the workspace; "delete" removes the
   * tenant and everything of it. Same safeguards, different consequences, so one dialog.
   */
  mode?: "wipe" | "delete";
  tenantId: string;
  tenantName: string;
  onClose: () => void;
  onWiped: (report: TenantWipeReport) => void;
};

/**
 * Confirms clearing a tenant's records.
 *
 * Two things make this safe enough to expose at all. The counts are fetched from the
 * server before anything is destroyed, so nobody approves a number they have not seen;
 * and the tenant's name has to be typed, so reaching this dialog on the wrong row is not
 * enough to lose an agency's data. The server enforces the name too — this is the
 * courtesy copy of that check, not the check itself.
 */
export function TenantWipeDialog({
  open,
  mode = "wipe",
  tenantId,
  tenantName,
  onClose,
  onWiped,
}: TenantWipeDialogProps) {
  const [typedName, setTypedName] = useState("");
  const isDelete = mode === "delete";

  useEffect(() => {
    if (open) setTypedName("");
  }, [open, tenantId]);

  const previewQuery = useQuery({
    enabled: open && Boolean(tenantId),
    // Never cached: these counts are the basis for a destructive decision, so a stale
    // number from a previous visit would be worse than a spinner.
    gcTime: 0,
    staleTime: 0,
    queryKey: ["sa", `tenant-${mode}-preview`, tenantId],
    queryFn: () =>
      isDelete ? saTeamApi.previewTenantDelete(tenantId) : saTeamApi.previewTenantWipe(tenantId),
  });

  const wipeMutation = useMutation({
    mutationFn: () =>
      isDelete
        ? saTeamApi.deleteTenant(tenantId, typedName.trim())
        : saTeamApi.wipeTenantData(tenantId, typedName.trim()),
    onSuccess: (report) => onWiped(report),
  });

  const preview = previewQuery.data;
  const nameMatches = typedName.trim().toLowerCase() === tenantName.trim().toLowerCase();
  // A tenant always has something to delete - at least the tenant itself.
  const nothingToRemove = !isDelete && preview?.total === 0;

  // Only the rows that actually exist. A list of twenty zeroes buries the one number
  // that matters.
  const lines = useMemo(
    () =>
      Object.entries(preview?.counts ?? {}).filter(([, n]) => n > 0),
    [preview],
  );

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={wipeMutation.isPending ? undefined : onClose}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
        <WarningAmberRounded color="error" />
        {isDelete ? "Delete tenant" : "Clear tenant data"}
      </DialogTitle>

      <DialogContent>
        <Typography sx={{ mb: 2 }} variant="body2">
          {isDelete ? (
            <>
              This permanently deletes <strong>{tenantName}</strong>: the workspace, its users and
              settings, and all of its records. Its users can no longer sign in. It cannot be undone.
            </>
          ) : (
            <>
              This permanently removes the records below from <strong>{tenantName}</strong>. It
              cannot be undone.
            </>
          )}
        </Typography>

        {previewQuery.isLoading ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : previewQuery.isError ? (
          <Alert severity="error">
            {getApiErrorMessage(previewQuery.error, "Could not work out what would be removed.")}
          </Alert>
        ) : nothingToRemove ? (
          <Alert severity="success">
            This tenant has no records to clear. Nothing would be removed.
          </Alert>
        ) : (
          <Box
            sx={{
              border: "1px solid",
              borderColor: "#f0d3d3",
              borderRadius: "10px",
              bgcolor: "#fdf6f6",
              px: 2,
              py: 1.25,
            }}
          >
            {lines.map(([label, count]) => (
              <Stack
                key={label}
                direction="row"
                sx={{ justifyContent: "space-between", py: 0.35 }}
              >
                <Typography sx={{ fontSize: 13 }}>{label}</Typography>
                <Typography
                  sx={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
                >
                  {count}
                </Typography>
              </Stack>
            ))}
            <Divider sx={{ my: 0.75 }} />
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Total records</Typography>
              <Typography
                sx={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
              >
                {preview?.total ?? 0}
              </Typography>
            </Stack>
          </Box>
        )}

        <Typography color="text.secondary" sx={{ display: "block", mt: 2 }} variant="caption">
          {isDelete
            ? "Kept: shared system roles, and the super-admin audit log, which records this deletion."
            : "Kept: the workspace itself, its users and their roles, lead sources, application " +
              "stage sequences, and commission, WhatsApp and ad settings. Everyone can sign back " +
              "in straight away and find the tenant empty."}
        </Typography>

        {!nothingToRemove ? (
          <TextField
            fullWidth
            size="small"
            sx={{ mt: 2.5 }}
            label={`Type "${tenantName}" to confirm`}
            value={typedName}
            disabled={wipeMutation.isPending || previewQuery.isLoading}
            onChange={(event) => setTypedName(event.target.value)}
          />
        ) : null}

        {wipeMutation.isError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {getApiErrorMessage(
              wipeMutation.error,
              isDelete ? "Could not delete the tenant." : "Could not clear the tenant's data.",
            )}
          </Alert>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={wipeMutation.isPending} sx={{ textTransform: "none" }} onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          sx={{ textTransform: "none" }}
          disabled={!nameMatches || nothingToRemove || wipeMutation.isPending || previewQuery.isLoading}
          onClick={() => wipeMutation.mutate()}
        >
          {wipeMutation.isPending
            ? isDelete
              ? "Deleting…"
              : "Clearing…"
            : isDelete
              ? "Delete tenant"
              : `Clear ${preview?.total ?? 0} records`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
