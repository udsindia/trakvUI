import { httpClient } from "@/shared/services/http/client";
import { API_CONFIG } from "@/config/api/config";

/** A student option for pickers (application create, course-search eligibility). */
export interface StudentOption {
  id: string;
  name: string;
  email: string;
  phone: string;
}

/** Backend StudentSummaryDTO. */
export interface BackendStudentSummary {
  id: string;
  tenantId?: string;
  leadId?: string;
  assignedTo?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  highestDegree?: string;
  enrolledAt?: string;
}

/** Backend LanguageTestDTO, returned inline on the student detail payload. */
export interface BackendLanguageTest {
  id: string;
  testType?: string;
  overallScore?: number;
  bandListening?: number;
  bandReading?: number;
  bandWriting?: number;
  bandSpeaking?: number;
  testDate?: string;
  expiryDate?: string;
  moiInstitution?: string;
  class12EnglishPct?: number;
  documentId?: string;
  primary?: boolean;
  notes?: string;
}

/** Backend StudentDetailDTO. */
export interface BackendStudentDetail extends BackendStudentSummary {
  enrolledBy?: string;
  dateOfBirth?: string;
  passportExpiryDate?: string;
  passportIssueCountry?: string;
  institutionName?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
  academicScore?: number;
  scoreType?: string;
  workExperienceMonths?: number;
  createdAt?: string;
  updatedAt?: string;
  languageTests?: BackendLanguageTest[];
}

/** Spring `Page<StudentSummaryDTO>`. */
export interface PaginatedStudentsResponse {
  content: BackendStudentSummary[];
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  number: number;
  size: number;
}

export interface GetStudentsPaginatedParams {
  page: number;
  size: number;
}

/**
 * Backend UpdateStudentRequest. The service applies only non-null fields, so this
 * behaves as a partial update: omitting a key leaves it untouched. Text fields can
 * be cleared by sending "", but numeric/date fields cannot — null reads as "no change".
 */
export interface UpdateStudentPayload {
  assignedTo?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string | null;
  nationality?: string;
  passportExpiryDate?: string | null;
  passportIssueCountry?: string;
  highestDegree?: string;
  institutionName?: string;
  fieldOfStudy?: string;
  graduationYear?: number | null;
  academicScore?: number | null;
  scoreType?: string;
  workExperienceMonths?: number | null;
}

/** The list endpoint returns a Spring Page; older builds returned a raw array. */
interface Paged<T> {
  content?: T[];
}

export const studentsApi = {
  /** Flat option list for pickers — collapses the paged payload. */
  getStudents: async (): Promise<StudentOption[]> => {
    const response = await httpClient.get<BackendStudentSummary[] | Paged<BackendStudentSummary>>(
      API_CONFIG.students,
    );
    const data = response.data;
    const list = Array.isArray(data) ? data : data?.content ?? [];
    return list.map((s) => ({
      id: s.id,
      name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.email || s.id,
      email: s.email ?? "",
      phone: s.phone ?? "",
    }));
  },

  /** Full student profile; the payload already includes their language tests. */
  getStudent: async (id: string): Promise<BackendStudentDetail> => {
    const response = await httpClient.get<BackendStudentDetail>(`${API_CONFIG.students}/${id}`);
    return response.data;
  },

  updateStudent: async (
    id: string,
    payload: UpdateStudentPayload,
  ): Promise<BackendStudentDetail> => {
    const response = await httpClient.put<BackendStudentDetail>(
      `${API_CONFIG.students}/${id}`,
      payload,
    );
    return response.data;
  },

  /**
   * Paged list for the Students table. The backend paginates (page is 0-based
   * there, 1-based in the UI), and exposes no search/sort params yet.
   */
  getStudentsPaginated: async ({
    page,
    size,
  }: GetStudentsPaginatedParams): Promise<PaginatedStudentsResponse> => {
    const response = await httpClient.get<PaginatedStudentsResponse>(API_CONFIG.students, {
      params: { page, size },
    });
    return response.data;
  },
};
