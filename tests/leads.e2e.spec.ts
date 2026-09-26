import { test, expect, apiLogin, createLead, ACCOUNTS, login } from "./fixtures";
import { API_BASE_URL } from "../playwright.config";

test.describe("lead pipeline", () => {
  test("the stage picker offers the agreed pipeline", async ({ authedPage: page }) => {
    await page.goto("/leads");
    const row = page.locator("tbody tr").first();
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: /^Change stage for/ }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").click();

    await expect(page.locator("li[role=option]")).toHaveText([
      "New",
      "Contacted",
      "Qualified",
      "Prospective",
      "Enrolled",
    ]);
  });

  test("moving a lead to Enrolled creates its student record", async ({
    authedPage: page,
    request,
  }) => {
    const token = await apiLogin(request);
    const { id, firstName } = await createLead(request, token);

    await page.goto("/leads");
    // The new lead is the most recent; search narrows to it regardless of page.
    await page.getByPlaceholder(/Search name, email, phone/i).fill(firstName);
    const row = page.locator("tbody tr", { hasText: firstName });
    await expect(row).toHaveCount(1);

    await row.getByRole("button", { name: `Change stage for ${firstName} Test` }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").click();
    await page.locator("li[role=option]", { hasText: "Enrolled" }).click();
    await dialog.getByRole("button", { name: "Update" }).click();

    // The student is what the application picker reads, so assert on the API, not the toast.
    await expect
      .poll(
        async () => {
          const res = await request.get(`${API_BASE_URL}/students?size=500`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const body = await res.json();
          const list = Array.isArray(body) ? body : (body.content ?? []);
          return list.some((s: { leadId?: string }) => s.leadId === id);
        },
        { message: "no student was created for the enrolled lead", timeout: 15_000 },
      )
      .toBe(true);
  });

  test("enrolling twice does not create a second student", async ({ request }) => {
    const token = await apiLogin(request);
    const { id } = await createLead(request, token);
    const headers = { Authorization: `Bearer ${token}` };

    const enrol = () =>
      request.patch(`${API_BASE_URL}/leads/${id}`, {
        headers,
        data: { leadStage: "CONVERTED" },
      });

    expect((await enrol()).ok()).toBeTruthy();
    expect((await enrol()).ok()).toBeTruthy();

    const res = await request.get(`${API_BASE_URL}/students?size=500`, { headers });
    const body = await res.json();
    const list = Array.isArray(body) ? body : (body.content ?? []);
    expect(list.filter((s: { leadId?: string }) => s.leadId === id)).toHaveLength(1);
  });

  test("a non-stage update never enrols a lead", async ({ request }) => {
    const token = await apiLogin(request);
    const { id } = await createLead(request, token);
    const headers = { Authorization: `Bearer ${token}` };

    await request.patch(`${API_BASE_URL}/leads/${id}`, {
      headers,
      data: { notes: "touched without changing the stage" },
    });

    const res = await request.get(`${API_BASE_URL}/students?size=500`, { headers });
    const body = await res.json();
    const list = Array.isArray(body) ? body : (body.content ?? []);
    expect(list.some((s: { leadId?: string }) => s.leadId === id)).toBe(false);
  });
});

test.describe("custom lead source", () => {
  test("Other reveals a validated free-text field", async ({ authedPage: page }) => {
    await page.goto("/leads/create");

    const sourceField = page.locator("#source");
    await sourceField.click();
    await page.locator("li[role=option]", { hasText: /^Other$/ }).click();

    const custom = page.locator("#otherSource");
    await expect(custom).toBeVisible();

    // A duplicate of an existing option is refused with a pointed message.
    await custom.fill("Website");
    await custom.blur();
    await expect(page.getByText(/already in the list/i)).toBeVisible();

    await custom.fill("Instagram Reels");
    await custom.blur();
    await expect(page.getByText(/already in the list/i)).toHaveCount(0);
  });

  test("switching away from Other hides the field", async ({ authedPage: page }) => {
    await page.goto("/leads/create");
    await page.locator("#source").click();
    await page.locator("li[role=option]", { hasText: /^Other$/ }).click();
    await expect(page.locator("#otherSource")).toBeVisible();

    await page.locator("#source").click();
    await page.locator("li[role=option]", { hasText: /^Website$/ }).click();
    await expect(page.locator("#otherSource")).toHaveCount(0);
  });
});

test.describe("lead assignment", () => {
  test("a lead can be reassigned from the table", async ({ authedPage: page, request }) => {
    const token = await apiLogin(request);
    const { firstName } = await createLead(request, token);

    await page.goto("/leads");
    await page.getByPlaceholder(/Search name, email, phone/i).fill(firstName);
    const row = page.locator("tbody tr", { hasText: firstName });
    await expect(row).toHaveCount(1);

    await row.getByRole("button", { name: `Assign ${firstName} Test` }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Assign Lead");

    await dialog.getByRole("combobox").click();
    const firstAgent = page.locator("li[role=option]").first();
    const agentName = (await firstAgent.textContent())?.trim() ?? "";
    await firstAgent.click();
    await dialog.getByRole("button", { name: "Assign" }).click();

    await expect(page.getByText(`Lead assigned to ${agentName}`)).toBeVisible();
  });

  test("a counsellor without LEAD_ASSIGN gets no assign control", async ({ page }) => {
    await login(page, ACCOUNTS.counsellor);
    await page.goto("/leads");
    await expect(page.locator("tbody tr").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^Assign / })).toHaveCount(0);
  });
});
