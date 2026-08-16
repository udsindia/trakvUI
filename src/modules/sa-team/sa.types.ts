export interface SaRole {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  system: boolean;
  permissions: string[];
}

export interface SaUser {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  roleName: string;
  roleDisplayName: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface SaSession {
  token: string;
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface InviteSaUserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  saRoleId: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  regId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  /** Primary AGENCY_ADMIN login email (the tenant's contact). */
  adminEmail: string | null;
}

export interface SaDashboardStats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  starterPlanTenants: number;
  trialPlanTenants: number;
  proPlanTenants: number;
  enterprisePlanTenants: number;
}

export interface WhatsAppConfig {
  id: string;
  tenantId: string;
  provider: string;
  phoneNumberId: string;
  wabaId: string | null;
  accessTokenMasked: string;
  webhookVerifyToken: string;
  welcomeTemplateName: string | null;
  tenantDisplayName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdChannelConfig {
  id: string;
  tenantId: string;
  channel: string;
  metaPageId: string | null;
  metaFormId: string | null;
  googleCustomerId: string | null;
  googleWebhookKey: string | null;
  defaultAssignedTo: string | null;
  defaultStage: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface OnboardTenantFormValues {
  consultancyName: string;
  registrationID: string;
  consultancyAddress: string;
  consultancyCity: string;
  consultancyState: string;
  consultancyCountry: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
