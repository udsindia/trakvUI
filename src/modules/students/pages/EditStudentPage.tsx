import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { usersService } from "@/modules/settings/usersService";
import {
  studentsApi,
  type BackendStudentDetail,
  type UpdateStudentPayload,
} from "@/modules/students/studentsApi";
import { studentRoutePaths } from "@/modules/students/studentRoutePaths";

type FormState = {
  assignedTo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  passportExpiryDate: string;
  passportIssueCountry: string;
  highestDegree: string;
  institutionName: string;
  fieldOfStudy: string;
  graduationYear: string;
  academicScore: string;
  scoreType: string;
  workExperienceMonths: string;
};

const EMPTY_FORM: FormState = {
  assignedTo: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  nationality: "",
  passportExpiryDate: "",
  passportIssueCountry: "",
  highestDegree: "",
  institutionName: "",
  fieldOfStudy: "",
  graduationYear: "",
  academicScore: "",
  scoreType: "",
  workExperienceMonths: "",
};

/** Dates arrive as ISO instants/dates; the date input needs bare yyyy-MM-dd. */
function toDateInput(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function toFormState(student: BackendStudentDetail): FormState {
  return {
    assignedTo: student.assignedTo ?? "",
    firstName: student.firstName ?? "",
    lastName: student.lastName ?? "",
    email: student.email ?? "",
    phone: student.phone ?? "",
    dateOfBirth: toDateInput(student.dateOfBirth),
    nationality: student.nationality ?? "",
    passportExpiryDate: toDateInput(student.passportExpiryDate),
    passportIssueCountry: student.passportIssueCountry ?? "",
    highestDegree: student.highestDegree ?? "",
    institutionName: student.institutionName ?? "",
    fieldOfStudy: student.fieldOfStudy ?? "",
    graduationYear: student.graduationYear?.toString() ?? "",
    academicScore: student.academicScore?.toString() ?? "",
    scoreType: student.scoreType ?? "",
    workExperienceMonths: student.workExperienceMonths?.toString() ?? "",
  };
}

/** Blank numeric input → omitted, since the backend reads null as "leave unchanged". */
function numberOrUndefined(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toPayload(form: FormState): UpdateStudentPayload {
  return {
    assignedTo: form.assignedTo || undefined,
    // Strings are sent even when blank: "" is not null, so it genuinely clears them.
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    nationality: form.nationality.trim(),
    // passport_issue_country is varchar(3) — an ISO code. Anything longer is
    // rejected by the database as a 500, so it is clamped here as well as in the input.
    passportIssueCountry: form.passportIssueCountry.trim().toUpperCase().slice(0, 3),
    highestDegree: form.highestDegree.trim(),
    institutionName: form.institutionName.trim(),
    fieldOfStudy: form.fieldOfStudy.trim(),
    scoreType: form.scoreType.trim(),
    dateOfBirth: form.dateOfBirth || undefined,
    passportExpiryDate: form.passportExpiryDate || undefined,
    graduationYear: numberOrUndefined(form.graduationYear),
    academicScore: numberOrUndefined(form.academicScore),
    workExperienceMonths: numberOrUndefined(form.workExperienceMonths),
  };
}

export function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  const tenantId = tenant?.tenantId ?? "";

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const {
    data: student,
    isLoading,
    isError,
  } = useQuery({
    enabled: Boolean(id),
    queryKey: ["student", id],
    queryFn: () => studentsApi.getStudent(id as string),
  });

  const usersQuery = useQuery({
    enabled: Boolean(tenantId),
    queryKey: ["settings", "users", tenantId],
    queryFn: () => usersService.getUsers(tenantId),
  });

  const assigneeOptions = useMemo(
    () => (usersQuery.data ?? []).filter((user) => user.active),
    [usersQuery.data],
  );

  useEffect(() => {
    if (student) setForm(toFormState(student));
  }, [student]);

  const mutation = useMutation({
    mutationFn: () => studentsApi.updateStudent(id as string, toPayload(form)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["student", id] });
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      navigate(studentRoutePaths.details(id as string));
    },
    onError: (e: unknown) => {
      const anyE = e as { response?: { data?: { message?: string } }; message?: string };
      setError(anyE?.response?.data?.message ?? anyE?.message ?? "Could not save the student.");
    },
  });

  const setField = (key: keyof FormState) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !student) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <Typography color="error">Student not found.</Typography>
      </Box>
    );
  }

  const fullName = `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() || "Student";
  const gridSx = {
    display: "grid",
    gap: 2,
    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
  } as const;

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        minHeight: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` },
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader
          actions={
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                sx={{ borderRadius: "9px", textTransform: "none" }}
                onClick={() => navigate(studentRoutePaths.details(id as string))}
              >
                Cancel
              </Button>
              <Button
                disabled={mutation.isPending}
                variant="contained"
                sx={{ borderRadius: "9px", textTransform: "none" }}
                onClick={() => {
                  setError(null);
                  mutation.mutate();
                }}
              >
                {mutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </Stack>
          }
          subtitle="Update profile, passport and academic details"
          title={`Edit ${fullName}`}
        />
      </Box>

      <Stack spacing={2.5} sx={{ bgcolor: "#fcfdff", flex: 1, overflowY: "auto", p: { xs: 2, md: 3 } }}>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Stack spacing={1.25}>
          <Typography sx={{ fontSize: 12, fontWeight: 700 }} variant="subtitle2">
            CONTACT
          </Typography>
          <Box sx={gridSx}>
            <TextField label="First name" size="small" value={form.firstName} onChange={setField("firstName")} />
            <TextField label="Last name" size="small" value={form.lastName} onChange={setField("lastName")} />
            <TextField label="Email" size="small" value={form.email} onChange={setField("email")} />
            <TextField label="Phone" size="small" value={form.phone} onChange={setField("phone")} />
            <TextField
              InputLabelProps={{ shrink: true }}
              label="Date of birth"
              size="small"
              type="date"
              value={form.dateOfBirth}
              onChange={setField("dateOfBirth")}
            />
            <TextField label="Nationality" size="small" value={form.nationality} onChange={setField("nationality")} />
            <TextField
              label="Assigned to"
              select
              size="small"
              value={form.assignedTo}
              onChange={setField("assignedTo")}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {assigneeOptions.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Stack>

        <Divider />

        <Stack spacing={1.25}>
          <Typography sx={{ fontSize: 12, fontWeight: 700 }} variant="subtitle2">
            PASSPORT
          </Typography>
          <Box sx={gridSx}>
            <TextField
              helperText="3-letter ISO code, e.g. IND"
              inputProps={{ maxLength: 3, style: { textTransform: "uppercase" } }}
              label="Issuing country"
              size="small"
              value={form.passportIssueCountry}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  passportIssueCountry: event.target.value.toUpperCase().slice(0, 3),
                }))
              }
            />
            <TextField
              InputLabelProps={{ shrink: true }}
              label="Expiry date"
              size="small"
              type="date"
              value={form.passportExpiryDate}
              onChange={setField("passportExpiryDate")}
            />
          </Box>
        </Stack>

        <Divider />

        <Stack spacing={1.25}>
          <Typography sx={{ fontSize: 12, fontWeight: 700 }} variant="subtitle2">
            ACADEMICS
          </Typography>
          <Box sx={gridSx}>
            <TextField
              label="Highest degree"
              size="small"
              value={form.highestDegree}
              onChange={setField("highestDegree")}
            />
            <TextField
              label="Institution"
              size="small"
              value={form.institutionName}
              onChange={setField("institutionName")}
            />
            <TextField
              label="Field of study"
              size="small"
              value={form.fieldOfStudy}
              onChange={setField("fieldOfStudy")}
            />
            <TextField
              label="Graduation year"
              size="small"
              type="number"
              value={form.graduationYear}
              onChange={setField("graduationYear")}
            />
            <TextField
              label="Academic score"
              size="small"
              type="number"
              value={form.academicScore}
              onChange={setField("academicScore")}
            />
            <TextField
              label="Score type"
              placeholder="e.g. GPA, Percentage"
              size="small"
              value={form.scoreType}
              onChange={setField("scoreType")}
            />
            <TextField
              label="Work experience (months)"
              size="small"
              type="number"
              value={form.workExperienceMonths}
              onChange={setField("workExperienceMonths")}
            />
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
