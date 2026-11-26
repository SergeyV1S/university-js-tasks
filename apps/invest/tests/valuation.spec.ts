import { expect, test } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";

import type { Purchase } from "../src/pages/portfolio/types";
import { installMarketFixture } from "./market-fixture";

const purchase = (coinId: string, overrides: Partial<Purchase> = {}): Purchase => ({
  coinId,
  quantity: 1,
  unitPrice: 100,
  currency: "RUB",
  rubPerUsd: 90,
  ...overrides
});

const seedPortfolio = (context: BrowserContext, purchases: Purchase[]) =>
  context.addInitScript((purchases) => {
    const key = "invest:portfolio";
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({ revision: purchases.length, purchases }));
    }
  }, purchases);

const marketResponse = (url: URL) => {
  const page = Number(url.searchParams.get("page"));
  if (url.pathname.endsWith("/coins/markets")) {
    return {
      status: 200,
      json: Array.from({ length: 20 }, (_, index) => {
        const rank = (page - 1) * 20 + index + 1;
        return { id: `coin-${rank}`, name: `Монета ${rank}`, market_cap_rank: rank };
      })
    };
  }
  if (url.pathname.endsWith("/coins/list")) {
    return {
      status: 200,
      json: [{ id: "outside-top", name: "Монета вне рейтинга", symbol: "OT" }]
    };
  }
  if (url.pathname.endsWith("/exchange_rates")) {
    return { status: 200, json: { rates: { usd: { value: 1 }, rub: { value: 110 } } } };
  }
  throw new Error(`Unexpected market request: ${url.pathname}`);
};

const installQuotes = (
  context: BrowserContext,
  quote: (id: string, currency: string) => number | undefined,
  beforeQuote?: (currency: string) => Promise<void> | undefined
) =>
  installMarketFixture(context, async (url) => {
    if (!url.pathname.endsWith("/simple/price")) return marketResponse(url);

    const currency = url.searchParams.get("vs_currencies") ?? "";
    const ids = url.searchParams.get("ids")?.split(",") ?? [];
    const json = Object.fromEntries(ids.map((id) => [id, { [currency]: quote(id, currency) }]));
    await beforeQuote?.(currency);
    return { status: 200, json };
  });

const summary = (page: Page) => page.getByRole("region", { name: "Текущая стоимость и PnL" });
const allocation = (page: Page) => page.getByRole("region", { name: "Структура портфеля" });
const chart = (page: Page) => allocation(page).getByRole("img", { name: "Доли монет" });
const currencyButton = (page: Page, currency: string) =>
  page.getByRole("button", { name: currency, exact: true });
const purchaseList = (page: Page) => page.getByRole("region", { name: "Покупки" });
const numeric = (text: string) =>
  Number(
    text
      .replace(/[^\d,−-]/g, "")
      .replace(",", ".")
      .replace("−", "-")
  );
const readValuation = async (page: Page, symbol: string) => {
  const values = summary(page).getByRole("definition");
  await expect(values.nth(0)).toContainText(symbol);
  await expect(values.nth(1)).toContainText(symbol);
  return {
    total: numeric(await values.nth(0).innerText()),
    pnl: numeric(await values.nth(1).innerText())
  };
};
const shares = async (page: Page) =>
  (
    await allocation(page)
      .getByText(/^\d+(,\d+)?%$/)
      .allTextContents()
  ).map(numeric);

test("values_purchases_in_both_currencies", async ({ context, page }) => {
  await seedPortfolio(context, [
    purchase("coin-1", { quantity: 2 }),
    purchase("coin-2", { quantity: 3, unitPrice: 20 })
  ]);
  let firstPrice = 120;
  let usdFirstPrice: number | undefined;
  let delayedUsd: Promise<void> | undefined;
  const { requests } = await installQuotes(
    context,
    (id, currency) => {
      if (id !== "coin-1") return 10;
      return currency === "usd" ? (usdFirstPrice ?? firstPrice) : firstPrice;
    },
    (currency) => (currency === "usd" ? delayedUsd : undefined)
  );

  await page.goto("/portfolio");
  await expect(chart(page)).toBeVisible();
  expect(await readValuation(page, "₽")).toEqual({ total: 270, pnl: 10 });
  const [firstShare, secondShare] = await shares(page);
  expect(firstShare).toBeCloseTo((100 * 240) / 270, 2);
  expect(secondShare).toBeCloseTo((100 * 30) / 270, 2);
  expect(requests.filter(({ url }) => url.includes("/simple/price"))).toHaveLength(1);

  firstPrice = 110;
  await currencyButton(page, "USD").click();
  expect(await readValuation(page, "$")).toEqual({ total: 250, pnl: 247.11 });
  const [nextShare] = await shares(page);
  expect(nextShare).toBe(88);

  await currencyButton(page, "RUB").click();
  expect(await readValuation(page, "₽")).toEqual({ total: 250, pnl: -10 });
  firstPrice = 115;
  await page.reload();
  expect(await readValuation(page, "₽")).toEqual({ total: 260, pnl: 0 });

  let releaseUsd = () => {};
  usdFirstPrice = 900;
  delayedUsd = new Promise((resolve) => {
    releaseUsd = resolve;
  });
  const usdRequests = () => requests.filter(({ url }) => url.includes("vs_currencies=usd"));
  const previousUsdRequests = usdRequests().length;
  const staleQuote = page.waitForRequest((request) => request.url().includes("vs_currencies=usd"));
  await currencyButton(page, "USD").click();
  await staleQuote;
  try {
    await expect(summary(page).getByText("Расчёты загружаются")).toBeAttached();
    await currencyButton(page, "RUB").click();
    expect(await readValuation(page, "₽")).toEqual({ total: 260, pnl: 0 });
  } finally {
    delayedUsd = undefined;
    usdFirstPrice = undefined;
    releaseUsd();
  }
  await expect.poll(() => usdRequests()[previousUsdRequests]?.status).toBe(200);
  expect(await readValuation(page, "₽")).toEqual({ total: 260, pnl: 0 });

  await page.evaluate(
    (purchases) => {
      localStorage.setItem("invest:portfolio", JSON.stringify({ revision: 2, purchases }));
    },
    [
      purchase("coin-1", { currency: "USD", rubPerUsd: 90 }),
      purchase("coin-2", { unitPrice: 10_000, rubPerUsd: 100 })
    ]
  );
  await page.reload();
  const inRubles = await readValuation(page, "₽");
  expect(inRubles.total - inRubles.pnl).toBe(19_000);
  await currencyButton(page, "USD").press("Enter");
  await expect(currencyButton(page, "USD")).toHaveAttribute("aria-pressed", "true");
  const inDollars = await readValuation(page, "$");
  expect(inDollars.total - inDollars.pnl).toBe(200);

  await page.reload();
  await expect(currencyButton(page, "RUB")).toHaveAttribute("aria-pressed", "true");
  await currencyButton(page, "USD").press("Enter");
  const reopened = await readValuation(page, "$");
  expect(reopened.total - reopened.pnl).toBe(200);
  expect(requests.filter(({ url }) => url.includes("/exchange_rates"))).toHaveLength(0);
});

