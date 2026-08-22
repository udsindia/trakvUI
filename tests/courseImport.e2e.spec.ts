import { test, expect, ACCOUNTS, login } from "./fixtures";

test.describe("course import placement", () => {
  test("lives on the Universities page", async ({ authedPage: page }) => {
    await page.goto("/universities");
    await expect(page.getByRole("button", { name: "Import courses" })).toBeVisible();
  });

  test("no longer appears on the Courses page", async ({ authedPage: page }) => {
    // Courses is now search + filtering only.
    await page.goto("/courses");
    await expect(page.getByRole("button", { name: "Import courses" })).toHaveCount(0);
  });

  test("opens the two-phase dialog", async ({ authedPage: page }) => {
    await page.goto("/universities");
    await page.getByRole("button", { name: "Import courses" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Import courses" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Download sample CSV/i })).toBeVisible();
    // Preview is the only way forward, and it is disabled until a file is chosen —
    // nothing can be written to the catalogue by accident.
    await expect(dialog.getByRole("button", { name: "Preview import" })).toBeDisabled();

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("is hidden from a counsellor, who lacks UNIVERSITY_MANAGE", async ({ page }) => {
    await login(page, ACCOUNTS.counsellor);
    await page.goto("/universities");
    await expect(page.getByRole("button", { name: "Import courses" })).toHaveCount(0);
  });
});
