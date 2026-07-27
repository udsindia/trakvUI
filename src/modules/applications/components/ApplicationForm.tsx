import type { FormEventHandler } from "react";
import {
  Alert,
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
import type { ApplicationFormValues } from "@/modules/applications/applicationForm.types";
import type { StudentOption } from "@/modules/applications/studentsApi";
import type {
  CountryDto,
  CourseDto,
  UniversitySummaryDto,
} from "@/modules/universities/universitiesApi.types";

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
  onUniversityChange: (universityId: string) => void;
  onCourseChange: (courseId: string) => void;
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
  onUniversityChange,
  onCourseChange,
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
    if (universitiesError) {
      return "Could not load universities for this country.";
    }
    if (universitiesLoading) {
      return "Loading universities…";
    }
    if (universities.length === 0) {
      return "No universities found for this country.";
    }
    return undefined;
  })();

  const courseHelperText = (() => {
    if (errors.courseName?.message) {
      return errors.courseName.message;
    }
    if (!universityId) {
      return "Select a university first.";
    }
    if (coursesError) {
      return "Could not load courses for this university.";
    }
    if (coursesLoading) {
      return "Loading courses…";
    }
    if (courses.length === 0) {
      return "No courses found for this university.";
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

                  <Controller
                    control={control}
                    name="universityId"
                    rules={{ required: "Target university is required." }}
                    render={({ field }) => (
                      <TextField
                        disabled={!destinationCountry || universitiesLoading}
                        error={Boolean(errors.targetUniversity) || Boolean(errors.universityId) || universitiesError}
                        fullWidth
                        helperText={universityHelperText}
                        id={field.name}
                        label="Target University"
                        required
                        select
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        value={field.value || ""}
                        onBlur={field.onBlur}
                        onChange={(event) => onUniversityChange(event.target.value)}
                      >
                        <MenuItem disabled value="">
                          Select university
                        </MenuItem>
                        {universities.map((university) => (
                          <MenuItem key={university.id} value={university.id}>
                            {university.name}
                            {university.city ? ` — ${university.city}` : ""}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />

                  <Controller
                    control={control}
                    name="courseId"
                    rules={{ required: "Course is required." }}
                    render={({ field }) => (
                      <TextField
                        disabled={!universityId || coursesLoading}
                        error={Boolean(errors.courseName) || Boolean(errors.courseId) || coursesError}
                        fullWidth
                        helperText={courseHelperText}
                        id={field.name}
                        label="Course"
                        required
                        select
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        value={field.value || ""}
                        onBlur={field.onBlur}
                        onChange={(event) => onCourseChange(event.target.value)}
                      >
                        <MenuItem disabled value="">
                          Select course
                        </MenuItem>
                        {courses.map((course) => (
                          <MenuItem key={course.id} value={course.id}>
                            {course.name}
                            {course.code ? ` (${course.code})` : ""}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
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
                {isSubmitting ? "Saving..." : "Save Application"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
