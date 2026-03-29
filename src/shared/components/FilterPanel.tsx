import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export type FilterOption = string | { label: string; value: string };

type BaseFilterConfig = {
  disabled?: boolean;
  helperText?: string;
  key: string;
  label: string;
};

export type DropdownFilterConfig = BaseFilterConfig & {
  options?: FilterOption[];
  placeholder?: string;
  type: "dropdown";
};

export type SliderFilterConfig = BaseFilterConfig & {
  max: number;
  min: number;
  step?: number;
  type: "slider";
};

export type CheckboxGroupFilterConfig = BaseFilterConfig & {
  options: FilterOption[];
  type: "checkbox-group";
};

export type DateRangeFilterValue = {
  endDate: string;
  startDate: string;
};

export type DateRangeFilterConfig = BaseFilterConfig & {
  type: "date-range";
};

export type FilterConfig =
  | DropdownFilterConfig
  | SliderFilterConfig
  | CheckboxGroupFilterConfig
  | DateRangeFilterConfig;

export type FilterPanelValue = DateRangeFilterValue | [number, number] | string | string[];

export type FilterPanelValues = Record<string, FilterPanelValue>;

type FilterPanelProps = {
  applyButtonLabel?: string;
  filtersConfig: FilterConfig[];
  onApplyFilters?: (values: FilterPanelValues) => void;
  onFiltersChange: (nextValues: FilterPanelValues) => void;
  stickyTopOffset?: number | string;
  sx?: SxProps<Theme>;
  title?: string;
  values: FilterPanelValues;
  width?: number | string;
};

function normalizeOption(option: FilterOption) {
  if (typeof option === "string") {
    return {
      label: option,
      value: option,
    };
  }

  return option;
}

function createDefaultValue(config: FilterConfig): FilterPanelValue {
  switch (config.type) {
    case "checkbox-group":
      return [];
    case "date-range":
      return {
        startDate: "",
        endDate: "",
      };
    case "dropdown":
      return "";
    case "slider":
      return [config.min, config.max];
  }
}

function isDateRangeValue(value: FilterPanelValue | undefined): value is DateRangeFilterValue {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "startDate" in value &&
    "endDate" in value,
  );
}

function isSliderValue(value: FilterPanelValue | undefined): value is [number, number] {
  return Array.isArray(value) && value.length === 2 && value.every((entry) => typeof entry === "number");
}

function isCheckboxGroupValue(value: FilterPanelValue | undefined): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function getDefaultFilterPanelValues(filtersConfig: FilterConfig[]): FilterPanelValues {
  return filtersConfig.reduce<FilterPanelValues>((accumulator, filterConfig) => {
    accumulator[filterConfig.key] = createDefaultValue(filterConfig);
    return accumulator;
  }, {});
}

