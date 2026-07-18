import { Box, Paper } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { ApplicationForm } from "@/modules/applications/components/ApplicationForm";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { useApplicationFormController } from "@/modules/applications/useApplicationFormController";

export function AddApplicationPage() {
  const [searchParams] = useSearchParams();
  // Case 2: launched from a student entry — ?studentId=<id> pre-selects & locks the student.
  const preselectedStudentId = searchParams.get("studentId") ?? undefined;
  const { form, students, lockedStudentName, isStudentLocked, handleCancel, handleFormSubmit } =
    useApplicationFormController(preselectedStudentId);

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "#e9eff5",
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: {
          lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)`,
        },
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader subtitle="Applications > New Application" title="Add New Application" />
      </Box>

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
        <Box
          sx={{
            marginInline: "auto",
            maxWidth: 920,
            width: "100%",
          }}
        >
          <ApplicationForm
            form={form}
            students={students}
            lockedStudentName={lockedStudentName}
            isStudentLocked={isStudentLocked}
            onCancel={handleCancel}
            onSubmit={handleFormSubmit}
          />
        </Box>
      </Box>
    </Paper>
  );
}
