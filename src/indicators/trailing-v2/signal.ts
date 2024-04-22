import BigNumber from "bignumber.js";
import BaseIndicator from "indicators/base-indicator";
import { EMA } from "technicalindicators";
import { CLOSING_SCALE_ALL, TRAILING_CLOSING_TYPE } from "common/constants/signal.constant";
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
import { StringNum } from "common/types/common.type";
import { ClosingSignal, TrailingOpenSignal, TrailingV2Config } from "./type";
import { Kline } from "common/types/kline.type";

export default class TrailingSignalV2 extends BaseIndicator {
  protected config: TrailingV2Config;
  private mainRfInstance: RangeFilter;
  private subRfInstance: RangeFilter;
  private cfbInstance: CFB;
  private mainTrailingInstance: Trailing;
  private subTrailingInstance: Trailing;
  private emaInstance: EMA;
  private previousMainRF: RangeFilterResult;
  private previousSubRF: RangeFilterResult;
  private previousCFB: CFBResult;
  private emaValue: number;

  constructor(config: TrailingV2Config) {
    super(config);

    this._initIndicatorInstances();
    this.previousMainRF = {} as RangeFilterResult;
    this.previousSubRF = {} as RangeFilterResult;
    this.previousCFB = {} as CFBResult;
  }

  nextSignal(bar: Kline) {
    const subRfValue = this.subRfInstance.nextValue(bar);
    const mainRfValue = this.mainRfInstance.nextValue(bar);
    const cfbValue = this.cfbInstance.nextValue(bar);

    this.emaValue = this.emaInstance.nextValue(+bar.close);

    this.mainTrailingInstance.nextValue(bar);
    this.subTrailingInstance.nextValue(bar);

    const openingSignal = this._nextEntrySignal(subRfValue, mainRfValue, cfbValue, bar);
    const closingSignal = this._nextClosingSignal(subRfValue, mainRfValue, cfbValue, bar.close);

    let signals = [];

    if (closingSignal) {
      signals.push(closingSignal);
    }

    if (openingSignal.length) {
      signals = signals.concat(openingSignal);
    }

    this.previousMainRF = mainRfValue;
    this.previousSubRF = subRfValue;
    this.previousCFB = cfbValue;

    return signals;
  }

  private _nextClosingSignal(
    subRfValue: RangeFilterResult,
    mainRfValue: RangeFilterResult,
    cfbValue: CFBResult,
    close: string
  ) {
    if (this.config.tpslMode == ETPSLMode.Fixed) {
      return null;
    }

    let closingSignal = this._nextClosingLongSignal(subRfValue, mainRfValue, cfbValue, close);

    if (!closingSignal) {
      closingSignal = this._nextClosingShortSignal(subRfValue, mainRfValue, cfbValue, close);
    }

    return this._formatClosingSignal(closingSignal, close);
  }

  private _nextClosingLongSignal(
    subRfValue: RangeFilterResult,
    mainRfValue: RangeFilterResult,
    cfbValue: CFBResult,
    close: string
  ) {
    //case 1
    if (this._isRFMainCrossDownCFB(mainRfValue.filter, cfbValue.filter)) {
      return this._formatClosingLongSignal(1);
    }
    //case 2
    if (
      BigNumber(close).isLessThan(this.mainTrailingInstance.nrtr) &&
      this._isRFCrossDown(mainRfValue.filter, subRfValue.filter)
    ) {
      return this._formatClosingLongSignal(2);
    }

    //case 3
    if (this.mainTrailingInstance.isCrossUp(close)) {
      return this._formatClosingLongSignal(3);
    }

    //case2
    if (this.subTrailingInstance.isCrossUp(close) && BigNumber(close).isLessThan(this.emaValue)) {
      return this._formatClosingLongSignal(4);
    }
  }

  private _nextClosingShortSignal(
    subRfValue: RangeFilterResult,
    mainRfValue: RangeFilterResult,
    cfbValue: CFBResult,
    close: string
  ) {
    //case 1
    if (this._isRFMainCrossUpCFB(mainRfValue.filter, cfbValue.filter)) {
      return this._formatClosingShortSignal(1);
    }
    //case 2
    if (
      BigNumber(close).isGreaterThan(this.mainTrailingInstance.nrtr) &&
      this._isRFCrossUp(mainRfValue.filter, subRfValue.filter)
    ) {
      return this._formatClosingShortSignal(2);
    }

    //case 3
    if (this.mainTrailingInstance.isCrossDown(close)) {
      return this._formatClosingShortSignal(3);
    }
    //case 4
    if (
      this.subTrailingInstance.isCrossDown(close) &&
      BigNumber(close).isGreaterThan(this.emaValue)
    ) {
      return this._formatClosingShortSignal(4);
    }
  }

  private _nextEntrySignal(
    subRfValue: RangeFilterResult,
    mainRfValue: RangeFilterResult,
    cfbValue: CFBResult,
    bar: Kline
  ) {
    let signal = this._getLongEntrySignal(subRfValue, mainRfValue, cfbValue, bar);

    if (!signal.caseNumbers.length) {
      signal = this._getShortEntrySignal(subRfValue, mainRfValue, cfbValue, bar);
    }

    return this._formatEntrySignal(signal);
  }

