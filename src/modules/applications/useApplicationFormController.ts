import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";
import { applicationsApi } from "@/modules/applications/applicationsApi";
import { studentsApi } from "@/modules/applications/studentsApi";
import {
  OTHER_COURSE_ID,
  type CreateApplicationPayload,
  type ApplicationFormValues,
  type UpdateApplicationPayload,
} from "@/modules/applications/applicationForm.types";
import type { CountryDto, CourseDto } from "@/modules/universities/universitiesApi.types";
import { universitiesApi } from "@/modules/universities/universitiesApi";
import { universityCoursesQueryKey } from "@/modules/universities/universitiesCatalogService";
import { useAuth } from "@/app/auth/useAuth";
import { PERMISSIONS } from "@/config/permissions/permissions";
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
  useCustomUniversity: false,
  targetUniversity: "",
  courseId: "",
  useCustomCourse: false,
  courseName: "",
  studyLevel: "",
  intakeMonth: "",
  intakeYear: new Date().getFullYear(),
  tuitionFeeInr: "",
  applicationFeeInr: "",
  notes: "",
  processedBy: "",
};

export function buildCreateApplicationPayload(
  values: ApplicationFormValues,
  countries: CountryDto[],
): CreateApplicationPayload {
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
    // GET /universities/countries already returns alpha-3, which is what the column
    // stores. This used to send country.name into a code column.
    destinationCountryCode: values.destinationCountry,
    intakeMonth: values.intakeMonth,
    intakeYear: Number(values.intakeYear),
    tuitionFeeInr: toOptionalNumber(values.tuitionFeeInr),
    applicationFeeInr: toOptionalNumber(values.applicationFeeInr),
    notes: values.notes.trim() || undefined,
    processedBy: values.processedBy.trim() || undefined,
  };
}

/**
 * destinationCountry and studentId are absent by design: the stage sequence is cloned
 * from the country at creation, and moving an application between students is not an
 * edit. Both fields are read-only in edit mode.
 */
function buildUpdateApplicationPayload(
  values: ApplicationFormValues,
): UpdateApplicationPayload {
  const toOptionalNumber = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return {
    universityName: values.targetUniversity,
    courseName: values.courseName,
    courseId: values.courseId || undefined,
    studyLevel: values.studyLevel || undefined,
    intakeMonth: values.intakeMonth,
    intakeYear: Number(values.intakeYear),
    tuitionFeeInr: toOptionalNumber(values.tuitionFeeInr),
    applicationFeeInr: toOptionalNumber(values.applicationFeeInr),
    notes: values.notes.trim() || undefined,
    // Sent even when empty, unlike the fields above: the backend reads null as "no change",
    // so an emptied box has to arrive as "" for clearing the third party to stick.
    processedBy: values.processedBy.trim(),
  };
}

type UseApplicationFormControllerOptions = {
  /** Present → edit that application instead of creating a new one. */
  applicationId?: string;
};

