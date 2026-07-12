import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import { Box, Chip, Stack, Typography } from "@mui/material";
import type { RequirementStatus } from "@/modules/universities/universities.types";
import { getRequirementStatusSx } from "@/modules/universities/universitiesStyles";

const statusIcons = {
  met: CheckCircleOutlineRounded,
  warn: WarningAmberRounded,
  miss: ErrorOutlineRounded,
} as const;

type RequirementRowProps = {
  label: string;
  detail?: string;
  status: RequirementStatus;
  statusNote: string;
};

export function RequirementRow({ label, detail, status, statusNote }: RequirementRowProps) {
  const StatusIcon = statusIcons[status];

  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{
        alignItems: "center",
        borderBottom: "1px solid",
        borderColor: "#edf2f7",
        py: 1,
        "&:last-child": { borderBottom: 0 },
      }}
    >
      <Box
        sx={[
          {
            alignItems: "center",
            borderRadius: "50%",
            display: "flex",
            flexShrink: 0,
            height: 24,
            justifyContent: "center",
            width: 24,
          },
          getRequirementStatusSx(status),
        ]}
      >
        <StatusIcon sx={{ fontSize: 14 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: status === "met" ? 600 : 500 }}>
          {label}
        </Typography>
        {detail ? (
          <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.25 }}>
            {detail}
          </Typography>
        ) : null}
      </Box>
      <Chip
        label={statusNote}
        size="small"
        sx={[getRequirementStatusSx(status), { flexShrink: 0, fontSize: 10, fontWeight: 600 }]}
      />
    </Stack>
  );
}
