import BigNumber from "bignumber.js";
import {
  EEntryAmountType,
  EIndicatorType,
  EPositionSide,
  ESignalType,
} from "common/enum/indicator.enum";
import RSIDivergence from "common/indicator-lib/rsi-divergence";
import { StringNum } from "common/types/common.type";
import BaseIndicator from "indicators/base-indicator";
import { RSIDivergenceConfig } from "./type";
import { Kline } from "common/types/kline.type";
import { ExchangeSignal } from "common/types/signal";
import { ExchangeSignalType } from "common/enum/exchange.enum";

export default class RSIDivergenceSignal extends BaseIndicator {
  protected config: RSIDivergenceConfig;
  private rsiDivergenceInstance: RSIDivergence;
  private previousPositionSide: EPositionSide;
  private signalZoneId = 0;

  constructor(config: RSIDivergenceConfig) {
    super(config);

    this.rsiDivergenceInstance = new RSIDivergence({
      rsiSource: config.rsiSource,
      rsiPeriod: Number(config.rsiPeriod),
      overboughtLevel: Number(config.overboughtLevel),
      oversoldLevel: Number(config.oversoldLevel),
      shortPeriod: Number(config.shortPeriod),
      longPeriod: Number(config.longPeriod),
      atrReversalMultiplier: config.atrReversalMultiplier,
      alertPeriod: Number(config.alertPeriod),
      precision: config.pricePrecision,
    });
  }
  handleExchangeSignal(exchangeSignal: ExchangeSignal) {
    if (exchangeSignal.type == ExchangeSignalType.Kline) {
      const signals = this.nextSignal(exchangeSignal.data as Kline);

      this.emit("newSignalTriggered", signals);
    }
  }

  nextSignal(bar: Kline) {
    const { rsiValue, bull, bear } = this.rsiDivergenceInstance.nextValue(bar);
    const { longRangeFrom, longRangeTo, shortRangeFrom, shortRangeTo } = this.config;
    const signalPrice = bar.close;
    let signal = null;

    if (bull && this._isValueInRange(rsiValue, longRangeFrom, longRangeTo)) {
      signal = {
        positionSide: EPositionSide.Long,
        price: signalPrice,
      };
    } else if (bear && this._isValueInRange(rsiValue, shortRangeFrom, shortRangeTo)) {
      signal = {
        positionSide: EPositionSide.Short,
        price: signalPrice,
      };
    }

    if (!signal) {
      this.previousPositionSide = null;
      return [];
    }

    if (signal.positionSide != this.previousPositionSide) {
      this.signalZoneId++;
    }

    this.previousPositionSide = signal?.positionSide;

    const positionSide = this._getPositionSide(signal.positionSide);
    const signalConfig: any = {
      indicator: EIndicatorType.RSIDivergence,
      leverage: this.config.leverage,
      reEntrySetting: this.config.reEntrySetting,
      takeProfitRate: this.config.takeProfitRate,
      stopLossRate: this.config.stopLossRate,
      maximumEntry: this.config.maximumEntry || 1,
      amountType: this.config.amountType,
      signalZoneId: this.signalZoneId,
      entryAmount:
        this.config.amountType === EEntryAmountType.Rate
          ? this.config.amountRate
          : this.config.entryAmount,
      maximumReEntry: this.config.maximumReEntry,
      trailingStartRate: this.config.trailingStartRate,
      trailingStopRate: this.config.trailingStopRate,
      reEntryStopLossCount: this.config.reEntryStopLossCount,
      pricePrecision: this.config.pricePrecision,
      quantityPrecision: this.config.quantityPrecision,
      contractValue: this.config.contractValue,
      entryOrderType: this.config.entryOrderType,
      closeOrderType: this.config.closeOrderType,
    };

    if (this.config.amountType == EEntryAmountType.Rate) {
      signalConfig.amountRate = this.config.amountRate;
    }

    return [
      {
        type: ESignalType.Entry,
        symbol: this.config.symbol,
        baseSymbol: this.config.baseSymbol,
        exchange: this.config.exchange,
        positionSide,
        price: this.getSignalPrice(ESignalType.Entry, signal.price, positionSide),
        signalId: this.config.signalId,
        signalConfig,
      },
    ];
  }

  private _isValueInRange(value: StringNum, from: string, to: string) {
    return BigNumber(value).comparedTo(from) >= 0 && BigNumber(value).comparedTo(to) <= 0;
  }

  private _getPositionSide(positionSide: EPositionSide) {
    let signalPositionSide = positionSide;

    if (this.config.reverse) {
      signalPositionSide =
        signalPositionSide == EPositionSide.Long ? EPositionSide.Short : EPositionSide.Long;
    }

    return signalPositionSide;
  }
}
