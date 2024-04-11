export type Kline = {
  symbol?: string;
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  spreadRate?: string;
  isInitBar?: boolean;
};

export type Price = {
  symbol: string;
  price: string;
  timestamp: number;
};

export type Bar = {
  high: number;
  low: number;
  close: number;
  open: number;
  close_time: number;
};

export type OrderbookRow = {
  price: string;
  quantity: string;
};

export type Orderbook = {
  symbol: string;
  bids: OrderbookRow[];
  asks: OrderbookRow[];
  type: string;
  exchange: string;
  mode: string;
};

export type KlineSource =
  | "openTime"
  | "closeTime"
  | "symbol"
  | "interval"
  | "open"
  | "close"
  | "high"
  | "low"
  | "baseVolume"
  | "quoteVolume"
  | "spreadRate";
