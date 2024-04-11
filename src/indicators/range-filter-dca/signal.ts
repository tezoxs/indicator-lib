import BigNumber from "bignumber.js";
import { SOURCE_OPEN } from "common/constants/exchange.constant";
import { CLOSE_BY_SIGNAL, CLOSING_SCALE_ALL } from "common/constants/signal.constant";
import { EOpenningSignalType } from "common/enum/exchange.enum";
import {
  EEntryAmountType,
  EIndicatorType,
  EPositionSide,
  ESignalType,
  ETPSLMode,
} from "common/enum/indicator.enum";
import CFB, { CFBResult } from "common/indicator-lib/cfb";
import KDJ, { KDJResult } from "common/indicator-lib/kdj";
import RangeFilter, { RangeFilterResult } from "common/indicator-lib/range-filter";
import { SignalResult } from "common/types/common.type";
import { Kline } from "common/types/kline.type";
import { isIntersection } from "common/utils/bar.util";
import BaseIndicator from "indicators/base-indicator";
import { RangeFilterDCAConfig, RangeFilterDCASignalResult } from "./type";

export default class RangeFilterDCASignal extends BaseIndicator<RangeFilterDCAConfig> {
  private kdjInstance: KDJ;
  private rfInstance: RangeFilter;
  private cfbInstance: CFB;
  private previousKDJ: KDJResult;
  private previousRF: RangeFilterResult;
  private previousCFB: CFBResult;
  private currentMainSignal: RangeFilterDCASignalResult;

  constructor(config: RangeFilterDCAConfig) {
    super(config);

    this._initIndicatorInstances();
    this.currentMainSignal = {} as RangeFilterDCASignalResult;
    this.previousCFB = {} as CFBResult;
    this.previousKDJ = {} as KDJResult;
    this.previousRF = {} as RangeFilterResult;
  }

  nextSignal(bar: Kline) {
    const kdjValue = this.kdjInstance.nextValue(bar);
    const rfValue = this.rfInstance.nextValue(bar);
    const cfbValue = this.cfbInstance.nextValue(bar);
    const mainSignal = this._nextMainSignal(bar, rfValue, cfbValue) as SignalResult;
    const subSignal = this._nextSubSignal(bar, rfValue, kdjValue);
    const closingSignal = this._nextClosingSignal(mainSignal);
    const signals = [];

    if (closingSignal) {
      signals.push(closingSignal);
    }

    if (mainSignal && this._validateOneWayMode(mainSignal.positionSide)) {
      signals.push(mainSignal);
    }

    if (subSignal && this._validateOneWayMode(subSignal.positionSide)) {
      signals.push(subSignal);
    }

    this.previousKDJ = kdjValue;
    this.previousRF = rfValue;
    this.previousCFB = cfbValue;

    return signals;
  }

  private _nextMainSignal(bar: Kline, rfValue: RangeFilterResult, cfbValue: CFBResult) {
    const currentRFFilter = rfValue.filter;
    const currentCFBFilter = cfbValue.filter;
    const prevRFFilter = this.previousRF.filter || 0;
    const prevCFBFilter = this.previousCFB.filter || 0;

    if (!isIntersection(prevRFFilter, prevCFBFilter, currentRFFilter, currentCFBFilter)) {
      return;
    }

    const signal: RangeFilterDCASignalResult = {
      positionSide: null,
      price: "0",
      type: EOpenningSignalType.Main,
    };

    signal.positionSide =
      BigNumber(currentRFFilter).comparedTo(currentCFBFilter) >= 0
        ? EPositionSide.Long
        : EPositionSide.Short;
    signal.price = bar.close;

    if (this.config.rangeFilterSource == SOURCE_OPEN && this.config.cfbSource == SOURCE_OPEN) {
      signal.price = bar.open;
    }

    this.currentMainSignal = signal;

    return this._formatOpeningSignal(signal);
  }

  private _nextSubSignal(bar: Kline, rfValue: RangeFilterResult, kdjValue: KDJResult) {
    if (this.config.onlyMainSignal) {
      return;
    }

    const isUpTrendRF = rfValue.isUpTrend;
    const kdjSignal = this._getKDJSignal(kdjValue);
    const signal: RangeFilterDCASignalResult = {
      positionSide: null,
      price: "0",
      type: EOpenningSignalType.Sub,
    };

    if (
      kdjSignal === this.currentMainSignal.positionSide &&
      ((isUpTrendRF && kdjSignal == EPositionSide.Short) ||
        (!isUpTrendRF && kdjSignal == EPositionSide.Long))
    ) {
      signal.positionSide = kdjSignal;
      signal.price = bar.close;
    }

    if (!signal.positionSide) {
      return;
    }

    return this._formatOpeningSignal(signal);
  }

