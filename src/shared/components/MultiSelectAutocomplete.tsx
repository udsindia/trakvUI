import type { ReactNode } from "react";
import { Autocomplete, Chip, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export type MultiSelectOption = string | { label: string; value: string };

type NormalizedOption = {
  label: string;
  value: string;
};

type MultiSelectAutocompleteProps = {
  allowCustomValues?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  id?: string;
  label: string;
  onBlur?: () => void;
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  required?: boolean;
  sx?: SxProps<Theme>;
  value: string[];
};

function normalizeOption(option: MultiSelectOption): NormalizedOption {
  if (typeof option === "string") {
    return {
      label: option,
      value: option,
    };
  }

  return option;
}

export function MultiSelectAutocomplete({
  allowCustomValues = false,
  disabled = false,
  error = false,
  helperText,
  id,
  label,
  onBlur,
  onChange,
  options,
  placeholder,
  required = false,
  sx,
  value,
}: MultiSelectAutocompleteProps) {
  const normalizedOptions = options.map(normalizeOption);
  const selectedOptions = value
    .map((selectedValue) =>
      normalizedOptions.find((option) => option.value === selectedValue) ?? {
        label: selectedValue,
        value: selectedValue,
      },
    );

  return (
    <Autocomplete
      clearOnBlur={allowCustomValues}
      disableCloseOnSelect
      disabled={disabled}
      filterSelectedOptions
      freeSolo={allowCustomValues}
      id={id}
      getOptionLabel={(option) => typeof option === "string" ? option : option.label}
      handleHomeEndKeys={allowCustomValues}
      isOptionEqualToValue={(option, selectedOption) => option.value === selectedOption.value}
      multiple
      options={normalizedOptions}
      selectOnFocus={allowCustomValues}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const tagProps = getTagProps({ index });

          return (
            <Chip
              {...tagProps}
              key={option.value}
              color="primary"
              label={option.label}
              size="small"
              variant="outlined"
            />
          );
        })
      }
      value={selectedOptions}
      onBlur={onBlur}
      onChange={(_, nextValue) =>
        onChange(
          nextValue.map((option) =>
            typeof option === "string" ? option.trim() : option.value.trim(),
          ).filter(Boolean),
        )
      }
      renderInput={(params) => (
        <TextField
          {...params}
          error={error}
          fullWidth
          helperText={helperText}
          id={id}
          label={label}
          placeholder={placeholder}
          required={required}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
          sx={sx}
        />
      )}
    />
  );
}
