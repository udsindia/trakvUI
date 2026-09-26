const APPLICATIONS_BASE_PATH = "/applications";

export const applicationsRoutePaths = {
  dashboard: APPLICATIONS_BASE_PATH,
  create: `${APPLICATIONS_BASE_PATH}/create`,
  details: `${APPLICATIONS_BASE_PATH}/:id`,
  edit: `${APPLICATIONS_BASE_PATH}/:id/edit`,
} as const;

/** Concrete detail URL for one application. */
export const applicationDetailsPath = (id: string) =>
  `${APPLICATIONS_BASE_PATH}/${id}`;

/** Concrete edit URL for one application. */
export const applicationEditPath = (id: string) =>
  `${APPLICATIONS_BASE_PATH}/${id}/edit`;

/**
 * The create form, opened for one student. The id travels as a query param rather than in
 * the path: the form works perfectly well without it, and a path segment would imply the
 * student is part of the route's identity.
 */
export const applicationCreateForStudentPath = (studentId: string) =>
  `${APPLICATIONS_BASE_PATH}/create?studentId=${encodeURIComponent(studentId)}`;
