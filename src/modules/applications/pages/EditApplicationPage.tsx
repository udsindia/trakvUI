import { Box, Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { ApplicationForm } from "@/modules/applications/components/ApplicationForm";
import { useApplicationFormController } from "@/modules/applications/useApplicationFormController";

/**
 * Edits an existing application, reusing the create form and controller.
 *
 * The backend only permits this while the application is still a draft — open and still
 * in the first stage of its sequence. Once it has advanced, the PATCH is refused and the
 * form surfaces that as a form-level error. The details page hides the Edit button in
 * that case, so this is the belt-and-braces path.
 */
export function EditApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const {
    form,
    isEditMode,
    students,
    countries,
    universities,
    courses,
    countriesLoading,
    universitiesLoading,
    coursesLoading,
    countriesError,
    universitiesError,
    coursesError,
    handleCountryChange,
    handleUniversityChange,
    handleUniversityNameChange,
    handleCustomUniversityToggle,
    handleCancelCustomCourse,
    handleCourseChange,
    handleCourseNameChange,
    canManageCourses,
    handleCancel,
    handleFormSubmit,
  } = useApplicationFormController({ applicationId: id });

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "#e9eff5",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        minHeight: {
          lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)`,
        },
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          bgcolor: "#fcfdff",
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          px: { xs: 2, md: 3.5 },
          py: { xs: 2.5, md: 3.5 },
        }}
      >
        <Box sx={{ marginInline: "auto", maxWidth: 920, width: "100%" }}>
          <ApplicationForm
            form={form}
            isEditMode={isEditMode}
            students={students}
            countries={countries}
            universities={universities}
            courses={courses}
            countriesLoading={countriesLoading}
            universitiesLoading={universitiesLoading}
            coursesLoading={coursesLoading}
            countriesError={countriesError}
            universitiesError={universitiesError}
            coursesError={coursesError}
            onCountryChange={handleCountryChange}
            onUniversityChange={handleUniversityChange}
            onUniversityNameChange={handleUniversityNameChange}
            onCustomUniversityToggle={handleCustomUniversityToggle}
            canManageCourses={canManageCourses}
            onCancelCustomCourse={handleCancelCustomCourse}
            onCourseChange={handleCourseChange}
            onCourseNameChange={handleCourseNameChange}
            onCancel={handleCancel}
            onSubmit={handleFormSubmit}
          />
        </Box>
      </Box>
    </Paper>
  );
}
