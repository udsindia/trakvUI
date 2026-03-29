import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ButtonProps } from "@mui/material/Button";

export type BulkAction = {
  color?: ButtonProps["color"];
  disabled?: boolean;
  key: string;
  label: string;
  onClick?: () => void;
  sx?: SxProps<Theme>;
  variant?: ButtonProps["variant"];
};

type BulkActionsBarProps = {
  allSelected: boolean;
  actions: BulkAction[];
  indeterminate?: boolean;
  itemLabel?: string;
  onClearSelection: () => void;
  onSelectAllChange: (checked: boolean) => void;
  selectedCount: number;
  totalCount: number;
};

function getSelectionLabel(itemLabel: string, selectedCount: number, totalCount: number) {
  return `${selectedCount} / ${totalCount} ${itemLabel}${totalCount === 1 ? "" : "s"} selected`;
}

export function BulkActionsBar({
  allSelected,
  actions,
  indeterminate = false,
  itemLabel = "item",
  onClearSelection,
  onSelectAllChange,
  selectedCount,
  totalCount,
}: BulkActionsBarProps) {
  return (
    <Box>
      <Toolbar
        disableGutters
        sx={{
          gap: 2,
          flexWrap: "wrap",
          justifyContent: "space-between",
          minHeight: 70,
          px: 2.75,
          py: 1.5,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1, sm: 2 }}
          sx={{ alignItems: { sm: "center" } }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={allSelected}
                disabled={totalCount === 0}
                indeterminate={indeterminate}
                size="small"
                sx={{
                  color: "#c8d5e1",
                  "&.Mui-checked": {
                    color: "#2f87b7",
                  },
                  "&.MuiCheckbox-indeterminate": {
                    color: "#2f87b7",
                  },
                }}
                onChange={(event) => onSelectAllChange(event.target.checked)}
              />
            }
            label={<Typography sx={{ fontSize: 13, fontWeight: 500 }} variant="body2">Select All</Typography>}
            sx={{ m: 0 }}
          />

          <Typography color="text.secondary" sx={{ fontSize: 12 }} variant="subtitle2">
            {getSelectionLabel(itemLabel, selectedCount, totalCount)}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1}
          sx={{ justifyContent: "flex-end" }}
        >
          {actions.map((action) => (
            <Button
              key={action.key}
              color={action.color}
              disabled={action.disabled}
              size="small"
              variant={action.variant ?? "outlined"}
              sx={[
                {
                  borderRadius: 2,
                  boxShadow: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  minHeight: 34,
                  px: 1.75,
                  textTransform: "none",
                },
                ...(Array.isArray(action.sx) ? action.sx : [action.sx]),
              ]}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      </Toolbar>
    </Box>
  );
}
