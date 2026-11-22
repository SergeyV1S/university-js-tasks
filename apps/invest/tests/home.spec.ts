import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { installMarketFixture } from "./market-fixture";
import type { FixtureResponse } from "./market-fixture";

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
  return { status: 200, json: ids ? all.filter(({ id }) => ids.includes(id)) : top };
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

test("shows_top_100_and_searches_full_catalog", async ({ context, page }) => {
  const initial = defer();
  const fixture = await installMarketFixture(context, async (url) => {
    if (!url.searchParams.has("ids") && url.pathname.endsWith("/coins/markets"))
      await initial.promise;
    return respond(url);
  });

  await page.goto("/");
  await expect(page.getByRole("status", { name: "Загрузка котировок" })).toBeVisible();
  initial.resolve();
  await expect(coinLinks(page)).toHaveCount(100);
  await expect(coinLinks(page).last()).toHaveText("Market 100");
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

test("sorts all matches before taking the first 100", async ({ context, page }) => {
  const all = Array.from({ length: 120 }, (_, i) => coin(i + 1, `Match ${i + 1}`, i + 1));
  await installMarketFixture(context, (url) => respond(url, all.slice(0, 100), all));
  await page.goto("/");
  await search(page).fill("match");
  await expect(coinLinks(page)).toHaveCount(100);
  await page.getByRole("button", { name: "Сортировать по цене" }).click();
  await expect(coinLinks(page)).toHaveText(
    all
      .slice(20)
      .reverse()
      .map(({ name }) => name)
  );
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
  await expect(page.getByText("+2%", { exact: true })).toHaveCSS("color", "rgb(116, 216, 171)");
  await expect(page.getByText("−2%", { exact: true })).toHaveCSS("color", "rgb(255, 149, 153)");
  await expect(page.getByText("0%", { exact: true })).toHaveCSS("color", "rgb(243, 242, 238)");

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

  await page.getByRole("button", { name: "Диапазон цен" }).click();
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
    if (await min.isHidden()) await page.getByRole("button", { name: "Диапазон цен" }).click();
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

test("explains_metrics", async ({ browser, context, page }) => {
  await installMarketFixture(context, (url) => respond(url));
  await page.goto("/");
  const metrics = page.getByRole("region", { name: "Рыночные метрики" });
  await expect(metrics.getByRole("heading")).toHaveCount(4);
  await expect(metrics.getByText("+1,86% за 24 ч")).toBeVisible();
  await expect(metrics.getByText("53,2%")).toBeVisible();
  await expect(metrics.getByText("17,1%")).toBeVisible();

  const help = metrics.getByRole("button", { name: "Подробнее: Капитализация рынка" });
  const explanation = metrics.getByText("Суммарная стоимость криптовалют по рыночным ценам.");
  await help.hover();
  await expect(explanation).toBeVisible();
  await page.getByRole("heading", { level: 1 }).hover();
  await expect(explanation).toBeHidden();
  await help.focus();
  await page.keyboard.press("Enter");
  await expect(explanation).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(explanation).toBeHidden();
  await expect(help).toBeFocused();

  const mobile = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 }
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
  await expect(coinLinks(page)).toHaveCount(100);
  await search(page).fill("older");
  await expect
    .poll(() => fixture.requests.some(({ url }) => url.endsWith("ids=coin-121")))
    .toBe(true);
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
  await expect(coinLinks(page)).toHaveCount(100);
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
  await expect(coinLinks(page)).toHaveCount(100);
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
