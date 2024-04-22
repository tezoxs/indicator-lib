import BigNumber from "bignumber.js";
import { CLOSING_SCALE_ALL } from "common/constants/signal.constant";
import {
  EEntryAmountType,
  EIndicatorType,
  EPositionSide,
  ESignalType,
} from "common/enum/indicator.enum";
import RSIDivergence from "common/indicator-lib/rsi-divergence";
import { StringNum } from "common/types/common.type";
import BaseIndicator from "indicators/base-indicator";
import { RSIDivergenceAdvancedConfig } from "./type";
import { Kline } from "common/types/kline.type";

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

    const signalConfig: any = {
      indicator: EIndicatorType.RsiDivergenceAdvanced,
      leverage: this.config.leverage,
      reEntrySettings: this.config.reEntrySettings,
      reEntryStopLossCount: this.config.reEntryStopLossCount,
      takeProfitRate: this.config.maximumTakeProfitRate,
      stopLossRate: this.config.maximumStopLossRate,
      zoneStopLossRate: this.config.stopLossRate,
      maximumEntry: this.config.maximumEntry,
      amountType: this.config.entryAmountType,
      signalZoneId: this.signalZoneId,
      entryAmount:
        this.config.entryAmountType === EEntryAmountType.Rate
          ? this.config.entryAmountRate
          : this.config.entryAmount,
      maximumReEntry: this.config.maximumReEntry,
      singleZone: this.config.singleZone,
      trailingStartRate: this.config.trailingStartRate,
      trailingStopRate: this.config.trailingStopRate,
      pricePrecision: this.config.pricePrecision,
      quantityPrecision: this.config.quantityPrecision,
      contractValue: this.config.contractValue,
    };

    const formattedSignal = {
      symbol: this.config.symbol,
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
        price: signal.price,
        ...formattedSignal,
      },
      {
        type: ESignalType.Entry,
        positionSide,
        price: signal.price,
        ...formattedSignal,
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