test("distinguishes_missing_and_zero_prices", async ({ context, page }) => {
  let outsidePrice: number | undefined;
  await installQuotes(context, (id) => (id === "outside-top" ? outsidePrice : 0));
  await page.goto("/portfolio");
  await expect(page.getByText("Портфель пока пуст")).toBeVisible();
  await expect(summary(page)).toHaveCount(0);
  await expect(allocation(page)).toHaveCount(0);

  await seedPortfolio(context, [
    purchase("coin-1", { currency: "USD" }),
    purchase("outside-top", { currency: "USD" })
  ]);
  await page.reload();
  await expect(purchaseList(page).getByText("Монета вне рейтинга", { exact: true })).toBeVisible();
  await expect(summary(page)).toContainText("Нет котировок для Монета вне рейтинга (OT)");
  await expect(summary(page).getByText("Недоступна", { exact: true })).toBeVisible();
  await expect(summary(page).getByText("Недоступны", { exact: true })).toBeVisible();
  await expect(allocation(page)).toContainText("Структура недоступна до получения всех котировок.");
  await expect(chart(page)).toHaveCount(0);

  outsidePrice = 0;
  await currencyButton(page, "USD").click();
  expect(await readValuation(page, "$")).toEqual({ total: 0, pnl: -200 });
  await expect(allocation(page)).toContainText("Доли недоступны при нулевой стоимости портфеля");
  await expect(chart(page)).toHaveCount(0);
});

test("handles_200_purchases_across_two_tabs", async ({ context, page }) => {
  const purchases = Array.from({ length: 199 }, (_, index) =>
    purchase(`coin-${(index % 20) + 1}`, { unitPrice: 10 })
  );
  await seedPortfolio(context, purchases);
  const { requests } = await installQuotes(context, () => 20);
  const secondTab = await context.newPage();
  await Promise.all([page.goto("/portfolio"), secondTab.goto("/portfolio")]);

  for (const tab of [page, secondTab]) {
    await expect(purchaseList(tab).getByRole("listitem")).toHaveCount(199);
    expect(await readValuation(tab, "₽")).toEqual({ total: 3980, pnl: 1990 });
  }
  await page.getByRole("combobox", { name: "Монета" }).fill("Монета 1");
  await page.getByRole("option", { name: "Монета 1 #1", exact: true }).click();
  await page.getByLabel("Количество", { exact: true }).fill("2");
  await page.getByLabel("Цена за одну монету", { exact: true }).fill("15");
  await page.getByRole("button", { name: "Сохранить покупку" }).click();
  await expect(page.getByText("Покупка сохранена")).toBeVisible();
  await expect(purchaseList(secondTab).getByRole("listitem")).toHaveCount(200, { timeout: 1000 });

  for (const tab of [page, secondTab]) {
    await expect(purchaseList(tab).getByRole("listitem")).toHaveCount(200);
    await expect.poll(() => readValuation(tab, "₽")).toEqual({ total: 4020, pnl: 2000 });
    await expect(allocation(tab).getByRole("listitem")).toHaveCount(20);
    expect((await shares(tab))[0]).toBeCloseTo((100 * 240) / 4020, 2);
  }

  const readQuoteRequests = () => requests.filter(({ url }) => url.includes("/simple/price"));
  await expect.poll(() => readQuoteRequests().length).toBe(4);
  const quoteRequests = readQuoteRequests();
  expect(quoteRequests).toHaveLength(4);
  for (const request of quoteRequests) {
    const params = new URL(request.url).searchParams;
    expect([...params.keys()].sort()).toEqual(["ids", "vs_currencies"]);
    expect(params.get("ids")?.split(",").sort()).toEqual(
      Array.from({ length: 20 }, (_, index) => `coin-${index + 1}`).sort()
    );
    expect(request.method).toBe("GET");
    expect(request.body).toBeNull();
  }
});
