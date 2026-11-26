import type { AxiosRequestConfig } from "axios";

export type RequestArgs<Params = never> = { config?: AxiosRequestConfig } & ([Params] extends [
  never
]
  ? { params?: never }
  : { params: Params });
