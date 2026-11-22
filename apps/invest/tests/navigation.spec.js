import { expect, test } from "@playwright/test";

test("switches_screens_in_one_document", async ({ page }) => {
  await page.goto("/#/");
  await expect(page.getByRole("heading", { name: "Главная" })).toBeVisible();
  await page.evaluate(() => {
    window.navigationMarker = "same-document";
  });

  const home = page.getByRole("link", { name: "Главная" });
  const portfolio = page.getByRole("link", { name: "Портфель" });

  await page.keyboard.press("Tab");
  await expect(home).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(portfolio).toBeFocused();
  await expect(portfolio).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/portfolio$/);
  await expect(page.getByRole("heading", { name: "Портфель" })).toBeVisible();
  await expect(portfolio).toHaveAttribute("aria-current", "page");

  await page.keyboard.press("Shift+Tab");
  await expect(home).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole("heading", { name: "Главная" })).toBeVisible();

  await page.goto("/#/coin/bitcoin");
  await expect(page).toHaveURL(/#\/coin\/bitcoin$/);
  await expect(page.getByRole("heading", { name: "Детали монеты" })).toBeVisible();

  expect(await page.evaluate(() => window.navigationMarker)).toBe("same-document");

  await page.goBack();
  await expect(page.getByRole("heading", { name: "Главная" })).toBeVisible();
  expect(await page.evaluate(() => window.navigationMarker)).toBe("same-document");
});
