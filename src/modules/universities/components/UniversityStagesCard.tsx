import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import {
  StageSequenceEditor,
  toDraftStages,
  validateStages,
  type DraftStage,
} from "@/modules/settings/components/StageSequenceEditor";
import {
  isOverride,
  sourceLabel,
  stageTemplatesApi,
  type StageChangePreview,
} from "@/modules/settings/stageTemplatesApi";
import { StageChangePreviewDialog } from "@/modules/settings/components/StageChangePreviewDialog";
import { StageSequenceFlow } from "@/shared/components/StageFlow";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type UniversityStagesCardProps = {
  universityId: string;
  universityName: string;
  countryCode: string;
  /** Whether the viewer may change the sequence; the server enforces it regardless. */
  canManage: boolean;
};

/**
 * The stage sequence applications to this university follow, on the university's own page.
 *
 * Unlike the same editor in the add-university drawer, this one goes through a preview
 * before saving. A university that already exists can have applications in flight, and
 * changing its sequence reconciles them — so the confirmation names how many.
 */
export function UniversityStagesCard({
  universityId,
  universityName,
  countryCode,
  canManage,
}: UniversityStagesCardProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<DraftStage[]>([]);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<StageChangePreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const templateQuery = useQuery({
    enabled: Boolean(universityId),
    queryKey: ["stage-templates", "university", universityId],
    queryFn: () => stageTemplatesApi.getForUniversity(universityId, countryCode),
  });

  const template = templateQuery.data;

  // Reseeded whenever the saved sequence changes, so a save or reset leaves the editor
  // showing what is actually stored rather than what was typed.
  const signature = template
    ? `${template.source}:${template.stages.map((stage) => stage.name).join("|")}`
    : "";
  useEffect(() => {
    if (template) setDraft(toDraftStages(template.stages));
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["stage-templates", "university", universityId] });
    // Saving reconciles applications in flight, so anything showing them is stale.
    await queryClient.invalidateQueries({ queryKey: ["applications"] });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      stageTemplatesApi.saveForUniversity(
        universityId,
        draft.map((stage) => ({ name: stage.name.trim(), active: stage.active })),
        countryCode,
      ),
    onSuccess: async () => {
      setPreviewOpen(false);
      setEditing(false);
      await refresh();
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => stageTemplatesApi.resetForUniversity(universityId, countryCode),
    onSuccess: async () => {
      setEditing(false);
      await refresh();
    },
  });

  const requestSave = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreview(null);
    try {
      setPreview(
        await stageTemplatesApi.previewUniversity(
          universityId,
          draft.map((stage) => ({ name: stage.name.trim(), active: stage.active })),
        ),
      );
    } catch {
      // A read-only call being unavailable should not stop an admin saving.
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  if (templateQuery.isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 3 }}>
        <CircularProgress size={22} />
      </Stack>
    );
  }

  if (templateQuery.isError || !template) {
    return (
      <Alert severity="error">
        {getApiErrorMessage(templateQuery.error, "Unable to load the stage sequence.")}
      </Alert>
    );
  }

  const own = isOverride(template.source);
  const unchanged =
    draft.length === template.stages.length &&
    draft.every((stage, index) => stage.name === template.stages[index].name);

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
      >
        <Chip
          label={own ? "This university's own" : `Following ${template.countryName}`}
          size="small"
          sx={
            own
              ? { backgroundColor: "#E1F5EC", color: "#0B7A57" }
              : { backgroundColor: "#EEF2F6", color: "#55707C" }
          }
        />
        {canManage ? (
          <Stack direction="row" spacing={0.75}>
            {own ? (
              <Button
                disabled={resetMutation.isPending}
                size="small"
                sx={{ textTransform: "none" }}
                onClick={() => resetMutation.mutate()}
              >
                Use {template.countryName}&rsquo;s
              </Button>
            ) : null}
            {editing ? (
              <Button
                disabled={unchanged || !validateStages(draft).valid || saveMutation.isPending}
                size="small"
                sx={{ textTransform: "none" }}
                variant="contained"
                onClick={requestSave}
              >
                Save
              </Button>
            ) : (
              <Button size="small" sx={{ textTransform: "none" }} onClick={() => setEditing(true)}>
                Customise
              </Button>
            )}
          </Stack>
        ) : null}
      </Stack>

      {!own && editing ? (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Saving gives {universityName} its own sequence. Later changes to{" "}
          {template.countryName} will not reach it.
        </Alert>
      ) : null}

      {saveMutation.isError ? (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {getApiErrorMessage(saveMutation.error, "Unable to save the sequence.")}
        </Alert>
      ) : null}

      {editing ? (
        <StageSequenceEditor stages={draft} onChange={setDraft} />
      ) : (
        <StageSequenceFlow stages={template.stages} />
      )}

      <StageChangePreviewDialog
        loading={previewLoading}
        open={previewOpen}
        preview={preview}
        saving={saveMutation.isPending}
        scopeLabel={universityName}
        onCancel={() => setPreviewOpen(false)}
        onConfirm={() => saveMutation.mutate()}
      />
    </>
  );
}
