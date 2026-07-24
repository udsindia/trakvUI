import { Box, Stack, Typography } from "@mui/material";
import type { DashboardSectionTab } from "@/modules/dashboard/dashboardRoleConfig";

type DashboardSectionTabsProps = {
  activeSection: string;
  scopeNote: string;
  tabs: DashboardSectionTab[];
  onSectionChange: (sectionId: string) => void;
};

export function DashboardSectionTabs({
  activeSection,
  scopeNote,
  tabs,
  onSectionChange,
}: DashboardSectionTabsProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      sx={{ alignItems: { sm: "center" }, flexShrink: 0, justifyContent: "space-between" }}
    >
      <Stack
        direction="row"
        spacing={0.375}
        sx={{
          alignItems: "center",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "9px",
          boxShadow: "0 1px 4px rgba(0,0,0,.05)",
          p: 0.5,
          width: "fit-content",
        }}
      >
        {tabs.map((tab) => {
          const active = activeSection === tab.id;

          return (
            <Box
              component="button"
              key={tab.id}
              sx={{
                alignItems: "center",
                background: active ? "#E6F7F9" : "transparent",
                border: "none",
                borderRadius: "9px",
                boxShadow: active ? "0 2px 8px rgba(0,122,135,.12)" : "none",
                color: active ? "text.primary" : "text.secondary",
                cursor: "pointer",
                display: "flex",
                fontSize: 12,
                fontWeight: 700,
                gap: 0.625,
                px: 1.75,
                py: 0.625,
                transition: ".15s",
                whiteSpace: "nowrap",
                "&:hover": {
                  bgcolor: active ? "#E6F7F9" : "#F5FBFC",
                  color: active ? "text.primary" : "primary.main",
                },
              }}
              onClick={() => onSectionChange(tab.id)}
            >
              {tab.label}
              {tab.badge ? (
                <Box
                  component="span"
                  sx={{
                    bgcolor: active ? "primary.main" : "secondary.main",
                    borderRadius: "9px",
                    color: active ? "#fff" : "#fff",
                    fontSize: 8,
                    fontWeight: 800,
                    px: 0.625,
                    py: 0.125,
                  }}
                >
                  {tab.badge}
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Stack>

      <Typography
        dangerouslySetInnerHTML={{ __html: scopeNote }}
        sx={{ color: "text.disabled", fontSize: 10, fontWeight: 600 }}
      />
    </Stack>
  );
}
