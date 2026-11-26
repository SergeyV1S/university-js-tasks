export type CatalogCoin = { id: string; name: string; symbol?: string };

export type Coin = CatalogCoin & {
  image?: string;
  rank: number | null;
  price: number | null;
  change24h: number | null;
  marketCap: number | null;
};
