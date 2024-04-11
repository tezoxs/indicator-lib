import BigNumber from "bignumber.js";

import { StringNum } from "../types/common.type";

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const intervalToMilliseconds = (interval: string) => {
  const intervalLength = interval.length;
  const intervalType = interval.charAt(intervalLength - 1);
  const numberInterval = parseInt(interval.substring(0, intervalLength - 1), 10);

  switch (intervalType) {
    case "m":
      return numberInterval * 60 * 1000;
    case "h":
      return numberInterval * 60 * 60 * 1000;
    case "d":
      return numberInterval * 24 * 60 * 60 * 1000;
    case "w":
      return numberInterval * 7 * 24 * 60 * 60 * 1000;
    case "M":
      return numberInterval * 30 * 24 * 60 * 60 * 1000;
    default:
      throw new Error("Invalid interval type");
  }
};

export const splitRanges = (
  from: number,
  to: number,
  step: number
): { start: number; end: number }[] => {
  const numberOfTimeParts = Math.ceil((to - from) / step);
  const ranges = [];

  for (let i = 1; i <= numberOfTimeParts; i++) {
    let nextEndTime = from + step;

    if (nextEndTime > to) {
      nextEndTime = to;
    }

    ranges.push({
      start: from,
      end: nextEndTime,
    });

    from = nextEndTime;
  }

  return ranges;
};

export function isValueInRange(value: StringNum, from: StringNum, to: StringNum) {
  return BigNumber(value).isGreaterThanOrEqualTo(from) && BigNumber(value).isLessThanOrEqualTo(to);
}
