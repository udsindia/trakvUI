import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Stack,
  Typography,
} from "@mui/material";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { PERMISSION_GROUPS, getPermissionLabel } from "@/config/permissions/permissionLabels";
import type { RoleFormValues } from "@/modules/settings/settings.types";

type PermissionPickerProps = {
  control: Control<RoleFormValues>;
  disabled?: boolean;
  errors: FieldErrors<RoleFormValues>;
};

export function PermissionPicker({ control, disabled = false, errors }: PermissionPickerProps) {
  return (
    <Stack spacing={2}>
      <Controller
        control={control}
        name="permissions"
        rules={{
          validate: (value) => value.length > 0 || "Select at least one permission.",
        }}
        render={({ field }) => (
          <Stack spacing={2.5}>
            {PERMISSION_GROUPS.map((group) => (
              <Box
                key={group.label}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  p: 2,
                }}
              >
                <Typography sx={{ fontWeight: 600, mb: 1 }} variant="subtitle2">
                  {group.label}
                </Typography>
                <FormGroup>
                  {group.permissions.map((permission) => {
                    const checked = field.value.includes(permission);

                    return (
                      <FormControlLabel
                        key={permission}
                        control={
                          <Checkbox
                            checked={checked}
                            disabled={disabled}
                            onChange={(event) => {
                              if (event.target.checked) {
                                field.onChange([...field.value, permission]);
                                return;
                              }

                              field.onChange(field.value.filter((value) => value !== permission));
                            }}
                          />
                        }
                        label={getPermissionLabel(permission)}
                      />
                    );
                  })}
                </FormGroup>
              </Box>
            ))}
            {errors.permissions?.message ? (
              <FormHelperText error>{errors.permissions.message}</FormHelperText>
            ) : null}
          </Stack>
        )}
      />
    </Stack>
  );
}
