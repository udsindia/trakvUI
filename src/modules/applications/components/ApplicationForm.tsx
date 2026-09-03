import type { FormEventHandler } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, type UseFormReturn } from "react-hook-form";
import {
  OTHER_COURSE_ID,
  type ApplicationFormValues,
} from "@/modules/applications/applicationForm.types";
import type { StudentOption } from "@/modules/applications/studentsApi";
import type {
  CountryDto,
  CourseDto,
  UniversitySummaryDto,
} from "@/modules/universities/universitiesApi.types";

/** API StudyLevel values, for a course being added from this form. */
const STUDY_LEVEL_OPTIONS = [
  { label: "Undergraduate", value: "UNDERGRADUATE" },
  { label: "Masters (taught)", value: "POSTGRADUATE_TAUGHT" },
  { label: "Masters (research)", value: "POSTGRADUATE_RESEARCH" },
  { label: "Integrated Masters", value: "INTEGRATED_MASTERS" },
  { label: "PhD", value: "PHD" },
  { label: "Foundation", value: "FOUNDATION" },
  { label: "Diploma", value: "DIPLOMA" },
] as const;

type ApplicationFormProps = {
  form: UseFormReturn<ApplicationFormValues>;
  students: StudentOption[];
  countries: CountryDto[];
  universities: UniversitySummaryDto[];
  courses: CourseDto[];
  countriesLoading?: boolean;
  universitiesLoading?: boolean;
  coursesLoading?: boolean;
  countriesError?: boolean;
  universitiesError?: boolean;
  coursesError?: boolean;
  onCountryChange: (countryCode: string) => void;
  /** Edit mode locks the fields that cannot change after creation. */
  isEditMode?: boolean;
  onUniversityChange: (universityId: string) => void;
  /** A university typed by hand rather than picked from the catalogue. */
  onUniversityNameChange: (name: string) => void;
  /** Switches between catalogue selection and typing the names by hand. */
  onCustomUniversityToggle: (enabled: boolean) => void;
  /** A course typed by hand rather than picked from the catalogue. */
  onCourseNameChange: (name: string) => void;
  onCourseChange: (courseId: string) => void;
  /** Abandons the "Other" course entry and goes back to the catalogue list. */
  onCancelCustomCourse: () => void;
  /** Whether this user may add the typed course to the shared catalogue. */
  canManageCourses?: boolean;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function ApplicationForm({
  form,
  students,
  countries,
  universities,
  courses,
  countriesLoading = false,
  universitiesLoading = false,
  coursesLoading = false,
  countriesError = false,
  universitiesError = false,
  coursesError = false,
  onCountryChange,
  isEditMode = false,
  onUniversityChange,
  onUniversityNameChange,
  onCustomUniversityToggle,
  onCourseNameChange,
  onCourseChange,
  onCancelCustomCourse,
  canManageCourses = false,
  onCancel,
  onSubmit,
}: ApplicationFormProps) {
  const {
    control,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const destinationCountry = watch("destinationCountry");
  const universityId = watch("universityId");
  const targetUniversity = watch("targetUniversity");
  const courseId = watch("courseId");
  const useCustomUniversity = watch("useCustomUniversity");
  const useCustomCourse = watch("useCustomCourse");

  /**
   * A synthetic last row in the course list. Only its id and name are ever read — picking
   * it swaps the field for a text box rather than selecting a course.
   */
  const courseOptions: CourseDto[] = [
    ...courses,
    { id: OTHER_COURSE_ID, name: "Other — add a new course" } as CourseDto,
  ];

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "background.paper",
      borderRadius: "9px",
    },
  };

  const alwaysVisibleLabelSlotProps = {
    inputLabel: {
      shrink: true,
    },
  } as const;

  const countryHelperText = (() => {
    if (errors.destinationCountry?.message) {
      return errors.destinationCountry.message;
    }
    if (countriesError) {
      return "Could not load countries. Please refresh and try again.";
    }
    if (countriesLoading) {
      return "Loading countries…";
    }
    return undefined;
  })();

  const universityHelperText = (() => {
    if (errors.targetUniversity?.message) {
      return errors.targetUniversity.message;
    }
    if (!destinationCountry) {
      return "Select a destination country first.";
    }
    if (useCustomUniversity) {
      // Typing a name that exists still links it — the controller matches on exact name.
      return universityId
        ? "Matches a catalogue entry — it will be linked."
        : "Saved as typed, with no catalogue link.";
    }
    if (universitiesError) {
      return "Could not load the catalogue — tick the box above to type the name.";
    }
    if (universitiesLoading) {
      return "Loading universities…";
    }
    if (universities.length === 0) {
      return "No catalogue entries for this country — tick the box above to type the name.";
    }
    return undefined;
  })();

  const courseHelperText = (() => {
    if (errors.courseName?.message) {
      return errors.courseName.message;
    }
    if (!targetUniversity) {
      return "Enter a university first.";
    }
    if (useCustomUniversity || !universityId) {
      return "Saved as typed, with no catalogue link.";
    }
    if (coursesError) {
      return "Could not load this university's courses.";
    }
    if (coursesLoading) {
      return "Loading courses…";
    }
    if (courses.length === 0) {
      return "No courses listed for this university yet.";
    }
    return undefined;
  })();

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "#e9eff5",
        borderRadius: "12px",
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
                Provide details for the student's university application.
              </Typography>
            </Stack>

            <Divider />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  control={control}
                  name="studentId"
                  render={({ field }) => (
                    <TextField
                      error={Boolean(errors.studentId)}
                      fullWidth
                      helperText={errors.studentId?.message || "Optional: Select an existing student to auto-fill details"}
                      id={field.name}
                      label="Select Student (Optional)"
                      select
                      slotProps={alwaysVisibleLabelSlotProps}
                      sx={fieldSx}
                      {...field}
                      value={field.value || ""}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {students.map((student) => (
                        <MenuItem key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={3}>
                  <Controller
                    control={control}
                    name="studentName"
                    rules={{ required: "Student name is required." }}
                    render={({ field }) => (
                      <TextField
                        error={Boolean(errors.studentName)}
                        fullWidth
                        helperText={errors.studentName?.message}
                        id={field.name}
                        label="Student Name"
                        placeholder="Enter full name"
                        required
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="email"
                    rules={{
                      pattern: {
                        message: "Enter a valid email address.",
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      },
                      required: "Email address is required.",
                    }}
                    render={({ field }) => (
                      <TextField
                        error={Boolean(errors.email)}
                        fullWidth
                        helperText={errors.email?.message}
                        id={field.name}
                        label="Email Address"
                        placeholder="name@example.com"
                        required
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        type="email"
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="phone"
                    rules={{ required: "Phone number is required." }}
                    render={({ field }) => (
                      <TextField
                        error={Boolean(errors.phone)}
                        fullWidth
                        helperText={errors.phone?.message}
                        id={field.name}
                        label="Phone Number"
                        placeholder="+91 98765 43210"
                        required
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        {...field}
                      />
                    )}
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={3}>
                  <Controller
                    control={control}
                    name="destinationCountry"
                    rules={{ required: "Destination country is required." }}
                    render={({ field }) => (
                      <TextField
                        disabled={countriesLoading}
                        error={Boolean(errors.destinationCountry) || countriesError}
                        fullWidth
                        helperText={countryHelperText}
                        id={field.name}
                        label="Destination Country"
                        required
                        select
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        value={field.value || ""}
                        onBlur={field.onBlur}
                        onChange={(event) => onCountryChange(event.target.value)}
                      >
                        <MenuItem disabled value="">
                          Select country
                        </MenuItem>
                        {countries.map((country) => (
                          <MenuItem key={country.code} value={country.code}>
                            {country.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />

                  {/*
                    Two explicit modes rather than one free-text field.

                    Off-catalogue entry used to be implicit — any typing cleared
                    universityId — which meant a user typing a name that WAS in the
                    catalogue silently produced an unlinked record. The checkbox makes
                    the choice deliberate, so linkage is only ever lost on purpose.

                    Applications store university_name (NOT NULL) with university_id
                    nullable, so both modes are valid; the id just drives the course list.
                  */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={useCustomUniversity}
                        disabled={!destinationCountry}
                        size="small"
                        onChange={(event) => onCustomUniversityToggle(event.target.checked)}
                      />
                    }
                    label="University is not in our catalogue"
                    sx={{ ml: 0 }}
                  />

                  {useCustomUniversity ? (
                    <Controller
                      control={control}
                      name="targetUniversity"
                      rules={{ required: "Target university is required." }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          disabled={!destinationCountry}
                          error={Boolean(errors.targetUniversity)}
                          fullWidth
                          helperText={universityHelperText}
                          id={field.name}
                          label="Target University"
                          required
                          slotProps={alwaysVisibleLabelSlotProps}
                          sx={fieldSx}
                          onChange={(event) => onUniversityNameChange(event.target.value)}
                        />
                      )}
                    />
                  ) : (
                    <Controller
                      control={control}
                      name="targetUniversity"
                      rules={{ required: "Target university is required." }}
                      render={({ field }) => (
                        <Autocomplete
                          disabled={!destinationCountry || universitiesLoading}
                          options={universities}
                          getOptionLabel={(option) => option.name}
                          isOptionEqualToValue={(option, selected) => option.id === selected.id}
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
                              {option.name}
                              {option.city ? ` — ${option.city}` : ""}
                            </li>
                          )}
                          value={
                            universities.find((university) => university.id === universityId) ??
                            null
                          }
                          onChange={(_event, option) =>
                            onUniversityChange(option ? option.id : "")
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              error={
                                Boolean(errors.targetUniversity) ||
                                Boolean(errors.universityId) ||
                                universitiesError
                              }
                              fullWidth
                              helperText={universityHelperText}
                              id={field.name}
                              label="Target University"
                              required
                              sx={fieldSx}
                              onBlur={field.onBlur}
                            />
                          )}
                        />
                      )}
                    />
                  )}

                  {/*
                    The course follows the university: a catalogue university offers its
                    courses, a custom one has none to offer so the name is typed.
                  */}
                  {useCustomUniversity || !universityId ? (
                    <Controller
                      control={control}
                      name="courseName"
                      rules={{ required: "Course is required." }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          disabled={!targetUniversity}
                          error={Boolean(errors.courseName)}
                          fullWidth
                          helperText={courseHelperText}
                          id={field.name}
                          label="Course"
                          required
                          slotProps={alwaysVisibleLabelSlotProps}
                          sx={fieldSx}
                          onChange={(event) => onCourseNameChange(event.target.value)}
                        />
                      )}
                    />
                  ) : useCustomCourse ? (
                    /*
                      "Other" was picked: the name is typed here and added to this
                      university's catalogue on save, so it can be selected next time.
                    */
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={2}>
                        <Controller
                          control={control}
                          name="courseName"
                          rules={{ required: "Course is required." }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              autoFocus
                              error={Boolean(errors.courseName)}
                              fullWidth
                              helperText={
                                errors.courseName?.message ??
                                (canManageCourses
                                  ? `Added to ${targetUniversity} so it can be picked next time.`
                                  : "Saved on this application only — you cannot add to the shared catalogue.")
                              }
                              id={field.name}
                              label="New course name"
                              required
                              slotProps={alwaysVisibleLabelSlotProps}
                              sx={fieldSx}
                              onChange={(event) => onCourseNameChange(event.target.value)}
                            />
                          )}
                        />
                        <Controller
                          control={control}
                          name="studyLevel"
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Study level"
                              select
                              slotProps={alwaysVisibleLabelSlotProps}
                              sx={fieldSx}
                            >
                              {STUDY_LEVEL_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Stack>
                      <Button
                        size="small"
                        sx={{ alignSelf: "flex-start", textTransform: "none" }}
                        onClick={onCancelCustomCourse}
                      >
                        ← Pick from the course list instead
                      </Button>
                    </Stack>
                  ) : (
                    <Controller
                      control={control}
                      name="courseName"
                      rules={{ required: "Course is required." }}
                      render={({ field }) => (
                        <Autocomplete
                          disabled={coursesLoading}
                          options={courseOptions}
                          getOptionLabel={(option) => option.name}
                          isOptionEqualToValue={(option, selected) => option.id === selected.id}
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
                              {option.name}
                              {option.code ? ` (${option.code})` : ""}
                            </li>
                          )}
                          value={courses.find((course) => course.id === courseId) ?? null}
                          onChange={(_event, option) =>
                            onCourseChange(option ? option.id : "")
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              error={
                                Boolean(errors.courseName) ||
                                Boolean(errors.courseId) ||
                                coursesError
                              }
                              fullWidth
                              helperText={courseHelperText}
                              id={field.name}
                              label="Course"
                              required
                              sx={fieldSx}
                              onBlur={field.onBlur}
                            />
                          )}
                        />
                      )}
                    />
                  )}

                  <Stack direction="row" spacing={2}>
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
                          {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
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
                  </Stack>
                </Stack>
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
                startIcon={
                  isSubmitting ? <CircularProgress color="inherit" size={16} /> : null
                }
                sx={{ minWidth: 140, textTransform: "none" }}
                type="submit"
                variant="contained"
              >
                {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Save Application"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
