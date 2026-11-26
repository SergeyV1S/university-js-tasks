import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { installMarketFixture } from "./market-fixture";
import type { FixtureResponse, RecordedRequest } from "./market-fixture";

const coin = (
  rank: number,
  name: string,
  price: number | null,
  change = 0,
  cap: number | null = rank * 10
) => ({
  id: `coin-${rank}`,
  name,
  market_cap_rank: rank,
  current_price: price,
  price_change_percentage_24h: change,
  market_cap: cap
});

const catalog = Array.from({ length: 120 }, (_, index) =>
  coin(index + 1, `Market ${index + 1}`, index + 1)
);
catalog[104] = coin(105, "<b>Пример</b>", 12);
catalog[119] = coin(120, "ExampleCoin", 25);

const globalMetrics = {
  total_market_cap: { usd: 2.51e12 },
  total_volume: { usd: 76.4e9 },
  market_cap_change_percentage_24h_usd: 1.86,
  market_cap_percentage: { btc: 53.2, eth: 17.1 }
};

const respond = (url: URL, top = catalog.slice(0, 105), all = catalog): FixtureResponse => {
  if (url.pathname.endsWith("/global")) return { status: 200, json: { data: globalMetrics } };
  if (url.pathname.endsWith("/coins/list")) return { status: 200, json: all };
  const ids = url.searchParams.get("ids")?.split(",");
  if (ids) return { status: 200, json: all.filter(({ id }) => ids.includes(id)) };
  const size = Number(url.searchParams.get("per_page"));
  const page = Number(url.searchParams.get("page"));
  return { status: 200, json: top.slice((page - 1) * size, page * size) };
};

const defer = () => {
  let resolve = () => {};
  const promise = new Promise<void>((release) => {
    resolve = release;
  });
  return { promise, resolve };
};

const coinLinks = (page: Page) => page.getByRole("table").getByRole("link");
const search = (page: Page) => page.getByRole("searchbox", { name: "Поиск по названию" });
const scrollToBottom = (page: Page) =>
  page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
const getTopPages = (requests: RecordedRequest[]) =>
  requests
    .map(({ url }) => new URL(url))
    .filter((url) => url.pathname.endsWith("/coins/markets") && !url.searchParams.has("ids"))
    .map((url) => Number(url.searchParams.get("page")));

test("appends 20 coins at a time and stops after page five", async ({ context, page }) => {
  const fixture = await installMarketFixture(context, (url) => respond(url));
  await page.goto("/");
  await expect(coinLinks(page)).toHaveCount(20);
  expect(getTopPages(fixture.requests)).toEqual([1]);

  for (const count of [40, 60, 80, 100]) {
    await scrollToBottom(page);
    await expect(coinLinks(page)).toHaveText(catalog.slice(0, count).map(({ name }) => name));
  }

  await scrollToBottom(page);
  await expect(coinLinks(page).last()).toBeInViewport();
  expect(getTopPages(fixture.requests)).toEqual([1, 2, 3, 4, 5]);
});

test("retries the same page and keeps existing coins when pages overlap", async ({
  context,
  page
}) => {
  let failPageTwo = true;
  const fixture = await installMarketFixture(context, (url) => {
    if (!url.searchParams.has("ids") && url.searchParams.get("page") === "2") {
      if (failPageTwo) return { status: 503 };
      return { status: 200, json: [coin(20, "Changed name", 999), ...catalog.slice(20, 39)] };
    }
    return respond(url, [...catalog.slice(0, 39), ...catalog.slice(40)]);
  });

  await page.goto("/");
  await expect(coinLinks(page)).toHaveCount(20);
  await scrollToBottom(page);
  const retry = page.getByRole("button", { name: "Повторить загрузку" });
  await expect(retry).toBeVisible();
  await expect(coinLinks(page)).toHaveCount(20);
  expect(getTopPages(fixture.requests)).toEqual([1, 2]);

  failPageTwo = false;
  await retry.click();
  await expect(coinLinks(page)).toHaveText(catalog.slice(0, 39).map(({ name }) => name));
  for (const count of [59, 79, 99]) {
    await scrollToBottom(page);
    await expect(coinLinks(page)).toHaveCount(count);
  }
  await scrollToBottom(page);
  await expect(coinLinks(page).last()).toBeInViewport();
  expect(getTopPages(fixture.requests)).toEqual([1, 2, 2, 3, 4, 5]);
});

