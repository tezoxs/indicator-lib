import { EExchange, Interval } from "common/enum/exchange.enum";
import { EEntryAmountType } from "common/enum/indicator.enum";
import { EOrderMode } from "common/enum/order.enum";
import { StringNum } from "common/types/common.type";
import { KlineSource } from "common/types/kline.type";

export type ReEntrySetting = {
  multipleAmountRate: string;
};

export type RSIDivergenceConfig = {
  signalId: number;
  exchange: EExchange;
  leverage: string;
  reEntrySetting: ReEntrySetting[];
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
  amountType: EEntryAmountType;
  entryAmount: string;
  amountRate: string;
  reEntryStopLossCount: string;
  maximumReEntry: string;
  reverse?: boolean;
  pricePrecision: string;
  quantityPrecision: string;
  contractValue: string;

  // below fields used by bot process
  entryOrderType: EOrderMode;
  closeOrderType: EOrderMode;
  signalExchange: string;
  signalSymbol: string;
  baseSymbol: string;
  interval: Interval;
  maximumEntry: StringNum;

};
