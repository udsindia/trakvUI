import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import {
  GRADE_STYLES,
  partnerAgenciesApi,
  type SaveUniversityPartnerAgency,
} from "@/modules/universities/partnerAgenciesApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type UniversityAgenciesCardProps = {
  universityId: string;
  canManage: boolean;
};

const emptyDraft: SaveUniversityPartnerAgency = {
  agencyName: "",
  commissionPercentage: null,
  ranking: null,
};

/**
 * The third-party agencies that place students at this university, and what each pays.
 *
 * Ordered by rank, because that is the question a counsellor is asking — who do we send
 * this through first. The commission sits beside it with its grade, since the rank and the
 * money are usually related but not always: an agency can be worth ranking first for
 * reasons other than what it pays.
 *
 * Typing a name that already exists reuses that agency rather than creating a second one,
 * so the same firm at two universities stays one record.
 */
export function UniversityAgenciesCard({ universityId, canManage }: UniversityAgenciesCardProps) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<SaveUniversityPartnerAgency>(emptyDraft);

  const agenciesQuery = useQuery({
    enabled: Boolean(universityId),
    queryKey: ["partner-agencies", universityId],
    queryFn: () => partnerAgenciesApi.forUniversity(universityId),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["partner-agencies", universityId] });

  const save = useMutation({
    mutationFn: () => partnerAgenciesApi.save(universityId, draft),
    onSuccess: async () => {
      setAdding(false);
      setDraft(emptyDraft);
      await refresh();
    },
  });

  const remove = useMutation({
    mutationFn: (linkId: string) => partnerAgenciesApi.remove(universityId, linkId),
    onSuccess: refresh,
  });

  if (agenciesQuery.isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 3 }}>
        <CircularProgress size={22} />
      </Stack>
    );
  }

  const agencies = agenciesQuery.data ?? [];

  return (
    <>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
      >
        <Typography color="text.secondary" sx={{ fontSize: 13 }}>
          {agencies.length === 0
            ? "No agencies recorded for this university."
            : `${agencies.length} agenc${agencies.length === 1 ? "y" : "ies"}`}
        </Typography>
        {canManage && !adding ? (
          <Button
            size="small"
            startIcon={<AddRounded />}
            sx={{ textTransform: "none" }}
            onClick={() => setAdding(true)}
          >
            Add an agency
          </Button>
        ) : null}
      </Stack>

      {save.isError ? (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {getApiErrorMessage(save.error, "Unable to save the agency.")}
        </Alert>
      ) : null}

      {adding ? (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "#E3EAF0",
            borderRadius: "10px",
            p: 1.75,
            mb: 1.5,
          }}
        >
          <Stack spacing={1.5}>
            <TextField
              autoFocus
              fullWidth
              helperText="An agency you already work with is reused, not duplicated."
              label="Agency name"
              size="small"
              value={draft.agencyName ?? ""}
              onChange={(event) => setDraft({ ...draft, agencyName: event.target.value })}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                helperText="Percent of tuition"
                inputProps={{ min: 0, max: 100, step: 0.5 }}
                label="Commission"
                size="small"
                type="number"
                value={draft.commissionPercentage ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    commissionPercentage:
                      event.target.value === "" ? null : Number(event.target.value),
                  })
                }
              />
              <TextField
                fullWidth
                helperText="1 is tried first; leave blank for no preference"
                inputProps={{ min: 1, step: 1 }}
                label="Rank"
                size="small"
                type="number"
                value={draft.ranking ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    ranking: event.target.value === "" ? null : Number(event.target.value),
                  })
                }
              />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
              <Button
                size="small"
                sx={{ textTransform: "none" }}
                onClick={() => {
                  setAdding(false);
                  setDraft(emptyDraft);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!draft.agencyName?.trim() || save.isPending}
                size="small"
                sx={{ textTransform: "none" }}
                variant="contained"
                onClick={() => save.mutate()}
              >
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}

      <Stack spacing={0.75}>
        {agencies.map((agency) => (
          <Stack
            key={agency.id}
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
              border: "1px solid",
              borderColor: "#E9EFF3",
              borderRadius: "8px",
              px: 1.5,
              py: 1,
            }}
          >
            <Typography
              color="text.secondary"
              sx={{ fontSize: 12, fontVariantNumeric: "tabular-nums", width: 22, flexShrink: 0 }}
            >
              {agency.ranking ?? "—"}
            </Typography>

            <Typography sx={{ fontSize: 13.5, fontWeight: 600, flex: 1, minWidth: 0 }}>
              {agency.agencyName}
            </Typography>

            <Typography
              sx={{ fontSize: 13, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}
            >
              {agency.commissionPercentage == null ? "—" : `${agency.commissionPercentage}%`}
            </Typography>

            {agency.commissionGrade ? (
              <Tooltip title="Grade band, from the commission">
                <Chip
                  label={agency.commissionGrade}
                  size="small"
                  sx={{
                    ...(GRADE_STYLES[agency.commissionGrade] ?? {}),
                    fontWeight: 700,
                    height: 20,
                    minWidth: 26,
                    flexShrink: 0,
                  }}
                />
              </Tooltip>
            ) : null}

            {canManage ? (
              <IconButton
                aria-label={`Remove ${agency.agencyName}`}
                disabled={remove.isPending}
                size="small"
                onClick={() => remove.mutate(agency.id)}
              >
                <DeleteOutlineRounded fontSize="small" />
              </IconButton>
            ) : null}
          </Stack>
        ))}
      </Stack>
    </>
  );
}
