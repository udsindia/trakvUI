import { Box, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import type { BackendAgentTaskSummaryDto } from "@/modules/activities/activityService";

type TeamTaskSummaryProps = {
  agents: BackendAgentTaskSummaryDto[];
  isError?: boolean;
  isLoading?: boolean;
  onSelectAgent?: (agentId: string) => void;
  selectedAgentId?: string | null;
};

/**
 * Who on the team is carrying what, in one row each.
 *
 * The board could already be filtered to one agent at a time, which answers "what is
 * Priya working on" but never "who is drowning" — you had to pick each person in turn and
 * remember the last answer. This is the across-the-team view that filter implies.
 *
 * The server scopes the list, so this renders whatever it is given: a tenant-wide admin
 * gets everyone, a manager their reports, a counsellor themselves alone.
 */
export function TeamTaskSummary({
  agents,
  isError = false,
  isLoading = false,
  onSelectAgent,
  selectedAgentId,
}: TeamTaskSummaryProps) {
  if (isError) {
    return (
      <Paper sx={{ mb: 2, p: 2 }} variant="outlined">
        <Typography color="text.secondary" variant="body2">
          Team workload is unavailable right now.
        </Typography>
      </Paper>
    );
  }

  if (isLoading) {
    return (
      <Paper sx={{ alignItems: "center", display: "flex", gap: 1, mb: 2, p: 2 }} variant="outlined">
        <CircularProgress size={16} />
        <Typography color="text.secondary" variant="body2">
          Loading team workload…
        </Typography>
      </Paper>
    );
  }

  // One agent means the viewer is only allowed to see themselves; the board below already
  // shows their tasks, so a "team" panel of one is noise.
  if (agents.length <= 1) {
    return null;
  }

  const totals = agents.reduce(
    (acc, a) => ({
      open: acc.open + a.openCount,
      overdue: acc.overdue + a.overdueCount,
      stuck: acc.stuck + a.stuckCount,
      dueToday: acc.dueToday + a.dueTodayCount,
    }),
    { open: 0, overdue: 0, stuck: 0, dueToday: 0 },
  );

  // Most overdue first: the panel exists to surface trouble, so trouble goes at the top.
  const ordered = [...agents].sort(
    (a, b) => b.overdueCount - a.overdueCount || b.openCount - a.openCount,
  );

  return (
    <Paper sx={{ mb: 2, p: 2 }} variant="outlined">
      <Stack
        alignItems={{ xs: "flex-start", sm: "center" }}
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        <Typography fontWeight={600} variant="subtitle2">
          Team workload
        </Typography>
        <Stack direction="row" spacing={0.75}>
          <Chip label={`${totals.open} open`} size="small" />
          {totals.dueToday > 0 && (
            <Chip color="info" label={`${totals.dueToday} due today`} size="small" />
          )}
          {totals.overdue > 0 && (
            <Chip color="error" label={`${totals.overdue} overdue`} size="small" />
          )}
          {totals.stuck > 0 && (
            <Chip color="warning" label={`${totals.stuck} stuck`} size="small" />
          )}
        </Stack>
      </Stack>

      <Stack spacing={0.5}>
        {ordered.map((agent) => {
          const isSelected = selectedAgentId === agent.agent.id;
          return (
            <Box
              key={agent.agent.id}
              onClick={() => onSelectAgent?.(agent.agent.id)}
              sx={{
                alignItems: "center",
                borderRadius: 1,
                bgcolor: isSelected ? "action.selected" : "transparent",
                cursor: onSelectAgent ? "pointer" : "default",
                display: "flex",
                gap: 1,
                px: 1,
                py: 0.75,
                "&:hover": onSelectAgent ? { bgcolor: "action.hover" } : undefined,
              }}
            >
              <Typography sx={{ flex: 1, minWidth: 0 }} noWrap variant="body2">
                {agent.agent.name}
              </Typography>
              {/* Counts keep their place whether or not they are zero, so the columns
                  line up down the list and a glance compares like with like. */}
              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                <Chip
                  label={`${agent.openCount} open`}
                  size="small"
                  sx={{ minWidth: 74 }}
                  variant="outlined"
                />
                <Chip
                  color={agent.dueTodayCount > 0 ? "info" : undefined}
                  label={`${agent.dueTodayCount} today`}
                  size="small"
                  sx={{ minWidth: 74, opacity: agent.dueTodayCount > 0 ? 1 : 0.45 }}
                  variant="outlined"
                />
                <Chip
                  color={agent.overdueCount > 0 ? "error" : undefined}
                  label={`${agent.overdueCount} overdue`}
                  size="small"
                  sx={{ minWidth: 86, opacity: agent.overdueCount > 0 ? 1 : 0.45 }}
                  variant={agent.overdueCount > 0 ? "filled" : "outlined"}
                />
                <Chip
                  color={agent.stuckCount > 0 ? "warning" : undefined}
                  label={`${agent.stuckCount} stuck`}
                  size="small"
                  sx={{ minWidth: 74, opacity: agent.stuckCount > 0 ? 1 : 0.45 }}
                  variant="outlined"
                />
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
