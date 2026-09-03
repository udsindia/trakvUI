import {
  Button,
  Divider,
  Drawer,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
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
  onSave: (input: UniversityInput) => void;
  open: boolean;
  university?: University | null;
};

export function UniversityFormDrawer({
  onClose,
  onSave,
  open,
  university,
}: UniversityFormDrawerProps) {
  const [form, setForm] = useState<UniversityInput>(emptyUniversity());

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
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, p: 3 } }}>
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

        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => onSave({ ...form, id: university?.id })}
            disabled={!form.name.trim() || !form.countryCode.trim()}
          >
            Save university
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
