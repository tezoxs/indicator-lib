import BigNumber from "bignumber.js";
import { EMA } from "technicalindicators";

import { StringNum } from "../types/common.type";
import { Kline, KlineSource } from "../types/kline.type";

type CFBConfig = {
  smoothPrice: boolean;
  period: StringNum;
  multiplier: StringNum;
  offset: StringNum;
  source: KlineSource;
  precision: StringNum;
};

export type CFBResult = {
  filter: StringNum;
  high: StringNum;
  low: StringNum;
};

export default class CFB {
  private config: CFBConfig;
  private emaAvrngInstance: EMA;
  private emaAcInstance: EMA;
  private sourcePrices: any;
  private lastSourcePrice: StringNum;
  private lastFilter: StringNum;
  private maximumPrices: number;
  private results: CFBResult[];

  constructor(config: CFBConfig) {
    this.config = config;

    this.emaAvrngInstance = new EMA({
      period: +config.period,
      values: [],
    });
    this.emaAcInstance = new EMA({
      period: +config.period * 2 - 1,
      values: [],
    });

    this.sourcePrices = [];
    this.lastSourcePrice = 0;
    this.lastFilter = 0;
    this.maximumPrices = 3;
    this.results = [];
  }

  nextValue(bar: Kline) {
    const { source } = this.config;
    const currentPrice = bar[source];
    const sourcePrice = this._calculateSourcePrice(currentPrice);
    const rngSize = this._calculateSmoothRNG(sourcePrice);
    const filter = this._calculateFilter(sourcePrice, rngSize);
    const result = this._calculateResult(filter, rngSize);

    this.lastSourcePrice = sourcePrice;
    this.lastFilter = filter;
    this._updateSourcePriceHistories(currentPrice);

    return result;
  }

  private _calculateSourcePrice(currentPrice: StringNum) {
    const { smoothPrice } = this.config;

    if (!smoothPrice) {
      return currentPrice;
    }

    // Smooth mode
    if (this.sourcePrices.length < this.maximumPrices) {
      return 0;
    }

    const price = BigNumber(this.sourcePrices[2])
      .plus(this.sourcePrices[1])
      .multipliedBy(2)
      .plus(this.sourcePrices[0])
      .plus(currentPrice)
      .dividedBy(6)
      .toFixed();

    return this._roundValue(price);
  }

  private _calculateSmoothRNG(price: StringNum) {
    if (!this.lastSourcePrice) {
      return;
    }

    const priceDiff = BigNumber(price).minus(this.lastSourcePrice).abs().toFixed();
    const avrngEMA = this.emaAvrngInstance.nextValue(parseFloat(priceDiff));

    if (!avrngEMA) {
      return;
    }

    const acEMA = this.emaAcInstance.nextValue(avrngEMA);

    if (!acEMA) {
      return;
    }

    const { multiplier } = this.config;
    const size = BigNumber(acEMA).multipliedBy(multiplier).toFixed();

    return this._roundValue(size);
  }

  private _calculateFilter(price: StringNum, rngSize: StringNum) {
    if (rngSize === undefined) {
      return 0;
    }

    let filter = price;

    if (BigNumber(price).comparedTo(this.lastFilter) > 0) {
      const subPriceSize = BigNumber(price).minus(rngSize);

      filter =
        subPriceSize.comparedTo(this.lastFilter) < 0 ? this.lastFilter : subPriceSize.toFixed();
    } else {
      const addPriceSize = BigNumber(price).plus(rngSize);

      filter =
        addPriceSize.comparedTo(this.lastFilter) > 0 ? this.lastFilter : addPriceSize.toFixed();
    }

    return this._roundValue(filter);
  }

  private _calculateResult(filter: StringNum, rngSize: StringNum) {
    const result: CFBResult = {
      filter,
      high: 0,
      low: 0,
    };
    const { offset } = this.config;

    if (rngSize !== undefined) {
      const high = BigNumber(filter).plus(rngSize).toFixed();
      const low = BigNumber(filter).minus(rngSize).toFixed();

      result.high = this._roundValue(high);
      result.low = this._roundValue(low);
    }

    this.results.push(result);

    if (this.results.length > +offset) {
      return this.results.shift();
    }

    return {
      filter: 0,
      high: 0,
      low: 0,
    };
  }

  private _updateSourcePriceHistories(price: StringNum) {
    this.sourcePrices.push(price);

    if (this.sourcePrices.length > this.maximumPrices) {
      this.sourcePrices.shift();
    }
  }

  private _roundValue(val: StringNum | BigNumber) {
    const { precision } = this.config;
    const roundNum = BigNumber(val).dividedBy(precision).toFixed(0);

    return BigNumber(roundNum).multipliedBy(precision).toFixed();
  }
}
