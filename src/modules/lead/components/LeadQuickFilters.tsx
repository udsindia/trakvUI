import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export type LeadQuickFilterTab = {
  count: number;
  key: string;
  label: string;
};

type LeadQuickFiltersProps = {
  activeKey: string;
  onChange: (key: string) => void;
  tabs: LeadQuickFilterTab[];
};

const quickFilterTones: Record<string, { badgeBg: string; badgeColor: string }> = {
  all: {
    badgeBg: "#d7ebf8",
    badgeColor: "#2f87b7",
  },
  contacted: {
    badgeBg: "#feedd5",
    badgeColor: "#d98c1f",
  },
  new: {
    badgeBg: "#d7ebf8",
    badgeColor: "#2f87b7",
  },
  qualified: {
    badgeBg: "#daf5e3",
    badgeColor: "#3ea96c",
  },
};

export function LeadQuickFilters({
  activeKey,
  onChange,
  tabs,
}: LeadQuickFiltersProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "#edf2f7",
        borderRadius: 4,
        overflowX: "auto",
        p: 2.25,
      }}
    >
      <Tabs
        allowScrollButtonsMobile
        aria-label="Lead quick filters"
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
        {tabs.map((tab) => (
          (() => {
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
                    <Typography fontWeight={700} variant="body2">
                      {tab.label}
                    </Typography>
                    <Box
                      className="LeadQuickFilters-count"
                      sx={{
                        alignItems: "center",
                        backgroundColor: tone.badgeBg,
                        borderRadius: 999,
                        color: tone.badgeColor,
                        display: "inline-flex",
                        fontSize: 12,
                        fontWeight: 700,
                        justifyContent: "center",
                        lineHeight: 1,
                        minWidth: 28,
                        px: 1,
                        py: 0.45,
                        textAlign: "center",
                      }}
                    >
                      {tab.count}
                    </Box>
                  </Box>
                }
                sx={{
                  bgcolor: "#f7fafc",
                  borderRadius: 2.5,
                  minHeight: 42,
                  minWidth: "fit-content",
                  px: 2,
                  py: 1,
                  textTransform: "none",
                  "&.Mui-selected": {
                    backgroundColor: "#2f87b7",
                    color: "common.white",
                  },
                  "&.Mui-selected .LeadQuickFilters-count": {
                    backgroundColor: alpha("#ffffff", 0.2),
                    color: "common.white",
                  },
                }}
                value={tab.key}
              />
            );
          })()
        ))}
      </Tabs>
    </Paper>
  );
}
