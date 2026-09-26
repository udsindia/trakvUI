import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import { stageStepsApi } from "@/modules/universities/stageStepsApi";

type StageStepsEditorProps = {
  universityId: string;
  /** The stage names currently in the sequence, in order. */
  stageNames: string[];
  canManage: boolean;
};

/**
 * Notes about what happens during each stage — "Documents: passport copy, transcripts".
 *
 * Reference only. Nothing records whether an application did any of these, and they never
 * reach the stage machinery; a counsellor reads them to remember what this university
 * wants. Making them tickable would be application state, with all the reconciliation the
 * stages themselves needed, and that is not what these are for.
 *
 * Collapsed by default and per stage, because most stages will have none and an open
 * accordion of empty lists says less than a closed one.
 */
export function StageStepsEditor({ universityId, stageNames, canManage }: StageStepsEditorProps) {
  const queryClient = useQueryClient();
  const [openStage, setOpenStage] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);

  const stepsQuery = useQuery({
    enabled: Boolean(universityId),
    queryKey: ["stage-steps", universityId],
    queryFn: () => stageStepsApi.forUniversity(universityId),
  });

  const steps = stepsQuery.data ?? {};

  const save = useMutation({
    mutationFn: (stageName: string) =>
      stageStepsApi.replaceForStage(universityId, stageName, draft),
    onSuccess: async () => {
      setOpenStage(null);
      await queryClient.invalidateQueries({ queryKey: ["stage-steps", universityId] });
    },
  });

  const openFor = (stageName: string) => {
    setOpenStage(stageName);
    setDraft(steps[stageName] ?? []);
  };

  return (
    <Stack spacing={0.5}>
      {stageNames.map((stageName) => {
        const saved = steps[stageName] ?? [];
        const isOpen = openStage === stageName;

        return (
          <Box
            key={stageName}
            sx={{ border: "1px solid", borderColor: "#E9EFF3", borderRadius: "8px", px: 1.5, py: 1 }}
          >
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{stageName}</Typography>
                <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>
                  {saved.length === 0
                    ? "no steps"
                    : `${saved.length} step${saved.length === 1 ? "" : "s"}`}
                </Typography>
              </Stack>

              {canManage ? (
                <IconButton
                  aria-label={isOpen ? `Close ${stageName} steps` : `Edit ${stageName} steps`}
                  size="small"
                  onClick={() => (isOpen ? setOpenStage(null) : openFor(stageName))}
                >
                  <ExpandMoreRounded
                    fontSize="small"
                    sx={{
                      transform: isOpen ? "rotate(180deg)" : "none",
                      transition: "transform 120ms",
                      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                    }}
                  />
                </IconButton>
              ) : null}
            </Stack>

            {!isOpen && saved.length > 0 ? (
              <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
                {saved.map((step, index) => (
                  <Typography
                    key={`${step}-${index}`}
                    component="li"
                    color="text.secondary"
                    sx={{ fontSize: 12.5 }}
                  >
                    {step}
                  </Typography>
                ))}
              </Box>
            ) : null}

            <Collapse in={isOpen} unmountOnExit>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {draft.map((step, index) => (
                  <Stack key={index} direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <TextField
                      fullWidth
                      placeholder="e.g. Certified transcripts"
                      size="small"
                      value={step}
                      onChange={(event) =>
                        setDraft((current) =>
                          current.map((row, i) => (i === index ? event.target.value : row)),
                        )
                      }
                    />
                    <IconButton
                      aria-label={`Remove step ${index + 1}`}
                      size="small"
                      onClick={() =>
                        setDraft((current) => current.filter((_row, i) => i !== index))
                      }
                    >
                      <DeleteOutlineRounded fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={<AddRounded />}
                    sx={{ textTransform: "none" }}
                    onClick={() => setDraft((current) => [...current, ""])}
                  >
                    Add a step
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    size="small"
                    sx={{ textTransform: "none" }}
                    onClick={() => setOpenStage(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={save.isPending}
                    size="small"
                    sx={{ textTransform: "none" }}
                    variant="contained"
                    onClick={() => save.mutate(stageName)}
                  >
                    {save.isPending ? "Saving…" : "Save"}
                  </Button>
                </Stack>
              </Stack>
            </Collapse>
          </Box>
        );
      })}
    </Stack>
  );
}
