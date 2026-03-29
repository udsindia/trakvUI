const LEADS_BASE_PATH = "/leads";

export const leadRoutePaths = {
  create: `${LEADS_BASE_PATH}/create`,
  dashboard: LEADS_BASE_PATH,
} as const;
