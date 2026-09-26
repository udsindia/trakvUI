import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { DashboardQuickAction } from "@/modules/dashboard/dashboard.types";

type DashboardGreetingProps = {
  greeting: string;
  quickActions: DashboardQuickAction[];
  roleLabel: string;
  subtitle: string;
  tenantName?: string;
};

export function DashboardGreeting({
  greeting,
  quickActions,
  roleLabel,
  subtitle,
  tenantName,
}: DashboardGreetingProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "#e2e8f0",
        borderRadius: "10px",
        p: { xs: 2, md: 2.5 },
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography sx={{ fontWeight: 800 }} variant="h5">
            {greeting} 👋
          </Typography>
          <Chip color="primary" label={roleLabel} size="small" variant="outlined" />
        </Stack>
        <Typography color="text.secondary" variant="body2">
          {subtitle}
          {tenantName ? ` · ${tenantName}` : ""}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {quickActions.map((action) => (
            <Button
              component={action.href.startsWith("#") ? "button" : RouterLink}
              disabled={action.href === "#"}
              key={action.label}
              size="small"
              sx={{
                border: "1.5px solid",
                borderColor: "#e2e8f0",
                borderRadius: "8px",
                color: "text.primary",
                fontWeight: 600,
                px: 1.75,
                py: 0.75,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "#eef2ff",
                  borderColor: "primary.main",
                  color: "primary.main",
                },
              }}
              to={action.href.startsWith("#") ? undefined : action.href}
              variant="outlined"
            >
              <Box component="span" sx={{ mr: 0.75 }}>
                {action.icon}
              </Box>
              {action.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
