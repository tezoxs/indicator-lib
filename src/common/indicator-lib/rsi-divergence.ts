import BigNumber from "bignumber.js";
import { ATR, RSI } from "technicalindicators";

import { StringNum } from "../types/common.type";
import { Kline } from "common/types/kline.type";

type RSIDivergenceConfig = {
  rsiSource: StringNum;
  rsiPeriod: number;
  overboughtLevel: number;
  oversoldLevel: number;
  shortPeriod: number;
  longPeriod: number;
  atrReversalMultiplier: StringNum;
  alertPeriod: number;
  precision: StringNum;
};

export default class RSIDivergence {
  private config: RSIDivergenceConfig;
  private sources: StringNum[];
  private rsiValues: StringNum[];
  private rsiInstance: RSI;
  private atrInstance: ATR;
  private maxHistoryLength: number;
  private bullCount: number;
  private bearCount: number;

  constructor(config: RSIDivergenceConfig) {
    this.config = config;
    this.maxHistoryLength = this.config.shortPeriod + this.config.longPeriod;

    this.rsiInstance = new RSI({
      period: this.config.rsiPeriod,
      values: [],
    });
    this.atrInstance = new ATR({
      period: this.config.rsiPeriod,
      high: [],
      low: [],
      close: [],
    });

    this.sources = [];
    this.rsiValues = [];

    this.bullCount = undefined;
    this.bearCount = undefined;
  }

  nextValue(bar: Kline) {
    const sourceValue = this._getRSISource(bar);
    const rsiValue = this._getRsiValue(sourceValue);
    const atrValue = this._getAtrValue(bar);

    this._handleSourceValue(sourceValue);
    this._handleRsiValue(rsiValue);

    if (!rsiValue || !atrValue) {
      return {
        sourceValue,
        rsiValue,
        atrValue,
        bull: false,
        bear: false,
      };
    }

    const bull = this._nextBullSignal(sourceValue, rsiValue, atrValue);
    const bear = this._nextBearSignal(sourceValue, rsiValue, atrValue);

    return {
      sourceValue,
      rsiValue,
      atrValue,
      bull,
      bear,
    };
  }

  private _nextBullSignal(source: StringNum, rsi: StringNum, atr: StringNum) {
    const { shortPeriod, longPeriod, oversoldLevel, alertPeriod } = this.config;
    const lowestSourceShort = this._getTopValue(this.sources, shortPeriod, "min");
    const lowestSourceLong = this._getTopValue(this.sources, longPeriod, "min", shortPeriod);
    const lowestRsiShort = this._getTopValue(this.rsiValues, shortPeriod, "min");
    const lowestRsiLong = this._getTopValue(this.rsiValues, longPeriod, "min", shortPeriod);
    const srcAtrCompared = BigNumber(lowestSourceShort).plus(atr).comparedTo(source);
    const srcShortLongCompared = BigNumber(lowestSourceShort).comparedTo(lowestSourceLong);
    const rsiShortCompared = BigNumber(rsi).comparedTo(lowestRsiShort);
    const rsiShortLongCompared = BigNumber(lowestRsiShort).comparedTo(lowestRsiLong);
    const shortLevelCompared = BigNumber(lowestRsiShort).comparedTo(oversoldLevel);
    const currentBull =
      srcAtrCompared < 0 &&
      srcShortLongCompared < 0 &&
      rsiShortCompared > 0 &&
      rsiShortLongCompared > 0 &&
      shortLevelCompared < 0;

    if (currentBull) {
      this.bullCount = 0;
    } else if (Number.isInteger(this.bullCount)) {
      this.bullCount++;
    }

    if (this.bullCount !== undefined && this.bullCount < alertPeriod) {
      return true;
    }

    return false;
  }

  private _nextBearSignal(source: StringNum, rsi: StringNum, atr: StringNum) {
    const { shortPeriod, longPeriod, overboughtLevel, alertPeriod } = this.config;
    const highestSourceShort = this._getTopValue(this.sources, shortPeriod, "max");
    const highestSourceLong = this._getTopValue(this.sources, longPeriod, "max", shortPeriod);
    const highestRsiShort = this._getTopValue(this.rsiValues, shortPeriod, "max");
    const highestRsiLong = this._getTopValue(this.rsiValues, longPeriod, "max", shortPeriod);
    const srcAtrCompared = BigNumber(highestSourceShort).minus(atr).comparedTo(source);
    const srcShortLongCompared = BigNumber(highestSourceShort).comparedTo(highestSourceLong);
    const rsiShortCompared = BigNumber(rsi).comparedTo(highestRsiShort);
    const rsiShortLongCompared = BigNumber(highestRsiShort).comparedTo(highestRsiLong);
    const shortLevelCompared = BigNumber(highestRsiShort).comparedTo(overboughtLevel);
    const currentBear =
      srcAtrCompared > 0 &&
      srcShortLongCompared > 0 &&
      rsiShortCompared < 0 &&
      rsiShortLongCompared < 0 &&
      shortLevelCompared > 0;

    if (currentBear) {
      this.bearCount = 0;
    } else if (Number.isInteger(this.bearCount)) {
      this.bearCount++;
    }

    if (this.bearCount !== undefined && this.bearCount < alertPeriod) {
      return true;
    }

    return false;
  }

  private _handleSourceValue(source: StringNum) {
    this.sources.push(source);

    if (this.sources.length > this.maxHistoryLength) {
      this.sources.shift();
    }
  }

  private _handleRsiValue(rsi: StringNum) {
    if (!rsi) {
      return;
    }

    this.rsiValues.push(rsi);

    if (this.rsiValues.length > this.maxHistoryLength) {
      this.rsiValues.shift();
    }
  }

  private _getTopValue(arr: StringNum[], period: number, type: StringNum, offset = 0) {
    const totalLength = period + offset;
    const arrLength = arr.length;

    if (totalLength > arrLength) {
      return;
    }

    const startIndex = arrLength - period - offset;
    const calculateArr = arr.slice(startIndex, startIndex + period);

    if (type == "min") {
      return BigNumber.minimum(...calculateArr).toFixed();
    }

    return BigNumber.maximum(...calculateArr).toFixed();
  }

  private _getRSISource(bar: Kline) {
    const { rsiSource } = this.config;

    switch (rsiSource) {
      case "high":
      case "close":
        return bar[rsiSource];
      case "ohlc4":
        // eslint-disable-next-line no-case-declarations
        const source = BigNumber(bar.open)
          .plus(bar.close)
          .plus(bar.high)
          .plus(bar.low)
          .dividedBy(4)
          .toFixed();
        return this._roundValue(source);
    }
  }

  private _getRsiValue(source: StringNum) {
    const val = this.rsiInstance.nextValue(+source);
    return this._roundValue(val);
  }

  private _getAtrValue(bar: any) {
    const val = this.atrInstance.nextValue(bar);

    if (!val) {
      return;
    }

    const { atrReversalMultiplier } = this.config;
    const multipliedVal = BigNumber(val).multipliedBy(atrReversalMultiplier).toFixed();
    return this._roundValue(multipliedVal);
  }

  private _roundValue(val: StringNum) {
    if (!val) {
      return val;
    }

    const { precision } = this.config;
    const roundNum = BigNumber(val).dividedBy(precision).toFixed(0);

    return BigNumber(roundNum).multipliedBy(precision).toFixed();
  }
}