  private _getLongEntrySignal(
    subRfValue: RangeFilterResult,
    mainRfValue: RangeFilterResult,
    cfbValue: CFBResult,
    bar: Kline
  ) {
    const rfSubFilter = subRfValue.filter;
    const rfMainFilter = mainRfValue.filter;
    const cfbFilter = cfbValue.filter;
    const mainTrailingValue = this.mainTrailingInstance.nrtr;

    const signal: TrailingOpenSignal = {
      positionSide: EPositionSide.Long,
      caseNumbers: [],
      price: bar.close,
    };

    //case 1
    if (this._isRFMainCrossUpCFB(rfMainFilter, cfbFilter)) {
      signal.caseNumbers.push(1);
    }
    //case 2
    if (
      this._isRFCrossUp(rfMainFilter, rfSubFilter) &&
      BigNumber(bar.close).isGreaterThan(mainTrailingValue)
    ) {
      signal.caseNumbers.push(2);
    }

    if (!mainRfValue.isUpTrend) {
      return signal;
    }

    //case 3
    if (this.mainTrailingInstance.isCrossDown(bar.close)) {
      signal.caseNumbers.push(3);
    }

    //case 4
    if (
      this.subTrailingInstance.isCrossDown(bar.close) &&
      BigNumber(bar.close).isGreaterThan(this.emaValue)
    ) {
      signal.caseNumbers.push(4);
    }

    return signal;
  }

  private _getShortEntrySignal(
    subRfValue: RangeFilterResult,
    mainRfValue: RangeFilterResult,
    cfbValue: CFBResult,
    bar: Kline
  ) {
    const rfSubFilter = subRfValue.filter;
    const rfMainFilter = mainRfValue.filter;
    const cfbFilter = cfbValue.filter;
    const mainTrailingValue = this.mainTrailingInstance.nrtr;

    const signal: TrailingOpenSignal = {
      positionSide: EPositionSide.Long,
      caseNumbers: [],
      price: bar.close,
    };
    //case 1
    if (this._isRFMainCrossDownCFB(rfMainFilter, cfbFilter)) {
      signal.caseNumbers.push(1);
    }
    //case 2
    if (
      this._isRFCrossDown(rfMainFilter, rfSubFilter) &&
      BigNumber(bar.close).isLessThan(mainTrailingValue)
    ) {
      signal.caseNumbers.push(2);
    }

    if (mainRfValue.isUpTrend) {
      return signal;
    }

    //case 3
    if (this.mainTrailingInstance.isCrossUp(bar.close)) {
      signal.caseNumbers.push(3);
    }

    //case 4
    if (
      this.subTrailingInstance.isCrossUp(bar.close) &&
      BigNumber(bar.close).isLessThan(this.emaValue)
    ) {
      signal.caseNumbers.push(4);
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

  private _isRFCrossUp(mainRfValueFilter: StringNum, subRfValueFilter: StringNum) {
    return (
      BigNumber(this.previousMainRF.filter).isLessThan(this.previousSubRF.filter) &&
      BigNumber(mainRfValueFilter).isGreaterThan(subRfValueFilter)
    );
  }

  private _isRFCrossDown(mainRfValueFilter: StringNum, subRfValueFilter: StringNum) {
    return (
      BigNumber(this.previousMainRF.filter).isGreaterThan(this.previousSubRF.filter) &&
      BigNumber(mainRfValueFilter).isLessThan(subRfValueFilter)
    );
  }

  private _isRFMainCrossUpCFB(rfValueFilter: StringNum, cfbValueFilter: StringNum) {
    return (
      BigNumber(this.previousMainRF.filter).isLessThan(this.previousCFB.filter) &&
      BigNumber(rfValueFilter).isGreaterThan(cfbValueFilter)
    );
  }

  private _isRFMainCrossDownCFB(rfValueFilter: StringNum, cfbValueFilter: StringNum) {
    return (
      BigNumber(this.previousMainRF.filter).isGreaterThan(this.previousCFB.filter) &&
      BigNumber(rfValueFilter).isLessThan(cfbValueFilter)
    );
  }

  private _formatEntrySignal(signal: TrailingOpenSignal) {
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
      indicator: EIndicatorType.Trailingv2,
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
      return null;
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
        indicator: EIndicatorType.Trailingv2,
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
    this.mainRfInstance = new RangeFilter({
      source: this.config.mainRangeFilter.source,
      period: this.config.mainRangeFilter.period,
      multiplier: this.config.mainRangeFilter.multiplier,
      precision: this.config.pricePrecision,
    });

    this.subRfInstance = new RangeFilter({
      source: this.config.subRangeFilter.source,
      period: this.config.subRangeFilter.period,
      multiplier: this.config.subRangeFilter.multiplier,
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
      coefficient: this.config.mainCoefficient,
      previousBar: this.config.trailingPreviousBar,
    });

    this.emaInstance = new EMA({
      period: +this.config.emaPeriod,
      values: [],
    });
  }
}
