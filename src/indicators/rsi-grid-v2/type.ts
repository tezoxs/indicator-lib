import { EEntryAmountType, ETPSLMode } from "common/enum/indicator.enum";
import { KlineSource } from "common/types/kline.type";

export type MaximumDca = {
  [zone: number]: number;
};

export type RSIGridV2Config = {
  signalId: number;
  exchange: string;
  leverage: string;
  symbol: string;
  rsiSource: KlineSource;
  rsiPeriod: string;
  takeProfitRate: string;
  stopLossRate: string;
  overboughtLevel: number;
  oversoldLevel: number;
  longPeriod: string;
  longRangeFrom: string;
  longRangeTo: string;
  shortRangeFrom: string;
  shortRangeTo: string;
  amountType: EEntryAmountType;
  entryAmount: string;
  amountRate: string;
  reverse?: boolean;
  pricePrecision: string;
  quantityPrecision: string;
  contractValue: string;
  numberOfZone: number;
  closeZone: number;
  entryZone: number;
  dcaZone: number;
  multipleEntry?: boolean;
  enableOverbought: boolean;
  enableOversold: boolean;
  tpslMode: ETPSLMode;
  maximumDCANormalZone: number;
  maximumDCAOverSoldZone: number;
  maximumDCAOverBoughtZone: number;
};
