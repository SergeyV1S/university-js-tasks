import type { BrowserContext } from "@playwright/test";

export type FixtureResponse =
  { status: number; json?: unknown; headers?: Record<string, string> } | { abort: true };

export type RecordedRequest = {
  url: string;
  method: string;
  body: string | null;
  atMs: number;
  status: number | null;
};

export const installMarketFixture = async (
  context: BrowserContext,
  respond: (url: URL) => FixtureResponse | Promise<FixtureResponse>
): Promise<{ requests: RecordedRequest[] }> => {
  const requests: RecordedRequest[] = [];
  const origin = "http://127.0.0.1:4174";

  await context.route(
    (url) => url.origin === origin && url.pathname.startsWith("/api/v3/"),
    async (route) => {
      const request = route.request();
      const recorded: RecordedRequest = {
        url: request.url(),
        method: request.method(),
        body: request.postData(),
        atMs: Date.now(),
        status: null
      };
      requests.push(recorded);

      const result = await respond(new URL(recorded.url));
      if ("abort" in result) {
        await route.abort();
        return;
      }

      await route.fulfill(result);
      recorded.status = result.status;
    }
  );

  return { requests };
};
