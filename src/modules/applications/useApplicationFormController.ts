import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";
import { applicationsApi } from "@/modules/applications/applicationsApi";
import { studentsApi } from "@/modules/applications/studentsApi";
import type {
  CreateApplicationPayload,
  ApplicationFormValues,
} from "@/modules/applications/applicationForm.types";
import type { CountryDto } from "@/modules/universities/universitiesApi.types";
import {
  useCountries,
  useUniversitiesByCountry,
  useUniversityCourseOptions,
} from "@/modules/universities/useUniversitiesCatalog";

const defaultApplicationFormValues: ApplicationFormValues = {
  studentId: "",
  studentName: "",
  email: "",
  phone: "",
  destinationCountry: "",
  universityId: "",
  targetUniversity: "",
  courseId: "",
  courseName: "",
  studyLevel: "",
  intakeMonth: "",
  intakeYear: new Date().getFullYear(),
  tuitionFeeInr: "",
  applicationFeeInr: "",
  notes: "",
};

export function buildCreateApplicationPayload(
  values: ApplicationFormValues,
  countries: CountryDto[],
): CreateApplicationPayload {
  const country = countries.find((c) => c.code === values.destinationCountry);
  const toOptionalNumber = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    studentId: values.studentId,
    universityName: values.targetUniversity,
    courseName: values.courseName,
    courseId: values.courseId || undefined,
    studyLevel: values.studyLevel || "POSTGRADUATE_TAUGHT",
    destinationCountry: country?.name ?? values.destinationCountry,
    intakeMonth: values.intakeMonth,
    intakeYear: Number(values.intakeYear),
    tuitionFeeInr: toOptionalNumber(values.tuitionFeeInr),
    applicationFeeInr: toOptionalNumber(values.applicationFeeInr),
    notes: values.notes.trim() || undefined,
  };
}

export function useApplicationFormController() {
  const navigate = useNavigate();
  const form = useForm<ApplicationFormValues>({
    defaultValues: defaultApplicationFormValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { watch, setValue } = form;
  const selectedStudentId = watch("studentId");
  const destinationCountry = watch("destinationCountry");
  const universityId = watch("universityId");

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.getStudents,
  });

  const {
    data: countries = [],
    isLoading: countriesLoading,
    isError: countriesError,
  } = useCountries();

  const {
    data: universities = [],
    isLoading: universitiesLoading,
    isError: universitiesError,
  } = useUniversitiesByCountry(destinationCountry || undefined);

  const {
    data: courses = [],
    isLoading: coursesLoading,
    isError: coursesError,
  } = useUniversityCourseOptions(universityId || undefined);

  useEffect(() => {
    if (selectedStudentId && students) {
      const student = students.find((s) => s.id === selectedStudentId);
      if (student) {
        setValue("studentName", student.name, { shouldValidate: true });
        setValue("email", student.email, { shouldValidate: true });
        setValue("phone", student.phone, { shouldValidate: true });
      }
    }
  }, [selectedStudentId, students, setValue]);

  const handleCountryChange = (countryCode: string) => {
    setValue("destinationCountry", countryCode, { shouldValidate: true });
    setValue("universityId", "");
    setValue("targetUniversity", "");
    setValue("courseId", "");
    setValue("courseName", "");
    setValue("studyLevel", "");
  };

  const handleUniversityChange = (nextUniversityId: string) => {
    const university = universities.find((u) => u.id === nextUniversityId);
    setValue("universityId", nextUniversityId, { shouldValidate: true });
    setValue("targetUniversity", university?.name ?? "", { shouldValidate: true });
    setValue("courseId", "");
    setValue("courseName", "");
    setValue("studyLevel", "");
  };

  const handleCourseChange = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    setValue("courseId", courseId, { shouldValidate: true });
    setValue("courseName", course?.name ?? "", { shouldValidate: true });
    setValue("studyLevel", course?.studyLevel ?? "", { shouldValidate: true });
  };

  const handleCancel = () => {
    form.reset(defaultApplicationFormValues);
    navigate(applicationsRoutePaths.dashboard);
  };

  const handleValidSubmit = async (values: ApplicationFormValues) => {
    const payload = buildCreateApplicationPayload(values, countries);

    try {
      await applicationsApi.createApplication(payload);
      form.reset(defaultApplicationFormValues);
      navigate(applicationsRoutePaths.dashboard);
    } catch (error) {
      console.error("Failed to create application:", error);

      const isTimeout =
        axios.isAxiosError(error) &&
        (error.code === "ECONNABORTED" ||
          error.message.toLowerCase().includes("timeout"));

      form.setError("root", {
        message: isTimeout
          ? "The server is warming up — your data is safe. Click Save Application to try again."
          : "Failed to save the application. Please try again.",
      });
    }
  };

  return {
    form,
    students: students ?? [],
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
    handleCourseChange,
    handleCancel,
    handleFormSubmit: form.handleSubmit(handleValidSubmit),
  };
}
