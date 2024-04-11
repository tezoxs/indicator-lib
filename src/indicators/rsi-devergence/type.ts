import { EExchange } from "common/enum/exchange.enum";
import { EEntryAmountType } from "common/enum/indicator.enum";
import { KlineSource } from "common/types/kline.type";

export type ReEntrySetting = {
  multipleAmountRate: string;
};

export type RSIDivergenceConfig = {
  signalId: number;
  exchange: EExchange;
  leverage: string;
  reEntrySettings: ReEntrySetting[];
  symbol: string;
  rsiSource: KlineSource;
  rsiPeriod: string;
  overboughtLevel: string;
  oversoldLevel: string;
  shortPeriod: string;
  longPeriod: string;
  atrReversalMultiplier: string;
  alertPeriod: string;
  longRangeFrom: string;
  longRangeTo: string;
  shortRangeFrom: string;
  shortRangeTo: string;
  takeProfitRate: string;
  stopLossRate: string;
  trailingStartRate: string;
  trailingStopRate: string;
  entryAmountType: EEntryAmountType;
  entryAmount: string;
  entryAmountRate: string;
  reEntryStopLossCount: string;
  maximumReEntry: string;
  reverse?: boolean;
  pricePrecision: string;
  quantityPrecision: string;
  contractValue: string;
};
