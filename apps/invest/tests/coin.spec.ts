import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { installMarketFixture } from "./market-fixture";
import type { FixtureResponse } from "./market-fixture";

const catalog = [
  { id: "bitcoin", name: "Bitcoin", symbol: "btc", market_cap_rank: 1, current_price: 100 },
  { id: "ethereum", name: "Ethereum", symbol: "eth", market_cap_rank: 2, current_price: 12 },
];
const start = Date.UTC(2026, 5, 17);

const history = (last = 100): FixtureResponse => ({
  status: 200,
  json: { prices: [[start, last / 2], [start + 86_400_000, last]] },
});

const respond = (url: URL): FixtureResponse => {
  if (url.pathname.endsWith("/coins/list")) return { status: 200, json: catalog };
  if (url.pathname.endsWith("/global")) return { status: 200, json: { data: {} } };
  if (url.pathname.endsWith("/simple/price")) {
    return { status: 200, json: { bitcoin: { usd: 100, btc: 1 }, ethereum: { usd: 12, eur: 1.246, btc: 0.125 } } };
  }
  if (url.pathname.endsWith("/exchange_rates")) {
    return { status: 200, json: { rates: { usd: { value: 100 }, eur: { value: 80 } } } };
  }
  if (url.pathname.endsWith("/market_chart")) return history();
  const id = url.searchParams.get("ids");
  return { status: 200, json: id ? catalog.filter((coin) => coin.id === id) : catalog };
};

const defer = () => {
  let resolve = () => {};
  const promise = new Promise<void>((release) => { resolve = release; });
  return { promise, resolve };
};

const graph = (page: Page) => page.getByRole("img", { name: /^График цены/ });
const period = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const quantity = (page: Page) => page.getByRole("textbox", { name: /^Количество/ });
const conversion = (page: Page) => page.getByRole("status", { name: "Результат конвертации" });
const chooseCurrency = (page: Page, currency: string) =>
  page.getByRole("button", { name: currency, exact: true }).click();

test("opens_known_and_unknown_urls", async ({ context, page }) => {
  const initial = defer();
  let pendingHistory = initial.promise;
  let catalogUnavailable = false;
  const { requests } = await installMarketFixture(context, async (url) => {
    if (url.pathname.endsWith("/coins/list") && catalogUnavailable) return { status: 429 };
    if (url.pathname.endsWith("/market_chart")) await pendingHistory;
    return respond(url);
  });

  try {
    await page.goto("/coin/bitcoin");
    await expect(page.getByRole("status", { name: "Загрузка данных монеты" })).toBeVisible();
  } finally {
    initial.resolve();
  }
  await expect(page.getByRole("heading", { name: "Bitcoin", exact: true })).toBeVisible();

  await page.goto("/coin/ethereum");
  await expect(page.getByRole("heading", { name: "Ethereum", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Ethereum", exact: true })).toBeVisible();

  await page.goto("/coin/unknown");
  await expect(page.getByRole("heading", { name: "Монета не найдена" })).toBeVisible();
  await expect(page).toHaveURL("/coin/unknown");
  expect(requests.some(({ url }) => url.includes("/unknown/market_chart") || url.includes("ids=unknown"))).toBe(false);
  await page.getByRole("button", { name: "На главную" }).click();
  await expect(page).toHaveURL("/");

  const internal = defer();
  pendingHistory = internal.promise;
  try {
    await page.getByRole("main").getByRole("link", { name: "Bitcoin", exact: true }).click();
    await expect(page.getByRole("status", { name: "Загрузка данных монеты" })).toBeVisible();
  } finally {
    internal.resolve();
  }
  await expect(page).toHaveURL("/coin/bitcoin");
  await expect(page.getByRole("heading", { name: "Bitcoin", exact: true })).toBeVisible();

  catalogUnavailable = true;
  await page.goto("/coin/bitcoin");
  await expect(page.getByRole("heading", { name: "Данные временно недоступны" })).toBeVisible();
  await expect(page.getByRole("status", { name: "Загрузка данных монеты" })).toHaveCount(0);
  await expect(page).toHaveURL("/coin/bitcoin");
});

test("shows_selected_history", async ({ context, page }) => {
  const requestedPeriods: number[] = [];
  let yearUnavailable = true;
  await installMarketFixture(context, (url) => {
    if (!url.pathname.endsWith("/market_chart")) return respond(url);
    const days = Number(url.searchParams.get("days"));
    requestedPeriods.push(days);
    expect(url.searchParams.get("vs_currency")).toBe("usd");
    if (days === 1) return { status: 200, json: { prices: [] } };
    if (days === 365 && yearUnavailable) return { status: 503 };
    return history(days * 10);
  });

  await page.goto("/coin/bitcoin");
  await expect(period(page, "7 д")).toHaveAttribute("aria-pressed", "true");
  await expect(graph(page)).toHaveAccessibleName(/\$70,00/);
  await expect.poll(() => graph(page).evaluate((element) => {
    if (!(element instanceof HTMLCanvasElement)) return false;
    const pixels = element.getContext("2d")?.getImageData(0, 0, element.width, element.height).data;
    if (!pixels) return false;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] === 255 && pixels[index + 1] === 198 && pixels[index + 2] === 122 && pixels[index + 3] === 255) return true;
    }
    return false;
  })).toBe(true);
  await period(page, "1 д").click();
  await expect(page.getByText("За этот период нет данных")).toBeVisible();
  await expect(graph(page)).toHaveCount(0);
  await period(page, "7 д").click();
  await expect(graph(page)).toHaveAccessibleName(/\$70,00/);
  await period(page, "30 д").click();
  await expect(graph(page)).toHaveAccessibleName(/\$300,00/);
  await period(page, "1 год").click();
  await expect(page.getByText("Не удалось загрузить график")).toBeVisible();
  await expect(page.getByText("Выберите другой период.")).toBeVisible();
  expect(requestedPeriods).toEqual([7, 1, 7, 30, 365]);

  yearUnavailable = false;
  await period(page, "30 д").click();
  await expect(graph(page)).toHaveAccessibleName(/\$300,00/);
  await period(page, "1 год").click();
  await expect(graph(page)).toHaveAccessibleName(/\$3\s650,00/);
});

