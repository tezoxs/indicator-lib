import { KlineSource } from "common/types/kline.type";
import { EEntryAmountType, EPositionSide, ETPSLMode } from "common/enum/indicator.enum";
import { StringNum } from "common/types/common.type";
import { EOrderMode } from "common/enum/order.enum";
import { Interval } from "common/enum/exchange.enum";

export type TitanV2Config = {
  signalId: number;
  exchange: string;
  symbol: string;
  leverage: string;
  rangeFilterSource: KlineSource;
  rangeFilterPeriod: string;
  rangeFilterMultiplier: string;
  cfbSource: KlineSource;
  cfbPeriod: string;
  cfbMultiplier: string;
  cfbOffset: string;
  trailingCoefficient: string;
  trailingPeriod: string;
  maximumEntry: string;
  tpslMode: ETPSLMode;
  amountType: EEntryAmountType;
  longEntryAmount: any;
  shortEntryAmount: any;
  pricePrecision: string;
  quantityPrecision: string;
  contractValue: string;
  takeProfitRate?: string;
  stopLossRate?: string;
  cfbSmoothPrice?: boolean;
  strictMode?: boolean;
  multipleEntry?: boolean;
  multipleCase?: boolean;
  oneWaySignal: boolean;
  oneWaySignalSide: EPositionSide;

  // below fields used by bot process
  entryOrderType: EOrderMode;
  closeOrderType: EOrderMode;
  signalExchange: string;
  signalSymbol: string;
  baseSymbol: string;
  interval: Interval;
  longAmountRates: StringNum[];
  shortAmountRates: StringNum[];
};

export type TitanV2OpenSignal = {
  positionSide: EPositionSide;
  caseNumbers: number[];
  price: string;
};
