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
  ToggleButton,
  ToggleButtonGroup,
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
  type StageChangePreview,
} from "@/modules/settings/stageTemplatesApi";
import { useCountries, useAllUniversities } from "@/modules/universities/useUniversitiesCatalog";
import { StageChangePreviewDialog } from "@/modules/settings/components/StageChangePreviewDialog";
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

  // Country or university scope. The editor below is identical either way - only what is
  // being edited changes - so this is a scope switch rather than a second screen.
  const [scope, setScope] = useState<"country" | "university">("country");
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>("");

  // Save goes through a preview whenever applications in flight would be touched, so the
  // confirmation can name a number instead of warning about change in general.
  const [preview, setPreview] = useState<StageChangePreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const templatesQuery = useQuery({
    queryKey: stageTemplatesQueryKey,
    queryFn: stageTemplatesApi.list,
  });

  // Only to offer countries that have no sequence yet; the page works without it.
  const { data: countries = [] } = useCountries();
  // Only fetched once the university scope is actually open — the catalogue is a large
  // list and an admin editing country sequences never needs it.
  const { data: universities = [] } = useAllUniversities(scope === "university");

  const universityTemplateQuery = useQuery({
    enabled: scope === "university" && Boolean(selectedUniversityId),
    queryKey: ["settings", "stage-templates", "university", selectedUniversityId],
    queryFn: () =>
      stageTemplatesApi.getForUniversity(
        selectedUniversityId,
        universities.find((u) => u.id === selectedUniversityId)?.countryCode,
      ),
  });

  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
  const universityCountry = universities.find((u) => u.id === selectedUniversityId)?.countryCode;

  const selected = useMemo(
    () =>
      scope === "university"
        ? universityTemplateQuery.data
        : templates.find((template) => template.countryCode === selectedCode),
    [scope, universityTemplateQuery.data, templates, selectedCode],
  );

  /*
    The draft is reseeded whenever the selected country's saved sequence changes — on
    first load, on switching country, and after a save or reset returns the new server
    state. Keyed on the resolved stage names so an unrelated refetch cannot silently
    discard edits in progress.
  */
  const selectedSignature = selected
    ? `${scope}:${selectedUniversityId}:${selected.countryCode}:${selected.source}:${selected.stages
        .map((stage) => `${stage.name}:${stage.active}`)
        .join("|")}`
    : "";

  useEffect(() => {
    if (selected) {
      setDraft(toDraft(selected));
    }
  }, [selectedSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshTemplates = async () => {
    await queryClient.invalidateQueries({ queryKey: stageTemplatesQueryKey });
    await queryClient.invalidateQueries({
      queryKey: ["settings", "stage-templates", "university"],
    });
    // Saving reconciles applications in flight, so anything showing them is now stale.
    await queryClient.invalidateQueries({ queryKey: ["applications"] });
  };

  const stagesPayload = (stages: DraftStage[]) =>
    stages.map((stage) => ({ name: stage.name.trim(), active: stage.active }));

  const saveMutation = useMutation({
    mutationFn: (stages: DraftStage[]) =>
      scope === "university"
        ? stageTemplatesApi.saveForUniversity(
            selectedUniversityId,
            stagesPayload(stages),
            universityCountry,
          )
        : stageTemplatesApi.save(selectedCode, stagesPayload(stages)),
    onSuccess: async () => {
      setPreviewOpen(false);
      await refreshTemplates();
    },
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      scope === "university"
        ? stageTemplatesApi.resetForUniversity(selectedUniversityId, universityCountry)
        : stageTemplatesApi.reset(selectedCode),
    onSuccess: refreshTemplates,
  });

  /**
   * Asks the server what the save would do before doing it. A failed preview does not
   * block the save - the confirmation simply shows nothing rather than refusing to let an
   * admin work because a read-only call was unavailable.
   */
  const requestSave = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreview(null);
    try {
      const result =
        scope === "university"
          ? await stageTemplatesApi.previewUniversity(selectedUniversityId, stagesPayload(draft))
          : await stageTemplatesApi.previewCountry(selectedCode, stagesPayload(draft));
      setPreview(result);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

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
          canManage && !addingCountry && scope === "country" ? (
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

      <ToggleButtonGroup
        exclusive
        size="small"
        value={scope}
        onChange={(_event, next) => {
          if (!next) return;
          setScope(next);
          // The draft belongs to whatever was being edited. Carrying it across scopes
          // showed a country's stages under a university heading.
          setDraft([]);
        }}
      >
        <ToggleButton sx={{ textTransform: "none", px: 2 }} value="country">
          By country
        </ToggleButton>
        <ToggleButton sx={{ textTransform: "none", px: 2 }} value="university">
          By university
        </ToggleButton>
      </ToggleButtonGroup>

      <Typography color="text.secondary" variant="body2">
        The stages an application moves through. A university can have its own sequence; a
        country without one uses the default below it. Saving updates applications already
        in progress as well — stages they have already been through are kept, and their
        counsellor is asked about anything that needs confirming.
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
            <List disablePadding sx={{ maxHeight: 520, overflowY: "auto" }}>
              {scope === "university"
                ? universities.map((university) => {
                    const isSelected = university.id === selectedUniversityId;
                    return (
                      <ListItemButton
                        key={university.id}
                        selected={isSelected}
                        sx={{ alignItems: "flex-start", py: 1.25 }}
                        onClick={() => setSelectedUniversityId(university.id)}
                      >
                        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                          <Typography noWrap sx={{ fontSize: 13, fontWeight: isSelected ? 700 : 600 }}>
                            {university.name}
                          </Typography>
                          <Typography color="text.disabled" sx={{ fontSize: 11 }}>
                            {university.countryCode}
                          </Typography>
                        </Stack>
                      </ListItemButton>
                    );
                  })
                : null}
              {scope === "country" ? templates.map((template) => {
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
              }) : null}
              {scope === "country" && selected === undefined && selectedCode !== ANY_COUNTRY ? (
                <ListItemButton selected sx={{ py: 1.25 }}>
                  <Stack spacing={0.25}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{selectedCode}</Typography>
                    <Typography color="text.disabled" sx={{ fontSize: 11 }}>
                      Not saved yet
                    </Typography>
                  </Stack>
                </ListItemButton>
              ) : null}
              {scope === "university" && universities.length === 0 ? (
                <Box sx={{ px: 2, py: 2.5 }}>
                  <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
                    No universities in your catalogue yet.
                  </Typography>
                </Box>
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
                  {scope === "university"
                    ? universities.find((u) => u.id === selectedUniversityId)?.name ??
                      "Select a university"
                    : selected?.countryName ?? selectedCode}
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
                      {scope === "university" ? "Use the country sequence" : "Reset to standard"}
                    </Button>
                  ) : null}
                  <Button
                    disabled={!canSave}
                    size="small"
                    sx={{ textTransform: "none" }}
                    variant="contained"
                    onClick={requestSave}
                  >
                    {saveMutation.isPending ? "Saving…" : "Save sequence"}
                  </Button>
                </Stack>
              ) : null}
            </Stack>

            {selected && !isOverride(selected.source) ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                {scope === "university"
                  ? `${
                      universities.find((u) => u.id === selectedUniversityId)?.name ??
                      "This university"
                    } is following ${selected.countryName}'s sequence. Saving creates one just for this university, and later changes to ${selected.countryName} will not reach it.`
                  : selected.countryCode === ANY_COUNTRY
                    ? "This is the sequence every country without one of its own uses. Saving creates your own version of it."
                    : `${selected.countryName} is using the ${sourceLabel(selected.source).toLowerCase()}. Saving creates a sequence just for this country.`}
              </Alert>
            ) : null}

            <Divider sx={{ mb: 1.5 }} />

            {scope === "university" && !selectedUniversityId ? (
              <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }} variant="body2">
                Choose a university on the left to see the stages its applications get.
              </Typography>
            ) : null}

            <Stack spacing={1}>
              {scope === "university" && !selectedUniversityId ? null : draft.map((stage, index) => (
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

            {canManage && !(scope === "university" && !selectedUniversityId) ? (
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
      <StageChangePreviewDialog
        loading={previewLoading}
        open={previewOpen}
        preview={preview}
        saving={saveMutation.isPending}
        scopeLabel={
          scope === "university"
            ? universities.find((u) => u.id === selectedUniversityId)?.name ?? "university"
            : selected?.countryName ?? selectedCode
        }
        onCancel={() => setPreviewOpen(false)}
        onConfirm={() => saveMutation.mutate(draft)}
      />

    </Stack>
  );
}
