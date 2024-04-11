import BigNumber from "bignumber.js";

import { StringNum } from "../types/common.type";
import { Kline } from "common/types/kline.type";

type TrailingConfig = {
  coefficient: StringNum;
  previousBar: StringNum;
};

export type TrailingResult = {
  nrtr: StringNum;
  trend: StringNum;
};

export default class Trailing {
  private config: TrailingConfig;
  private hp: StringNum;
  private lp: StringNum;
  private trend: StringNum;
  private nrtrs: StringNum[];
  private prices: StringNum[];
  private previousTrend: StringNum;
  public nrtr: StringNum;

  constructor(config: TrailingConfig) {
    this.config = config;

    this.hp = 0;
    this.lp = 0;
    this.trend = 0;
    this.nrtr = 0;
    this.previousTrend = 0;

    this.nrtrs = [];
    this.prices = [];
  }

  nextValue(bar: Kline) {
    this.previousTrend = this.trend;
    this.nrtr = this._calculateNrtr(bar.close);

    this._logPrice(bar.close);
    this._logsNrtr(this.nrtr);

    return {
      nrtr: this.nrtr,
      trend: this.trend,
    };
  }

  isCrossDown(price: StringNum) {
    return this.trend > this.previousTrend && BigNumber(price).isGreaterThan(this.nrtr);
  }

  isCrossUp(price: StringNum) {
    return this.trend < this.previousTrend && BigNumber(price).isLessThan(this.nrtr);
  }

  private _calculateNrtr(close: StringNum) {
    const { coefficient } = this.config;
    const percentage = +coefficient * 0.01;
    let nrtr;

    if (+this.trend >= 0) {
      if (BigNumber(close).isGreaterThan(this.hp) || !this.hp) {
        this.hp = close;
      }

      nrtr = BigNumber(this.hp)
        .multipliedBy(1 - percentage)
        .toFixed();

      if (BigNumber(close).isLessThanOrEqualTo(nrtr)) {
        this.trend = -1;
        this.lp = close;
        nrtr = BigNumber(this.lp)
          .multipliedBy(1 + percentage)
          .toFixed();
      }

      return nrtr;
    }

    if (BigNumber(close).isLessThan(this.lp) || !this.lp) {
      this.lp = close;
    }

    nrtr = BigNumber(this.lp)
      .multipliedBy(1 + percentage)
      .toFixed();

    if (BigNumber(close).isGreaterThan(nrtr)) {
      this.trend = 1;
      this.hp = close;
      nrtr = BigNumber(this.hp)
        .multipliedBy(1 - percentage)
        .toFixed();
    }

    return nrtr;
  }

  private _logsNrtr(value: StringNum) {
    const { previousBar } = this.config;

    this.nrtrs.push(value);

    if (this.nrtrs.length > +previousBar) {
      this.nrtrs.shift();
    }
  }

  private _logPrice(price: StringNum) {
    const { previousBar } = this.config;

    this.prices.push(price);

    if (this.prices.length > +previousBar) {
      this.prices.shift();
    }
  }

  priceGoUpThenDown() {
    const { previousBar } = this.config;
    let firstDown = false;
    let goUp = false;
    let secondsDown = false;

    for (let i = 0; i < +previousBar; i++) {
      const nrtr = this.nrtrs[i];
      const price = this.prices[i];

      if (BigNumber(price).isLessThan(nrtr) && !firstDown) {
        firstDown = true;
      }

      if (firstDown && !goUp) {
        goUp = BigNumber(price).isGreaterThan(nrtr);
        secondsDown = false;
      }

      if (goUp) {
        secondsDown = BigNumber(price).isLessThan(nrtr);
      }
    }

    return secondsDown;
  }
}
