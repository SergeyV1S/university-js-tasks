import { useCoinId } from "./hooks/useCoinId";
import "./page.css";

export const CoinPage = () => {
  const coinId = useCoinId();

  return (
    <>
      <h1>Детали монеты</h1>
      <p className="coin-id">{coinId}</p>
    </>
  );
};
