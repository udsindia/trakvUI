import { useQuery } from "@tanstack/react-query";
import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { leadApi } from "@/modules/lead/leadApi";

type LeadActivityTimelineProps = {
  leadId: string;
};

const formatWhen = (iso: string) => {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

/**
 * Tasks and activities against this lead, newest first.
 *
 * Both in one list because that is how the work actually reads — a call logged and a
 * follow-up raised off the back of it belong next to each other, not in two panels the
 * counsellor has to interleave by eye. The chip keeps them apart where it matters.
 *
 * Newest first, unlike the application page's oldest-first story. An application is read
 * as a history leading to where it is now; a lead is read as "what happened last, and what
 * do I owe this person".
 */
export function LeadActivityTimeline({ leadId }: LeadActivityTimelineProps) {
  const { data: items = [], isLoading } = useQuery({
    enabled: Boolean(leadId),
    queryKey: ["leads", leadId, "timeline"],
    queryFn: () => leadApi.timeline(leadId),
  });

  const ordered = [...items].sort(
    (left, right) => new Date(right.eventAt).getTime() - new Date(left.eventAt).getTime(),
  );

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 2 }}>
        <CircularProgress size={20} />
      </Stack>
    );
  }

  if (ordered.length === 0) {
    return (
      <Typography color="text.disabled" sx={{ fontSize: 13.5 }}>
        Nothing logged against this lead yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.75}>
      {ordered.map((item) => {
        const isTask = item.kind === "TASK";
        // The note is the headline, not a subtitle under the type. Reading the type first
        // put "NOTE" above every comment and the actual sentence below it, which buried
        // the only part worth scanning. The type earns a place only when it says something
        // the text does not — a call or an email, not a note.
        const title = item.note?.trim() || (isTask ? "Task" : (item.type ?? "Activity"));
        const kindLabel =
          !isTask && item.type && item.type.toUpperCase() !== "NOTE" ? item.type : null;
        return (
          <Box key={`${item.kind}-${item.id}`}>
            <Stack alignItems="center" direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
              <Chip
                color={isTask ? "warning" : "info"}
                label={isTask ? "Task" : "Activity"}
                size="small"
                variant="outlined"
              />
              {kindLabel ? (
                <Typography color="text.secondary" sx={{ fontSize: 11.5, fontWeight: 700 }}>
                  {kindLabel}
                </Typography>
              ) : null}
              {isTask && item.status ? <Chip label={item.status} size="small" /> : null}
            </Stack>

            <Typography sx={{ fontSize: 13.5, mt: 0.25 }}>{title}</Typography>

            <Typography color="text.secondary" sx={{ fontSize: 11.5, mt: 0.25 }}>
              {formatWhen(item.eventAt)}
              {isTask && item.dueDate ? ` · due ${item.dueDate}` : ""}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}
