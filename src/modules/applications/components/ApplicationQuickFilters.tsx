import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export type ApplicationQuickFilterTab = {
  count: number;
  key: string;
  label: string;
};

type ApplicationQuickFiltersProps = {
  activeKey: string;
  onChange: (key: string) => void;
  tabs: ApplicationQuickFilterTab[];
};

const quickFilterTones: Record<string, { badgeBg: string; badgeColor: string }> = {
  all: { badgeBg: "#d7ebf8", badgeColor: "#2f87b7" },
  processing: { badgeBg: "#feedd5", badgeColor: "#d98c1f" },
  visa_applied: { badgeBg: "#d7ebf8", badgeColor: "#2f87b7" },
  approved: { badgeBg: "#daf5e3", badgeColor: "#3ea96c" },
};

export function ApplicationQuickFilters({
  activeKey,
  onChange,
  tabs,
}: ApplicationQuickFiltersProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "10px",
        overflowX: "auto",
        p: 0.625,
      }}
    >
      <Tabs
        allowScrollButtonsMobile
        aria-label="Application quick filters"
        scrollButtons="auto"
        value={activeKey}
        variant="scrollable"
        sx={{
          minHeight: 0,
          "& .MuiTabs-flexContainer": {
            gap: 1,
          },
          "& .MuiTabs-indicator": {
            display: "none",
          },
        }}
        onChange={(_, value: string) => onChange(value)}
      >
        {tabs.map((tab) => {
          const tone = quickFilterTones[tab.key] ?? {
            badgeBg: "#edf2f7",
            badgeColor: "#5b7083",
          };

          return (
            <Tab
              key={tab.key}
              disableRipple
              label={
                <Box
                  sx={{
                    alignItems: "center",
                    display: "flex",
                    gap: 1,
                  }}
                >
                  <Typography sx={{ fontSize: 12, fontWeight: 700 }} variant="body2">
                    {tab.label}
                  </Typography>
                  <Box
                    className="AppQuickFilters-count"
                    sx={{
                      alignItems: "center",
                      backgroundColor: tone.badgeBg,
                      borderRadius: "7px",
                      color: tone.badgeColor,
                      display: "inline-flex",
                      fontSize: 10,
                      fontWeight: 700,
                      justifyContent: "center",
                      lineHeight: 1,
                      minWidth: 20,
                      px: 0.75,
                      py: 0.375,
                      textAlign: "center",
                    }}
                  >
                    {tab.count}
                  </Box>
                </Box>
              }
              sx={{
                bgcolor: "#F7FAFC",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "8px",
                color: "text.secondary",
                minHeight: 28,
                minWidth: "fit-content",
                px: 1.25,
                py: 0.375,
                textTransform: "none",
                "&.Mui-selected": {
                  backgroundColor: (theme) => theme.palette.sidebar.bg,
                  borderColor: (theme) => theme.palette.sidebar.bg,
                  color: "common.white",
                },
                "&.Mui-selected .AppQuickFilters-count": {
                  backgroundColor: alpha("#ffffff", 0.2),
                  color: "common.white",
                },
              }}
              value={tab.key}
            />
          );
        })}
      </Tabs>
    </Paper>
  );
}
