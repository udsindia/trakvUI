import type { FormEventHandler } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, type UseFormReturn } from "react-hook-form";
import { STUDY_LEVELS, type ApplicationFormValues } from "@/modules/applications/applicationForm.types";
import type { StudentOption } from "@/modules/applications/studentsApi";
import type { CountryDto, CourseDto, UniversitySummaryDto } from "@/modules/universities/universitiesApi.types";

type ApplicationFormProps = {
  form: UseFormReturn<ApplicationFormValues>;
  students: StudentOption[];
  countries: CountryDto[];
  universities: UniversitySummaryDto[];
  courses: CourseDto[];
  lockedStudentName: string | null;
  isStudentLocked: boolean;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ApplicationForm({
  form,
  students,
  countries,
  universities,
  courses,
  lockedStudentName,
  isStudentLocked,
  onCancel,
  onSubmit,
}: ApplicationFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = form;

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "background.paper",
      borderRadius: 2.5,
    },
  };

  const alwaysVisibleLabelSlotProps = {
    inputLabel: { shrink: true },
  } as const;

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "#e9eff5",
        borderRadius: 3,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
        <Box component="form" noValidate onSubmit={onSubmit}>
          <Stack spacing={3}>
            {errors.root?.message && (
              <Alert severity={errors.root.message.includes("warming up") ? "warning" : "error"}>
                {errors.root.message}
              </Alert>
            )}
            <Stack spacing={0.75}>
              <Typography variant="h6">Application Information</Typography>
              <Typography color="text.secondary" variant="body2">
                Attach this application to a student and provide the university details.
              </Typography>
            </Stack>

            <Divider />

            {/* Student — locked when launched from a student, otherwise a picker */}
            {isStudentLocked ? (
              <TextField
                fullWidth
                label="Student"
                value={lockedStudentName ?? "Selected student"}
                slotProps={{ ...alwaysVisibleLabelSlotProps, input: { readOnly: true } }}
                sx={fieldSx}
              />
            ) : (
              <Controller
                control={control}
                name="studentId"
                rules={{ required: "Please select a student." }}
                render={({ field }) => (
                  <Autocomplete
                    options={students}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, selected) => option.id === selected.id}
                    value={students.find((s) => s.id === field.value) ?? null}
                    onChange={(_, newValue) => field.onChange(newValue ? newValue.id : "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Student"
                        required
                        error={Boolean(errors.studentId)}
                        helperText={errors.studentId?.message || "Select an existing student"}
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                      />
                    )}
                  />
                )}
              />
            )}

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={3}>
                  <Controller
                    control={control}
                    name="universityName"
                    rules={{ required: "University name is required." }}
                    render={({ field }) => (
                      <Autocomplete
                        freeSolo
                        options={universities}
                        getOptionLabel={(option) => (typeof option === "string" ? option : option.name)}
                        isOptionEqualToValue={(option, selected) =>
                          option.name === (typeof selected === "string" ? selected : selected.name)
                        }
                        value={field.value || null}
                        onChange={(_, newValue) =>
                          field.onChange(typeof newValue === "string" ? newValue : newValue?.name ?? "")
                        }
                        onInputChange={(_, newInputValue, reason) => {
                          if (reason === "input") field.onChange(newInputValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            error={Boolean(errors.universityName)}
                            fullWidth
                            helperText={
                              errors.universityName?.message ||
                              "Select a Destination Country first to see matching universities"
                            }
                            id={field.name}
                            label="University Name"
                            placeholder="e.g. University of Toronto"
                            required
                            slotProps={alwaysVisibleLabelSlotProps}
                            sx={fieldSx}
                          />
                        )}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="courseName"
                    rules={{ required: "Course is required." }}
                    render={({ field }) => (
                      <Autocomplete
                        freeSolo
                        options={courses}
                        getOptionLabel={(option) => (typeof option === "string" ? option : option.name)}
                        isOptionEqualToValue={(option, selected) =>
                          option.name === (typeof selected === "string" ? selected : selected.name)
                        }
                        value={field.value || null}
                        onChange={(_, newValue) =>
                          field.onChange(typeof newValue === "string" ? newValue : newValue?.name ?? "")
                        }
                        onInputChange={(_, newInputValue, reason) => {
                          if (reason === "input") field.onChange(newInputValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            error={Boolean(errors.courseName)}
                            fullWidth
                            helperText={
                              errors.courseName?.message ||
                              "Select a University Name first to see matching courses"
                            }
                            id={field.name}
                            label="Course"
                            placeholder="e.g. MS Computer Science"
                            required
                            slotProps={alwaysVisibleLabelSlotProps}
                            sx={fieldSx}
                          />
                        )}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="studyLevel"
                    rules={{ required: "Study level is required." }}
                    render={({ field }) => (
                      <TextField
                        error={Boolean(errors.studyLevel)}
                        fullWidth
                        helperText={errors.studyLevel?.message}
                        id={field.name}
                        label="Study Level"
                        select
                        required
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        {...field}
                      >
                        <MenuItem disabled value="">Select level</MenuItem>
                        {STUDY_LEVELS.map((level) => (
                          <MenuItem key={level} value={level}>
                            {level.replace(/_/g, " ")}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />

                  <Controller
                    control={control}
                    name="destinationCountry"
                    rules={{ required: "Destination country is required." }}
                    render={({ field }) => (
                      <Autocomplete
                        freeSolo
                        options={countries}
                        getOptionLabel={(option) => (typeof option === "string" ? option : option.name)}
                        isOptionEqualToValue={(option, selected) =>
                          option.name === (typeof selected === "string" ? selected : selected.name)
                        }
                        value={field.value || null}
                        onChange={(_, newValue) =>
                          field.onChange(typeof newValue === "string" ? newValue : newValue?.name ?? "")
                        }
                        onInputChange={(_, newInputValue, reason) => {
                          if (reason === "input") field.onChange(newInputValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            error={Boolean(errors.destinationCountry)}
                            fullWidth
                            helperText={errors.destinationCountry?.message}
                            id={field.name}
                            label="Destination Country"
                            placeholder="e.g. Canada"
                            required
                            slotProps={alwaysVisibleLabelSlotProps}
                            sx={fieldSx}
                          />
                        )}
                      />
                    )}
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={3}>
                  <Controller
                    control={control}
                    name="intakeMonth"
                    rules={{ required: "Intake month is required." }}
                    render={({ field }) => (
                      <TextField
                        error={Boolean(errors.intakeMonth)}
                        fullWidth
                        helperText={errors.intakeMonth?.message}
                        id={field.name}
                        label="Intake Month"
                        select
                        required
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        {...field}
                      >
                        <MenuItem disabled value="">Select Month</MenuItem>
                        {MONTHS.map((m) => (
                          <MenuItem key={m} value={m}>{m}</MenuItem>
                        ))}
                      </TextField>
                    )}
                  />

                  <Controller
                    control={control}
                    name="intakeYear"
                    rules={{ required: "Intake year is required." }}
                    render={({ field }) => (
                      <TextField
                        error={Boolean(errors.intakeYear)}
                        fullWidth
                        helperText={errors.intakeYear?.message}
                        id={field.name}
                        label="Intake Year"
                        type="number"
                        required
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="tuitionFeeInr"
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        helperText="Optional"
                        id={field.name}
                        label="Tuition Fee (INR)"
                        type="number"
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="applicationFeeInr"
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        helperText="Optional"
                        id={field.name}
                        label="Application Fee (INR)"
                        type="number"
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        {...field}
                      />
                    )}
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  control={control}
                  name="notes"
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      helperText="Optional"
                      id={field.name}
                      label="Notes"
                      multiline
                      minRows={2}
                      slotProps={alwaysVisibleLabelSlotProps}
                      sx={fieldSx}
                      {...field}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider />

            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              spacing={1.5}
              sx={{ justifyContent: "flex-end" }}
            >
              <Button
                disabled={isSubmitting}
                sx={{ minWidth: 120, textTransform: "none" }}
                type="button"
                variant="outlined"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress color="inherit" size={16} /> : null}
                sx={{ minWidth: 140, textTransform: "none" }}
                type="submit"
                variant="contained"
              >
                {isSubmitting ? "Saving..." : "Save Application"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
