import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import {
  INTAKE_STATUS_LABELS,
  intakeNoticesApi,
  type IntakeStatus,
} from "@/modules/universities/universityIntakesApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type IntakeChangeBannerProps = {
  courseId: string;
  /** Whether the viewer may answer; the server enforces it regardless. */
  canManage: boolean;
  /** Called after an answer, so the page can refetch the intakes it draws. */
  onResolved?: () => void;
};

const statusLabel = (status: string | null) =>
  status ? (INTAKE_STATUS_LABELS[status as IntakeStatus] ?? status) : "—";

/**
 * Shown when this course's university changed its intake calendar and this course had
 * answers of its own.
 *
 * The course is untouched until somebody answers — that is the point. Both buttons are
 * real answers: taking the university's, or keeping this course's, which is recorded so
 * the same change is never asked twice.
 */
export function IntakeChangeBanner({ courseId, canManage, onResolved }: IntakeChangeBannerProps) {
  const queryClient = useQueryClient();

  const noticesQuery = useQuery({
    enabled: Boolean(courseId),
    queryKey: ["courses", courseId, "intake-notices"],
    queryFn: () => intakeNoticesApi.forCourse(courseId),
  });

  const settle = async () => {
    await queryClient.invalidateQueries({ queryKey: ["courses", courseId, "intake-notices"] });
    await queryClient.invalidateQueries({ queryKey: ["intakes", "course", courseId] });
    onResolved?.();
  };

  const applyMutation = useMutation({
    mutationFn: intakeNoticesApi.apply,
    onSuccess: settle,
  });

  const keepMutation = useMutation({
    mutationFn: intakeNoticesApi.keepOwn,
    onSuccess: settle,
  });

  const notices = noticesQuery.data ?? [];
  if (notices.length === 0) {
    return null;
  }

  const busy = applyMutation.isPending || keepMutation.isPending;

  return (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      {applyMutation.isError || keepMutation.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(
            applyMutation.error ?? keepMutation.error,
            "Unable to answer this notice.",
          )}
        </Alert>
      ) : null}

      {notices.map((notice) => {
        const months = notice.summary?.months ?? [];
        const questions = months.filter((month) => month.action !== "NO_LONGER_IN_CALENDAR");
        const dropped = months.filter((month) => month.action === "NO_LONGER_IN_CALENDAR");

        return (
          <Box
            key={notice.id}
            sx={{
              border: "1px solid",
              borderColor: "#F0C98A",
              borderLeft: "3px solid",
              borderLeftColor: "#B35A00",
              borderRadius: "10px",
              bgcolor: "#FFFBF4",
              px: 2,
              py: 1.5,
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
              <WarningAmberRounded sx={{ color: "#B35A00", fontSize: 18 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#8A5300" }}>
                {notice.scopeLabel ?? "The university"} changed its intake calendar
              </Typography>
            </Stack>

            <Typography color="text.secondary" sx={{ fontSize: 12.5, mb: 1 }}>
              This course has intakes of its own, so nothing has changed here.
            </Typography>

            <Box sx={{ mb: dropped.length > 0 ? 1 : 1.5 }}>
              {questions.map((month) => (
                <Typography
                  key={`${month.month}${month.year}`}
                  sx={{ fontSize: 13, py: 0.2 }}
                >
                  <strong>
                    {month.month} {month.year}
                  </strong>{" "}
                  {month.action === "ADDED"
                    ? `— added to the calendar as ${statusLabel(month.to)}; this course does not run it`
                    : `— this course says ${statusLabel(month.from)}, ${
                        notice.scopeLabel ?? "the university"
                      } now says ${statusLabel(month.to)}`}
                </Typography>
              ))}
            </Box>

            {dropped.length > 0 ? (
              <Typography color="text.secondary" sx={{ fontSize: 12, mb: 1.5 }}>
                {dropped.map((month) => `${month.month} ${month.year}`).join(", ")} —
                {dropped.length === 1 ? " is" : " are"} no longer on the university&rsquo;s
                calendar, and stay{dropped.length === 1 ? "s" : ""} on this course either way.
              </Typography>
            ) : null}

            {canManage ? (
              <Stack direction="row" spacing={1}>
                <Button
                  disabled={busy}
                  size="small"
                  sx={{ textTransform: "none" }}
                  variant="contained"
                  onClick={() => applyMutation.mutate(notice.id)}
                >
                  Use {notice.scopeLabel ?? "the university"}&rsquo;s
                </Button>
                <Button
                  disabled={busy}
                  size="small"
                  sx={{ textTransform: "none" }}
                  onClick={() => keepMutation.mutate(notice.id)}
                >
                  Keep this course&rsquo;s
                </Button>
              </Stack>
            ) : (
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                Someone who can manage the catalogue needs to settle this.
              </Typography>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}
