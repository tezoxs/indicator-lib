import { KlineSource } from "common/types/kline.type";
import { EEntryAmountType, EPositionSide, ETPSLMode } from "common/enum/indicator.enum";

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
  entryAmountType: EEntryAmountType;
  longEntryAmountRate: string[];
  shortEntryAmountRate: string[];
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
  isOneWayMode: boolean;
  oneWaySignalSide: EPositionSide;
};

export type TitanV2OpenSignal = {
  positionSide: EPositionSide;
  caseNumbers: number[];
  price: string;
};
