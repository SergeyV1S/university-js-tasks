import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { installMarketFixture } from "./market-fixture";
import type { FixtureResponse } from "./market-fixture";

const coins = Array.from({ length: 32 }, (_, index) => ({
  id: `coin-${index + 1}`,
  name: `Market ${index + 1}`,
  market_cap_rank: index + 1,
  current_price: index + 1
}));

const clockStart = new Date("2025-01-01T12:00:00Z");

const pauseClock = async (page: Page) => {
  await page.clock.install({ time: clockStart });
  await page.clock.pauseAt(new Date(clockStart.getTime() + 1_000));
};

const defer = () => {
  let resolve = () => {};
  const promise = new Promise<void>((release) => {
    resolve = release;
  });
  return { promise, resolve };
};

const metrics = (share: number) => ({
  status: 200,
  json: { data: { market_cap_percentage: { btc: share } } }
});

const respond = (url: URL): FixtureResponse => {
  if (url.pathname.endsWith("/global")) return metrics(53);
  if (url.pathname.endsWith("/coins/list")) return { status: 200, json: coins };
  if (url.pathname.endsWith("/simple/price"))
    return { status: 200, json: { "coin-1": { usd: 24, eur: 20, btc: 0.001, rub: 2400 } } };
  if (url.pathname.endsWith("/market_chart"))
    return {
      status: 200,
      json: {
        prices: [
          [1_735_732_800_000, 20],
          [1_735_736_400_000, 24]
        ]
      }
    };

  const ids = url.searchParams.get("ids")?.split(",");
  const offset = (Number(url.searchParams.get("page")) - 1) * 20;
  return {
    status: 200,
    json: ids ? coins.filter(({ id }) => ids.includes(id)) : coins.slice(offset, offset + 20)
  };
};

const table = (page: Page) => page.getByRole("table", { name: "Котировки монет" });
const globalCards = (page: Page) => page.getByRole("region", { name: "Рыночные метрики" });
const summary = (page: Page) => page.getByRole("region", { name: "Текущая стоимость и PnL" });
const converter = (page: Page) => page.getByRole("region", { name: "Конвертер" });

test("polls_without_hiding_or_resetting_the_table", async ({ context, page }) => {
  await pauseClock(page);
  const delayed = defer();
  let globals = 0;
  let refreshedTables = 0;
  const fixture = await installMarketFixture(context, async (url) => {
    if (url.pathname.endsWith("/global")) return metrics(52 + ++globals);
    const ids = url.searchParams.get("ids")?.split(",");
    if (ids?.length === coins.length) {
      refreshedTables += 1;
      if (refreshedTables === 1) await delayed.promise;
      return {
        status: 200,
        json: coins.map((coin, index) => ({
          ...coin,
          current_price: refreshedTables > 1 && index >= 24 ? 201 : 101
        }))
      };
    }
    return respond(url);
  });
  await page.goto("/");
  await expect(table(page).getByRole("link")).toHaveCount(20);
  expect(fixture.requests).toHaveLength(2);
  await page.getByRole("searchbox").fill("Market");
  await page.clock.runFor(300);
  await expect(table(page).getByRole("link")).toHaveCount(32);

  await page.getByRole("button", { name: "Диапазон цен" }).click();
  await page.getByRole("textbox", { name: "Максимальная цена" }).fill("150");
  await page.getByRole("button", { name: "Показать" }).click();
  await expect(table(page).getByRole("link")).toHaveCount(32);
  await expect(page.locator("#market-price-filter")).toBeHidden();

  await page.addStyleTag({ content: "tbody tr { height: 50px !important }" });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: 1440, height: height - 800 });
  await page.evaluate(() => window.scrollTo(0, 600));

  await page.clock.fastForward(59_699);
  expect(globals).toBe(1);
  await page.clock.runFor(1);
  await expect(globalCards(page)).toContainText("54%");
  await expect(page.getByText("Обновляем котировки…")).toBeVisible();
  await expect(table(page)).toBeVisible();
  await expect(table(page)).not.toHaveAttribute("aria-busy", "true");

  await page.clock.fastForward(60_000);
  expect(refreshedTables).toBe(1);
  expect(globals).toBe(2);
  delayed.resolve();
  await expect(page.getByText("Обновляем котировки…")).toBeHidden();
  await expect(table(page)).toContainText("$101,00");
  expect(await page.evaluate(() => window.scrollY)).toBe(600);

  await page.clock.fastForward(60_000);
  await expect(table(page).getByRole("link")).toHaveCount(24);
  expect(await page.evaluate(() => window.scrollY)).toBe(400);
});

