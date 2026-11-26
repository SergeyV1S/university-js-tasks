import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

import axios, { AxiosError } from "axios";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";

// The native Node test runner needs the alias Vite resolves for endpoint modules.
const instanceUrl = new URL("../src/shared/api/instance.ts", import.meta.url).href;
const aliases = registerHooks({
  resolve: (specifier, context, nextResolve) =>
    nextResolve(specifier === "@/shared/api/instance" ? instanceUrl : specifier, context)
});
const {
  getCoinsIdMarketChart,
  getCoinsList,
  getCoinsMarkets,
  getExchangeRates,
  getGlobal,
  getSimplePrice
} = await import("../src/shared/api/requests/index.ts");
aliases.deregister();

const baseURL = "https://example.test/api/v3/";
const row = { id: "bitcoin", name: "Bitcoin", market_cap_rank: 1 };

const mockAdapter =
  (respond: (url: URL, config: InternalAxiosRequestConfig) => Response): AxiosAdapter =>
  async (config) => {
    const response = respond(new URL(axios.getUri(config)), config);
    const reply = {
      data: await response.text(),
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      config
    };
    if (!response.ok) throw new AxiosError("HTTP error", undefined, config, undefined, reply);
    return reply;
  };

test("normalizes_market_payloads_and_errors", async (context) => {
  const now = Date.parse("2026-11-22T12:00:00Z");
  context.mock.method(Date, "now", () => now);

  const requests: Array<{ url: URL; config: InternalAxiosRequestConfig }> = [];
  const lastRequestUrl = () => {
    const url = requests.at(-1)?.url;
    assert.ok(url);
    return url;
  };
  const respond = context.mock.fn((_url: URL): Response => Response.json(null));
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: { getItem: (key: string) => (key === "invest:market-demo-key" ? "test-key" : null) }
  });
  context.after(() => {
    if (previousStorage) Object.defineProperty(globalThis, "sessionStorage", previousStorage);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  });

  const config = {
    baseURL,
    adapter: mockAdapter((url, config) => {
      requests.push({ url, config });
      return respond(url);
    })
  };

  respond.mock.mockImplementation(() => Response.json([{ ...row, platforms: {} }, row]));
  assert.deepEqual(await getCoinsList({ config }), [{ id: "bitcoin", name: "Bitcoin" }]);
  assert.equal(requests.at(-1)?.url.searchParams.get("include_platform"), "false");

  respond.mock.mockImplementation(() =>
    Response.json([
      { ...row, current_price: 0, price_change_percentage_24h: -2, market_cap: 0 },
      { id: "outside-top", name: "Outside top", market_cap: null }
    ])
  );
  assert.equal((await getCoinsMarkets({ config }))[0].rank, 1);
  assert.deepEqual(Object.fromEntries(lastRequestUrl().searchParams), {
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: "20",
    page: "1"
  });
  const pageRequest = new AbortController();
  await getCoinsMarkets({ params: { page: 2 }, config: { ...config, signal: pageRequest.signal } });
  assert.deepEqual(Object.fromEntries(lastRequestUrl().searchParams), {
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: "20",
    page: "2"
  });
  assert.equal(requests.at(-1)?.config.signal, pageRequest.signal);
  const markets = await getCoinsMarkets({
    params: { ids: ["bitcoin", "outside-top", "bitcoin"] },
    config
  });
  assert.deepEqual(markets, [
    { id: "bitcoin", name: "Bitcoin", rank: 1, price: 0, marketCap: 0, change24h: -2 },
    {
      id: "outside-top",
      name: "Outside top",
      rank: null,
      price: null,
      marketCap: null,
      change24h: null
    }
  ]);
  assert.equal(requests.at(-1)?.url.searchParams.get("ids"), "bitcoin,outside-top");

  respond.mock.mockImplementation(() =>
    Response.json({
      data: { total_market_cap: { usd: 100 }, market_cap_change_percentage_24h_usd: -1 }
    })
  );
  assert.deepEqual(await getGlobal({ config }), {
    marketCap: 100,
    marketCapChange24h: -1,
    volume24h: null,
    bitcoinShare: null,
    ethereumShare: null
  });

  respond.mock.mockImplementation(() => Response.json({ prices: [[now, 0]] }));
  assert.deepEqual(await getCoinsIdMarketChart({ params: { id: "bitcoin", days: 365 }, config }), [
    [now, 0]
  ]);
  const history = lastRequestUrl();
  assert.equal(history.pathname, "/api/v3/coins/bitcoin/market_chart");
  assert.equal(history.searchParams.get("days"), "365");
  respond.mock.mockImplementation(() => Response.json({ prices: [] }));
  assert.deepEqual(await getCoinsIdMarketChart({ params: { id: "bitcoin", days: 7 }, config }), []);

  respond.mock.mockImplementation(() => Response.json({ bitcoin: { usd: 0, eur: null, jpy: 20 } }));
  assert.deepEqual(
    await getSimplePrice({
      params: {
        ids: ["bitcoin", "bitcoin", "missing"],
        currencies: ["USD", "EUR", "USD", "BTC", "RUB"]
      },
      config
    }),
    {
      bitcoin: { USD: 0 }
    }
  );
  assert.deepEqual(Object.fromEntries(lastRequestUrl().searchParams), {
    ids: "bitcoin,missing",
    vs_currencies: "usd,eur,btc,rub"
  });

  respond.mock.mockImplementation(() =>
    Response.json({
      rates: {
        usd: { value: 100 },
        rub: { value: 9_000 },
        btc: { value: 1 },
        jpy: { value: 20 }
      }
    })
  );
  const rates = await getExchangeRates({ config });
  assert.deepEqual(rates, { USD: 100, BTC: 1, RUB: 9_000 });

  for (const retryAfter of ["45", new Date(now + 45_000).toUTCString()]) {
    respond.mock.mockImplementation(
      () => new Response(null, { status: 429, headers: { "Retry-After": retryAfter } })
    );
    await assert.rejects(getGlobal({ config }), {
      kind: "rate-limit",
      status: 429,
      retryAt: now + 45_000
    });
  }
  respond.mock.mockImplementation(
    () => new Response(null, { status: 429, headers: { "Retry-After": "1.5" } })
  );
  await assert.rejects(
    getGlobal({ config }),
    (error: { kind: string; retryAt?: number }) =>
      error.kind === "rate-limit" && error.retryAt === undefined
  );
  respond.mock.mockImplementation(() => new Response(null, { status: 404 }));
  await assert.rejects(getCoinsIdMarketChart({ params: { id: "missing", days: 7 }, config }), {
    kind: "not-found",
    status: 404
  });
  respond.mock.mockImplementation(() => new Response(null, { status: 503 }));
  await assert.rejects(getGlobal({ config }), { kind: "http", status: 503 });
  respond.mock.mockImplementation(() => new Response("{"));
  await assert.rejects(getGlobal({ config }), { kind: "invalid-response" });
  respond.mock.mockImplementation(() => Response.json({ prices: [[now, "broken"]] }));
  await assert.rejects(getCoinsIdMarketChart({ params: { id: "bitcoin", days: 7 }, config }), {
    kind: "invalid-response"
  });
  respond.mock.mockImplementation(() => {
    throw new TypeError("Network unavailable");
  });
  await assert.rejects(getGlobal({ config }), { kind: "network" });

  const controller = new AbortController();
  const abortError = new DOMException("Aborted", "AbortError");
  respond.mock.mockImplementation(() => {
    throw abortError;
  });
  await assert.rejects(
    getGlobal({ config: { ...config, signal: controller.signal } }),
    (error) => error === abortError
  );
  assert.equal(requests.at(-1)?.config.signal, controller.signal);

  for (const { url, config } of requests) {
    assert.equal(url.origin, new URL(baseURL).origin);
    assert.ok(url.pathname.startsWith("/api/v3/"));
    assert.ok(!url.href.includes("test-key"));
    assert.equal(config.headers.get("x-cg-demo-api-key"), "test-key");
    assert.equal(config.method, "get");
    assert.equal(config.data, undefined);
  }
});