  private _nextClosingSignal(mainSignal: SignalResult) {
    if (!mainSignal || this.config.tpslMode == ETPSLMode.Fixed) {
      return null;
    }

    const positionSide =
      mainSignal.positionSide == EPositionSide.Long ? EPositionSide.Short : EPositionSide.Long;

    return {
      type: ESignalType.Close,
      symbol: this.config.symbol,
      exchange: this.config.exchange,
      positionSide,
      price: mainSignal.price,
      signalId: this.config.signalId,
      signalScale: CLOSING_SCALE_ALL,
      signalConfig: {
        leverage: this.config.leverage,
        indicator: EIndicatorType.RangeFilterDca,
        contractValue: this.config.contractValue,
        quantityPrecision: this.config.quantityPrecision,
        pricePrecision: this.config.pricePrecision,
        closeReason: CLOSE_BY_SIGNAL,
      },
    };
  }

  private _validateOneWayMode(positionSide: EPositionSide) {
    if (!this.config.isOneWayMode) {
      return true;
    }

    return positionSide == this.config.oneWaySignalSide;
  }

  private _getKDJSignal(kdjValue: KDJResult) {
    const prevKDJ = +this.previousKDJ.pj;
    const currentKDJ = +kdjValue.pj;

    if (prevKDJ < 30 && currentKDJ >= 30) {
      return EPositionSide.Long;
    }

    if (prevKDJ > 70 && currentKDJ <= 70) {
      return EPositionSide.Short;
    }
  }

  private _formatOpeningSignal(signal: RangeFilterDCASignalResult) {
    const { reverse } = this.config;

    let positionSide = signal.positionSide;

    if (reverse) {
      positionSide = positionSide === EPositionSide.Long ? EPositionSide.Short : EPositionSide.Long;
    }

    const signalConfig: any = {
      indicator: EIndicatorType.RangeFilterDca,
      type: signal.type,
      leverage: this.config.leverage,
      tpslMode: this.config.tpslMode,
      maximumEntry: this.config.maximumEntry,
      maximumDca: this.config.maximumDca,
      dcaMultipliedRates: this.config.dcaMultipliedRates,
      contractValue: this.config.contractValue,
      quantityPrecision: this.config.quantityPrecision,
      pricePrecision: this.config.pricePrecision,
      amountType: this.config.entryAmountType,
      entryAmount:
        this.config.entryAmountType === EEntryAmountType.Rate
          ? this.config.entryAmountRate
          : this.config.entryAmount,
      gapDcaPriceRate: this.config.gapDcaPriceRate,
      multipleMainOrder: this.config.multipleMainOrder,
      enableMaximumOrderInRange: this.config.enableMaximumOrderInRange,
      rangeMaximumOrderRate: this.config.rangeMaximumOrderRate,
      maximumOrderInRange: this.config.maximumOrderInRange,
    };

    if (this.config.tpslMode != ETPSLMode.Normal) {
      signalConfig.takeProfitRate = this.config.takeProfitRate;
      signalConfig.stopLossRate = this.config.stopLossRate;
      signalConfig.dcaStopLossRate = this.config.dcaStopLossRate;
    }

    return {
      type: ESignalType.Entry,
      symbol: this.config.symbol,
      exchange: this.config.exchange,
      positionSide,
      price: signal.price,
      signalId: this.config.signalId,
      signalConfig,
    };
  }

  private _initIndicatorInstances() {
    this.kdjInstance = new KDJ({
      period: this.config.kdjPeriod,
      signal: this.config.kdjSignal,
      precision: this.config.pricePrecision,
    });
    this.rfInstance = new RangeFilter({
      source: this.config.rangeFilterSource,
      period: this.config.rangeFilterPeriod,
      multiplier: this.config.rangeFilterMultiplier,
      precision: this.config.pricePrecision,
    });
    this.cfbInstance = new CFB({
      smoothPrice: this.config.cfbSmoothPrice,
      period: this.config.cfbPeriod,
      multiplier: this.config.cfbMultiplier,
      offset: this.config.cfbOffset,
      source: this.config.cfbSource,
      precision: this.config.pricePrecision,
    });
  }
}
