import BigNumber from "bignumber.js";
import { Kline } from "common/types/kline.type";
import { CLOSING_SCALE_ALL } from "common/constants/signal.constant";
import {
  EEntryAmountType,
  EIndicatorType,
  EPositionSide,
  ESignalType,
  ETPSLMode,
} from "common/enum/indicator.enum";
import CFB, { CFBResult } from "common/indicator-lib/cfb";
import RangeFilter, { RangeFilterResult } from "common/indicator-lib/range-filter";
import Trailing, { TrailingResult } from "common/indicator-lib/trailing";
import { SignalResult } from "common/types/common.type";

import BaseIndicator from "../base-indicator";
import { TitanV2Config, TitanV2OpenSignal } from "./type";

export default class TitanV2 extends BaseIndicator<TitanV2Config> {
  private cfbInstance: CFB;
  private rfInstance: RangeFilter;
  private trailingInstance: Trailing;
  private previousRF: RangeFilterResult;
  private previousCFB: CFBResult;

  constructor(config: TitanV2Config) {
    super(config);

    this._initIndicatorInstances();
    this.previousRF = {} as RangeFilterResult;
    this.previousCFB = {} as CFBResult;
  }

  nextSignal(bar: Kline) {
    const rfValue = this.rfInstance.nextValue(bar);
    const cfbValue = this.cfbInstance.nextValue(bar);
    const trailingValue = this.trailingInstance.nextValue(bar);

    const openingSignal = this._nextEntrySignal(rfValue, cfbValue, trailingValue, bar.close);
    const closingSignal = this._nextClosingSignal(rfValue, cfbValue, bar.close);

    let signals: SignalResult[] = [];

    if (closingSignal) {
      signals.push(closingSignal);
    }

    if (!openingSignal.length) {
      signals = signals.concat(openingSignal);
    }

    this.previousRF = rfValue;
    this.previousCFB = cfbValue;

    return signals;
  }

  private _nextEntrySignal(
    rfValue: RangeFilterResult,
    cfbValue: CFBResult,
    trailingValue: TrailingResult,
    price: string
  ) {
    let signal = this._getLongSignal(rfValue, cfbValue, trailingValue, price);

    if (!signal.caseNumbers.length) {
      signal = this._getShortSignal(rfValue, cfbValue, trailingValue, price);
    }

    return this._formatEntrySignal(signal);
  }

  private _nextClosingSignal(rfValue: RangeFilterResult, cfbValue: CFBResult, price: string) {
    if (this.config.tpslMode == ETPSLMode.Fixed) {
      return;
    }

    let positionSide = null;

    if (
      (!rfValue.isUpTrend && this.trailingInstance.isCrossUp(price)) ||
      this._isRFCrossDownCFB(rfValue.filter, cfbValue.filter)
    ) {
      positionSide = EPositionSide.Long;
    } else if (
      (rfValue.isUpTrend && this.trailingInstance.isCrossDown(price)) ||
      this._isRFCrossUpCFB(rfValue.filter, cfbValue.filter)
    ) {
      positionSide = EPositionSide.Short;
    }

    return this._formatClosingSignal(positionSide, price);
  }

  private _getLongSignal(
    rfValue: RangeFilterResult,
    cfbValue: CFBResult,
    trailingValue: TrailingResult,
    price: string
  ) {
    const signal: TitanV2OpenSignal = {
      positionSide: EPositionSide.Long,
      caseNumbers: [],
      price,
    };

    if (this._isRFCrossUpCFB(rfValue.filter, cfbValue.filter)) {
      signal.caseNumbers.push(1);
    }

    if (
      BigNumber(price).isLessThanOrEqualTo(trailingValue.nrtr) ||
      BigNumber(rfValue.filter).isLessThanOrEqualTo(cfbValue.filter)
    ) {
      return signal;
    }

    if (!this.previousRF.isUpTrend && rfValue.isUpTrend) {
      signal.caseNumbers.push(2);
    }

    if (this.trailingInstance.isCrossDown(price)) {
      signal.caseNumbers.push(3);
    }

    return signal;
  }

