import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import {
  stageNoticesApi,
  type PendingStage,
  type StageChangeNotice,
} from "@/modules/applications/stageNoticesApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type StageChangeBannerProps = {
  applicationId: string;
  /** Called after any change, so the page can refetch the stages it draws. */
  onResolved?: () => void;
};

const dateOf = (iso: string) => {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString();
};

/**
 * Shown when this application's stage sequence changed underneath it.
 *
 * Split into two halves on purpose. The top is what the counsellor has to decide — a stage
 * was inserted behind where the student has already got to, and only they know whether it
 * happened. The bottom is news they can read and dismiss.
 *
 * Nothing renders for anyone who is not the assigned counsellor: the server returns an
 * empty list to everybody else, so a manager reading someone else's application is never
 * asked a question they cannot answer.
 */
export function StageChangeBanner({ applicationId, onResolved }: StageChangeBannerProps) {
  const queryClient = useQueryClient();

  const noticesQuery = useQuery({
    enabled: Boolean(applicationId),
    queryKey: ["applications", applicationId, "stage-notices"],
    queryFn: () => stageNoticesApi.list(applicationId),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["applications", applicationId, "stage-notices"],
    });
    // The dashboard shows a count of the same thing.
    await queryClient.invalidateQueries({ queryKey: ["applications", "stage-notices", "count"] });
    onResolved?.();
  };

  const decide = useMutation({
    mutationFn: ({ stageId, done }: { stageId: string; done: boolean }) =>
      done
        ? stageNoticesApi.markDone(applicationId, stageId)
        : stageNoticesApi.markNotRequired(applicationId, stageId),
    onSuccess: refresh,
  });

  const dismiss = useMutation({
    mutationFn: (noticeId: string) => stageNoticesApi.dismiss(applicationId, noticeId),
    onSuccess: refresh,
  });

  const notices = noticesQuery.data ?? [];
  if (notices.length === 0) {
    return null;
  }

  // The same pending stages come back on every notice — they are a property of the
  // application, not of one change — so they are listed once rather than per notice.
  const pending: PendingStage[] = notices[0]?.needsDecision ?? [];

  const describe = (notice: StageChangeNotice) => {
    const s = notice.summary ?? {};
    const lines: string[] = [];
    const ahead = (s.added ?? []).filter(
      (name) => !(s.addedBehindCurrent ?? []).includes(name),
    );
    if (ahead.length) lines.push(`${ahead.join(", ")} added ahead of this application`);
    if (s.removed?.length) lines.push(`${s.removed.join(", ")} removed`);
    if (s.keptBecausePassed?.length) {
      lines.push(
        `${s.keptBecausePassed.join(", ")} removed from the sequence, but kept here — already passed`,
      );
    }
    return lines;
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: pending.length ? "#f0d3a0" : "#dbe5ee",
        borderRadius: "12px",
        bgcolor: pending.length ? "#fffaf2" : "#f8fbfd",
        p: 2,
        mb: 2.5,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", mb: 1 }}>
        <WarningAmberRounded sx={{ color: pending.length ? "#B35A00" : "#55707C", fontSize: 20 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
            The stage flow{notices[0]?.scopeLabel ? ` for ${notices[0].scopeLabel}` : ""} changed
            {notices[0]?.changedAt ? ` on ${dateOf(notices[0].changedAt)}` : ""}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
            This application was updated to match. Stages it had already been through were kept.
          </Typography>
        </Box>
      </Stack>

      {pending.length > 0 ? (
        <Box sx={{ mt: 1.5 }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", mb: 0.75 }}>
            NEEDS YOUR ATTENTION
          </Typography>
          <Stack spacing={1}>
            {pending.map((stage) => (
              <Stack
                key={stage.stageId}
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{
                  alignItems: { sm: "center" },
                  justifyContent: "space-between",
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "#f0d3a0",
                  borderRadius: "8px",
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography sx={{ fontSize: 13 }}>
                  <strong>{stage.stageName}</strong> was added before this application&rsquo;s
                  current stage. Did this step happen?
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
                  <Button
                    disabled={decide.isPending}
                    size="small"
                    sx={{ textTransform: "none" }}
                    variant="contained"
                    onClick={() => decide.mutate({ stageId: stage.stageId, done: true })}
                  >
                    Mark as done
                  </Button>
                  <Button
                    disabled={decide.isPending}
                    size="small"
                    sx={{ textTransform: "none" }}
                    onClick={() => decide.mutate({ stageId: stage.stageId, done: false })}
                  >
                    Not required
                  </Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}

      {notices.some((notice) => describe(notice).length > 0) ? (
        <Box sx={{ mt: pending.length ? 2 : 1 }}>
          <Divider sx={{ mb: 1 }} />
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", mb: 0.5 }}>
            FOR INFORMATION
          </Typography>
          {notices.map((notice) =>
            describe(notice).map((line) => (
              <Typography
                key={`${notice.id}-${line}`}
                color="text.secondary"
                sx={{ fontSize: 12.5, display: "list-item", ml: 2.5 }}
              >
                {line}
              </Typography>
            )),
          )}
        </Box>
      ) : null}

      {decide.isError ? (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {getApiErrorMessage(decide.error, "Could not record that.")}
        </Alert>
      ) : null}

      <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 1 }}>
        <Button
          disabled={dismiss.isPending || pending.length > 0}
          size="small"
          sx={{ textTransform: "none" }}
          title={
            pending.length > 0
              ? "Answer the question above first"
              : undefined
          }
          onClick={() => notices.forEach((notice) => dismiss.mutate(notice.id))}
        >
          Dismiss
        </Button>
      </Stack>
    </Box>
  );
}
