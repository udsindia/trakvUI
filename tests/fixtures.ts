import { test as base, expect, type Page, type APIRequestContext } from "@playwright/test";
import { API_BASE_URL } from "../playwright.config";

/**
 * Test accounts seeded in trakv_verify (all password Test@1234).
 * See the project's local-verify-db notes.
 */
export const ACCOUNTS = {
  admin: { email: "admin2@trakv.com", password: "Test@1234" },      // AGENCY_ADMIN, TENANT scope
  counsellor: { email: "c1@uds.com", password: "Test@1234" },       // COUNSELLOR, SELF scope
} as const;

/**
 * The e2e suite creates and mutates records. Running it against a deployed environment
 * would write test leads and students into real data, so refuse anything but a localhost
 * API. This is the single most important guard in the suite — do not relax it.
 */
function assertLocalBackend() {
  const host = new URL(API_BASE_URL).hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error(
      `Refusing to run: E2E writes data and the API is ${API_BASE_URL}. ` +
        `Point E2E_API_BASE_URL at a local backend running against trakv_verify.`,
    );
  }
}

/** Logs in through the real form and waits for the app shell. */
export async function login(page: Page, account = ACCOUNTS.admin) {
  await page.goto("/login");
  await page.locator("input[type=text]").fill(account.email);
  await page.locator("input[type=password]").fill(account.password);
  await page.locator("button[type=submit]").click();
  await expect(page).toHaveURL(/\/(dashboard|leads|students)/, { timeout: 20_000 });
}

/** A raw API token, for arranging state without clicking through the UI. */
export async function apiLogin(
  request: APIRequestContext,
  account = ACCOUNTS.admin,
): Promise<string> {
  const res = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email: account.email, password: account.password },
  });
  expect(res.ok(), `login failed for ${account.email}`).toBeTruthy();
  const body = await res.json();
  const token = body.token ?? body.accessToken;
  expect(token, "no token in login response").toBeTruthy();
  return token;
}

/** Creates a lead directly through the API and returns its id. */
export async function createLead(
  request: APIRequestContext,
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<{ id: string; firstName: string }> {
  const stamp = Date.now().toString().slice(-8);
  const firstName = `E2E${stamp}`;
  const res = await request.post(`${API_BASE_URL}/leads`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      firstName,
      lastName: "Test",
      emailAddress: `e2e.${stamp}@test.local`,
      countryCode: "+91",
      phoneNo: `98${stamp}`,
      leadSource: "Website",
      intakeMonth: "September",
      year: new Date().getFullYear() + 1,
      ...overrides,
    },
  });
  expect(res.ok(), `lead create failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  return { id: body.id, firstName };
}

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    assertLocalBackend();
    await login(page);
    await use(page);
  },
});

test.beforeAll(() => assertLocalBackend());

export { expect };