test("recovers from an empty top by retrying from the first page", async ({ context, page }) => {
  let available = false;
  const fixture = await installMarketFixture(context, (url) => {
    if (!available && url.pathname.endsWith("/global")) return { status: 503 };
    return respond(url, available ? catalog : []);
  });

  await page.goto("/");
  const retry = page.getByRole("button", { name: "Повторить запрос" });
  await expect(retry).toBeVisible();
  await scrollToBottom(page);
  await expect.poll(() => getTopPages(fixture.requests)).toEqual([1, 2, 3, 4, 5]);

  available = true;
  await retry.click();
  await expect(coinLinks(page)).toHaveCount(20);
  await scrollToBottom(page);
  await expect(coinLinks(page)).toHaveCount(40);
  expect(getTopPages(fixture.requests)).toEqual([1, 2, 3, 4, 5, 1, 2]);
});

test("shows an initial page and searches the full catalog", async ({ context, page }) => {
  const initial = defer();
  const fixture = await installMarketFixture(context, async (url) => {
    if (!url.searchParams.has("ids") && url.pathname.endsWith("/coins/markets"))
      await initial.promise;
    return respond(url);
  });

  await page.goto("/");
  await expect(page.getByRole("status", { name: "Загрузка котировок" })).toBeVisible();
  initial.resolve();
  await expect(coinLinks(page)).toHaveCount(20);
  await expect(coinLinks(page).last()).toHaveText("Market 20");
  expect(
    fixture.requests.some(({ url }) => url.endsWith("/coins/list?include_platform=false"))
  ).toBe(false);

  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await search(page).fill("PLEco");
  await page.clock.runFor(299);
  expect(fixture.requests.filter(({ url }) => new URL(url).searchParams.has("ids"))).toHaveLength(
    0
  );
  await page.clock.runFor(1);
  await expect(coinLinks(page)).toHaveText(["ExampleCoin"]);

  await search(page).fill("b>Пример");
  await page.clock.runFor(300);
  await expect(coinLinks(page)).toHaveText(["<b>Пример</b>"]);
  await expect(coinLinks(page).locator("b")).toHaveCount(0);

  await search(page).fill("missing name");
  await page.clock.runFor(300);
  await expect(page.getByText("Монеты не найдены")).toBeVisible();
});

test("sorts all matches without fetching more top coins while searching", async ({
  context,
  page
}) => {
  const all = Array.from({ length: 120 }, (_, i) => coin(i + 1, `Match ${i + 1}`, i + 1));
  const fixture = await installMarketFixture(context, (url) =>
    respond(url, all.slice(0, 100), all)
  );
  await page.goto("/");
  await search(page).fill("match");
  await expect(coinLinks(page)).toHaveCount(120);
  await page.getByRole("button", { name: "Сортировать по цене" }).click();
  await expect(coinLinks(page)).toHaveText(all.map(({ name }) => name).reverse());
  await scrollToBottom(page);
  await expect(coinLinks(page).last()).toBeInViewport();
  expect(getTopPages(fixture.requests)).toEqual([1]);
});

test("combines_price_and_sort", async ({ context, page }) => {
  const rows = [
    coin(1, "Example A", 5, 2, 500),
    coin(2, "Example B", 10, -2, 100),
    coin(3, "Example C", 20, 0, null),
    coin(4, "Example D", 25, 1, 200),
    coin(5, "Example E", null, 3, 300)
  ];
  await installMarketFixture(context, (url) =>
    respond(url, rows, [...rows, coin(120, "Example Extra", 12)])
  );
  await page.goto("/");
  await expect(coinLinks(page)).toHaveCount(5);
  await expect(page.getByText("+2%", { exact: true })).toHaveCSS("color", "rgb(140, 219, 179)");
  await expect(page.getByText("−2%", { exact: true })).toHaveCSS("color", "rgb(255, 156, 157)");
  await expect(page.getByText("0%", { exact: true })).toHaveCSS("color", "rgb(244, 242, 233)");

  const sortCases = [
    { name: "по рангу", asc: [0, 1, 2, 3, 4] },
    { name: "по названию", asc: [0, 1, 2, 3, 4] },
    { name: "по цене", asc: [0, 1, 2, 3] },
    { name: "по изменению за сутки", asc: [1, 2, 3, 0, 4] },
    { name: "по капитализации", asc: [1, 3, 4, 0] }
  ];
  for (const { name, asc } of sortCases) {
    const button = page.getByRole("table").getByRole("button", { name: `Сортировать ${name}` });
    const first = name === "по рангу" || name === "по цене" ? [...asc].reverse() : asc;
    await button.click();
    await expect(coinLinks(page)).toHaveText(first.map((index) => rows[index].name));
    await button.click();
    await expect(coinLinks(page)).toHaveText([...first].reverse().map((index) => rows[index].name));
  }
  await page.getByRole("button", { name: "Сортировать по цене" }).click();
  await page.getByRole("button", { name: "Сортировать по цене" }).click();

  const toggle = page.getByRole("button", { name: "Диапазон цен" });
  await toggle.click();
  const min = page.getByRole("textbox", { name: "Минимальная цена" });
  const max = page.getByRole("textbox", { name: "Максимальная цена" });
  const apply = page.getByRole("button", { name: "Показать", exact: true });
  await min.fill("-2");
  await max.fill("abc");
  await apply.click();
  await expect(min).toHaveAttribute("aria-invalid", "true");
  await expect(max).toHaveAttribute("aria-invalid", "true");

  for (const [from, to, expected] of [
    ["20", "10", ["Example B", "Example C"]],
    ["", "20", ["Example A", "Example B", "Example C"]],
    ["10", "", ["Example B", "Example C", "Example D"]]
  ] as const) {
    if ((await toggle.getAttribute("aria-expanded")) === "false") await toggle.click();
    await min.fill(from);
    await max.fill(to);
    await apply.click();
    await expect(coinLinks(page)).toHaveText([...expected]);
  }

  await search(page).fill("example");
  await expect(coinLinks(page)).toHaveText([
    "Example B",
    "Example Extra",
    "Example C",
    "Example D"
  ]);
  await search(page).fill("");
  await expect(coinLinks(page)).toHaveText(["Example B", "Example C", "Example D"]);
});

