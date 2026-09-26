import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Autocomplete,
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
  type PartnerAgencySummary,
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

  // Loaded only while the add form is open — the list is for suggesting, and there is no
  // reason to fetch every agency in the tenant just to render this card.
  const tenantAgencies = useQuery({
    enabled: adding,
    queryKey: ["partner-agencies", "tenant"],
    queryFn: () => partnerAgenciesApi.forTenant(),
  });

  /** Agencies already on this university — offering them again would only ever 409. */
  const alreadyLinked = new Set(
    (agenciesQuery.data ?? []).map((agency) => agency.partnerAgencyId),
  );

  const agencyOptions: PartnerAgencySummary[] = (tenantAgencies.data ?? []).filter(
    (agency) => !alreadyLinked.has(agency.id),
  );

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
            <Autocomplete
              freeSolo
              autoHighlight
              disabled={agencyOptions.length === 0 && tenantAgencies.isLoading}
              options={agencyOptions}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.name
              }
              inputValue={draft.agencyName ?? ""}
              // Typing is the same act as choosing: the name is kept either way, and the
              // id is only set when a suggestion was actually taken. That is what tells
              // the server to reuse an agency rather than find-or-create by name.
              onInputChange={(_event, value, reason) =>
                setDraft((current) => ({
                  ...current,
                  agencyName: value,
                  partnerAgencyId: reason === "reset" ? current.partnerAgencyId : null,
                }))
              }
              onChange={(_event, value) =>
                setDraft((current) => ({
                  ...current,
                  agencyName: typeof value === "string" ? value : value?.name ?? "",
                  partnerAgencyId: typeof value === "string" || !value ? null : value.id,
                }))
              }
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack>
                    <Typography sx={{ fontSize: 13 }}>{option.name}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 11 }}>
                      {option.universityCount === 1
                        ? "1 university"
                        : `${option.universityCount} universities`}
                      {option.bestGrade ? ` · best grade ${option.bestGrade}` : ""}
                    </Typography>
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  autoFocus
                  fullWidth
                  helperText={
                    alreadyLinked.size > 0
                      ? "Start typing — agencies already on this university are not offered again."
                      : "Start typing. An agency you already work with is reused, not duplicated."
                  }
                  label="Agency name"
                  size="small"
                />
              )}
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
