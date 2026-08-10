const LEADS_BASE_PATH = "/leads";

export const leadRoutePaths = {
  create: `${LEADS_BASE_PATH}/create`,
  dashboard: LEADS_BASE_PATH,
  details: (id: string) => `${LEADS_BASE_PATH}/${id}`,
  edit: (id: string) => `${LEADS_BASE_PATH}/${id}/edit`,
} as const;