test("animates_opening_and_closing_the_price_filter", async ({ context, page }) => {
  await installMarketFixture(context, (url) => respond(url));
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Диапазон цен" });
  const form = page.locator("#market-price-filter");
  const panel = page.locator(".market-filter");
  const min = form.getByRole("textbox", { name: "Минимальная цена" });
  const apply = form.getByRole("button", { name: "Показать" });

  await toggle.click();
  await expect(panel).toHaveCSS("transition-duration", "0.3s");
  await expect(apply).toHaveCSS("transition-duration", "0.14s");
  await min.fill("5");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toHaveAttribute("inert", "");
  await expect(panel).toHaveCSS("transition-duration", "0.24s");
  await expect(form).toBeHidden();

  await toggle.press("Enter");
  await expect(min).toHaveValue("");
  await expect(panel).toHaveCSS("transition-duration", "0.3s");
  await apply.click();
  await expect(form).toBeHidden();
  await expect(toggle).toBeFocused();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await toggle.click();
  await expect(panel).toHaveCSS("transition-duration", "0s");
  await expect(apply).toHaveCSS("transition-property", "background-color");
  await toggle.click();
  await expect(panel).toHaveCSS("transition-delay", "0.08s");
  await expect(form).toBeHidden();
});

test("explains_metrics", async ({ browser, context, page }) => {
  await installMarketFixture(context, (url) => respond(url));
  await page.goto("/");
  const metrics = page.getByRole("region", { name: "Рыночные метрики" });
  await expect(metrics.getByRole("heading")).toHaveCount(4);
  await expect(metrics.getByText("+1,86% за 24 ч")).toBeVisible();
  await expect(metrics.getByText("53,2%")).toBeVisible();
  await expect(metrics.getByText("17,1%")).toBeVisible();

  const help = metrics.getByRole("button", { name: "Подробнее: Капитализация рынка" });
  const panel = page.locator("#market-metric-0");
  const explanation = metrics.getByText("Суммарная стоимость криптовалют по рыночным ценам.");
  await help.hover();
  await expect(explanation).toBeVisible();
  await expect(panel).toHaveCSS("transition-duration", "0.22s, 0.22s, 0s");
  await metrics.getByRole("button", { name: "Подробнее: Объём торгов за 24 ч" }).hover();
  const nextPanel = metrics.getByRole("region", { name: "Объём торгов за 24 ч" });
  await expect(nextPanel).toHaveCSS("transition-duration", "0.22s, 0.22s, 0s");
  await expect(panel).toBeHidden();
  await page.getByRole("heading", { level: 1 }).hover();
  await expect(page.locator("#market-metric-1")).toHaveCSS(
    "transition-duration",
    "0.18s, 0.18s, 0s"
  );
  await expect(nextPanel).toBeHidden();
  await help.focus();
  await page.keyboard.press("Enter");
  await expect(explanation).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveAttribute("inert", "");
  await expect(explanation).toBeHidden();
  await expect(help).toBeFocused();

  const mobile = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce"
  });
  try {
    await installMarketFixture(mobile, (url) => respond(url));
    const touchPage = await mobile.newPage();
    await touchPage.goto("http://127.0.0.1:4174/");
    const touchHelp = touchPage.getByRole("button", { name: "Подробнее: Капитализация рынка" });
    const touchExplanation = touchPage.getByText(
      "Суммарная стоимость криптовалют по рыночным ценам."
    );
    await touchHelp.tap();
    await expect(touchExplanation).toBeVisible();
    await expect(touchPage.locator("#market-metric-0")).toHaveCSS(
      "transition-duration",
      "0.08s, 0.08s, 0s"
    );
    await touchHelp.tap();
    await expect(touchExplanation).toBeHidden();
    await touchHelp.tap();
    await touchPage.getByRole("heading", { level: 1 }).tap();
    await expect(touchExplanation).toBeHidden();
  } finally {
    await mobile.close();
  }
});