test("batches unique IDs without truncating long searches or requesting empty lists", async () => {
  const makeIds = (count: number, prefix = "coin") =>
    Array.from({ length: count }, (_, index) => `${prefix}-${index}`);
  const requests: URL[] = [];
  const requestedIds = (url: URL) => {
    const ids = url.searchParams.get("ids");
    assert.ok(ids);
    return ids.split(",");
  };
  const config = {
    baseURL,
    adapter: mockAdapter((url) => {
      requests.push(url);
      const ids = requestedIds(url);
      return url.pathname.endsWith("/markets")
        ? Response.json(ids.map((id) => ({ id, name: id })))
        : Response.json(Object.fromEntries(ids.map((id) => [id, { usd: 0 }])));
    })
  };

  const ids = [...makeIds(300), ...makeIds(60, "long-id".repeat(14))];
  assert.deepEqual(
    (await getCoinsMarkets({ params: { ids: [...ids, ids[0]] }, config })).map(({ id }) => id),
    ids
  );
  for (const url of requests) {
    const batch = requestedIds(url);
    const pageSize = Number(url.searchParams.get("per_page"));
    assert.ok(batch.length <= 250);
    assert.equal(pageSize, batch.length);
    assert.ok(url.href.length <= 2_000);
  }

  requests.length = 0;
  assert.deepEqual(
    Object.keys(await getSimplePrice({ params: { ids, currencies: ["USD"] }, config })),
    ids
  );
  assert.ok(requests.every((url) => url.href.length <= 2_000));
  requests.length = 0;
  assert.deepEqual(await getCoinsMarkets({ params: { ids: [] }, config }), []);
  assert.deepEqual(await getSimplePrice({ params: { ids: [], currencies: ["USD"] }, config }), {});
  assert.deepEqual(
    await getSimplePrice({ params: { ids: ["bitcoin"], currencies: [] }, config }),
    {}
  );
  assert.equal(requests.length, 0);
});

test("stops a multi-request lookup when the signal is aborted", async () => {
  const controller = new AbortController();
  let requests = 0;
  const config = {
    baseURL,
    adapter: mockAdapter(() => {
      requests += 1;
      controller.abort();
      return Response.json([]);
    })
  };

  const ids = Array.from({ length: 300 }, (_, index) => `coin-${index}`);
  await assert.rejects(
    getCoinsMarkets({ params: { ids }, config: { ...config, signal: controller.signal } }),
    (error) =>
      error instanceof Error && error === controller.signal.reason && error.name === "AbortError"
  );
  assert.equal(requests, 1);
});
