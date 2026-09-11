import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AddRounded from "@mui/icons-material/AddRounded";
import ArrowDownwardRounded from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import PublicRounded from "@mui/icons-material/PublicRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useAuth } from "@/app/auth/useAuth";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { SettingsPageHeader } from "@/modules/settings/components/SettingsPageHeader";
import {
  ANY_COUNTRY,
  isOverride,
  sourceLabel,
  stageTemplatesApi,
  type StageTemplate,
} from "@/modules/settings/stageTemplatesApi";
import { useCountries } from "@/modules/universities/useUniversitiesCatalog";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

/** One stage while it is being edited. `key` keeps React rows stable through a rename. */
type DraftStage = { key: string; name: string; active: boolean };

let draftKeySeed = 0;
const nextKey = () => `stage-${(draftKeySeed += 1)}`;

function toDraft(template: StageTemplate): DraftStage[] {
  return template.stages.map((stage) => ({
    key: nextKey(),
    name: stage.name,
    active: stage.active,
  }));
}

function sameAsTemplate(draft: DraftStage[], template: StageTemplate | undefined) {
  if (!template) return true;
  if (draft.length !== template.stages.length) return false;
  return draft.every(
    (stage, index) =>
      stage.name === template.stages[index].name && stage.active === template.stages[index].active,
  );
}

const stageTemplatesQueryKey = ["settings", "stage-templates"];

