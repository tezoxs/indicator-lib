import { EExchange } from "common/enum/exchange.enum";
import { EEntryAmountType, EPositionSide, ETPSLMode } from "common/enum/indicator.enum";
import { KlineSource } from "common/types/kline.type";

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
  entryAmountType: EEntryAmountType;
  longEntryAmount?: string[];
  shortEntryAmount?: string[];
  cfbSmoothPrice?: boolean;
  strictMode?: boolean;
  multipleEntry?: boolean;
  multipleCase?: boolean;
  reverse?: boolean;
  isOneWayMode?: boolean;
  oneWaySignalSide?: EPositionSide;
  longEntryAmountRate?: string[];
  shortEntryAmountRate?: string[];
  pricePrecision: string;
  quantityPrecision: string;
  contractValue: string;
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
