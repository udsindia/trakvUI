import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, type UseFormReturn } from "react-hook-form";
import type {
  AddUserFormValues,
  RoleDefinition,
  TenantUser,
} from "@/modules/settings/settings.types";
import { usersService } from "@/modules/settings/usersService";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "background.paper",
    borderRadius: "9px",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cache availability per normalised email so re-validation (onChange) doesn't
// re-hit the backend for the same value.
const emailAvailabilityCache = new Map<string, boolean>();

async function isEmailTaken(email: string): Promise<boolean> {
  const key = email.trim().toLowerCase();
  if (emailAvailabilityCache.has(key)) return !emailAvailabilityCache.get(key)!;
  try {
    const available = await usersService.checkEmailAvailable(key);
    emailAvailabilityCache.set(key, available);
    return !available;
  } catch {
    return false; // network/error: don't block — the backend still enforces on submit
  }
}

type AddUserFormProps = {
  form: UseFormReturn<AddUserFormValues>;
  onCancel: () => void;
  onSubmit: () => void;
  roles: RoleDefinition[];
  supervisors: TenantUser[];
};

export function AddUserForm({ form, onCancel, onSubmit, roles, supervisors }: AddUserFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <Card
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", maxWidth: 760 }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        {errors.root?.message ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.root.message}
          </Alert>
        ) : null}

        <Box component="form" noValidate onSubmit={onSubmit}>
          <Stack spacing={3}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
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
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
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
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: "Email is required.",
                    pattern: {
                      value: EMAIL_RE,
                      message: "Enter a valid email address.",
                    },
                    // Global, case-insensitive uniqueness (emails are unique across all
                    // tenants). Skips the call until the format is valid; the backend
                    // re-checks on submit as the authority.
                    validate: async (value) => {
                      const v = (value ?? "").trim();
                      if (!EMAIL_RE.test(v)) return true;
                      return !(await isEmailTaken(v)) || "A user with this email already exists.";
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
                      sx={fieldSx}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Phone" sx={fieldSx} />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  control={control}
                  name="roleId"
                  rules={{ required: "Role is required." }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      error={Boolean(errors.roleId)}
                      fullWidth
                      helperText={errors.roleId?.message}
                      label="Role"
                      required
                      select
                      sx={fieldSx}
                    >
                      {roles.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          {role.name} ({role.roleName})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  control={control}
                  name="supervisorId"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      helperText="Manager or admin who supervises this user (drives team visibility)."
                      label="Supervisor"
                      select
                      sx={fieldSx}
                    >
                      <MenuItem value="">None</MenuItem>
                      {supervisors.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name} — {user.roleLabel}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button onClick={onCancel} sx={{ textTransform: "none" }} variant="outlined">
                Cancel
              </Button>
              <Button
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : null}
                sx={{ textTransform: "none" }}
                type="submit"
                variant="contained"
              >
                {isSubmitting ? "Creating user..." : "Create User"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