  private _getShortSignal(
    rfValue: RangeFilterResult,
    cfbValue: CFBResult,
    trailingValue: TrailingResult,
    price: string
  ) {
    const signal: TitanV2OpenSignal = {
      positionSide: EPositionSide.Short,
      caseNumbers: [],
      price,
    };

    if (this._isRFCrossDownCFB(rfValue.filter, cfbValue.filter)) {
      signal.caseNumbers.push(1);
    }

    if (BigNumber(price).isGreaterThanOrEqualTo(trailingValue.nrtr) || rfValue.isUpTrend) {
      return signal;
    }

    if (this.previousRF.isUpTrend && BigNumber(rfValue.filter).isLessThan(cfbValue.filter)) {
      signal.caseNumbers.push(2);
    }

    if (this.trailingInstance.isCrossUp(price)) {
      signal.caseNumbers.push(3);
    }

    return signal;
  }

  private _isRFCrossUpCFB(rfValueFilter: any, cfbValueFilter: any) {
    return (
      BigNumber(this.previousRF.filter).isLessThan(this.previousCFB.filter) &&
      BigNumber(rfValueFilter).isGreaterThan(cfbValueFilter)
    );
  }

  private _isRFCrossDownCFB(rfValueFilter: any, cfbValueFilter: any) {
    return (
      BigNumber(this.previousRF.filter).isGreaterThan(this.previousCFB.filter) &&
      BigNumber(rfValueFilter).isLessThan(cfbValueFilter)
    );
  }

  private _formatEntrySignal(entrySignal: TitanV2OpenSignal) {
    const signals = [];
    const {
      contractValue,
      quantityPrecision,
      pricePrecision,
      multipleEntry,
      isOneWayMode,
      oneWaySignalSide,
      entryAmountType,
      strictMode,
      tpslMode,
      maximumEntry,
      multipleCase,
      leverage,
      exchange,
      symbol,
      signalId,
    } = this.config;

    if (isOneWayMode && entrySignal.positionSide !== oneWaySignalSide) {
      return [];
    }

    const signalConfig = {
      leverage,
      indicator: EIndicatorType.Titanv2,
      contractValue,
      quantityPrecision,
      pricePrecision,
      maximumEntry,
      strictMode,
      tpslMode,
      multipleCase,
      amountType: entryAmountType,
    };

    if (this.config.tpslMode !== ETPSLMode.Normal) {
      signalConfig["takeProfitRate"] = this.config.takeProfitRate;
      signalConfig["stopLossRate"] = this.config.stopLossRate;
    }

    const validCaseNumbers = multipleEntry
      ? entrySignal.caseNumbers
      : entrySignal.caseNumbers.slice(0, 1);

    const positionSide = entrySignal.positionSide;

    for (const caseNumber of validCaseNumbers) {
      signals.push({
        type: ESignalType.Entry,
        exchange,
        symbol: symbol,
        positionSide,
        signalId,
        price: entrySignal.price,
        signalConfig: {
          ...signalConfig,
          caseNumber,
          entryAmount: this._getEntryAmount(positionSide, caseNumber),
        },
      });
    }

    return signals;
  }

  private _formatClosingSignal(positionSide: EPositionSide, price: string) {
    if (!positionSide) {
      return;
    }

    return {
      type: ESignalType.Close,
      symbol: this.config.symbol,
      exchange: this.config.exchange,
      positionSide: positionSide,
      price,
      signalId: this.config.signalId,
      signalScale: CLOSING_SCALE_ALL,
      signalConfig: {
        leverage: this.config.leverage,
        indicator: EIndicatorType.Titanv2,
      },
    } as SignalResult;
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
    this.cfbInstance = new CFB({
      smoothPrice: this.config.cfbSmoothPrice,
      period: this.config.cfbPeriod,
      multiplier: this.config.cfbMultiplier,
      offset: this.config.cfbOffset,
      source: this.config.cfbSource,
      precision: this.config.pricePrecision,
    });
    this.rfInstance = new RangeFilter({
      source: this.config.rangeFilterSource,
      period: +this.config.rangeFilterPeriod,
      multiplier: this.config.rangeFilterMultiplier,
      precision: this.config.pricePrecision,
    });
    this.trailingInstance = new Trailing({
      coefficient: this.config.trailingCoefficient,
      previousBar: this.config.trailingPeriod,
    });
  }
}
