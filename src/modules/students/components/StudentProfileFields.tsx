import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { UpdateStudentPayload } from "@/modules/students/studentsApi";

type StudentProfileFieldsProps = {
  value: UpdateStudentPayload;
  disabled?: boolean;
  /**
   * Identity (name, email, phone) is mirrored from the lead on every lead edit, so editing
   * it here would be overwritten the next time somebody touched the lead. Shown only where
   * there is no lead behind the student.
   */
  showIdentity?: boolean;
  onChange: (patch: UpdateStudentPayload) => void;
};

const DEGREES = ["High School", "Diploma", "Bachelors", "Masters", "PhD"];
const SCORE_TYPES = ["Percentage", "GPA", "CGPA"];

/**
 * The fields a student has and a lead never did.
 *
 * One component for two callers on purpose: the same set is asked for when a lead is
 * enrolled and edited afterwards on the student's page, and two copies would drift the
 * first time a field was added.
 */
export function StudentProfileFields({
  value,
  disabled = false,
  showIdentity = false,
  onChange,
}: StudentProfileFieldsProps) {
  const set = (patch: UpdateStudentPayload) => onChange({ ...value, ...patch });
  const text = (key: keyof UpdateStudentPayload) => ({
    disabled,
    fullWidth: true,
    size: "small" as const,
    value: (value[key] as string | null | undefined) ?? "",
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      set({ [key]: event.target.value || null } as UpdateStudentPayload),
  });

  const numeric = (key: keyof UpdateStudentPayload) => ({
    disabled,
    fullWidth: true,
    size: "small" as const,
    type: "number",
    value: (value[key] as number | null | undefined) ?? "",
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      set({
        [key]: event.target.value === "" ? null : Number(event.target.value),
      } as UpdateStudentPayload),
  });

  return (
    <Stack spacing={2}>
      {showIdentity ? (
        <>
          <Typography color="text.secondary" variant="subtitle2">
            Identity
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField label="First name" {...text("firstName")} />
            <TextField label="Last name" {...text("lastName")} />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField label="Email" {...text("email")} />
            <TextField label="Phone" {...text("phone")} />
          </Stack>
        </>
      ) : null}

      <Typography color="text.secondary" variant="subtitle2">
        Personal
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField
          InputLabelProps={{ shrink: true }}
          label="Date of birth"
          type="date"
          {...text("dateOfBirth")}
        />
        <TextField label="Nationality" {...text("nationality")} />
      </Stack>

      <Typography color="text.secondary" variant="subtitle2">
        Passport
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField
          InputLabelProps={{ shrink: true }}
          label="Expiry date"
          type="date"
          {...text("passportExpiryDate")}
        />
        <TextField
          helperText="Three-letter code, e.g. IND"
          label="Issuing country"
          inputProps={{ maxLength: 3 }}
          {...text("passportIssueCountry")}
        />
      </Stack>

      <Typography color="text.secondary" variant="subtitle2">
        Education
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField select label="Highest degree" {...text("highestDegree")}>
          <MenuItem value="">Not specified</MenuItem>
          {DEGREES.map((degree) => (
            <MenuItem key={degree} value={degree}>
              {degree}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="Institution" {...text("institutionName")} />
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField label="Field of study" {...text("fieldOfStudy")} />
        <TextField label="Graduation year" {...numeric("graduationYear")} />
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField label="Score" {...numeric("academicScore")} />
        <TextField select label="Score type" {...text("scoreType")}>
          <MenuItem value="">Not specified</MenuItem>
          {SCORE_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <TextField
        helperText="In months"
        label="Work experience"
        {...numeric("workExperienceMonths")}
      />
    </Stack>
  );
}
