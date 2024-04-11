import BigNumber from "bignumber.js";
import { BollingerBands } from "technicalindicators";
import { BollingerBandsOutput } from "technicalindicators/declarations/volatility/BollingerBands";
import {
  EBollingerBandIndicatorMode,
  EBollingerBandPriceSignalMode,
  EIndicatorType,
  EPositionSide,
  ESignalType,
} from "common/enum/indicator.enum";
import { SignalResult } from "common/types/common.type";
import { isPriceInRange } from "common/utils/bar.util";
import BaseIndicator from "indicators/base-indicator";
import { BollingerBandConfig, PrePositionState } from "./type";
import { Kline } from "common/types/kline.type";

export default class BollingerBand extends BaseIndicator<BollingerBandConfig> {
  private bbInstance: BollingerBands;
  private currentBBValue: BollingerBandsOutput;
  private waitingSide: EPositionSide;
  private lastCloseKline: string;
  private previousPosition: PrePositionState;

  constructor(config: BollingerBandConfig) {
    super(config);

    this.config = config;
    this._initBollingerBandInstance();

    this.previousPosition = {} as PrePositionState;
  }

  nextSignal(bar: Kline, isIntervalBar: boolean) {
    if (isIntervalBar) {
      return this._nextIntervalSignal(bar);
    }

    return this._nextTickerSignal(bar);
  }

  private _nextIntervalSignal(kline: Kline) {
    const price = kline.close;
    this.lastCloseKline = kline.close;
    this.currentBBValue = this.bbInstance.nextValue(+price);

    if (!this.currentBBValue) {
      return [];
    }

    this._nextWaitingSideIfNeed(kline);

    if (this.config.priceSignalMode === EBollingerBandPriceSignalMode.Ticker) {
      return [];
    }

    let positionSide = undefined;

    switch (this.config.signalOrderEntry) {
      case EBollingerBandIndicatorMode.ModeUpperLower:
        positionSide = this._handleSignalByUpperLower(kline);
        break;
      case EBollingerBandIndicatorMode.ModeMiddle:
        positionSide = this._handleSignalByMiddle(kline);
        break;
      case EBollingerBandIndicatorMode.ModeUpperLowerStraight:
        positionSide = this._handleSignalByUpperLowerStraight(kline);
        break;
    }

    if (!positionSide) {
      return [];
    }

    return this._handleValidateAndReverseSignal(positionSide, kline.close);
  }

  private _nextTickerSignal(bar: Kline) {
    if (
      this.config.priceSignalMode === EBollingerBandPriceSignalMode.Interval ||
      !this.currentBBValue
    ) {
      return [];
    }

    let positionSide = undefined;

    switch (this.config.signalOrderEntry) {
      case EBollingerBandIndicatorMode.ModeMiddle:
        positionSide = this._handleTickerSignalByMiddle(bar);
        break;
      case EBollingerBandIndicatorMode.ModeUpperLowerStraight:
        positionSide = this._handleTickerSignalByUpperLowerStraight(bar);
        break;
    }

    if (!positionSide) {
      this.previousPosition.positionSide = undefined;
      return [];
    }

    if (!this._validateSignalCount(positionSide)) {
      this.previousPosition = {
        positionSide,
        closeKline: this.lastCloseKline,
      };

      return [];
    }

    this.previousPosition = {
      positionSide,
      closeKline: this.lastCloseKline,
    };

    return this._handleValidateAndReverseSignal(positionSide, bar.close);
  }

  private _handleTickerSignalByMiddle(bar: Kline) {
    let low = bar.close;
    let high = this.lastCloseKline;

    if (BigNumber(bar.close).isGreaterThan(this.lastCloseKline)) {
      high = bar.close;
      low = this.lastCloseKline;
    }

    if (!this.waitingSide || !isPriceInRange({ low, high } as Kline, this.currentBBValue.middle)) {
      return;
    }

    return this.waitingSide;
  }

  private _handleTickerSignalByUpperLowerStraight(bar: Kline) {
    if (BigNumber(bar.close).isGreaterThan(this.currentBBValue.upper)) {
      return EPositionSide.Long;
    }

    if (BigNumber(bar.close).isLessThan(this.currentBBValue.lower)) {
      return EPositionSide.Short;
    }
  }

