export type CbrCurrency = {
  ID: string;
  NumCode: string;
  CharCode: string;
  Nominal: number;
  Name: string;
  Value: number;
};

export type CbrDailyResponse = {
  Valute: Record<string, CbrCurrency>;
};

export type Currency = {
  code: string;
  name: string;
  symbol: string;
  rate: number;
};
