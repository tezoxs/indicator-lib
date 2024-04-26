import { EExchange, Interval } from "common/enum/exchange.enum";
import { EEntryAmountType, EPositionSide, ETPSLMode } from "common/enum/indicator.enum";
import { StringNum } from "common/types/common.type";
import { Kline, KlineSource } from "common/types/kline.type";

export type TrailingV2Config = {
  signalId: number;
  exchange: EExchange;
  symbol: string;
  leverage: string;
  mainRangeFilter: {
    source: KlineSource;
    period: string;
    multiplier: string;
  };
  subRangeFilter: {
    source: KlineSource;
    period: string;
    multiplier: string;
  };
  cfbSource: KlineSource;
  cfbPeriod: string;
  cfbMultiplier: string;
  cfbOffset: string;
  mainCoefficient: string;
  subCoefficient: string;
  trailingPreviousBar: string;
  emaPeriod: string;
  tpslMode: ETPSLMode;
  takeProfitRate?: string;
  stopLossRate?: string;
  maximumEntry: string;
  amountType: EEntryAmountType;
  longEntryAmount?: string[];
  shortEntryAmount?: string[];
  cfbSmoothPrice?: boolean;
  strictMode?: boolean;
  multipleEntry?: boolean;
  multipleCase?: boolean;
  reverse?: boolean;
  oneWaySignal?: boolean;
  oneWaySignalSide?: EPositionSide;
  longEntryAmountRate?: string[];
  shortEntryAmountRate?: string[];
  pricePrecision: string;
  quantityPrecision: string;
  contractValue: string;
  signalExchange: string;
  signalSymbol: string;
  baseSymbol: string;
  interval: Interval;
  mainRangeFilterConfig: RangeFilterConfig;
  subRangeFilterConfig: RangeFilterConfig;
  trailingMainCoefficient: StringNum;
  trailingSubCoefficient: StringNum;
  trailingPeriod: StringNum;
  longAmountRates?: StringNum[];
  shortAmountRates?: StringNum[];
};

export type RangeFilterConfig = {
  source: KlineSource;
  period: StringNum;
  multiplier: StringNum;
};

export type TrailingOpenSignal = {
  positionSide: EPositionSide;
  caseNumbers: number[];
  price: string;
};

export type ClosingSignal = {
  side: EPositionSide;
  reason: string;
};
