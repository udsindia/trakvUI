import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import {
  INTAKE_MONTHS,
  INTAKE_STATUS_LABELS,
  courseIntakesApi,
  intakeNoticesApi,
  universityIntakesApi,
  type IntakeChangePreview,
  type IntakeStatus,
  type UniversityIntake,
  type UniversityIntakeInput,
} from "@/modules/universities/universityIntakesApi";
import { IntakeChangePreviewDialog } from "@/modules/universities/components/IntakeChangePreviewDialog";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type UniversityIntakesCardProps = {
  /**
   * Which set of intakes this is editing. The university's calendar is the plan; a
   * course's is what that course is doing this cycle. Same shape, same editor — only the
   * endpoint and the wording around it differ.
   */
  scope: "university" | "course";
  /** University id for scope "university", course id for scope "course". */
  ownerId: string;
  /** The university's name, for the preview dialog. Only used at university scope. */
  universityName?: string;
  /** Whether the viewer may change them; the server enforces it regardless. */
  canManage: boolean;
};

type DraftIntake = {
  key: string;
  intakeMonth: string;
  intakeYear: number;
  status: IntakeStatus;
  applicationDeadline: string;
};

const STATUS_CHIP_SX: Record<IntakeStatus, object> = {
  OPEN: { backgroundColor: "#E1F5EC", color: "#0B7A57" },
  WAITLIST: { backgroundColor: "#FFF4E5", color: "#8A5300" },
  CLOSED: { backgroundColor: "#EEF2F6", color: "#55707C" },
};

const toDraft = (intakes: UniversityIntake[]): DraftIntake[] =>
  intakes.map((intake, index) => ({
    key: `${intake.id ?? index}`,
    intakeMonth: intake.intakeMonth,
    intakeYear: intake.intakeYear,
    status: intake.status,
    applicationDeadline: intake.applicationDeadline ?? "",
  }));

/**
 * The months this university admits into, and where each one stands.
 *
 * Set here rather than on every course because a university nearly always admits in the
 * same months across its catalogue. Saving copies the calendar onto courses that are
 * missing a month — it never overwrites one a course already has, since that row is the
 * course's own answer for this cycle.
 */
