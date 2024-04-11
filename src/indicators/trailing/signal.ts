import BigNumber from "bignumber.js";
import { CLOSING_SCALE_ALL, TRAILING_CLOSING_TYPE } from "common/constants/signal.constant";
import { EExchange } from "common/enum/exchange.enum";
import {
  EEntryAmountType,
  EIndicatorType,
  EPositionSide,
  ESignalType,
} from "common/enum/indicator.enum";
import { ETPSLMode } from "common/enum/order.enum";
import CFB, { CFBResult } from "common/indicator-lib/cfb";
import RangeFilter, { RangeFilterResult } from "common/indicator-lib/range-filter";
import Trailing from "common/indicator-lib/trailing";
import { SignalResult, StringNum } from "common/types/common.type";
import BaseIndicator from "indicators/base-indicator";
import { TrailingOpenSignal, ClosingSignal } from "indicators/trailing-v2/type";
import { TrailingConfig } from "./type";
import { Kline } from "common/types/kline.type";

export default class TrailingSignal extends BaseIndicator<TrailingConfig> {
  private rfInstance: RangeFilter;
  private cfbInstance: CFB;
  private mainTrailingInstance: Trailing;
  private subTrailingInstance: Trailing;
  private previousRF: RangeFilterResult;
  private previousCFB: CFBResult;

  constructor(config: TrailingConfig) {
    super(config);

    this.config = config;
    this._initIndicatorInstances();
    this.previousCFB = {} as CFBResult;
    this.previousRF = {} as RangeFilterResult;
  }

  nextSignal(bar: Kline) {
    const rfValue = this.rfInstance.nextValue(bar);
    const cfbValue = this.cfbInstance.nextValue(bar);
    this.mainTrailingInstance.nextValue(bar);
    this.subTrailingInstance.nextValue(bar);

    const closingSignal = this._nextClosingSignal(rfValue, cfbValue, bar.close);
    const openingSignals = this._nextOpeningSignal(rfValue, cfbValue, bar);
    let signals: SignalResult[] = [];

    if (closingSignal) {
      signals.push(closingSignal);
    }

    if (openingSignals.length) {
      signals = signals.concat(openingSignals);
    }

    this.previousRF = rfValue;
    this.previousCFB = cfbValue;

    return signals;
  }

  private _nextClosingSignal(rfValue: RangeFilterResult, cfbValue: CFBResult, close: string) {
    if (this.config.tpslMode == ETPSLMode.Fixed) {
      return;
    }

    let closingSignal = this._nextClosingLongSignal(rfValue, cfbValue, close);

    if (!closingSignal) {
      closingSignal = this._nextClosingShortSignal(rfValue, cfbValue, close);
    }

    return this._formatClosingSignal(closingSignal, close);
  }

  private _nextClosingLongSignal(rfValue: RangeFilterResult, cfbValue: CFBResult, close: string) {
    if (this._isRFCrossDownCFB(rfValue.filter, cfbValue.filter)) {
      return this._formatClosingLongSignal(3);
    }

    if (this.mainTrailingInstance.isCrossUp(close) && !rfValue.isUpTrend) {
      return this._formatClosingLongSignal(1);
    }

    if (this.subTrailingInstance.isCrossUp(close)) {
      return this._formatClosingLongSignal(2);
    }
  }

  private _nextClosingShortSignal(rfValue: RangeFilterResult, cfbValue: CFBResult, close: string) {
    if (this._isRFCrossUpCFB(rfValue.filter, cfbValue.filter)) {
      return this._formatClosingShortSignal(3);
    }

    if (this.mainTrailingInstance.isCrossDown(close) && rfValue.isUpTrend) {
      return this._formatClosingShortSignal(1);
    }

    if (this.subTrailingInstance.isCrossDown(close)) {
      return this._formatClosingShortSignal(2);
    }
  }

