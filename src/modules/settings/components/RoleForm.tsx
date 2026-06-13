import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, type UseFormReturn } from "react-hook-form";
import { PermissionPicker } from "@/modules/settings/components/PermissionPicker";
import type { RoleFormValues } from "@/modules/settings/settings.types";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "background.paper",
    borderRadius: 2.5,
  },
};

type RoleFormProps = {
  form: UseFormReturn<RoleFormValues>;
  isReadOnly?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  title: string;
};

export function RoleForm({
  form,
  isReadOnly = false,
  onCancel,
  onSubmit,
  submitLabel,
  title,
}: RoleFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <Card
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <Typography variant="h6">{title}</Typography>

          {isReadOnly ? (
            <Alert severity="info">
              System roles are read-only. Create a custom role to define your own permission set.
            </Alert>
          ) : null}

          {errors.root?.message ? <Alert severity="error">{errors.root.message}</Alert> : null}

          <Box component="form" noValidate onSubmit={onSubmit}>
            <Stack spacing={3}>
              <Controller
                control={control}
                name="name"
                rules={{ required: "Role name is required." }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    disabled={isReadOnly}
                    error={Boolean(errors.name)}
                    fullWidth
                    helperText={errors.name?.message}
                    label="Role Name"
                    required
                    sx={fieldSx}
                  />
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <TextField
                    {...field}
                    disabled={isReadOnly}
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    sx={fieldSx}
                  />
                )}
              />

              <PermissionPicker control={control} disabled={isReadOnly} errors={errors} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button onClick={onCancel} sx={{ textTransform: "none" }} variant="outlined">
                  Cancel
                </Button>
                {!isReadOnly ? (
                  <Button
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : null}
                    sx={{ textTransform: "none" }}
                    type="submit"
                    variant="contained"
                  >
                    {isSubmitting ? "Saving..." : submitLabel}
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
