export enum EChartMode {
  Spot = "spot",
  Future = "future",
  Forex = "forex",
}

export enum EExchangeMode {
  SPOT = "spot",
  FUTURE = "future",
}

export enum EExchange {
  Binance = "binance",
  Bitget = "bitget",
  Bybit = "bybit",
  Okx = "okx",
  Bingx = "bingx",
  Gateio = "gateio",
  Upbit = "upbit",
}

export const Exchanges = [
  EExchange.Binance,
  EExchange.Bitget,
  EExchange.Bybit,
  EExchange.Okx,
  EExchange.Bingx,
  EExchange.Gateio,
  EExchange.Upbit,
];

export enum EMaximumEntryMode {
  Separate = "separate",
}

export enum EOpeningSignalType {
  Main = "main",
  Sub = "sub",
}

export enum Interval {
  "1m" = "1m",
  "5m" = "5m",
  "15m" = "15m",
  "30m" = "30m",
  "1h" = "1h",
  "2h" = "2h",
  "4h" = "4h",
  "1d" = "1d",
}

export enum ExchangeSignalType {
  Kline,
  Order,
  Price,
  OrderBook,
}
