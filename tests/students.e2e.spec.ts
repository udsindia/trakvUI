import { test, expect, apiLogin, createLead, ACCOUNTS, login } from "./fixtures";
import { API_BASE_URL } from "../playwright.config";

test.describe("students module", () => {
  test("is reachable from the left navbar, between Leads and Applications", async ({
    authedPage: page,
  }) => {
    const order = await page
      .locator('a[href="/dashboard"], a[href="/leads"], a[href="/students"], a[href="/applications"]')
      .evaluateAll((links) => links.map((l) => l.getAttribute("href")));

    // Sidebar renders each link twice (desktop + mobile nav); order within the first pass is what matters.
    const unique = [...new Set(order)];
    expect(unique).toEqual(["/dashboard", "/leads", "/students", "/applications"]);
  });

  test("lists students with origin and counsellor", async ({ authedPage: page }) => {
    await page.goto("/students");
    await expect(page.getByRole("columnheader", { name: "Student" })).toBeVisible();
    for (const header of ["Phone", "Nationality", "Highest Degree", "Counsellor", "Origin", "Enrolled"]) {
      await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
    }
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("quick filters split enrolled leads from direct students", async ({ authedPage: page }) => {
    await page.goto("/students");
    const all = page.getByRole("tab", { name: /^All/ });
    const fromLeads = page.getByRole("tab", { name: /^Enrolled leads/ });
    const direct = page.getByRole("tab", { name: /^Direct/ });

    for (const tab of [all, fromLeads, direct]) await expect(tab).toBeVisible();

    await fromLeads.click();
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
    // Every visible row in this tab must carry the "Enrolled lead" chip.
    const chips = await rows.locator("text=Enrolled lead").count();
    expect(chips).toBe(await rows.count());
  });

  test("search narrows the list", async ({ authedPage: page, request }) => {
    const token = await apiLogin(request);
    const { id, firstName } = await createLead(request, token);
    await request.patch(`${API_BASE_URL}/leads/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { leadStage: "CONVERTED" },
    });

    await page.goto("/students");
    await page.getByPlaceholder(/Search name, email, phone/i).fill(firstName);
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr").first()).toContainText(firstName);
  });

  test("a newly enrolled student appears in the application picker", async ({
    authedPage: page,
    request,
  }) => {
    const token = await apiLogin(request);
    const { id, firstName } = await createLead(request, token);
    await request.patch(`${API_BASE_URL}/leads/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { leadStage: "CONVERTED" },
    });

    await page.goto("/applications/create");
    await page.locator("#studentId").click();
    await expect(page.locator("li[role=option]", { hasText: firstName })).toHaveCount(1);
  });

  test("a counsellor sees only their own students", async ({ page, request }) => {
    const adminToken = await apiLogin(request);
    const adminRes = await request.get(`${API_BASE_URL}/students?size=500`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminBody = await adminRes.json();
    const adminCount = (Array.isArray(adminBody) ? adminBody : adminBody.content ?? []).length;

    const counsellorToken = await apiLogin(request, ACCOUNTS.counsellor);
    const ownRes = await request.get(`${API_BASE_URL}/students?size=500`, {
      headers: { Authorization: `Bearer ${counsellorToken}` },
    });
    const ownBody = await ownRes.json();
    const ownCount = (Array.isArray(ownBody) ? ownBody : ownBody.content ?? []).length;

    expect(ownCount).toBeLessThan(adminCount);

    await login(page, ACCOUNTS.counsellor);
    await page.goto("/students");
    await expect(page.getByRole("tab", { name: `All ${ownCount}` })).toBeVisible();
  });
});