export function FilterPanel({
  applyButtonLabel = "Apply filters",
  filtersConfig,
  onApplyFilters,
  onFiltersChange,
  stickyTopOffset = 0,
  sx,
  title = "Filters",
  values,
  width = 320,
}: FilterPanelProps) {
  const updateFilterValue = (key: string, value: FilterPanelValue) => {
    onFiltersChange({
      ...values,
      [key]: value,
    });
  };

  const handleClearAll = () => {
    onFiltersChange(getDefaultFilterPanelValues(filtersConfig));
  };

  const handleApplyFilters = () => {
    onApplyFilters?.(values);
  };

  const controlSx = {
    maxWidth: "100%",
    minWidth: 0,
    width: "100%",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#edf2f7",
    },
    "& .MuiOutlinedInput-root": {
      bgcolor: "#f8fbfe",
      borderRadius: 3,
      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
      minHeight: 44,
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#dbe6f0",
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#b7d7e9",
    },
    "& .MuiInputBase-input": {
      fontSize: 14,
      py: 1.25,
    },
  };

  return (
    <Paper
      elevation={0}
      sx={[
        {
          bgcolor: "transparent",
          border: 0,
          boxSizing: "border-box",
          borderRadius: 0,
          boxShadow: "none",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          maxHeight: "100%",
          maxWidth: "100%",
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
          position: { lg: "sticky" },
          top: { lg: stickyTopOffset },
          width: { xs: "100%", lg: width },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "#edf2f7",
          flexShrink: 0,
          justifyContent: "space-between",
          px: 2,
          py: 2,
        }}
      >
        <Typography variant="h6">{title}</Typography>

        <Button
          size="small"
          sx={{ fontWeight: 600, textTransform: "none" }}
          variant="text"
          onClick={handleClearAll}
        >
          Clear All
        </Button>
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowX: "hidden",
          overflowY: "auto",
          px: 2,
          py: 2,
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            height: 0,
            width: 6,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(148, 163, 184, 0.45)",
            borderRadius: 999,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
        }}
      >
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          {filtersConfig.map((filterConfig) => {
            const currentValue = values[filterConfig.key] ?? createDefaultValue(filterConfig);

            return (
              <Stack key={filterConfig.key} spacing={1.25} sx={{ minWidth: 0 }}>
                <Stack spacing={0.5}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }} variant="subtitle2">
                    {filterConfig.label}
                  </Typography>
                  {filterConfig.helperText ? (
                    <Typography color="text.secondary" variant="body2">
                      {filterConfig.helperText}
                    </Typography>
                  ) : null}
                </Stack>

                {filterConfig.type === "dropdown" ? (
                  <FormControl disabled={filterConfig.disabled} fullWidth size="small" sx={controlSx}>
                    <Select
                      displayEmpty
                      value={typeof currentValue === "string" ? currentValue : ""}
                      renderValue={(selected) => {
                        if (!selected) {
                          return (
                            <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                              {filterConfig.placeholder ?? `Select ${filterConfig.label}`}
                            </Typography>
                          );
                        }

                        const selectedOption = (filterConfig.options ?? [])
                          .map(normalizeOption)
                          .find((option) => option.value === selected);

                        return selectedOption?.label ?? selected;
                      }}
                      onChange={(event) => updateFilterValue(filterConfig.key, event.target.value)}
                    >
                      <MenuItem value="">
                        <em>{filterConfig.placeholder ?? `All ${filterConfig.label}`}</em>
                      </MenuItem>

                      {(filterConfig.options ?? []).map((option) => {
                        const normalizedOption = normalizeOption(option);

                        return (
                          <MenuItem key={normalizedOption.value} value={normalizedOption.value}>
                            {normalizedOption.label}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                ) : null}

                {filterConfig.type === "slider" ? (
                  <Box px={0.5}>
                    <Slider
                      disableSwap
                      disabled={filterConfig.disabled}
                      max={filterConfig.max}
                      min={filterConfig.min}
                      step={filterConfig.step ?? 1}
                      sx={{
                        color: "#2f87b7",
                        px: 0,
                        "& .MuiSlider-rail": {
                          bgcolor: "#d9e6f0",
                          borderRadius: 999,
                          height: 6,
                          opacity: 1,
                        },
                        "& .MuiSlider-track": {
                          border: "none",
                          borderRadius: 999,
                          height: 6,
                        },
                        "& .MuiSlider-thumb": {
                          bgcolor: "#2f87b7",
                          boxShadow: "0 0 0 3px rgba(47, 135, 183, 0.12)",
                          height: 14,
                          width: 14,
                        },
                      }}
                      value={isSliderValue(currentValue) ? currentValue : [filterConfig.min, filterConfig.max]}
                      valueLabelDisplay="off"
                      onChange={(_, value) => {
                        if (!Array.isArray(value)) {
                          return;
                        }

                        updateFilterValue(filterConfig.key, [value[0], value[1]]);
                      }}
                    />

                    <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", mt: 0.5 }}>
                      <Typography color="text.secondary" variant="caption">
                        {filterConfig.min}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {isSliderValue(currentValue)
                          ? Math.round((currentValue[0] + currentValue[1]) / 2)
                          : Math.round((filterConfig.min + filterConfig.max) / 2)}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {filterConfig.max}
                      </Typography>
                    </Stack>
                  </Box>
                ) : null}

                {filterConfig.type === "checkbox-group" ? (
                  <FormGroup sx={{ gap: 0.25, minWidth: 0, width: "100%" }}>
                    {filterConfig.options.map((option) => {
                      const normalizedOption = normalizeOption(option);
                      const selectedValues = isCheckboxGroupValue(currentValue) ? currentValue : [];

                      return (
                        <FormControlLabel
                          key={normalizedOption.value}
                          control={
                            <Checkbox
                              checked={selectedValues.includes(normalizedOption.value)}
                              disabled={filterConfig.disabled}
                              size="small"
                              sx={{
                                color: "#c8d5e1",
                                p: 0.5,
                                "&.Mui-checked": {
                                  color: "#2f87b7",
                                },
                              }}
                              onChange={(event) => {
                                const nextValues = event.target.checked
                                  ? [...selectedValues, normalizedOption.value]
                                  : selectedValues.filter((value) => value !== normalizedOption.value);

                                updateFilterValue(filterConfig.key, nextValues);
                              }}
                            />
                          }
                          label={
                            <Typography
                              sx={{
                                color: "text.secondary",
                                display: "block",
                                fontSize: 14,
                                overflowWrap: "anywhere",
                              }}
                              variant="body2"
                            >
                              {normalizedOption.label}
                            </Typography>
                          }
                          sx={{
                            alignItems: "flex-start",
                            m: 0,
                            minWidth: 0,
                            width: "100%",
                            "& .MuiFormControlLabel-label": {
                              minWidth: 0,
                            },
                          }}
                        />
                      );
                    })}
                  </FormGroup>
                ) : null}

                {filterConfig.type === "date-range" ? (
                  <Stack spacing={1.5}>
                    <TextField
                      disabled={filterConfig.disabled}
                      fullWidth
                      placeholder="mm/dd/yyyy"
                      size="small"
                      sx={controlSx}
                      value={isDateRangeValue(currentValue) ? currentValue.startDate : ""}
                      onChange={(event) => {
                        const nextValue = isDateRangeValue(currentValue)
                          ? currentValue
                          : { startDate: "", endDate: "" };

                        updateFilterValue(filterConfig.key, {
                          ...nextValue,
                          startDate: event.target.value,
                        });
                      }}
                    />

                    <Typography align="center" color="text.secondary" sx={{ fontSize: 12 }} variant="caption">
                      to
                    </Typography>

                    <TextField
                      disabled={filterConfig.disabled}
                      fullWidth
                      placeholder="mm/dd/yyyy"
                      size="small"
                      sx={controlSx}
                      value={isDateRangeValue(currentValue) ? currentValue.endDate : ""}
                      onChange={(event) => {
                        const nextValue = isDateRangeValue(currentValue)
                          ? currentValue
                          : { startDate: "", endDate: "" };

                        updateFilterValue(filterConfig.key, {
                          ...nextValue,
                          endDate: event.target.value,
                        });
                      }}
                    />
                  </Stack>
                ) : null}
              </Stack>
            );
          })}
        </Stack>
      </Box>

      <Box
        sx={{
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "#edf2f7",
          flexShrink: 0,
          p: 2,
        }}
      >
        <Button
          fullWidth
          sx={{
            borderRadius: 2.5,
            fontWeight: 700,
            minHeight: 44,
            textTransform: "none",
          }}
          variant="contained"
          onClick={handleApplyFilters}
        >
          {applyButtonLabel}
        </Button>
      </Box>
    </Paper>
  );
}
