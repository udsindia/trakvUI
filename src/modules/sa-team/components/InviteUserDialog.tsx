import { useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InviteSaUserFormValues } from "@/modules/sa-team/sa.types";
import { saTeamApi } from "@/modules/sa-team/saTeamApi";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to send invitation. Please try again.";
}

type InviteUserDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function InviteUserDialog({ open, onClose }: InviteUserDialogProps) {
  const queryClient = useQueryClient();
  const [successOpen, setSuccessOpen] = useState(false);

  const rolesQuery = useQuery({
    queryKey: ["sa-team", "roles"],
    queryFn: () => saTeamApi.listRoles(),
    enabled: open,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteSaUserFormValues>({
    defaultValues: { firstName: "", lastName: "", email: "", saRoleId: "" },
  });

  const inviteMutation = useMutation({
    mutationFn: (values: InviteSaUserFormValues) => saTeamApi.inviteUser(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sa-team", "users"] });
      reset();
      onClose();
      setSuccessOpen(true);
    },
  });

  const handleClose = () => {
    reset();
    inviteMutation.reset();
    onClose();
  };

  const onSubmit = (values: InviteSaUserFormValues) => {
    inviteMutation.mutate(values);
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "background.paper",
      borderRadius: 2.5,
    },
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Invite SA Team User</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {inviteMutation.isError ? (
              <Alert severity="error">
                {getErrorMessage(inviteMutation.error)}
              </Alert>
            ) : null}

            <Controller
              control={control}
              name="firstName"
              rules={{ required: "First name is required." }}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={Boolean(errors.firstName)}
                  fullWidth
                  helperText={errors.firstName?.message}
                  label="First Name"
                  required
                  sx={fieldSx}
                />
              )}
            />

            <Controller
              control={control}
              name="lastName"
              rules={{ required: "Last name is required." }}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={Boolean(errors.lastName)}
                  fullWidth
                  helperText={errors.lastName?.message}
                  label="Last Name"
                  required
                  sx={fieldSx}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address.",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={Boolean(errors.email)}
                  fullWidth
                  helperText={errors.email?.message}
                  label="Email"
                  required
                  type="email"
                  sx={fieldSx}
                />
              )}
            />

            <Controller
              control={control}
              name="saRoleId"
              rules={{ required: "Role is required." }}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={Boolean(errors.saRoleId)}
                  fullWidth
                  helperText={errors.saRoleId?.message}
                  label="Role"
                  required
                  select
                  sx={fieldSx}
                  disabled={rolesQuery.isLoading}
                >
                  {rolesQuery.data?.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.displayName}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} sx={{ textTransform: "none" }} variant="outlined">
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || inviteMutation.isPending}
            onClick={handleSubmit(onSubmit)}
            startIcon={
              inviteMutation.isPending ? (
                <CircularProgress color="inherit" size={18} />
              ) : null
            }
            sx={{ textTransform: "none" }}
            variant="contained"
          >
            {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={successOpen}
        autoHideDuration={4000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSuccessOpen(false)} severity="success" sx={{ width: "100%" }}>
          Invitation sent successfully.
        </Alert>
      </Snackbar>
    </>
  );
}
