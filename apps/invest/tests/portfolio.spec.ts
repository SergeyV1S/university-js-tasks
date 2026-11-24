import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { installMarketFixture } from "./market-fixture";
import type { FixtureResponse } from "./market-fixture";

const key = "invest:portfolio";
const rates = { status: 200, json: { rates: { usd: { value: 100 }, rub: { value: 9000 } } } };
const first = { coinId: "coin-1", quantity: 0.5, unitPrice: 25.75, currency: "RUB", rubPerUsd: 90 };
const market = (url: URL) => {
  if (url.pathname.endsWith("/simple/price")) return { status: 200, json: {} };

  const page = Number(url.searchParams.get("page"));
  return {
    status: 200,
    json: Array.from({ length: 20 }, (_, index) => {
      const rank = (page - 1) * 20 + index + 1;
      return {
        id: `coin-${rank}`,
        name: `Монета ${rank}`,
        symbol: `C${rank}`,
        market_cap_rank: rank
      };
    })
  };
};

const read = (page: Page) =>
  page.evaluate((name) => JSON.parse(localStorage.getItem(name) ?? "null"), key);
const save = (page: Page) => page.getByRole("button", { name: "Сохранить покупку" });
const quantity = (page: Page) => page.getByLabel("Количество", { exact: true });
const price = (page: Page) => page.getByLabel("Цена за одну монету", { exact: true });
const search = (page: Page) => page.getByRole("combobox", { name: "Монета" });
const purchases = (page: Page) =>
  page.getByRole("region", { name: "Покупки" }).getByRole("listitem");
const option = (page: Page, rank: number) =>
  page.getByRole("option", { name: new RegExp(`^Монета ${rank}( |$)`) });

const fill = async (page: Page, rank = 1) => {
  await search(page).fill(`монета ${rank}`);
  await option(page, rank).click();
  await quantity(page).fill("0,5");
  await price(page).fill("25.75");
};

const holdResponse = () => {
  let release = () => {};
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { wait, release };
};

test("animates_the_coin_list_and_preserves_matches_during_close", async ({ context, page }) => {
  await installMarketFixture(context, market);
  await page.goto("/portfolio");
  const coin = search(page);
  const panel = page.locator(".invest-disclosure");
  const listbox = panel.getByRole("listbox");

  await coin.click();
  await expect(panel).toHaveCSS("transition-duration", "0.24s");
  await coin.fill("Монета 100");
  await expect(listbox.getByRole("option")).toHaveCount(1);
  await panel.evaluate(async (element: HTMLDivElement) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    element.addEventListener("transitionrun", (event) => {
      if (
        event.target === element &&
        event.propertyName === "grid-template-rows" &&
        element.dataset.open === "false"
      )
        element.dataset.closingOptions = String(element.querySelectorAll("[role=option]").length);
    });
  });

  await coin.press("ArrowDown");
  await expect(option(page, 100)).toHaveAttribute("aria-selected", "true");
  await coin.press("Enter");
  await expect(coin).toHaveAttribute("aria-expanded", "false");
  await expect(coin).toHaveAccessibleDescription("Монета 100 (C100)");
  await expect(panel).toHaveAttribute("inert", "");
  await expect(panel).toHaveCSS("transition-duration", "0.18s");
  await expect(panel).toHaveAttribute("data-closing-options", "1");
  await expect(panel.locator("[role=option]")).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await coin.press("ArrowUp");
  await expect(option(page, 100)).toHaveAttribute("aria-selected", "true");
  await expect(panel).toHaveCSS("transition-duration", "0s");
  await expect(panel.locator(":scope > div")).toHaveCSS("transition-duration", "0.08s, 0s");
  await coin.press("Escape");
  await expect(coin).toBeFocused();
  await expect(listbox).toBeHidden();
  await expect(panel.locator("[role=option]")).toHaveCount(0);
});