  private _nextWaitingSideIfNeed(kline: Kline) {
    if (
      [
        EBollingerBandIndicatorMode.ModeUpperLower,
        EBollingerBandIndicatorMode.ModeMiddle,
      ].lastIndexOf(this.config.signalOrderEntry) < 0
    ) {
      return;
    }

    const { close, open } = kline;
    const { upper, lower } = this.currentBBValue;

    if (BigNumber(open).comparedTo(upper) >= 0 && BigNumber(close).comparedTo(upper) > 0) {
      return (this.waitingSide = EPositionSide.Long);
    }

    if (BigNumber(open).comparedTo(lower) <= 0 && BigNumber(close).comparedTo(lower) < 0) {
      return (this.waitingSide = EPositionSide.Short);
    }
  }

  private _handleSignalByUpperLower(kline: Kline) {
    if (!this.waitingSide) {
      return;
    }

    const { upper, lower } = this.currentBBValue;
    const { open, close } = kline;

    if (BigNumber(close).comparedTo(upper) > 0 || BigNumber(close).comparedTo(lower) < 0) {
      return;
    }

    const isUptrendBar = BigNumber(close).comparedTo(open) >= 0;

    if (
      (this.waitingSide === EPositionSide.Long && !isUptrendBar) ||
      (this.waitingSide === EPositionSide.Short && isUptrendBar)
    ) {
      return this.waitingSide;
    }
  }

  private _handleSignalByMiddle(kline: Kline) {
    if (!this.waitingSide || !isPriceInRange(kline, this.currentBBValue.middle)) {
      return;
    }

    return this.waitingSide;
  }

  private _handleSignalByUpperLowerStraight(kline: Kline) {
    if (isPriceInRange(kline, this.currentBBValue.upper)) {
      return EPositionSide.Long;
    }

    if (isPriceInRange(kline, this.currentBBValue.lower)) {
      return EPositionSide.Short;
    }
  }

  private _handleValidateAndReverseSignal(positionSide: EPositionSide, price: string) {
    let parsedPositionSide = positionSide;

    if (this.config.reverse) {
      parsedPositionSide =
        parsedPositionSide == EPositionSide.Long ? EPositionSide.Short : EPositionSide.Long;
    }

    if (this.config.oneWayPosition && parsedPositionSide != this.config.positionSide) {
      return [];
    }

    if (this.config.isSeparateMode && parsedPositionSide != this.config.separateSide) {
      return [];
    }

    return this._formatSignal(parsedPositionSide, price);
  }

  private _formatSignal(positionSide: EPositionSide, price: string): SignalResult[] {
    const signalConfig = {
      amountType: this.config.amountType,
      takeProfitRate: this.config.takeProfitRate,
      stopLossRate: this.config.stopLossRate,
      maximumEntryMode: this.config.maximumEntryMode,
      maximumEntry: this.config.maximumEntry,
      maximumReEntry: this.config.maximumReEntry,
      leverage: this.config.leverage,
      signalOrderEntry: this.config.signalOrderEntry,
      reEntrySettings: this.config.reEntrySettings,
      contractValue: this.config.contractValue,
      pricePrecision: this.config.pricePrecision,
      quantityPrecision: this.config.quantityPrecision,
      dcaStopLossRate: this.config.dcaStopLossRate,
    };

    this.waitingSide = undefined;

    return [
      {
        type: ESignalType.Entry,
        symbol: this.config.symbol,
        exchange: this.config.exchange,
        positionSide,
        signalId: this.config.signalId,
        price,
        signalConfig: {
          ...signalConfig,
          leverage: this.config.leverage,
          entryAmount: this.config.amountValue,
          indicator: EIndicatorType.BollingerBand,
        },
      },
    ];
  }

  private _initBollingerBandInstance() {
    this.bbInstance = new BollingerBands({
      period: +this.config.barPeriod,
      stdDev: +this.config.stdDev,
      values: [],
    });
  }

  private _validateSignalCount(currentPositionSide?: EPositionSide) {
    const { positionSide, closeKline } = this.previousPosition;

    return (
      currentPositionSide !== positionSide && !BigNumber(closeKline).isEqualTo(this.lastCloseKline)
    );
  }
}
