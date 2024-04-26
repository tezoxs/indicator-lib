import { EOpeningSignalType, Interval } from "common/enum/exchange.enum";
import { EEntryAmountType, EPositionSide, ETPSLMode } from "common/enum/indicator.enum";
import { EOrderMode } from "common/enum/order.enum";
import { KlineSource } from "common/types/kline.type";

export type RangeFilterDCASignalResult = {
  type: EOpeningSignalType;
  price: string;
  positionSide: EPositionSide;
};

export type RangeFilterDCAConfig = {
  signalId: number;
  tpslMode: ETPSLMode;
  maximumDca: string;
  exchange: string;
  symbol: string;
  kdjPeriod: string;
  kdjSignal: string;
  rangeFilterSource: KlineSource;
  rangeFilterPeriod: string;
  rangeFilterMultiplier: string;
  cfbSource: KlineSource;
  cfbPeriod: string;
  cfbMultiplier: string;
  cfbOffset: string;
  takeProfitRate?: string;
  stopLossRate?: string;
  dcaStopLossRate?: string;
  maximumEntry: string;
  amountType: EEntryAmountType;
  entryAmount: string;
  amountRate: string;
  gapDcaPriceRate: string;
  dcaMultipliedRates: string;
  cfbSmoothPrice?: boolean;
  onlyMainSignal?: boolean;
  reverse?: boolean;
  multipleMainOrder?: boolean;
  oneWaySignal?: boolean;
  oneWaySignalSide?: EPositionSide;
  pricePrecision: string;
  quantityPrecision: string;
  contractValue: string;
  enableMaximumOrderInRange: boolean;
  maximumOrderInRange: string;
  rangeMaximumOrderRate: string;
  leverage: string;

  // below fields used by bot process
  entryOrderType: EOrderMode;
  closeOrderType: EOrderMode;
  signalExchange: string;
  signalSymbol: string;
  baseSymbol: string;
  interval: Interval;
};
