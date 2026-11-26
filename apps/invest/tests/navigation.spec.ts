import { expect, test } from "@playwright/test";

import { installMarketFixture } from "./market-fixture";

declare global {
  interface Window {
    navigationMarker?: string;
  }
}

test("switches_screens_in_one_document", async ({ context, page }) => {
  await installMarketFixture(context, (url) => {
    if (url.pathname.endsWith("/global")) return { status: 200, json: { data: {} } };
    if (url.pathname.endsWith("/market_chart")) return { status: 200, json: { prices: [] } };
    if (url.pathname.endsWith("/simple/price"))
      return { status: 200, json: { bitcoin: { usd: 100, eur: 80, btc: 1 } } };
    return { status: 200, json: [{ id: "bitcoin", name: "Bitcoin", symbol: "btc" }] };
  });
  await page.goto("/coin/bitcoin");
  await expect(page.getByRole("heading", { name: "Bitcoin", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Bitcoin", exact: true })).toBeVisible();

  await page.evaluate(() => {
    window.navigationMarker = "same-document";
  });

  const home = page.getByRole("link", { name: "Рынок" });
  const portfolio = page.getByRole("link", { name: "Портфель" });

  await page.keyboard.press("Tab");
  await expect(home).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Рынок криптовалют" })).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(portfolio).toBeFocused();
  await expect(portfolio).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/portfolio");
  await expect(page.getByRole("heading", { name: "Мой портфель" })).toBeVisible();
  await expect(portfolio).toHaveAttribute("aria-current", "page");

  await page.keyboard.press("Shift+Tab");
  await expect(home).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Рынок криптовалют" })).toBeVisible();
  expect(await page.evaluate(() => window.navigationMarker)).toBe("same-document");

  await page.goBack();
  await expect(page).toHaveURL("/portfolio");
  await expect(page.getByRole("heading", { name: "Мой портфель" })).toBeVisible();
  expect(await page.evaluate(() => window.navigationMarker)).toBe("same-document");

  await page.reload();
  await expect(page.getByRole("heading", { name: "Мой портфель" })).toBeVisible();
});
