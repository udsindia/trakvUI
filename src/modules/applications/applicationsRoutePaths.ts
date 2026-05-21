const APPLICATIONS_BASE_PATH = "/applications";

export const applicationsRoutePaths = {
  dashboard: APPLICATIONS_BASE_PATH,
  create: `${APPLICATIONS_BASE_PATH}/create`,
  details: `${APPLICATIONS_BASE_PATH}/:id`,
} as const;