  private _nextOpeningSignal(rfValue: RangeFilterResult, cfbValue: CFBResult, bar: Kline) {
    let signal = this._getLongSignal(rfValue, cfbValue, bar);

    if (!signal.caseNumbers.length) {
      signal = this._getShortSignal(rfValue, cfbValue, bar);
    }

    return this._formatOpeningSignal(signal);
  }

  private _getLongSignal(rfValue: RangeFilterResult, cfbValue: CFBResult, bar: Kline) {
    const currentRFFilter = rfValue.filter;
    const currentCFBFilter = cfbValue.filter;

    const comparedRFAndCFBResult = BigNumber(currentRFFilter).comparedTo(currentCFBFilter);
    const signal: TrailingOpenSignal = {
      positionSide: EPositionSide.Long,
      caseNumbers: [],
      price: bar.close,
    };

    if (!comparedRFAndCFBResult) {
      return signal;
    }
    //case 5
    if (this._isRFCrossUpCFB(currentRFFilter, currentCFBFilter)) {
      signal.caseNumbers.push(5);
    }

    if (comparedRFAndCFBResult === 1) {
      //case 4
      if (this.subTrailingInstance.isCrossDown(bar.close)) {
        signal.caseNumbers.push(4);
      }
      //case 3
      if (this.mainTrailingInstance.isCrossDown(bar.close)) {
        signal.caseNumbers.push(3);
      }

      return signal;
    }

    if (!rfValue.isUpTrend) {
      return signal;
    }

    return this._getLongSignalRFLessThanCFB(signal, bar);
  }

  private _getShortSignal(rfValue: RangeFilterResult, cfbValue: CFBResult, bar: Kline) {
    const comparedRFAndCFBResult = BigNumber(rfValue.filter).comparedTo(cfbValue.filter);
    const signal: TrailingOpenSignal = {
      positionSide: EPositionSide.Short,
      caseNumbers: [],
      price: bar.close,
    };
    if (!comparedRFAndCFBResult) {
      return signal;
    }
    //case 5
    if (this._isRFCrossDownCFB(rfValue.filter, cfbValue.filter)) {
      signal.caseNumbers.push(5);
    }

    //case 4
    if (comparedRFAndCFBResult === -1) {
      if (this.subTrailingInstance.isCrossUp(bar.close)) {
        signal.caseNumbers.push(4);
      }

      //case 3
      if (this.mainTrailingInstance.isCrossUp(bar.close)) {
        signal.caseNumbers.push(3);
      }

      return signal;
    }

    if (rfValue.isUpTrend) {
      return signal;
    }

    return this._getShortSignalRFGreaterThanCFB(signal, bar);
  }

  private _getLongSignalRFLessThanCFB(signal: TrailingOpenSignal, bar: Kline) {
    //case 2
    if (this.subTrailingInstance.isCrossDown(bar.close)) {
      signal.caseNumbers.push(2);
    }
    //case 1
    if (this.mainTrailingInstance.isCrossDown(bar.close)) {
      signal.caseNumbers.push(1);
    }

    return signal;
  }

  private _getShortSignalRFGreaterThanCFB(signal: TrailingOpenSignal, bar: Kline) {
    //case 2
    if (this.subTrailingInstance.isCrossUp(bar.close)) {
      signal.caseNumbers.push(2);
    }
    //case 1
    if (this.mainTrailingInstance.isCrossUp(bar.close)) {
      signal.caseNumbers.push(1);
    }

    return signal;
  }

  private _formatClosingLongSignal(caseNumber: number): ClosingSignal {
    return {
      side: EPositionSide.Long,
      reason: TRAILING_CLOSING_TYPE[`CLOSE_LONG_CASE_${caseNumber}`],
    };
  }

  private _formatClosingShortSignal(caseNumber: number): ClosingSignal {
    return {
      side: EPositionSide.Short,
      reason: TRAILING_CLOSING_TYPE[`CLOSE_SHORT_CASE_${caseNumber}`],
    };
  }

