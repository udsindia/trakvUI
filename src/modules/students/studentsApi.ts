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
  /** Dial code for `phone`, e.g. "+91". */
  countryCode?: string;
  phone?: string;
  nationality?: string;
  highestDegree?: string;
  enrolledAt?: string;
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
};
