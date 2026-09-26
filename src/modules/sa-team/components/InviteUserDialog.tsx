import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InviteSaUserFormValues } from "@/modules/sa-team/sa.types";
import { saTeamApi } from "@/modules/sa-team/saTeamApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type InviteUserDialogProps = {
  open: boolean;
  onClose: () => void;
};

const SA_TEAL = "#0d7a7a";

export function InviteUserDialog({ open, onClose }: InviteUserDialogProps) {
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ["sa-team", "roles"],
    queryFn: saTeamApi.listRoles,
    enabled: open,
  });

  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<InviteSaUserFormValues>({
    defaultValues: { firstName: "", lastName: "", email: "", saRoleId: "" },
  });

  const inviteMutation = useMutation({
    mutationFn: (values: InviteSaUserFormValues) => saTeamApi.inviteUser(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sa-team", "users"] });
      reset();
      onClose();
    },
  });

  function handleClose() {
    reset();
    inviteMutation.reset();
    onClose();
  }

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={handleClose}>
      <DialogTitle>Invite SA User</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="invite-sa-user-form"
          spacing={2.5}
          sx={{ pt: 1 }}
          onSubmit={handleSubmit((values) => inviteMutation.mutate(values))}
        >
          {inviteMutation.isError && (
            <Alert severity="error">
              {getApiErrorMessage(inviteMutation.error, "Failed to send invitation.")}
            </Alert>
          )}

          <Controller
            control={control}
            name="firstName"
            rules={{ required: "First name is required" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="First Name"
                required
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field }) => (
              <TextField {...field} fullWidth label="Last Name" />
            )}
          />

          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="Email"
                required
                type="email"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="saRoleId"
            rules={{ required: "Role is required" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Role"
                required
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                disabled={rolesQuery.isLoading}
              >
                {(rolesQuery.data ?? []).map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.displayName}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting || inviteMutation.isPending}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="invite-sa-user-form"
          variant="contained"
          disabled={isSubmitting || inviteMutation.isPending}
          startIcon={inviteMutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ bgcolor: SA_TEAL, "&:hover": { bgcolor: "#0a6060" } }}
        >
          {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
