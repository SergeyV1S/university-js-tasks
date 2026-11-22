import { useParams } from "react-router";

export const useCoinId = () => useParams<"coinId">().coinId;
