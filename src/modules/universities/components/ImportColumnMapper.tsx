import { Alert, FormControl, MenuItem, Select, Stack, Typography } from "@mui/material";
import type { ImportFieldGroup } from "@/config/universities/importFields";

/** Strips case/spacing/punctuation so "Course Name" and "course_name" both match. */
export function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Common header wordings that mean one of our fields but don't match it by name.
 * Values are already normalized. Kept in step with the backend's copy in
 * ImportColumnMapper.java — if you add one here, add it there too, or the UI will
 * show a different guess from the one the server would make.
 */
const HEADER_ALIASES: Record<string, string[]> = {
  university_name: ["university", "institution", "college", "school", "universityname"],
  country_code: ["country", "countryname", "nation", "destination"],
  city: ["location", "town", "cityname", "campus"],
  university_type: ["type", "institutiontype"],
  qs_ranking: ["rank", "ranking", "qsrank", "worldranking"],
  website: ["url", "weburl", "site", "link", "homepage"],
  course_name: ["course", "programme", "program", "coursetitle"],
  course_code: ["code", "programmecode", "programcode"],
  study_level: ["level", "degreelevel", "qualification"],
  subject_area: ["subject", "discipline", "field", "fieldofstudy"],
  duration_months: ["duration", "length", "coursduration", "courselength"],
  tuition_amount: ["tuition", "fee", "tuitionfee", "fees", "annualfee"],
  tuition_currency: ["currency", "feecurrency"],
  intake_month: ["intake", "intakemonth", "month"],
  intake_year: ["year", "intakeyear"],
};

/**
 * Best-effort guess at ourField -> the file's column, mirroring the backend's own
 * fallback in ImportColumnMapper.resolveMapping so the UI shows what the server would
 * have inferred anyway.
 *
 * Exact name matches are taken first so an alias can never outrank a real column name;
 * a header already claimed by one field is not offered to another.
 */
export function autoMapHeaders(
  fields: readonly string[],
  headers: string[],
): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const field of fields) {
    const match = headers.find((header) => normalizeHeader(header) === normalizeHeader(field));
    if (match) {
      mapping[field] = match;
    }
  }

  for (const field of fields) {
    if (mapping[field]) {
      continue;
    }
    const aliases = HEADER_ALIASES[field];
    if (!aliases) {
      continue;
    }
    const claimed = new Set(Object.values(mapping));
    const match = headers.find(
      (header) => !claimed.has(header) && aliases.includes(normalizeHeader(header)),
    );
    if (match) {
      mapping[field] = match;
    }
  }

  return mapping;
}

type ImportColumnMapperProps = {
  /**
   * Fields to map, in labelled sections. Grouping matters here: the university import
   * legitimately accepts course columns, and a flat list of all 13 reads as though a
   * course were required when it is not.
   */
  groups: ImportFieldGroup[];
  /** Human labels for those fields. */
  labels: Record<string, string>;
  /** Fields the importer cannot run without. */
  requiredFields: readonly string[];
  /** Headers detected in the uploaded file. */
  headers: string[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
};

/**
 * "Map your columns to ours" step, so a spreadsheet doesn't have to be renamed before
 * it can be imported. Same shape as the lead import's mapping step.
 */
export function ImportColumnMapper({
  groups,
  labels,
  requiredFields,
  headers,
  value,
  onChange,
}: ImportColumnMapperProps) {
  const missingRequired = requiredFields.filter((field) => !value[field]);
  const allMatched = groups.every((group) => group.fields.every((field) => value[field]));

  return (
    <Stack spacing={1.5}>
      {missingRequired.length > 0 ? (
        <Alert severity="warning">
          Map a column to {missingRequired.map((field) => labels[field] ?? field).join(", ")}{" "}
          before importing.
        </Alert>
      ) : allMatched ? (
        <Alert severity="success">
          All {headers.length} columns matched automatically — ready to preview.
        </Alert>
      ) : (
        <Alert severity="info">
          We matched what we could automatically — adjust any that look wrong, then preview.
        </Alert>
      )}

      {groups.map((group) => (
        <Stack key={group.label} spacing={1}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, mt: 0.5 }}>
            {group.label}
          </Typography>
          {group.description ? (
            <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>
              {group.description}
            </Typography>
          ) : null}
          {group.fields.map((field) => (
            <Stack key={field} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Typography sx={{ fontSize: 12.5, flexShrink: 0, width: 190 }}>
                {labels[field] ?? field}
                {requiredFields.includes(field) ? " *" : ""}
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  displayEmpty
                  error={requiredFields.includes(field) && !value[field]}
                  value={value[field] ?? ""}
                  onChange={(event) => onChange({ ...value, [field]: event.target.value })}
                >
                  <MenuItem value="">
                    <em>Not in file</em>
                  </MenuItem>
                  {headers.map((header) => (
                    <MenuItem key={header} value={header}>
                      {header}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          ))}
        </Stack>
      ))}
    </Stack>
  );
}
