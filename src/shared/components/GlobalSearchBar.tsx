import { useEffect, useRef, useState, type ReactNode } from "react";
import SearchRounded from "@mui/icons-material/SearchRounded";
import {
  CircularProgress,
  InputAdornment,
  TextField,
} from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";

type GlobalSearchBarProps = {
  debounceTime?: number;
  disabled?: boolean;
  endAdornment?: ReactNode;
  loading?: boolean;
  onSearch: (query: string) => void;
  placeholder: string;
  sx?: SxProps<Theme>;
  value?: string;
};

export function GlobalSearchBar({
  debounceTime = 300,
  disabled = false,
  endAdornment,
  loading = false,
  onSearch,
  placeholder,
  sx,
  value,
}: GlobalSearchBarProps) {
  const [inputValue, setInputValue] = useState(value ?? "");
  const hasMountedRef = useRef(false);
  const isSyncingFromValueRef = useRef(false);

  useEffect(() => {
    if (value === undefined) {
      return;
    }

    setInputValue((currentValue) => {
      if (currentValue === value) {
        return currentValue;
      }

      isSyncingFromValueRef.current = true;
      return value;
    });
  }, [value]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (isSyncingFromValueRef.current) {
      isSyncingFromValueRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onSearch(inputValue);
    }, debounceTime);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [debounceTime, inputValue, onSearch]);

  return (
    <TextField
      fullWidth
      disabled={disabled}
      placeholder={placeholder}
      size="small"
      value={inputValue}
      sx={[
        {
          width: { xs: "100%", md: 300 },
          "& .MuiOutlinedInput-root": {
            bgcolor: "background.paper",
            borderRadius: 3.5,
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
            height: 42,
            transition: "box-shadow 0.2s ease, border-color 0.2s ease",
            "& fieldset": {
              borderColor: "#ebf1f6",
            },
            "&:hover fieldset": {
              borderColor: "#d9e5f0",
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${alpha("#2f87b7", 0.12)}`,
            },
            "&.Mui-focused fieldset": {
              borderColor: "#b9d7ea",
            },
          },
          "& .MuiInputBase-input": {
            fontSize: 14,
            "&::placeholder": {
              color: "text.secondary",
              opacity: 1,
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      onChange={(event) => setInputValue(event.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded color="action" fontSize="small" />
            </InputAdornment>
          ),
          endAdornment:
            loading || endAdornment ? (
              <InputAdornment position="end">
                {loading ? <CircularProgress size={16} /> : endAdornment}
              </InputAdornment>
            ) : undefined,
        },
      }}
    />
  );
}
