import { EOpenningSignalType } from "common/enum/exchange.enum";
import { EEntryAmountType, EPositionSide, ETPSLMode } from "common/enum/indicator.enum";
import { KlineSource } from "common/types/kline.type";

export type RangeFilterDCASignalResult = {
  type: EOpenningSignalType;
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
  entryAmountType: EEntryAmountType;
  entryAmount: string;
  entryAmountRate: string;
  gapDcaPriceRate: string;
  dcaMultipliedRates: string;
  cfbSmoothPrice?: boolean;
  onlyMainSignal?: boolean;
  reverse?: boolean;
  multipleMainOrder?: boolean;
  isOneWayMode: boolean;
  oneWaySignalSide?: EPositionSide;
  pricePrecision: string;
  quantityPrecision: string;
  contractValue: string;
  enableMaximumOrderInRange: boolean;
  maximumOrderInRange: string;
  rangeMaximumOrderRate: string;
  leverage: string;
};
