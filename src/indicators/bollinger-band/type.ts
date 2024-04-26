import { EExchange } from "common/enum/exchange.enum";
import {
  EBollingerBandIndicatorMode,
  EBollingerBandPriceSignalMode,
  EEntryAmountType,
  EPositionSide,
} from "common/enum/indicator.enum";
import { EOrderMode } from "common/enum/order.enum";
import { StringNum } from "common/types/common.type";

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
  symbol: string;
  baseSymbol: string;
  signalOrderEntry: EBollingerBandIndicatorMode;
  priceSignalMode: EBollingerBandPriceSignalMode;
  barPeriod: string;
  stdDev: string;
  takeProfitRate: string;
  stopLossRate: string;
  dcaStopLossRate?: string;
  amountType: EEntryAmountType;
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

  // below fields used by bot process
  entryOrderType: EOrderMode;
  closeOrderType: EOrderMode;
  interval: string;
  amountRate: StringNum;
  signalSymbol: string;
  signalExchange: string;
  reEntrySetting: ReEntrySetting[];
  oneWaySignal?: boolean;
  oneWaySignalSide?: EPositionSide;
};