export function UniversityIntakesCard({
  scope,
  ownerId,
  universityName = "this university",
  canManage,
}: UniversityIntakesCardProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<DraftIntake[]>([]);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<IntakeChangePreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const isUniversity = scope === "university";

  const intakesQuery = useQuery({
    enabled: Boolean(ownerId),
    queryKey: ["intakes", scope, ownerId],
    queryFn: () =>
      isUniversity ? universityIntakesApi.list(ownerId) : courseIntakesApi.list(ownerId),
  });

  const signature = (intakesQuery.data ?? [])
    .map((intake) => `${intake.intakeMonth}${intake.intakeYear}${intake.status}${intake.applicationDeadline ?? ""}`)
    .join("|");

  // Reseeded whenever the saved calendar changes, so cancelling or saving leaves the
  // editor showing what is stored rather than what was typed.
  useEffect(() => {
    setDraft(toDraft(intakesQuery.data ?? []));
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: UniversityIntakeInput[] = draft.map((intake) => ({
        intakeMonth: intake.intakeMonth,
        intakeYear: intake.intakeYear,
        status: intake.status,
        applicationDeadline: intake.applicationDeadline || null,
      }));
      return isUniversity
        ? universityIntakesApi.save(ownerId, payload, true)
        : courseIntakesApi.save(ownerId, payload);
    },
    onSuccess: async () => {
      setPreviewOpen(false);
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["intakes", scope, ownerId] });
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const payloadFromDraft = (): UniversityIntakeInput[] =>
    draft.map((intake) => ({
      intakeMonth: intake.intakeMonth,
      intakeYear: intake.intakeYear,
      status: intake.status,
      applicationDeadline: intake.applicationDeadline || null,
    }));

  /**
   * A course's own intakes affect nothing else, so they save straight away. A university's
   * calendar reaches every course beneath it, so that one is previewed first.
   */
  const requestSave = async () => {
    if (!isUniversity) {
      saveMutation.mutate();
      return;
    }
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreview(null);
    try {
      setPreview(await intakeNoticesApi.preview(ownerId, payloadFromDraft()));
    } catch {
      // A read-only call being unavailable should not stop an admin saving.
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const update = (key: string, patch: Partial<DraftIntake>) =>
    setDraft((current) =>
      current.map((intake) => (intake.key === key ? { ...intake, ...patch } : intake)),
    );

  const add = () =>
    setDraft((current) => [
      ...current,
      {
        key: `new-${Date.now()}-${current.length}`,
        intakeMonth: "Sep",
        intakeYear: new Date().getFullYear() + 1,
        status: "OPEN",
        applicationDeadline: "",
      },
    ]);

  if (intakesQuery.isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 3 }}>
        <CircularProgress size={22} />
      </Stack>
    );
  }

  if (intakesQuery.isError) {
    return (
      <Alert severity="error">
        {getApiErrorMessage(intakesQuery.error, "Unable to load the intake calendar.")}
      </Alert>
    );
  }

  const saved = intakesQuery.data ?? [];

  // A month can only appear once — the table uniques on it, so a duplicate would be
  // rejected by the server after the counsellor had finished typing.
  const duplicates = new Set(
    draft
      .map((intake) => `${intake.intakeMonth}|${intake.intakeYear}`)
      .filter((key, index, all) => all.indexOf(key) !== index),
  );

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
      >
        <Typography color="text.secondary" sx={{ fontSize: 13 }}>
          {saved.length === 0
            ? isUniversity
              ? "No intakes recorded — courses here will not appear in intake searches."
              : "No intakes recorded — this course will not appear in intake searches."
            : `${saved.length} intake${saved.length === 1 ? "" : "s"}`}
        </Typography>
        {canManage ? (
          editing ? (
            <Stack direction="row" spacing={0.75}>
              <Button
                size="small"
                sx={{ textTransform: "none" }}
                onClick={() => {
                  setDraft(toDraft(saved));
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={duplicates.size > 0 || saveMutation.isPending}
                size="small"
                sx={{ textTransform: "none" }}
                variant="contained"
                onClick={requestSave}
              >
                {saveMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </Stack>
          ) : (
            <Button size="small" sx={{ textTransform: "none" }} onClick={() => setEditing(true)}>
              {saved.length === 0 ? "Add intakes" : "Edit"}
            </Button>
          )
        ) : null}
      </Stack>

      {saveMutation.isError ? (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {getApiErrorMessage(saveMutation.error, "Unable to save the intake calendar.")}
        </Alert>
      ) : null}

      {editing ? (
        <>
          <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
            {isUniversity
              ? "Courses that follow this calendar are brought into line. A course that has set intakes of its own is left alone and asked to confirm."
              : "These apply to this course only, and it will be asked before the university's calendar changes them again."}
          </Alert>

          <Stack spacing={1}>
            {draft.map((intake) => {
              const isDuplicate = duplicates.has(`${intake.intakeMonth}|${intake.intakeYear}`);
              return (
                <Stack key={intake.key} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <TextField
                    select
                    error={isDuplicate}
                    label="Month"
                    size="small"
                    sx={{ width: 104 }}
                    value={intake.intakeMonth}
                    onChange={(event) => update(intake.key, { intakeMonth: event.target.value })}
                  >
                    {INTAKE_MONTHS.map((month) => (
                      <MenuItem key={month} value={month}>
                        {month}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    error={isDuplicate}
                    label="Year"
                    size="small"
                    sx={{ width: 96 }}
                    type="number"
                    value={intake.intakeYear}
                    onChange={(event) =>
                      update(intake.key, { intakeYear: Number(event.target.value) || 0 })
                    }
                  />
                  <TextField
                    select
                    label="Status"
                    size="small"
                    sx={{ width: 128 }}
                    value={intake.status}
                    onChange={(event) =>
                      update(intake.key, { status: event.target.value as IntakeStatus })
                    }
                  >
                    {(Object.keys(INTAKE_STATUS_LABELS) as IntakeStatus[]).map((status) => (
                      <MenuItem key={status} value={status}>
                        {INTAKE_STATUS_LABELS[status]}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    InputLabelProps={{ shrink: true }}
                    label="Deadline"
                    size="small"
                    sx={{ flex: 1, minWidth: 150 }}
                    type="date"
                    value={intake.applicationDeadline}
                    onChange={(event) =>
                      update(intake.key, { applicationDeadline: event.target.value })
                    }
                  />
                  <IconButton
                    aria-label={`Remove ${intake.intakeMonth} ${intake.intakeYear}`}
                    size="small"
                    onClick={() =>
                      setDraft((current) => current.filter((row) => row.key !== intake.key))
                    }
                  >
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>

          {duplicates.size > 0 ? (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              The same month appears more than once. Each month can be listed only once.
            </Alert>
          ) : null}

          <Button
            size="small"
            startIcon={<AddRounded />}
            sx={{ mt: 1, textTransform: "none" }}
            onClick={add}
          >
            Add an intake
          </Button>
        </>
      ) : saved.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          Intakes say when applications open and close. Without them,{" "}
          {isUniversity ? "this university’s courses are" : "this course is"} invisible to
          the intake filters in the course finder.
        </Typography>
      ) : (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {saved.map((intake) => (
            <Box
              key={intake.id}
              sx={{
                border: "1px solid #E3EAF0",
                borderRadius: "10px",
                px: 1.5,
                py: 1,
                minWidth: 132,
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                {intake.intakeMonth} {intake.intakeYear}
              </Typography>
              <Chip
                label={INTAKE_STATUS_LABELS[intake.status]}
                size="small"
                sx={{ ...STATUS_CHIP_SX[intake.status], fontSize: 11, height: 20, mt: 0.5 }}
              />
              {intake.applicationDeadline ? (
                <Typography color="text.secondary" sx={{ fontSize: 11, mt: 0.5 }}>
                  Apply by {intake.applicationDeadline}
                </Typography>
              ) : null}
            </Box>
          ))}
        </Stack>
      )}

      <IntakeChangePreviewDialog
        loading={previewLoading}
        open={previewOpen}
        preview={preview}
        saving={saveMutation.isPending}
        universityName={universityName}
        onCancel={() => setPreviewOpen(false)}
        onConfirm={() => saveMutation.mutate()}
      />
    </>
  );
}
