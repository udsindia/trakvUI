import {
  Alert,
  Box,
  Button,
  Divider,
  Drawer,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { lazy, Suspense } from "react";
import type { DraftStage } from "@/modules/settings/components/StageSequenceEditor";

/*
  Loaded on demand. This drawer is shared with the super-admin portal and the university
  detail page, so a static import put the settings module's stage code into the chunk
  every page loads — 92kB on first paint for a panel most people never open.
*/
const UniversityStagesSection = lazy(() =>
  import("@/modules/universities/components/UniversityStagesSection").then((module) => ({
    default: module.UniversityStagesSection,
  })),
);
import { courseSearchSettings } from "@/config/universities/courseSearchSettings";
import type { University } from "@/modules/universities/universities.types";
import type { UniversityInput } from "@/modules/universities/universitiesCatalogService";
import { useUniversity } from "@/modules/universities/useUniversitiesCatalog";

const emptyUniversity = (): UniversityInput => ({
  name: "",
  shortName: "",
  country: "",
  countryCode: "",
  city: "",
  flag: "",
  founded: new Date().getFullYear(),
  website: "",
  qsRank: undefined,
  universityType: "PUBLIC",
  about: "",
  internalNotes: "",
  links: [],
  trackRecord: {
    studentsEnrolled: 0,
    visasApproved: 0,
    visaSuccessRate: 0,
    avgApplicationDays: 0,
    avgCommission: "₹0",
  },
});

type UniversityFormDrawerProps = {
  onClose: () => void;
  /**
   * Called with the university, and the stage sequence when one was customised.
   *
   * Stages are handed back rather than saved here because they cannot be saved until the
   * university exists and has an id. The caller creates it, then saves these against it.
   */
  onSave: (input: UniversityInput, stages?: { name: string; active: boolean }[]) => void;
  open: boolean;
  university?: University | null;
  /**
   * Whether to offer the application stage sequence.
   *
   * Off by default because this drawer also serves the super-admin portal, where stage
   * templates are a tenant concept that does not apply.
   */
  showStages?: boolean;
};

export function UniversityFormDrawer({
  onClose,
  onSave,
  open,
  university,
  showStages = false,
}: UniversityFormDrawerProps) {
  const [form, setForm] = useState<UniversityInput>(emptyUniversity());

  // Stage sequence. Off until somebody asks for it: most universities follow their
  // country, and a form that opens with nine editable rows suggests otherwise.
  const [customiseStages, setCustomiseStages] = useState(false);
  const [stageDraft, setStageDraft] = useState<DraftStage[]>([]);

  // The same rules the editor and the server apply. Repeated rather than imported so the
  // drawer keeps no static dependency on the settings module.
  const stageNames = stageDraft.map((stage) => stage.name.trim());
  const stagesAreValid =
    stageDraft.length > 0 &&
    stageNames.every((name) => name.length > 0) &&
    new Set(stageNames.map((name) => name.toLowerCase())).size === stageNames.length;


  // Website and internal notes only exist on the detail response — a university picked from
  // a list is summary-shaped and carries neither. Without this the fields would open blank
  // and saving would wipe what is stored.
  const { data: detail } = useUniversity(open && university?.id ? university.id : undefined);
  const appliedDetailIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (university) {
      setForm({ ...university });
    } else {
      setForm(emptyUniversity());
    }
    appliedDetailIdRef.current = null;
    setCustomiseStages(false);
    setStageDraft([]);
  }, [university, open]);


  useEffect(() => {
    if (!open || !detail || detail.id !== university?.id) {
      return;
    }
    // Applied once per open so a background refetch cannot overwrite what is being typed.
    if (appliedDetailIdRef.current === detail.id) {
      return;
    }
    appliedDetailIdRef.current = detail.id;
    setForm((current) => ({
      ...current,
      website: current.website || detail.website,
      internalNotes: current.internalNotes || detail.internalNotes,
    }));
  }, [detail, open, university?.id]);

  const handleCountryChange = (countryCode: string) => {
    const option = courseSearchSettings.filters.country.options.find(
      (entry) => entry.value === countryCode,
    );
    setForm((current) => ({
      ...current,
      countryCode,
      country: option?.label ?? current.country,
    }));
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      // 520px was set when this held a name, a country and a few numbers. It now also
      // carries the stage sequence, whose rows need room for a drag handle, a name field
      // and three buttons — at the old width those rows were squeezed to nothing.
      // Capped at 92vw so it never fills the screen entirely: seeing the list behind is
      // what makes a drawer worth using instead of a page.
      PaperProps={{ sx: { width: { xs: "100%", sm: "min(780px, 92vw)" }, p: 3 } }}
    >
      <Stack spacing={2.5}>
        <Typography variant="h6">{university ? "Edit University" : "Add University"}</Typography>
        <Divider />

        <Typography color="text.secondary" variant="subtitle2">
          Basic information
        </Typography>
        <TextField
          fullWidth
          label="University name"
          size="small"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            label="University type"
            select
            // A native select always paints its selected option's text, so the label has
            // to sit above the box. Left to shrink on its own it stays inside while the
            // value is empty, printing the label straight over "Select …".
            InputLabelProps={{ shrink: true }}
            SelectProps={{ native: true }}
            size="small"
            value={form.universityType ?? "PUBLIC"}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                universityType: event.target.value as UniversityInput["universityType"],
              }))
            }
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
            <option value="RESEARCH_INTENSIVE">Research intensive</option>
          </TextField>
          <TextField
            label="QS rank"
            size="small"
            type="number"
            value={form.qsRank ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                qsRank: event.target.value ? Number(event.target.value) : undefined,
              }))
            }
          />
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            label="Country code"
            select
            // A native select always paints its selected option's text, so the label has
            // to sit above the box. Left to shrink on its own it stays inside while the
            // value is empty, printing the label straight over "Select …".
            InputLabelProps={{ shrink: true }}
            SelectProps={{ native: true }}
            size="small"
            value={form.countryCode}
            onChange={(event) => handleCountryChange(event.target.value)}
          >
            <option value="">Select country</option>
            {courseSearchSettings.filters.country.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="City"
            size="small"
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
          />
        </Stack>
        <TextField
          fullWidth
          helperText="Shown as a link on the university page. https:// is added if you leave it off."
          label="Website"
          size="small"
          value={form.website}
          onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
        />

        <Typography color="text.secondary" variant="subtitle2">
          Internal notes
        </Typography>
        <TextField
          fullWidth
          multiline
          helperText="Only your team sees this — it is stored against your agency, not the shared catalog."
          label="Internal notes"
          minRows={3}
          size="small"
          value={form.internalNotes ?? ""}
          onChange={(event) =>
            setForm((current) => ({ ...current, internalNotes: event.target.value }))
          }
        />

        {showStages ? (
          <>
            <Divider />
            <Typography color="text.secondary" variant="subtitle2">
              Application stages
            </Typography>

            <Suspense
              fallback={
                <Typography color="text.secondary" variant="body2">
                  Loading stages…
                </Typography>
              }
            >
              <UniversityStagesSection
                countryCode={form.countryCode}
                customise={customiseStages}
                stages={stageDraft}
                onCustomiseChange={setCustomiseStages}
                onStagesChange={setStageDraft}
              />
            </Suspense>
          </>
        ) : null}

        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() =>
              onSave(
                { ...form, id: university?.id },
                customiseStages
                  ? stageDraft.map((stage) => ({
                      name: stage.name.trim(),
                      active: stage.active,
                    }))
                  : undefined,
              )
            }
            disabled={
              !form.name.trim() ||
              !form.countryCode.trim() ||
              (customiseStages && !stagesAreValid)
            }
          >
            Save university
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
