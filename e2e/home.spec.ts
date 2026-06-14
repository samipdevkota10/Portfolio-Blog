import { expect, test } from "@playwright/test";

test("homepage renders key sections", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("h1").first()).toContainText(/scalable apis/i);
  await expect(page.getByRole("heading", { name: /case studies/i })).toBeVisible();
});

test("chat widget opens from the floating bubble", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /open portfolio assistant/i }).click();
  await expect(page.getByText(/portfolio assistant/i)).toBeVisible();
});
