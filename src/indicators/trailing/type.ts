
import { EExchange } from "common/enum/exchange.enum";
import { ETPSLMode, EEntryAmountType, EPositionSide } from "common/enum/indicator.enum";
import { KlineSource } from "common/types/kline.type";

export type TrailingConfig = {
  signalId: number;
  exchange: EExchange;
  symbol: string;
  leverage: string;
  rangeFilterSource: KlineSource;
  rangeFilterPeriod: string;
  rangeFilterMultiplier: string;
  cfbSource: KlineSource;
  cfbPeriod: string;
  cfbMultiplier: string;
  cfbOffset: string;
  subCoefficient: string;
  trailingPreviousBar: string;
  tpslMode: ETPSLMode;
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
  mainCoefficient: string;
  longEntryAmountRate?: string[];
  shortEntryAmountRate?: string[];
  takeProfitRate?: string;
  stopLossRate?: string;
  pricePrecision: string;
  quantityPrecision: string;
  contractValue: string;
};

type TrailingOpenSignal = {
  positionSide: EPositionSide;
  caseNumbers: number[];
  price: string;
};

type ClosingSignal = {
  side: EPositionSide;
  reason: string;
};
