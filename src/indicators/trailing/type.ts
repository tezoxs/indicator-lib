import { EExchange, Interval } from "common/enum/exchange.enum";
import { ETPSLMode, EEntryAmountType, EPositionSide } from "common/enum/indicator.enum";
import { EOrderMode, EOrderType } from "common/enum/order.enum";
import { StringNum } from "common/types/common.type";
import { Kline, KlineSource } from "common/types/kline.type";

export type TrailingConfig = {
  signalId: number;
  exchange: EExchange;
  symbol: string;
  leverage: string;

  subCoefficient: string;
  trailingPreviousBar: string;
  longEntryAmount?: string[];
  shortEntryAmount?: string[];
  reverse?: boolean;
  oneWaySignal?: boolean;
  oneWaySignalSide?: EPositionSide;
  mainCoefficient: string;
  longEntryAmountRate?: string[];
  shortEntryAmountRate?: string[];
  quantityPrecision: string;
  contractValue: string;

  // below fields used by bot process
  entryOrderType: EOrderMode;
  closeOrderType: EOrderMode;

  signalExchange: string;
  signalSymbol: string;
  baseSymbol: string;
  interval: Interval;
  rangeFilterSource: KlineSource;
  rangeFilterPeriod: StringNum;
  rangeFilterMultiplier: StringNum;
  cfbSource: KlineSource;
  cfbPeriod: StringNum;
  cfbMultiplier: StringNum;
  cfbOffset: StringNum;
  trailingMainCoefficient: StringNum;
  trailingSubCoefficient: StringNum;
  trailingPeriod: StringNum;
  tpslMode: ETPSLMode;
  amountType: EEntryAmountType;
  longAmountRates: StringNum[];
  shortAmountRates: StringNum[];
  maximumEntry: StringNum;
  pricePrecision: StringNum;
  takeProfitRate?: StringNum;
  stopLossRate?: StringNum;
  cfbSmoothPrice?: boolean;
  strictMode?: boolean;
  multipleEntry?: boolean;
  multipleCase?: boolean;
  orderType?: EOrderType;
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
