import assert from "node:assert/strict";
import { test } from "node:test";

import axios, { AxiosError } from "axios";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";

import { createApiClient } from "../src/shared/api/client.ts";

const baseUrl = "https://example.test/api/v3/";
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
  const respond = context.mock.fn((_url: URL): Response => Response.json(null));
  const client = createApiClient({
    baseUrl,
    apiKey: "test-key",
    adapter: mockAdapter((url, config) => {
      requests.push({ url, config });
      return respond(url);
    })
  });

  respond.mock.mockImplementation(() => Response.json([{ ...row, platforms: {} }]));
  assert.deepEqual(await client.getCatalog(), [{ id: "bitcoin", name: "Bitcoin" }]);
  assert.equal(requests.at(-1)?.url.searchParams.get("include_platform"), "false");

  respond.mock.mockImplementation(() =>
    Response.json([
      { ...row, current_price: 0, price_change_percentage_24h: -2, market_cap: 0 },
      { id: "outside-top", name: "Outside top", market_cap: null }
    ])
  );
  assert.equal((await client.getTop100())[0].rank, 1);
  assert.deepEqual(Object.fromEntries(requests.at(-1)!.url.searchParams), {
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: "100",
    page: "1"
  });
  const markets = await client.getMarkets(["bitcoin", "outside-top", "bitcoin"]);
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
  assert.deepEqual(await client.getGlobal(), {
    marketCap: 100,
    marketCapChange24h: -1,
    volume24h: null,
    bitcoinShare: null,
    ethereumShare: null
  });

  respond.mock.mockImplementation(() => Response.json({ prices: [[now, 0]] }));
  assert.deepEqual(await client.getHistory("bitcoin", 365), [[now, 0]]);
  const history = requests.at(-1)!.url;
  assert.equal(history.pathname, "/api/v3/coins/bitcoin/market_chart");
  assert.equal(history.searchParams.get("days"), "365");
  respond.mock.mockImplementation(() => Response.json({ prices: [] }));
  assert.deepEqual(await client.getHistory("bitcoin", 7), []);

  respond.mock.mockImplementation(() => Response.json({ bitcoin: { usd: 0, eur: null, jpy: 20 } }));
  assert.deepEqual(
    await client.getPrices(["bitcoin", "bitcoin", "missing"], ["USD", "EUR", "USD", "BTC", "RUB"]),
    {
      bitcoin: { USD: 0 }
    }
  );
  assert.deepEqual(Object.fromEntries(requests.at(-1)!.url.searchParams), {
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
  const rates = await client.getExchangeRates();
  assert.deepEqual(rates, { USD: 100, BTC: 1, RUB: 9_000 });
  assert.equal(rates.RUB! / rates.USD!, 90);

  for (const retryAfter of ["45", new Date(now + 45_000).toUTCString()]) {
    respond.mock.mockImplementation(
      () => new Response(null, { status: 429, headers: { "Retry-After": retryAfter } })
    );
    await assert.rejects(client.getGlobal(), {
      kind: "rate-limit",
      status: 429,
      retryAt: now + 45_000
    });
  }
  respond.mock.mockImplementation(
    () => new Response(null, { status: 429, headers: { "Retry-After": "1.5" } })
  );
  await assert.rejects(
    client.getGlobal(),
    (error: { kind: string; retryAt?: number }) =>
      error.kind === "rate-limit" && error.retryAt === undefined
  );
  respond.mock.mockImplementation(() => new Response(null, { status: 404 }));
  await assert.rejects(client.getHistory("missing", 7), { kind: "not-found", status: 404 });
  respond.mock.mockImplementation(() => new Response(null, { status: 503 }));
  await assert.rejects(client.getGlobal(), { kind: "http", status: 503 });
  respond.mock.mockImplementation(() => new Response("{"));
  await assert.rejects(client.getGlobal(), { kind: "invalid-response" });
  respond.mock.mockImplementation(() => Response.json({ prices: [[now, "broken"]] }));
  await assert.rejects(client.getHistory("bitcoin", 7), { kind: "invalid-response" });
  respond.mock.mockImplementation(() => {
    throw new TypeError("Network unavailable");
  });
  await assert.rejects(client.getGlobal(), { kind: "network" });

  const controller = new AbortController();
  const abortError = new DOMException("Aborted", "AbortError");
  respond.mock.mockImplementation(() => {
    throw abortError;
  });
  await assert.rejects(
    client.getGlobal({ signal: controller.signal }),
    (error) => error === abortError
  );
  assert.equal(requests.at(-1)?.config.signal, controller.signal);

  for (const { url, config } of requests) {
    assert.equal(url.origin, new URL(baseUrl).origin);
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
  const client = createApiClient({
    baseUrl,
    adapter: mockAdapter((url) => {
      requests.push(url);
      const ids = url.searchParams.get("ids")!.split(",");
      return url.pathname.endsWith("/markets")
        ? Response.json(ids.map((id) => ({ id, name: id })))
        : Response.json(Object.fromEntries(ids.map((id) => [id, { usd: 0 }])));
    })
  });

  const ids = [...makeIds(300), ...makeIds(60, "long-id".repeat(14))];
  assert.deepEqual(
    (await client.getMarkets([...ids, ids[0]])).map(({ id }) => id),
    ids
  );
  for (const url of requests) {
    const requestedIds = url.searchParams.get("ids")!.split(",");
    const pageSize = Number(url.searchParams.get("per_page"));
    assert.ok(requestedIds.length <= 250);
    assert.equal(pageSize, requestedIds.length);
    assert.ok(url.href.length <= 2_000);
  }

  requests.length = 0;
  assert.deepEqual(Object.keys(await client.getPrices(ids, ["USD"])), ids);
  assert.ok(requests.every((url) => url.href.length <= 2_000));
  requests.length = 0;
  assert.deepEqual(await client.getMarkets([]), []);
  assert.deepEqual(await client.getPrices([], ["USD"]), {});
  assert.deepEqual(await client.getPrices(["bitcoin"], []), {});
  assert.equal(requests.length, 0);
});

test("stops a multi-request lookup when the signal is aborted", async () => {
  const controller = new AbortController();
  let requests = 0;
  const client = createApiClient({
    baseUrl,
    adapter: mockAdapter(() => {
      requests += 1;
      controller.abort();
      return Response.json([]);
    })
  });

  const ids = Array.from({ length: 300 }, (_, index) => `coin-${index}`);
  await assert.rejects(
    client.getMarkets(ids, { signal: controller.signal }),
    (error) => error === controller.signal.reason && (error as Error).name === "AbortError"
  );
  assert.equal(requests, 1);
});