test("converts_loaded_prices", async ({ context, page }) => {
  let ratesAvailable = true;
  let pricesAvailable = true;
  let thresholdCase = false;
  const { requests } = await installMarketFixture(context, (url) => {
    if (thresholdCase && url.pathname.endsWith("/simple/price")) {
      return { status: 200, json: { bitcoin: { usd: 0.02, btc: 1 } } };
    }
    if (thresholdCase && url.pathname.endsWith("/exchange_rates")) {
      return { status: 200, json: { rates: { usd: { value: 79_800 }, eur: { value: 70_000 } } } };
    }
    if (url.pathname.endsWith("/exchange_rates") && !ratesAvailable) return { status: 200, json: { rates: {} } };
    if (url.pathname.endsWith("/simple/price") && !pricesAvailable) return { status: 429 };
    return respond(url);
  });

  await page.goto("/coin/bitcoin");
  await expect(quantity(page)).toHaveValue("1");
  await expect(conversion(page)).toHaveText("100,00 USD");
  await chooseCurrency(page, "EUR");
  await expect(conversion(page)).toHaveText("80,00 EUR");
  await quantity(page).fill("2,5");
  await expect(conversion(page)).toHaveText("200,00 EUR");
  await chooseCurrency(page, "BTC");
  await expect(conversion(page)).toHaveText("2,50000000 BTC");
  const priceRequests = requests.filter(({ url }) => url.includes("/simple/price"));
  expect(priceRequests).toHaveLength(1);
  expect(new URL(priceRequests[0].url).searchParams.get("vs_currencies")).toBe("usd,eur,btc");
  expect(requests.filter(({ url }) => url.includes("/exchange_rates"))).toHaveLength(1);

  await page.goto("/coin/ethereum");
  await expect(conversion(page)).toHaveText("12,00 USD");
  await chooseCurrency(page, "EUR");
  await expect(conversion(page)).toHaveText("1,25 EUR");
  await chooseCurrency(page, "BTC");
  await expect(conversion(page)).toHaveText("0,12500000 BTC");
  await quantity(page).fill("0,000000001");
  await expect(conversion(page)).toHaveText("< 0,00000001 BTC");
  await chooseCurrency(page, "USD");
  await expect(conversion(page)).toHaveText("< 0,01 USD");

  for (const raw of ["", "текст", "0", "-1"]) {
    await quantity(page).fill(raw);
    for (const [currency, expected] of [["USD", "0,00 USD"], ["EUR", "0,00 EUR"], ["BTC", "0,00000000 BTC"]]) {
      await chooseCurrency(page, currency);
      await expect(conversion(page)).toHaveText(expected);
    }
  }
  expect(requests.filter(({ url }) => url.includes("/exchange_rates"))).toHaveLength(1);

  ratesAvailable = false;
  await page.goto("/coin/bitcoin");
  await chooseCurrency(page, "EUR");
  await expect(conversion(page)).toHaveText("Курс недоступен");
  await chooseCurrency(page, "BTC");
  await expect(conversion(page)).toHaveText("1,00000000 BTC");
  await quantity(page).fill("1e-8");
  await expect(conversion(page)).toHaveText("0,00000001 BTC");

  pricesAvailable = false;
  await page.reload();
  await expect(conversion(page)).toHaveText("Данные временно недоступны");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(graph(page)).toBeVisible();

  thresholdCase = true;
  await page.reload();
  await chooseCurrency(page, "EUR");
  await quantity(page).fill("0,57");
  await expect(conversion(page)).toHaveText("0,01 EUR");
  await quantity(page).fill("0,569999");
  await expect(conversion(page)).toHaveText("< 0,01 EUR");
});

test("ignores_late_history", async ({ context, page }) => {
  const stale = defer();
  let oneDayRequested = false;
  const { requests } = await installMarketFixture(context, async (url) => {
    if (!url.pathname.endsWith("/market_chart")) return respond(url);
    const days = url.searchParams.get("days");
    if (days === "1") {
      oneDayRequested = true;
      await stale.promise;
      return history(10);
    }
    return history(days === "30" ? 300 : 70);
  });

  try {
    await page.goto("/coin/bitcoin");
    await period(page, "1 д").click();
    await expect.poll(() => oneDayRequested).toBe(true);
    await expect(page.getByRole("status", { name: "Загрузка истории цены" })).toBeVisible();
    await period(page, "30 д").click();
    await expect(graph(page)).toHaveAccessibleName(/\$300,00/);
  } finally {
    stale.resolve();
  }

  await expect.poll(() => requests.find(({ url }) => new URL(url).searchParams.get("days") === "1")?.status).toBe(200);
  await expect(period(page, "30 д")).toHaveAttribute("aria-pressed", "true");
  await expect(graph(page)).toHaveAccessibleName(/\$300,00/);
});