test("recovers_from_429_and_network_failure", async ({ context, page }) => {
  await pauseClock(page);
  let homeFailure: FixtureResponse | undefined = {
    status: 429,
    headers: { "Retry-After": "45" }
  };
  let quotesFail = false;
  let usd = 24;
  let rub = 2400;
  let chartFails = false;
  const fixture = await installMarketFixture(context, (url) => {
    if (homeFailure && /\/(global|coins\/markets)$/.test(url.pathname)) return homeFailure;
    if (url.pathname.endsWith("/simple/price")) {
      if (quotesFail) return { abort: true };
      return { status: 200, json: { "coin-1": { usd, rub, eur: 20, btc: 0.001 } } };
    }
    if (chartFails && url.pathname.endsWith("/market_chart")) return { abort: true };
    return respond(url);
  });

  await page.goto("/");
  await expect(table(page)).toBeVisible();
  await expect(page.getByRole("status", { name: "Загрузка котировок" })).toHaveCount(0);
  await expect(globalCards(page)).toContainText("Данные временно недоступны");
  await expect(page.getByRole("alert")).toContainText("Лимит запросов к сервису");
  const received429At = await page.evaluate(() => Date.now());
  const initialRequests = fixture.requests.length;

  homeFailure = undefined;
  await page.clock.fastForward(44_999);
  expect(fixture.requests).toHaveLength(initialRequests);
  await page.clock.runFor(1);
  await expect(globalCards(page)).toContainText("53%");
  const retryAt = await page.evaluate(() => Date.now());
  expect(retryAt - received429At).toBeGreaterThanOrEqual(45_000);
  await expect(table(page).getByRole("link")).toHaveCount(20);

  homeFailure = { abort: true };
  await page.clock.fastForward(15_000);
  await expect(page.getByText("Могут быть устаревшими", { exact: true })).toBeVisible();
  await expect(table(page).getByRole("link")).toHaveCount(20);
  await expect(globalCards(page)).toContainText("53%");
  const countGlobals = () => fixture.requests.filter(({ url }) => url.endsWith("/global")).length;
  for (const delay of [2_000, 4_000, 8_000, 16_000, 32_000, 60_000, 60_000, 60_000, 60_000]) {
    const count = countGlobals();
    const failed = page.waitForEvent("requestfailed", {
      predicate: (request) => request.url().endsWith("/global")
    });
    await page.clock.runFor(delay);
    await failed;
    await expect.poll(countGlobals).toBe(count + 1);
    await expect(page.getByText("Могут быть устаревшими", { exact: true })).toBeVisible();
  }
  homeFailure = undefined;
  await page.clock.runFor(60_000);
  await expect(page.getByText("Могут быть устаревшими", { exact: true })).toBeHidden();

  quotesFail = true;
  chartFails = true;
  await table(page).getByRole("link", { name: "Market 1", exact: true }).click();
  await expect(converter(page)).toContainText("Данные временно недоступны");
  await expect(page.getByText("Не удалось загрузить график")).toBeVisible();
  await expect(page.getByRole("button", { name: "30 д" })).toBeEnabled();
  quotesFail = false;
  chartFails = false;
  await page.clock.fastForward(2_000);
  await expect(converter(page)).toContainText("24,00 USD");
  await expect(page.getByText("Не удалось загрузить график")).toBeHidden();
  const coinRequests = fixture.requests.length;
  await page.clock.fastForward(120_000);
  expect(fixture.requests).toHaveLength(coinRequests);

  await page.getByRole("link", { name: "Все криптовалюты" }).click();
  quotesFail = true;
  await table(page).getByRole("link", { name: "Market 1", exact: true }).click();
  await expect(converter(page)).toContainText("24,00 USD");
  await expect(converter(page)).toContainText("Могут быть устаревшими");
  quotesFail = false;
  usd = 25;
  await page.clock.runFor(2_000);
  await expect(converter(page)).toContainText("25,00 USD");
  await expect(converter(page)).not.toContainText("Могут быть устаревшими");

  await page.evaluate(() => {
    localStorage.setItem(
      "invest:portfolio",
      JSON.stringify({
        revision: 1,
        purchases: [
          { coinId: "coin-1", quantity: 1, unitPrice: 24, rubPerUsd: 90, currency: "USD" }
        ]
      })
    );
  });
  quotesFail = true;
  await page.getByRole("link", { name: "Портфель" }).click();
  await expect(summary(page)).toContainText("Данные временно недоступны");
  quotesFail = false;
  await page.clock.fastForward(2_000);
  await expect(summary(page)).toContainText("2\u00a0400,00");
  const portfolioRequests = fixture.requests.length;
  await page.clock.fastForward(120_000);
  expect(fixture.requests).toHaveLength(portfolioRequests);

  const portfolioCurrency = page.getByRole("group", { name: "Валюта портфеля" });
  await portfolioCurrency.getByRole("button", { name: "USD", exact: true }).click();
  await expect(summary(page)).toContainText("$25,00");
  quotesFail = true;
  await portfolioCurrency.getByRole("button", { name: "RUB", exact: true }).click();
  await expect(summary(page)).toContainText("Могут быть устаревшими");
  await expect(summary(page)).toContainText(/2\s400,00/);
  quotesFail = false;
  rub = 2500;
  await page.clock.runFor(2_000);
  await expect(summary(page)).toContainText(/2\s500,00/);
  await expect(summary(page)).not.toContainText("Могут быть устаревшими");
});