test("ignores_late_search", async ({ context, page }) => {
  const older = defer();
  const cleared = defer();
  const all = [
    ...catalog,
    coin(121, "Older result", 3),
    coin(122, "Latest result", 2),
    coin(123, "Cleared result", 1)
  ];
  const fixture = await installMarketFixture(context, async (url) => {
    if (url.searchParams.get("ids") === "coin-121") await older.promise;
    if (url.searchParams.get("ids") === "coin-123") await cleared.promise;
    return respond(url, catalog.slice(0, 100), all);
  });
  await page.goto("/");
  await expect(coinLinks(page)).toHaveCount(20);
  await scrollToBottom(page);
  await expect(coinLinks(page)).toHaveCount(40);
  await search(page).fill("older");
  await expect
    .poll(() => fixture.requests.some(({ url }) => url.endsWith("ids=coin-121")))
    .toBe(true);
  await expect(page.getByRole("status", { name: "Загрузка котировок" })).toBeVisible();
  await expect(coinLinks(page)).toHaveCount(0);
  await search(page).fill("latest");
  await expect(coinLinks(page)).toHaveText(["Latest result"]);
  older.resolve();
  await expect(coinLinks(page)).toHaveText(["Latest result"]);
  await search(page).fill("cleared");
  await expect
    .poll(() => fixture.requests.some(({ url }) => url.endsWith("ids=coin-123")))
    .toBe(true);
  await search(page).fill("");
  cleared.resolve();
  await expect(coinLinks(page)).toHaveCount(40);
  await expect(coinLinks(page).first()).toHaveText("Market 1");
});

test("keeps catalog matches without quotes and independent market blocks available", async ({
  context,
  page
}) => {
  const extra = coin(121, "Catalog Only", 7);
  let failTop = true;

  await installMarketFixture(context, (url) => {
    if (url.pathname.endsWith("/coins/list")) return { status: 200, json: [extra] };
    if (url.searchParams.has("ids")) return { status: 200, json: [] };
    if (failTop && url.pathname.endsWith("/coins/markets")) return { status: 503 };
    return respond(url);
  });

  await page.goto("/");
  await expect(page.getByText("Данные временно недоступны")).toBeVisible();
  await expect(page.getByText("53,2%")).toBeVisible();
  await search(page).fill("catalog only");
  const match = page.getByRole("link", { name: "Catalog Only" });
  await expect(match).toBeVisible();
  await expect(match).toHaveAttribute("href", "/coin/coin-121");
  await expect(page.getByRole("row").filter({ has: match }).getByRole("cell").first()).toBeEmpty();

  await search(page).fill("");
  failTop = false;
  await page.getByRole("button", { name: "Повторить запрос" }).click();
  await expect(coinLinks(page)).toHaveCount(20);
  await expect(page.getByText("Данные временно недоступны")).toBeHidden();
  await coinLinks(page).first().click();
  await expect(page).toHaveURL("/coin/coin-1");
});

test("switches the last mobile column and sorts by capitalization", async ({ context, page }) => {
  await page.setViewportSize({ width: 360, height: 844 });
  const rows = [coin(1, "Bitcoin", 50, 2, 1.33e12), coin(2, "Ethereum", 20, -2, 428.3e9)];
  await installMarketFixture(context, (url) => respond(url, rows));
  await page.goto("/");
  await expect(coinLinks(page)).toHaveText(["Bitcoin", "Ethereum"]);
  await expect(page.getByText("+2%")).toBeVisible();
  const toggle = page.getByRole("button", { name: "Показать капитализацию" });
  await toggle.click();
  await expect(page.getByText("+2%")).toBeHidden();
  await expect(page.getByText("$1,33 трлн")).toBeVisible();
  await page.getByRole("button", { name: "Сортировать по капитализации" }).click();
  await expect(coinLinks(page)).toHaveText(["Ethereum", "Bitcoin"]);
  await toggle.click();
  await expect(page.getByText("+2%")).toBeVisible();
  const horizontallyFits = await page.evaluate(
    () => document.documentElement.scrollWidth === window.innerWidth
  );
  expect(horizontallyFits).toBe(true);
});
