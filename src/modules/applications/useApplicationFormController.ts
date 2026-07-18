import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";
import { applicationsApi } from "@/modules/applications/applicationsApi";
import { studentsApi } from "@/modules/applications/studentsApi";
import type {
  CreateApplicationPayload,
  ApplicationFormValues,
} from "@/modules/applications/applicationForm.types";

const defaultApplicationFormValues: ApplicationFormValues = {
  studentId: "",
  universityName: "",
  courseName: "",
  studyLevel: "",
  destinationCountry: "",
  intakeMonth: "",
  intakeYear: new Date().getFullYear(),
  tuitionFeeInr: "",
  applicationFeeInr: "",
  notes: "",
};

export function buildCreateApplicationPayload(values: ApplicationFormValues): CreateApplicationPayload {
  const toNumber = (v: string) => (v.trim() === "" ? null : Number(v));
  return {
    studentId: values.studentId,
    universityName: values.universityName.trim(),
    courseName: values.courseName.trim(),
    studyLevel: values.studyLevel,
    destinationCountry: values.destinationCountry.trim(),
    intakeMonth: values.intakeMonth,
    intakeYear: Number(values.intakeYear),
    tuitionFeeInr: toNumber(values.tuitionFeeInr),
    applicationFeeInr: toNumber(values.applicationFeeInr),
    notes: values.notes.trim() || undefined,
  };
}

export function useApplicationFormController(preselectedStudentId?: string) {
  const navigate = useNavigate();
  const form = useForm<ApplicationFormValues>({
    defaultValues: {
      ...defaultApplicationFormValues,
      studentId: preselectedStudentId ?? "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { setValue } = form;

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.getStudents,
  });

  // Keep the form's studentId in sync if a preselected id arrives after mount.
  useEffect(() => {
    if (preselectedStudentId) {
      setValue("studentId", preselectedStudentId, { shouldValidate: true });
    }
  }, [preselectedStudentId, setValue]);

  const studentOptions = students ?? [];
  const lockedStudent = preselectedStudentId
    ? studentOptions.find((s) => s.id === preselectedStudentId)
    : undefined;

  const handleCancel = () => {
    form.reset(defaultApplicationFormValues);
    navigate(applicationsRoutePaths.dashboard);
  };

  const handleValidSubmit = async (values: ApplicationFormValues) => {
    const payload = buildCreateApplicationPayload(values);
    try {
      await applicationsApi.createApplication(payload);
      form.reset(defaultApplicationFormValues);
      navigate(applicationsRoutePaths.dashboard);
    } catch (error) {
      console.error("Failed to create application:", error);
      const isTimeout =
        axios.isAxiosError(error) &&
        (error.code === "ECONNABORTED" || error.message.toLowerCase().includes("timeout"));
      form.setError("root", {
        message: isTimeout
          ? "The server is warming up — your data is safe. Click Save Application to try again."
          : "Failed to save the application. Please try again.",
      });
    }
  };

  return {
    form,
    students: studentOptions,
    lockedStudentName: lockedStudent ? lockedStudent.name : null,
    isStudentLocked: Boolean(preselectedStudentId),
    handleCancel,
    handleFormSubmit: form.handleSubmit(handleValidSubmit),
  };
}
