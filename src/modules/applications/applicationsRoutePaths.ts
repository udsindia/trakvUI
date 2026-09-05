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