export function useApplicationFormController(
  { applicationId }: UseApplicationFormControllerOptions = {},
) {
  const isEditMode = Boolean(applicationId);
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
  const useCustomUniversity = watch("useCustomUniversity");

  const queryClient = useQueryClient();
  const { hasPermissions } = useAuth();
  const canManageCourses = hasPermissions([PERMISSIONS.UNIVERSITIES_MANAGE]);

  const { data: students } = useQuery({
    // "options", not a bare ["students"]: this fetcher returns picker-shaped
    // StudentOption rows ({ id, name, email, phone }), while the students list fetches
    // full StudentSummary rows under ["students", "list"]. One key for two shapes meant
    // whichever page loaded last won the single cache entry, and the list then rendered
    // options with no firstName/lastName — showing each student's email as their name.
    queryKey: ["students", "options"],
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

  // ── Edit mode: load the application and seed the form ────────────────────
  const { data: editingApplication } = useQuery({
    enabled: Boolean(applicationId),
    queryKey: ["applications", "detail", applicationId],
    queryFn: () => applicationsApi.getApplicationById(applicationId as string),
  });

  useEffect(() => {
    if (!editingApplication) {
      return;
    }
    const country = countries.find((c) => c.code === editingApplication.destinationCountryCode);

    // Applications store names, not ids. Resolve the stored name against the catalogue
    // so an edit reopens in the mode it was created in: a match restores the link (and
    // with it the course list), no match opens in custom mode with the box ticked.
    const matchedUniversity = universities.find(
      (u) =>
        u.name.trim().toLowerCase() ===
        (editingApplication.universityName ?? "").trim().toLowerCase(),
    );

    // Resolved here rather than left to the auto-fill effect above. Both write the same
    // three fields, but this reset re-runs whenever the catalogue queries settle, and a
    // late re-run would blank what the effect had already filled — the student id has not
    // changed, so the effect never fires again to put it back. Since all three are
    // required, that left the form permanently unsubmittable.
    const student = students?.find((s) => s.id === editingApplication.studentId);

    form.reset({
      ...defaultApplicationFormValues,
      studentId: editingApplication.studentId ?? "",
      studentName: student?.name ?? "",
      email: student?.email ?? "",
      phone: student?.phone ?? "",
      targetUniversity: editingApplication.universityName ?? "",
      universityId: matchedUniversity?.id ?? "",
      useCustomUniversity: !matchedUniversity,
      courseName: editingApplication.courseName ?? "",
      courseId: "",
      studyLevel: (editingApplication.studyLevel as ApplicationFormValues["studyLevel"]) ?? "",
      destinationCountry: country?.code ?? editingApplication.destinationCountryCode ?? "",
      intakeMonth: editingApplication.intakeMonth ?? "",
      intakeYear: editingApplication.intakeYear ?? new Date().getFullYear(),
      tuitionFeeInr:
        editingApplication.tuitionFeeInr != null ? String(editingApplication.tuitionFeeInr) : "",
      applicationFeeInr:
        editingApplication.applicationFeeInr != null
          ? String(editingApplication.applicationFeeInr)
          : "",
      notes: editingApplication.notes ?? "",
      processedBy: editingApplication.processedBy ?? "",
    });
  }, [editingApplication, countries, universities, students, form]);

  const handleCountryChange = (countryCode: string) => {
    setValue("destinationCountry", countryCode, { shouldValidate: true });
    setValue("universityId", "");
    setValue("targetUniversity", "");
    setValue("courseId", "");
    setValue("useCustomCourse", false);
    setValue("courseName", "");
    setValue("studyLevel", "");
    setValue("useCustomUniversity", false);
  };

  /**
   * The university is stored on the application by NAME (applications.university_name is
   * the NOT NULL column; university_id is nullable and not set at all). So a university
   * that isn't in the catalogue is perfectly storable — the id only exists here to load
   * the course list.
   *
   * Picking from the list sets both; typing a free value sets the name and clears the id,
   * which in turn leaves the course field as free text since there is no course list to
   * offer.
   */
  const handleUniversityChange = (nextUniversityId: string) => {
    const university = universities.find((u) => u.id === nextUniversityId);
    setValue("universityId", nextUniversityId, { shouldValidate: true });
    setValue("targetUniversity", university?.name ?? "", { shouldValidate: true });
    setValue("courseId", "");
    setValue("useCustomCourse", false);
    setValue("courseName", "");
    setValue("studyLevel", "");
  };

  /** Case-insensitive exact match against the catalogue, or undefined. */
  const findUniversityByName = (name: string) => {
    const needle = name.trim().toLowerCase();
    if (!needle) {
      return undefined;
    }
    return universities.find((u) => u.name.trim().toLowerCase() === needle);
  };

  /**
   * A university typed by hand. Still links it when the name is an exact catalogue
   * match — that is the safety net against near-duplicate records for institutions we
   * already know about.
   */
  const handleUniversityNameChange = (name: string) => {
    setValue("targetUniversity", name, { shouldValidate: true });
    setValue("universityId", findUniversityByName(name)?.id ?? "");
    setValue("courseId", "");
    setValue("useCustomCourse", false);
  };

  /** Switches between picking from the catalogue and typing the names. */
  const handleCustomUniversityToggle = (enabled: boolean) => {
    setValue("useCustomUniversity", enabled);
    // Leaving custom mode drops a typed name that has no catalogue entry behind it,
    // since the selector can only represent one that does.
    if (!enabled && !universityId) {
      setValue("targetUniversity", "");
      setValue("courseName", "");
      setValue("studyLevel", "");
    }
    setValue("courseId", "");
    setValue("useCustomCourse", false);
  };

  const handleCourseChange = (courseId: string) => {
    // "Other" is not a course — it turns the field into a text box and the typed name is
    // added to this university's catalogue on save (see resolveCourseId).
    if (courseId === OTHER_COURSE_ID) {
      setValue("useCustomCourse", true);
      setValue("courseId", "");
      setValue("courseName", "", { shouldValidate: false });
      setValue("studyLevel", "POSTGRADUATE_TAUGHT");
      return;
    }

    const course = courses.find((c) => c.id === courseId);
    setValue("useCustomCourse", false);
    setValue("courseId", courseId, { shouldValidate: true });
    setValue("courseName", course?.name ?? "", { shouldValidate: true });
    setValue("studyLevel", course?.studyLevel ?? "", { shouldValidate: true });
  };

  /** A course typed by hand — studyLevel stays whatever the user picks separately. */
  const handleCourseNameChange = (name: string) => {
    setValue("courseName", name, { shouldValidate: true });
    setValue("courseId", "");
  };

  /** Back to the catalogue list, dropping whatever was being typed. */
  const handleCancelCustomCourse = () => {
    setValue("useCustomCourse", false);
    setValue("courseName", "", { shouldValidate: true });
    setValue("courseId", "");
    setValue("studyLevel", "");
  };

  const handleCancel = () => {
    form.reset(defaultApplicationFormValues);
    navigate(applicationsRoutePaths.dashboard);
  };

  /**
   * Turns a typed-in course name into a catalogue course id, adding the course when it is
   * genuinely new.
   *
   * Duplicates are guarded twice over: the loaded list is checked first (case-insensitive,
   * trimmed), and if two people add the same course at once the API answers 409, at which
   * point the list is refetched and the winner's id is used. Either way one course row
   * exists, not two.
   *
   * The id comes back empty when the course could not be added — the application still
   * saves, keeping the typed name, since applications.university_course_id is nullable.
   * The name comes back canonical: matching an existing course adopts its spelling, so
   * "  msc QUANTUM computing " is stored as "MSc Quantum Computing".
   */
  const resolveCourse = async (
    values: ApplicationFormValues,
  ): Promise<{ courseId: string; courseName: string }> => {
    const name = values.courseName.trim();
    if (!values.useCustomCourse || !name || !values.universityId) {
      return { courseId: values.courseId, courseName: values.courseName };
    }

    const matches = (course: CourseDto) =>
      course.name.trim().toLowerCase() === name.toLowerCase();

    const existing = courses.find(matches);
    if (existing) {
      return { courseId: existing.id, courseName: existing.name };
    }

    if (!canManageCourses) {
      // Adding to the shared catalogue needs UNIVERSITIES_MANAGE; without it the
      // application keeps the typed name and simply carries no course id.
      return { courseId: "", courseName: name };
    }

    try {
      const created = await universitiesApi.createCourse(values.universityId, {
        name,
        studyLevel: values.studyLevel || "POSTGRADUATE_TAUGHT",
        // Same slug the course drawer generates, so inline-added courses look like the rest.
        code: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32),
        subjectArea: "General",
      });
      return { courseId: created.id, courseName: created.name };
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 409) {
        // Someone else added it between the check and the write — take theirs.
        const refreshed = await universitiesApi.listAllUniversityCourses(values.universityId);
        const winner = refreshed.find(matches);
        return { courseId: winner?.id ?? "", courseName: winner?.name ?? name };
      }
      if (status === 403) {
        return { courseId: "", courseName: name };
      }
      throw error;
    } finally {
      queryClient.invalidateQueries({
        queryKey: universityCoursesQueryKey(values.universityId),
      });
    }
  };

  const handleValidSubmit = async (values: ApplicationFormValues) => {
    try {
      const submitted = { ...values, ...(await resolveCourse(values)) };

      if (applicationId) {
        await applicationsApi.updateApplication(
          applicationId,
          buildUpdateApplicationPayload(submitted),
        );
      } else {
        await applicationsApi.createApplication(
          buildCreateApplicationPayload(submitted, countries),
        );
      }
      form.reset(defaultApplicationFormValues);
      navigate(applicationsRoutePaths.dashboard);
    } catch (error) {
      console.error("Failed to save application:", error);

      // The backend refuses edits once an application has moved on; say why rather
      // than showing the generic retry message.
      if (axios.isAxiosError(error)) {
        const code = (error.response?.data as { code?: string } | undefined)?.code;
        if (code === "NOT_A_DRAFT" || code === "ALREADY_CLOSED") {
          form.setError("root", {
            message:
              "This application has already moved past its first stage, so its details can no longer be edited.",
          });
          return;
        }
      }

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
    isEditMode,
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
    handleUniversityNameChange,
    handleCustomUniversityToggle,
    handleCourseNameChange,
    handleCourseChange,
    handleCancelCustomCourse,
    canManageCourses,
    handleCancel,
    handleFormSubmit: form.handleSubmit(handleValidSubmit),
  };
}
