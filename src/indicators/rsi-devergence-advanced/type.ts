import { EExchange } from "common/enum/exchange.enum";
import { EEntryAmountType } from "common/enum/indicator.enum";
import { KlineSource } from "common/types/kline.type";

export type ReEntrySetting = {
  multipleAmountRate: string;
};

export type RSIDivergenceAdvancedConfig = {
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
  longRangeFrom: string;
  alertPeriod: string;
  longRangeTo: string;
  shortRangeFrom: string;
  shortRangeTo: string;
  maximumTakeProfitRate: string;
  maximumStopLossRate: string;
  stopLossRate: string;
  trailingStartRate: string;
  trailingStopRate: string;
  reEntryStopLossCount: string;
  entryAmountType: EEntryAmountType;
  entryAmount: string;
  entryAmountRate: string;
  maximumReEntry: string;
  maximumEntry: string;
  singleZone?: boolean;
  reverse?: boolean;
  pricePrecision: string;
  quantityPrecision: string;
  contractValue: string;
};
