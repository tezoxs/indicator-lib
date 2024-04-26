import BigNumber from "bignumber.js";
import { CLOSING_SCALE_ALL } from "common/constants/signal.constant";
import {
  EEntryAmountType,
  EIndicatorType,
  EPositionSide,
  ESignalType,
} from "common/enum/indicator.enum";
import RSIDivergence from "common/indicator-lib/rsi-divergence";
import { SignalResult, StringNum } from "common/types/common.type";
import BaseIndicator from "indicators/base-indicator";
import { RSIDivergenceAdvancedConfig } from "./type";
import { Kline } from "common/types/kline.type";
import { ExchangeSignal } from "common/types/signal";
import { ExchangeSignalType } from "common/enum/exchange.enum";

export default class RSIDivergenceAdvancedSignal extends BaseIndicator {
  protected config: RSIDivergenceAdvancedConfig;
  private rsiDivergenceInstance: RSIDivergence;
  private previousPositionSide: EPositionSide;
  private signalZoneId = 0;

  constructor(config: RSIDivergenceAdvancedConfig) {
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

  nextSignal(bar: Kline): SignalResult[] {
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

    const signalConfig: any = {
      indicator: EIndicatorType.RSIDivergenceAdvanced,
      leverage: this.config.leverage,
      reEntrySetting: this.config.reEntrySetting,
      reEntryStopLossCount: this.config.reEntryStopLossCount,
      takeProfitRate: this.config.maximumTakeProfitRate,
      stopLossRate: this.config.stopLossRate,
      zoneStopLossRate: this.config.zoneStopLossRate,
      maximumEntry: this.config.maximumEntry,
      amountType: this.config.amountType,
      signalZoneId: this.signalZoneId,
      entryAmount:
        this.config.amountType === EEntryAmountType.Rate
          ? this.config.amountRate
          : this.config.entryAmount,
      maximumReEntry: this.config.maximumReEntry,
      singleZone: this.config.singleZone,
      trailingStartRate: this.config.trailingStartRate,
      trailingStopRate: this.config.trailingStopRate,
      pricePrecision: this.config.pricePrecision,
      quantityPrecision: this.config.quantityPrecision,
      contractValue: this.config.contractValue,
      entryOrderType: this.config.entryOrderType,
      closeOrderType: this.config.closeOrderType,
    };

    const formattedSignal = {
      symbol: this.config.symbol,
      baseSymbol: this.config.baseSymbol,
      exchange: this.config.exchange,
      signalConfig,
      signalId: this.config.signalId,
    };
    const positionSide = this._getPositionSide(signal.positionSide);
    const closeSignalPositionSide =
      positionSide === EPositionSide.Long ? EPositionSide.Short : EPositionSide.Long;
    
    return [
      {
        type: ESignalType.Close,
        positionSide: closeSignalPositionSide,
        signalScale: CLOSING_SCALE_ALL,
        price: this.getSignalPrice(ESignalType.Close, signal.price, positionSide),
        ...formattedSignal,
      },
      {
        type: ESignalType.Entry,
        positionSide,
        price: this.getSignalPrice(ESignalType.Entry, signal.price, positionSide),
        ...formattedSignal,
      },
    ];
  }

  handleExchangeSignal(exchangeSignal: ExchangeSignal) {
    if (exchangeSignal.type == ExchangeSignalType.Kline) {
      const signals = this.nextSignal(exchangeSignal.data as Kline);

      this.emit("newSignalTriggered", signals);
    }
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