  private _isRFCrossUpCFB(rfValueFilter: StringNum, cfbValueFilter: StringNum) {
    return (
      BigNumber(this.previousRF.filter).isLessThan(this.previousCFB.filter) &&
      BigNumber(rfValueFilter).isGreaterThan(cfbValueFilter)
    );
  }

  private _isRFCrossDownCFB(rfValueFilter: StringNum, cfbValueFilter: StringNum) {
    return (
      BigNumber(this.previousRF.filter).isGreaterThan(this.previousCFB.filter) &&
      BigNumber(rfValueFilter).isLessThan(cfbValueFilter)
    );
  }

  private _formatOpeningSignal(signal: TrailingOpenSignal) {
    const signals = [];
    const { isOneWayMode, oneWaySignalSide, reverse } = this.config;

    let positionSide = signal.positionSide;

    if (reverse) {
      positionSide = positionSide === EPositionSide.Long ? EPositionSide.Short : EPositionSide.Long;
    }

    if (isOneWayMode && signal.positionSide !== oneWaySignalSide) {
      return [];
    }

    const signalConfig: any = {
      leverage: this.config.leverage,
      indicator: EIndicatorType.Trailing,
      contractValue: this.config.contractValue,
      quantityPrecision: this.config.quantityPrecision,
      pricePrecision: this.config.pricePrecision,
      tpslMode: this.config.tpslMode,
      maximumEntry: this.config.maximumEntry,
      strictMode: this.config.strictMode,
      multipleEntry: this.config.multipleEntry,
      multipleCase: this.config.multipleCase,
    };

    const validCaseNumbers = this.config.multipleEntry
      ? signal.caseNumbers
      : signal.caseNumbers.slice(-1);

    if (this.config.tpslMode !== ETPSLMode.Normal) {
      signalConfig.takeProfitRate = this.config.takeProfitRate;
      signalConfig.stopLossRate = this.config.stopLossRate;
    }

    for (const caseNumber of validCaseNumbers) {
      signals.push({
        type: ESignalType.Entry,
        exchange: this.config.exchange,
        symbol: this.config.symbol,
        positionSide,
        signalId: this.config.signalId,
        price: signal.price,
        signalConfig: {
          ...signalConfig,
          caseNumber,
          amountType: this.config.entryAmountType,
          entryAmount: this._getEntryAmount(positionSide, caseNumber),
        },
      });
    }

    return signals;
  }

  private _formatClosingSignal(signal: ClosingSignal, price: string) {
    if (!signal) {
      return;
    }

    return {
      type: ESignalType.Close,
      symbol: this.config.symbol,
      exchange: this.config.exchange,
      positionSide: signal.side,
      price,
      signalId: this.config.signalId,
      signalScale: CLOSING_SCALE_ALL,
      signalConfig: {
        leverage: this.config.leverage,
        indicator: EIndicatorType.Trailing,
        contractValue: this.config.contractValue,
        quantityPrecision: this.config.quantityPrecision,
        pricePrecision: this.config.pricePrecision,
        closeReason: signal.reason,
      },
    };
  }

  private _getEntryAmount(side: EPositionSide, caseNumber: number) {
    const {
      longEntryAmountRate,
      shortEntryAmountRate,
      longEntryAmount,
      shortEntryAmount,
      entryAmountType,
    } = this.config;

    if (entryAmountType === EEntryAmountType.Fixed) {
      const entryAmount = side === EPositionSide.Long ? longEntryAmount : shortEntryAmount;

      return entryAmount[caseNumber - 1];
    }

    const entryAmountRate =
      side === EPositionSide.Short ? longEntryAmountRate : shortEntryAmountRate;

    return entryAmountRate[caseNumber - 1];
  }

  private _initIndicatorInstances() {
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
    this.mainTrailingInstance = new Trailing({
      coefficient: this.config.mainCoefficient,
      previousBar: this.config.trailingPreviousBar,
    });

    this.subTrailingInstance = new Trailing({
      coefficient: this.config.subCoefficient,
      previousBar: this.config.trailingPreviousBar,
    });
  }
}