test("stops_obsolete_retries_on_navigation", async ({ context, page }) => {
  await pauseClock(page);
  const second = await context.newPage();
  const delayed = defer();
  let blockHome = false;
  let limit = false;
  const fixture = await installMarketFixture(context, async (url) => {
    if (url.pathname.endsWith("/global")) {
      if (limit) {
        limit = false;
        return { status: 429, headers: { "Retry-After": "45" } };
      }
      if (blockHome) await delayed.promise;
    }
    return respond(url);
  });
  await page.goto("/");
  await expect(globalCards(page)).toContainText("53%");
  await page.clock.runFor(1_000);
  await second.goto("/");
  await expect(globalCards(second)).toContainText("53%");

  const countGlobals = () => fixture.requests.filter(({ url }) => url.endsWith("/global")).length;
  limit = true;
  await page.clock.runFor(59_000);
  await expect(page.getByRole("alert")).toContainText("Лимит запросов к сервису");
  const globalsAfter429 = countGlobals();
  await page.clock.runFor(1_000);
  await expect(second.getByRole("alert")).toContainText("Лимит запросов к сервису");
  expect(countGlobals()).toBe(globalsAfter429);

  const portfolioLink = page.getByRole("link", { name: "Портфель" });
  await portfolioLink.click();
  await expect(page.getByRole("heading", { name: "Мой портфель" })).toBeVisible();
  await page.clock.runFor(43_999);
  expect(countGlobals()).toBe(globalsAfter429);
  await page.clock.runFor(1);
  await expect(second.getByRole("alert")).toBeHidden();
  expect(countGlobals()).toBe(globalsAfter429 + 1);
  await expect(page.getByRole("heading", { name: "Мой портфель" })).toBeVisible();

  blockHome = true;
  const cancelled = page.waitForEvent("requestfailed", {
    predicate: (request) => request.url().endsWith("/global")
  });
  try {
    await page.getByRole("link", { name: "Рынок", exact: true }).click();
    await expect(page.getByRole("status", { name: "Загрузка котировок" })).toBeVisible();
    await expect.poll(countGlobals).toBe(globalsAfter429 + 2);
    await portfolioLink.click();
    await cancelled;
  } finally {
    delayed.resolve();
  }
  await expect(page.getByRole("heading", { name: "Мой портфель" })).toBeVisible();
});

test("keeps cached home data and marks only the block still waiting for recovery", async ({
  context,
  page
}) => {
  await pauseClock(page);
  let topFails = false;
  let metricsFail = false;
  let returning = false;
  await installMarketFixture(context, (url) => {
    if (url.pathname.endsWith("/global")) {
      return metricsFail ? { abort: true } : metrics(returning ? 54 : 53);
    }
    if (url.pathname.endsWith("/coins/markets")) {
      if (topFails) return { abort: true };
      if (returning && url.searchParams.has("ids")) {
        return { status: 200, json: coins.slice(1, 20) };
      }
    }
    return respond(url);
  });

  await page.goto("/");
  const firstCoin = table(page).getByRole("link", { name: "Market 1", exact: true });
  await expect(firstCoin).toBeVisible();
  await expect(globalCards(page)).toContainText("53%");
  await page.getByRole("link", { name: "Портфель" }).click();
  await expect(page.getByRole("heading", { name: "Мой портфель" })).toBeVisible();

  returning = true;
  topFails = true;
  metricsFail = true;
  await page.getByRole("link", { name: "Рынок", exact: true }).click();
  await expect(firstCoin).toBeVisible();
  await expect(globalCards(page)).toContainText("53%");
  await expect(page.getByText("Могут быть устаревшими", { exact: true })).toBeVisible();

  topFails = false;
  await page.clock.runFor(2_000);
  await expect(firstCoin).toBeHidden();
  await expect(table(page)).not.toHaveAttribute("aria-describedby", "market-refresh-status");
  await expect(globalCards(page)).toContainText("Могут быть устаревшими");

  metricsFail = false;
  await page.clock.runFor(4_000);
  await expect(globalCards(page)).toContainText("54%");
  await expect(page.getByText("Могут быть устаревшими", { exact: true })).toBeHidden();
});