export function StageTemplatesPage() {
  const { hasPermissions } = useAuth();
  const canManage = hasPermissions([PERMISSIONS.SETTINGS_TENANT]);
  const queryClient = useQueryClient();

  const [selectedCode, setSelectedCode] = useState<string>(ANY_COUNTRY);
  const [draft, setDraft] = useState<DraftStage[]>([]);
  const [addingCountry, setAddingCountry] = useState(false);

  const templatesQuery = useQuery({
    queryKey: stageTemplatesQueryKey,
    queryFn: stageTemplatesApi.list,
  });

  // Only to offer countries that have no sequence yet; the page works without it.
  const { data: countries = [] } = useCountries();

  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
  const selected = useMemo(
    () => templates.find((template) => template.countryCode === selectedCode),
    [templates, selectedCode],
  );

  /*
    The draft is reseeded whenever the selected country's saved sequence changes — on
    first load, on switching country, and after a save or reset returns the new server
    state. Keyed on the resolved stage names so an unrelated refetch cannot silently
    discard edits in progress.
  */
  const selectedSignature = selected
    ? `${selected.countryCode}:${selected.source}:${selected.stages
        .map((stage) => `${stage.name}:${stage.active}`)
        .join("|")}`
    : "";

  useEffect(() => {
    if (selected) {
      setDraft(toDraft(selected));
    }
  }, [selectedSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation = useMutation({
    mutationFn: (stages: DraftStage[]) =>
      stageTemplatesApi.save(
        selectedCode,
        stages.map((stage) => ({ name: stage.name.trim(), active: stage.active })),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stageTemplatesQueryKey });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => stageTemplatesApi.reset(selectedCode),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stageTemplatesQueryKey });
    },
  });

  const move = (index: number, delta: number) => {
    setDraft((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const rename = (key: string, name: string) => {
    setDraft((current) =>
      current.map((stage) => (stage.key === key ? { ...stage, name } : stage)),
    );
  };

  const remove = (key: string) => {
    setDraft((current) => current.filter((stage) => stage.key !== key));
  };

  const addStage = () => {
    setDraft((current) => [...current, { key: nextKey(), name: "", active: true }]);
  };

  const trimmed = draft.map((stage) => stage.name.trim());
  const hasBlank = trimmed.some((name) => name.length === 0);
  const duplicate = trimmed.find(
    (name, index) =>
      name.length > 0 &&
      trimmed.findIndex((other) => other.toLowerCase() === name.toLowerCase()) !== index,
  );
  const unchanged = sameAsTemplate(draft, selected);
  const canSave =
    canManage && draft.length > 0 && !hasBlank && !duplicate && !unchanged && !saveMutation.isPending;

  // Countries with no sequence of their own, so the picker only offers something new.
  const addableCountries = useMemo(() => {
    const configured = new Set(templates.map((template) => template.countryCode));
    return countries.filter((country) => !configured.has(country.code));
  }, [countries, templates]);

  return (
    <Stack spacing={3}>
      <SettingsPageHeader
        eyebrow="Settings · Applications"
        title="Application Stages"
        actions={
          canManage && !addingCountry ? (
            <Button
              size="small"
              startIcon={<AddRounded />}
              sx={{ textTransform: "none" }}
              variant="contained"
              onClick={() => setAddingCountry(true)}
            >
              Add Country
            </Button>
          ) : null
        }
      />

      <Typography color="text.secondary" variant="body2">
        The stages an application moves through, per destination country. A country without
        its own sequence uses the default below it. Changing a sequence affects applications
        created from now on — those already in progress keep the stages they started with.
      </Typography>

      {addingCountry ? (
        <Paper elevation={0} sx={{ border: "1px solid", borderColor: "#e9eff5", borderRadius: "12px", p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: "center" }}>
            <Autocomplete
              options={addableCountries}
              getOptionLabel={(option) => option.name}
              size="small"
              sx={{ flex: 1, minWidth: 220 }}
              renderInput={(params) => <TextField {...params} label="Country" />}
              onChange={(_event, country) => {
                if (!country) return;
                // Nothing is written until Save; selecting a country just starts an
                // override seeded from whatever that country currently inherits.
                setSelectedCode(country.code);
                setAddingCountry(false);
              }}
            />
            <Button size="small" sx={{ textTransform: "none" }} onClick={() => setAddingCountry(false)}>
              Cancel
            </Button>
          </Stack>
          <Typography color="text.secondary" sx={{ display: "block", mt: 1 }} variant="caption">
            Countries already listed on the left are not shown here.
          </Typography>
        </Paper>
      ) : null}

      {templatesQuery.isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : null}

      {templatesQuery.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(templatesQuery.error, "Unable to load stage templates.")}
        </Alert>
      ) : null}

      {saveMutation.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(saveMutation.error, "Unable to save the stage sequence.")}
        </Alert>
      ) : null}

      {resetMutation.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(resetMutation.error, "Unable to reset the stage sequence.")}
        </Alert>
      ) : null}

      {templatesQuery.data ? (
        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
            alignItems: "start",
          }}
        >
          {/* ── Countries ──────────────────────────────────────────────── */}
          <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "#e9eff5", borderRadius: "12px", overflow: "hidden" }}
          >
            <List disablePadding>
              {templates.map((template) => {
                const isSelected = template.countryCode === selectedCode;
                const wildcard = template.countryCode === ANY_COUNTRY;
                return (
                  <ListItemButton
                    key={template.countryCode}
                    selected={isSelected}
                    sx={{ alignItems: "flex-start", gap: 1, py: 1.25 }}
                    onClick={() => setSelectedCode(template.countryCode)}
                  >
                    {wildcard ? (
                      <PublicRounded sx={{ color: "text.disabled", fontSize: 18, mt: 0.125 }} />
                    ) : null}
                    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontSize: 13, fontWeight: isSelected ? 700 : 600 }}>
                        {template.countryName}
                      </Typography>
                      <Typography color="text.disabled" sx={{ fontSize: 11 }}>
                        {template.stages.length} stages · {sourceLabel(template.source)}
                      </Typography>
                    </Stack>
                  </ListItemButton>
                );
              })}
              {selected === undefined && selectedCode !== ANY_COUNTRY ? (
                <ListItemButton selected sx={{ py: 1.25 }}>
                  <Stack spacing={0.25}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{selectedCode}</Typography>
                    <Typography color="text.disabled" sx={{ fontSize: 11 }}>
                      Not saved yet
                    </Typography>
                  </Stack>
                </ListItemButton>
              ) : null}
            </List>
          </Paper>

          {/* ── Stages ─────────────────────────────────────────────────── */}
          <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "#e9eff5", borderRadius: "12px", p: 2.25 }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 2 }}
            >
              <Stack spacing={0.5}>
                <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
                  {selected?.countryName ?? selectedCode}
                </Typography>
                {selected ? (
                  <Chip
                    label={sourceLabel(selected.source)}
                    size="small"
                    sx={{
                      alignSelf: "flex-start",
                      ...(isOverride(selected.source)
                        ? { backgroundColor: "#E1F5EC", color: "#0B7A57" }
                        : { backgroundColor: "#EEF2F6", color: "#55707C" }),
                    }}
                  />
                ) : null}
              </Stack>

              {canManage ? (
                <Stack direction="row" spacing={1}>
                  {selected && isOverride(selected.source) ? (
                    <Button
                      disabled={resetMutation.isPending}
                      size="small"
                      sx={{ textTransform: "none" }}
                      onClick={() => resetMutation.mutate()}
                    >
                      Reset to standard
                    </Button>
                  ) : null}
                  <Button
                    disabled={!canSave}
                    size="small"
                    sx={{ textTransform: "none" }}
                    variant="contained"
                    onClick={() => saveMutation.mutate(draft)}
                  >
                    {saveMutation.isPending ? "Saving…" : "Save sequence"}
                  </Button>
                </Stack>
              ) : null}
            </Stack>

            {selected && !isOverride(selected.source) ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                {selected.countryCode === ANY_COUNTRY
                  ? "This is the sequence every country without one of its own uses. Saving creates your own version of it."
                  : `${selected.countryName} is using the ${sourceLabel(selected.source).toLowerCase()}. Saving creates a sequence just for this country.`}
              </Alert>
            ) : null}

            <Divider sx={{ mb: 1.5 }} />

            <Stack spacing={1}>
              {draft.map((stage, index) => (
                <Stack
                  key={stage.key}
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <Typography
                    color="text.disabled"
                    sx={{ fontSize: 12, fontVariantNumeric: "tabular-nums", width: 22 }}
                  >
                    {index + 1}.
                  </Typography>
                  <TextField
                    disabled={!canManage}
                    error={stage.name.trim().length === 0}
                    fullWidth
                    size="small"
                    value={stage.name}
                    onChange={(event) => rename(stage.key, event.target.value)}
                  />
                  {canManage ? (
                    <>
                      <Tooltip title="Move up">
                        <span>
                          <IconButton
                            disabled={index === 0}
                            size="small"
                            onClick={() => move(index, -1)}
                          >
                            <ArrowUpwardRounded fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Move down">
                        <span>
                          <IconButton
                            disabled={index === draft.length - 1}
                            size="small"
                            onClick={() => move(index, 1)}
                          >
                            <ArrowDownwardRounded fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Remove stage">
                        <span>
                          <IconButton
                            disabled={draft.length <= 1}
                            size="small"
                            sx={{ color: "error.main" }}
                            onClick={() => remove(stage.key)}
                          >
                            <DeleteOutlineRounded fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </>
                  ) : null}
                </Stack>
              ))}
            </Stack>

            {canManage ? (
              <Button
                size="small"
                startIcon={<AddRounded />}
                sx={{ mt: 1.5, textTransform: "none" }}
                onClick={addStage}
              >
                Add stage
              </Button>
            ) : null}

            {duplicate ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                “{duplicate}” appears twice. Stage names must be unique within a country.
              </Alert>
            ) : null}
            {hasBlank ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Every stage needs a name.
              </Alert>
            ) : null}
          </Paper>
        </Box>
      ) : null}
    </Stack>
  );
}
