import BigNumber from "bignumber.js";

import { StringNum } from "../types/common.type";
import { Kline } from "common/types/kline.type";

export function isPriceInRange(bar: Kline, price: StringNum) {
  const priceCompareLow = BigNumber(price).comparedTo(bar.low);
  const priceCompareHigh = BigNumber(price).comparedTo(bar.high);

  return priceCompareLow >= 0 && priceCompareHigh <= 0;
}

export function roundByStep(num, step, roundMode = BigNumber.ROUND_UP) {
  if (BigNumber(step).isZero()) return BigNumber(num).toFixed();

  const roundNum = BigNumber(num).dividedBy(step).toFixed(0, roundMode);
  return BigNumber(roundNum).multipliedBy(step).toFixed();
}

export function isIntersection(prevVal1, prevVal2, currentVal1, currentVal2) {
  const currentDiff = BigNumber(currentVal1).minus(currentVal2);
  const prevDiff = BigNumber(prevVal1).minus(prevVal2);

  if (
    (currentDiff.isPositive() && prevDiff.isPositive()) ||
    (currentDiff.isNegative() && prevDiff.isNegative())
  ) {
    return false;
  }

  return true;
}
