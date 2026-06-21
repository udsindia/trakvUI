import { useState } from "react";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import type { DashboardAttentionItem } from "@/modules/dashboard/dashboardRoleConfig";

type DashboardAttentionStripProps = {
  items: DashboardAttentionItem[];
};

export function DashboardAttentionStrip({ items }: DashboardAttentionStripProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !items.length) {
    return null;
  }

  const hasDanger = items.some((item) => item.tone === "danger");

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: "center",
        bgcolor: hasDanger ? "#FEF2F2" : "#FFFBEB",
        border: "1px solid",
        borderColor: hasDanger ? "#FECACA" : "#FDE68A",
        borderLeft: "4px solid",
        borderLeftColor: hasDanger ? "error.main" : "warning.main",
        borderRadius: 2,
        flexShrink: 0,
        fontSize: 11,
        px: 1.5,
        py: 0.875,
      }}
    >
      <WarningAmberRounded
        sx={{ color: hasDanger ? "error.main" : "warning.main", flexShrink: 0, fontSize: 14 }}
      />
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flex: 1, flexWrap: "wrap" }}>
        {items.map((item, index) => (
          <Stack direction="row" key={item.message} spacing={1.25} sx={{ alignItems: "center" }}>
            {index > 0 ? (
              <Typography sx={{ color: "text.disabled" }}>·</Typography>
            ) : null}
            <Typography
              sx={{
                color:
                  item.tone === "danger" ? "#991B1B" : item.tone === "info" ? "#1D4ED8" : "#92400E",
                fontWeight: 600,
              }}
            >
              {item.message}{" "}
              <Box
                component="span"
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 700,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {item.action}
              </Box>
            </Typography>
          </Stack>
        ))}
      </Stack>
      <IconButton
        aria-label="Dismiss"
        size="small"
        sx={{ flexShrink: 0, height: 22, width: 22 }}
        onClick={() => setDismissed(true)}
      >
        <CloseRounded sx={{ fontSize: 14 }} />
      </IconButton>
    </Stack>
  );
}
