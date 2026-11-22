import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import { marketError, parseRetryAfter } from "./helpers";
import type { MarketInstanceOptions, RequestOptions } from "./type";

export const createMarketInstance = (options: MarketInstanceOptions) => {
  const baseURL = new URL(options.baseUrl, globalThis.location?.href).href;
  const api = axios.create({ baseURL, adapter: options.adapter });

  api.interceptors.request.use((config) => {
    const apiKey = options.apiKey;
    if (apiKey) config.headers.set("x-cg-demo-api-key", apiKey);
    return config;
  });

  api.interceptors.response.use(undefined, (error: unknown) => {
    if (axios.isCancel(error) || (error instanceof Error && error.name === "AbortError")) {
      throw error;
    }

    const response = axios.isAxiosError(error) ? error.response : undefined;
    if (!response) throw marketError("network");

    const { status } = response;
    if (status === 429) {
      const retryAt = parseRetryAfter(response.headers["retry-after"]);
      throw marketError("rate-limit", retryAt === undefined ? { status } : { status, retryAt });
    }
    if (status === 404) throw marketError("not-found", { status });
    throw marketError("http", { status });
  });

  const request = async <T>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> => {
    const signal = options?.signal;
    signal?.throwIfAborted();

    try {
      const { data } = await api.request<T>({ ...config, signal });
      signal?.throwIfAborted();
      return data;
    } catch (error) {
      if (axios.isCancel(error)) {
        signal?.throwIfAborted();
        throw new DOMException(error.message, "AbortError");
      }
      throw error;
    }
  };

  return { request, getUri: api.getUri };
};
