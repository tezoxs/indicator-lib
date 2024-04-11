import { EExchange } from "common/enum/exchange.enum";
import {
  EBollingerBandIndicatorMode,
  EBollingerBandPriceSignalMode,
  EEntryAmountType,
  EPositionSide,
} from "common/enum/indicator.enum";

export type ReEntrySetting = {
  multipleAmountRate: string;
};

export type PrePositionState = {
  positionSide: EPositionSide;
  closeKline: string;
};

export type BollingerBandConfig = {
  signalId: number;
  exchange: EExchange;
  leverage: string;
  reEntrySettings: ReEntrySetting[];
  symbol: string;
  signalOrderEntry: EBollingerBandIndicatorMode;
  priceSignalMode: EBollingerBandPriceSignalMode;
  barPeriod: string;
  stdDev: string;
  takeProfitRate: string;
  stopLossRate: string;
  dcaStopLossRate?: string;
  amountType: EEntryAmountType;
  amountValue: string;
  maximumEntry: string;
  maximumEntryMode: string;
  maximumReEntry: string;
  reverse?: boolean;
  isSeparateMode?: boolean;
  oneWayPosition?: boolean;
  positionSide?: EPositionSide;
  separateSide?: EPositionSide;
  pricePrecision: string;
  quantityPrecision: string;
  contractValue: string;
};
