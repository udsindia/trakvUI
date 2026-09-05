import { httpClient } from "@/shared/services/http/client";
import { API_CONFIG } from "@/config/api/config";

/** Backend StudentSummaryDTO. */
export interface BackendStudent {
  id: string;
  tenantId?: string;
  /** Set when the student came from an enrolled lead; null for directly-created students. */
  leadId?: string | null;
  assignedTo?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  /** Dial code for `phone`, e.g. "+91". Not a country — see nationality for that. */
  phoneCountryCode?: string;
  phone?: string;
  nationality?: string;
  highestDegree?: string;
  enrolledAt?: string;
}

/** One English-proficiency test on a student — backend LanguageTestDTO. */
export interface StudentLanguageTest {
  id: string;
  testType?: string;
  overallScore?: number | null;
  bandListening?: number | null;
  bandReading?: number | null;
  bandWriting?: number | null;
  bandSpeaking?: number | null;
  testDate?: string | null;
  expiryDate?: string | null;
  moiInstitution?: string | null;
  class12EnglishPct?: number | null;
  primary?: boolean;
  notes?: string | null;
}

/** Full student record — backend StudentDetailDTO. Adds everything the list omits. */
export interface BackendStudentDetail extends BackendStudent {
  enrolledBy?: string | null;
  dateOfBirth?: string | null;
  passportExpiryDate?: string | null;
  passportIssueCountry?: string | null;
  institutionName?: string | null;
  fieldOfStudy?: string | null;
  graduationYear?: number | null;
  academicScore?: number | null;
  scoreType?: string | null;
  workExperienceMonths?: number | null;
  createdAt?: string;
  updatedAt?: string;
  languageTests?: StudentLanguageTest[];
}

/** The list endpoint returns a Spring Page; older builds returned a raw array. */
interface Paged<T> {
  content?: T[];
}

/**
 * One large page rather than server-side paging: the list is filtered and paginated
 * client-side, matching how the Leads and Applications pages work.
 */
const LIST_PAGE_SIZE = 500;

export const studentsApi = {
  getStudents: async (): Promise<BackendStudent[]> => {
    const response = await httpClient.get<BackendStudent[] | Paged<BackendStudent>>(
      API_CONFIG.students,
      { params: { page: 0, size: LIST_PAGE_SIZE } },
    );
    const data = response.data;
    return Array.isArray(data) ? data : data?.content ?? [];
  },

  /** One student in full, including their language tests. */
  getStudentById: async (id: string): Promise<BackendStudentDetail> => {
    const response = await httpClient.get<BackendStudentDetail>(
      `${API_CONFIG.students}/${id}`,
    );
    return response.data;
  },
};