test("adds_persists_and_retries_purchase", async ({ browser, context, page }) => {
  const gate = holdResponse();
  let rateCalls = 0;
  let rateResponse: FixtureResponse = rates;
  const { requests } = await installMarketFixture(context, async (url) => {
    if (!url.pathname.endsWith("/exchange_rates")) return market(url);
    if (++rateCalls === 1) await gate.wait;
    return rateResponse;
  });

  await page.goto("/portfolio");
  await expect(page.getByText("Портфель пока пуст")).toBeVisible();
  await expect(page.getByRole("button", { name: "RUB", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await save(page).click();
  await expect(page.getByText("Выберите монету.")).toBeVisible();
  for (const invalid of ["", "текст", "0", "-1"]) {
    await quantity(page).fill(invalid);
    await price(page).fill(invalid);
    await save(page).click();
    await expect(quantity(page)).toHaveAccessibleDescription("Введите количество больше нуля.");
    await expect(price(page)).toHaveAccessibleDescription("Введите цену больше нуля.");
    await expect(quantity(page)).toHaveValue(invalid);
    await expect(price(page)).toHaveValue(invalid);
  }
  expect(rateCalls).toBe(0);

  await search(page).fill("Монета 101");
  await expect(page.getByText("Монеты не найдены")).toBeVisible();
  await search(page).fill("мОНЕТА 100");
  await expect(option(page, 100)).toBeVisible();
  await search(page).press("ArrowDown");
  await search(page).press("Enter");
  await expect(search(page)).toHaveAccessibleDescription("Монета 100 (C100)");

  await fill(page);
  await save(page).click();
  try {
    await expect(page.getByRole("button", { name: "Сохранение…" })).toBeDisabled();
    await page.locator("form").evaluate((form: HTMLFormElement) => form.requestSubmit());
    expect(await read(page)).toBeNull();
  } finally {
    gate.release();
  }
  await expect(purchases(page)).toHaveCount(1);
  expect(await read(page)).toEqual({ revision: 1, purchases: [first] });
  expect(rateCalls).toBe(1);
  await expect(quantity(page)).toHaveValue("");
  await expect(price(page)).toHaveValue("");
  await expect(search(page)).toHaveValue("");

  await fill(page);
  await save(page).click();
  await expect(purchases(page)).toHaveCount(2);
  expect(await read(page)).toEqual({ revision: 2, purchases: [first, first] });

  await page.getByRole("button", { name: "USD", exact: true }).click();
  await fill(page);
  for (const rejectedRates of [
    { status: 503 },
    { status: 200, json: { rates: { usd: { value: 1 } } } }
  ]) {
    rateResponse = rejectedRates;
    await save(page).click();
    await expect(page.getByText("Курс USD/RUB недоступен")).toBeVisible();
    await expect(purchases(page)).toHaveCount(2);
    await expect(price(page)).toHaveValue("25.75");
  }
  rateResponse = rates;
  await save(page).click();
  await expect(purchases(page)).toHaveCount(3);

  const confirmed = { revision: 3, purchases: [first, first, { ...first, currency: "USD" }] };
  await page.reload();
  await expect(purchases(page)).toHaveCount(3);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/portfolio");
  await expect(purchases(reopened)).toHaveCount(3);
  expect(await read(reopened)).toEqual(confirmed);

  const separate = await browser.newContext();
  try {
    await installMarketFixture(separate, market);
    const empty = await separate.newPage();
    await empty.goto(new URL("/portfolio", reopened.url()).href);
    await expect(empty.getByText("Портфель пока пуст")).toBeVisible();
  } finally {
    await separate.close();
  }
  const marketPages = requests.filter(({ url }) => url.includes("/coins/markets")).slice(0, 5);
  expect(
    marketPages.map(({ url }) => Number(new URL(url).searchParams.get("page"))).sort()
  ).toEqual([1, 2, 3, 4, 5]);
  for (const request of requests) {
    expect(request.method).toBe("GET");
    expect(request.body).toBeNull();
    const url = new URL(request.url);
    if (url.pathname.endsWith("/exchange_rates")) expect(url.search).toBe("");
    else if (url.pathname.endsWith("/simple/price")) {
      expect([...url.searchParams.keys()].sort()).toEqual(["ids", "vs_currencies"]);
      expect(url.searchParams.get("ids")).toBe("coin-1");
    } else
      expect([...url.searchParams.keys()].sort()).toEqual([
        "order",
        "page",
        "per_page",
        "vs_currency"
      ]);
  }
});

test("recovers_from_storage_error", async ({ context, page }) => {
  await context.addInitScript(
    ({ key, first }) => {
      const get = Storage.prototype.getItem;
      const set = Storage.prototype.setItem;
      if (!get.call(localStorage, key))
        set.call(localStorage, key, JSON.stringify({ revision: 1, purchases: [first] }));
      Storage.prototype.getItem = function (name) {
        if (name === key && get.call(sessionStorage, "fail-read")) throw new Error("Read failed");
        return get.call(this, name);
      };
      Storage.prototype.setItem = function (name, value) {
        if (name === key && get.call(sessionStorage, "fail-write")) throw new Error("Write failed");
        set.call(this, name, value);
      };
      sessionStorage.setItem("fail-read", "1");
    },
    { key, first }
  );
  await installMarketFixture(context, (url) =>
    url.pathname.endsWith("/exchange_rates") ? rates : market(url)
  );
  await page.goto("/portfolio");
  await expect(page.getByText("Не удалось открыть портфель")).toBeVisible();
  await expect(save(page)).toBeDisabled();
  await page.evaluate(() => sessionStorage.removeItem("fail-read"));
  await page.getByRole("button", { name: "Повторить", exact: true }).click();
  await expect(purchases(page)).toHaveCount(1);

  await fill(page);
  await page.evaluate(() => sessionStorage.setItem("fail-write", "1"));
  await save(page).click();
  await expect(page.getByText("Не удалось сохранить покупку")).toBeVisible();
  await expect(quantity(page)).toHaveValue("0,5");
  expect(await read(page)).toEqual({ revision: 1, purchases: [first] });
  await page.evaluate(() => sessionStorage.removeItem("fail-write"));
  await save(page).click();
  await expect(purchases(page)).toHaveCount(2);
  expect(await read(page)).toEqual({ revision: 2, purchases: [first, first] });
});

test("syncs_purchases_in_both_directions", async ({ context, page }) => {
  await installMarketFixture(context, (url) =>
    url.pathname.endsWith("/exchange_rates") ? rates : market(url)
  );
  const secondTab = await context.newPage();
  await Promise.all([page.goto("/portfolio"), secondTab.goto("/portfolio")]);
  await expect(secondTab.getByText("Портфель пока пуст")).toBeVisible();
  await fill(page);
  await save(page).click();
  await expect(page.getByText("Покупка сохранена")).toBeVisible();
  await expect(purchases(secondTab)).toHaveCount(1, { timeout: 1000 });
  await fill(secondTab, 2);
  await save(secondTab).click();
  await expect(secondTab.getByText("Покупка сохранена")).toBeVisible();
  await expect(purchases(page)).toHaveCount(2, { timeout: 1000 });
  expect(await read(page)).toEqual({
    revision: 2,
    purchases: [first, { ...first, coinId: "coin-2" }]
  });
});

test("preserves_first_purchase_on_conflict", async ({ context, page }) => {
  const firstRate = holdResponse();
  const secondRate = holdResponse();
  let rateCalls = 0;
  await installMarketFixture(context, async (url) => {
    if (!url.pathname.endsWith("/exchange_rates")) return market(url);
    const call = ++rateCalls;
    if (call === 1) await firstRate.wait;
    if (call === 2) await secondRate.wait;
    return rates;
  });
  const secondTab = await context.newPage();
  await secondTab.addInitScript(() => {
    window.BroadcastChannel = class extends BroadcastChannel {
      constructor(name: string) {
        super(name);
        let held: MessageEvent | undefined;
        this.addEventListener(
          "message",
          (event) => {
            event.stopImmediatePropagation();
            held = event;
          },
          { once: true }
        );
        window.addEventListener(
          "release-portfolio-message",
          () => {
            if (held) this.dispatchEvent(new MessageEvent("message", { data: held.data }));
          },
          { once: true }
        );
      }
    };
  });
  await Promise.all([page.goto("/portfolio"), secondTab.goto("/portfolio")]);
  await fill(page);
  await fill(secondTab, 2);
  try {
    await save(page).click();
    await expect.poll(() => rateCalls).toBe(1);
    await save(secondTab).click();
    await expect.poll(() => rateCalls).toBe(2);
    firstRate.release();
    await expect(purchases(page)).toHaveCount(1);
  } finally {
    firstRate.release();
    secondRate.release();
  }
  await expect(secondTab.getByRole("form").getByRole("status")).toContainText(
    "Повторите сохранение"
  );
  await secondTab.evaluate(() => window.dispatchEvent(new Event("release-portfolio-message")));
  await expect(purchases(secondTab)).toHaveCount(1);
  await expect(quantity(secondTab)).toHaveValue("0,5");
  expect(await read(secondTab)).toEqual({ revision: 1, purchases: [first] });
  await save(secondTab).click();
  await expect(purchases(secondTab)).toHaveCount(2);
  expect(await read(secondTab)).toEqual({
    revision: 2,
    purchases: [first, { ...first, coinId: "coin-2" }]
  });
});

test("reads_saved_purchases_without_web_locks", async ({ context, page }) => {
  await context.addInitScript(
    ({ key, first }) => {
      Object.defineProperty(navigator, "locks", { value: undefined });
      localStorage.setItem(key, JSON.stringify({ revision: 1, purchases: [first] }));
    },
    { key, first }
  );
  await installMarketFixture(context, market);
  await page.goto("/portfolio");
  await expect(purchases(page)).toHaveCount(1);
  await expect(page.getByText(/браузер не поддерживает Web Locks/)).toBeVisible();
  await expect(save(page)).toBeDisabled();
});

test("recovers_sync_when_notification_fails", async ({ context, page }) => {
  await page.addInitScript(() => {
    BroadcastChannel.prototype.postMessage = () => {
      throw new Error("Channel failed");
    };
  });
  await installMarketFixture(context, (url) =>
    url.pathname.endsWith("/exchange_rates") ? rates : market(url)
  );
  const secondTab = await context.newPage();
  await Promise.all([page.goto("/portfolio"), secondTab.goto("/portfolio")]);
  await expect(secondTab.getByText("Портфель пока пуст")).toBeVisible();
  await fill(page);
  await save(page).click();
  await expect(page.getByText("Покупка сохранена")).toBeVisible();
  await expect(quantity(page)).toHaveValue("");
  expect(await read(page)).toEqual({ revision: 1, purchases: [first] });
  await expect(purchases(secondTab)).toHaveCount(0);
  await secondTab.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(purchases(secondTab)).toHaveCount(1);
});

test("opens_purchase_form_on_mobile_and_returns_to_portfolio", async ({ context, page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installMarketFixture(context, (url) =>
    url.pathname.endsWith("/exchange_rates") ? rates : market(url)
  );
  await page.goto("/portfolio");
  await expect(page.getByText("Портфель пока пуст")).toBeVisible();
  await fill(page);
  await save(page).click();
  await expect(purchases(page)).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Мой портфель", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Добавить покупку", level: 2 })).toBeVisible();
  await page.getByRole("button", { name: "Добавить покупку", exact: true }).click();
  await expect(page).toHaveURL("/portfolio");
  await expect(page.getByRole("button", { name: "Мой портфель", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Добавить покупку", level: 1 })).toBeFocused();
  await expect(page.locator("form")).toHaveCSS("animation-duration", "0.22s");
  await expect(save(page)).toBeVisible();
  await expect(quantity(page)).toHaveValue("");
  await quantity(page).fill("2");
  await page.getByRole("button", { name: "Мой портфель", exact: true }).click();
  await expect(purchases(page)).toHaveCount(1);
  await fill(page);
  await save(page).click();
  await expect(purchases(page)).toHaveCount(2);
  await expect(page.getByText("Покупка сохранена")).toBeInViewport();
  await expect(page.locator(".purchase-saved-enter")).toHaveCSS("animation-duration", "0.2s");
  await quantity(page).fill("2");
  await page.setViewportSize({ width: 360, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Добавить покупку", exact: true }).click();
  await expect(page.locator("form")).toHaveCSS("animation-name", "invest-fade");
  await expect(quantity(page)).toHaveValue("2");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
});

test("can_retry_after_the_saved_portfolio_is_cleared", async ({ context, page }) => {
  await installMarketFixture(context, (url) =>
    url.pathname.endsWith("/exchange_rates") ? rates : market(url)
  );
  await page.goto("/portfolio");
  await fill(page);
  await save(page).click();
  await expect(purchases(page)).toHaveCount(1);
  await page.evaluate((name) => localStorage.removeItem(name), key);
  await fill(page, 2);
  await save(page).click();
  await expect(page.getByText("Портфель изменился в другой вкладке")).toBeVisible();
  await expect(quantity(page)).toHaveValue("0,5");
  await save(page).click();
  await expect(page.getByText("Покупка сохранена")).toBeVisible();
  expect(await read(page)).toEqual({ revision: 1, purchases: [{ ...first, coinId: "coin-2" }] });
});
