import BigNumber from "bignumber.js";

export class Grid {
  private fromPrice = undefined;
  private lineCount = undefined;
  private lineRate = undefined;
  private precision = undefined;

  private grids = [];

  constructor({ fromPrice, lineCount, lineRate, precision }) {
    this.fromPrice = fromPrice;
    this.lineCount = lineCount;
    this.lineRate = lineRate;
    this.precision = precision;

    this._initGrid();
  }

  getCrossedGrids(bar) {
    return this.grids.filter((price) => {
      return this._isPriceInRange(bar, price);
    });
  }

  private _initGrid() {
    for (let i = 0; i < this.lineCount; i++) {
      const lastGridPrice = this._getLastGrid();

      if (!lastGridPrice) {
        this.grids.push(this.fromPrice);
        continue;
      }

      let gridPrice = BigNumber(lastGridPrice)
        .multipliedBy(this.lineRate)
        .plus(lastGridPrice)
        .toFixed();

      gridPrice = this._roundValue(gridPrice);

      this.grids.push(gridPrice);
    }
  }

  private _getLastGrid() {
    return this.grids[this.grids.length - 1];
  }

  private _roundValue(val) {
    const roundNum = BigNumber(val).dividedBy(this.precision).toFixed(0, BigNumber.ROUND_UP);
    return BigNumber(roundNum).multipliedBy(this.precision).toFixed();
  }

  private _isPriceInRange(bar, price) {
    const priceCompareLow = BigNumber(price).comparedTo(bar.low);
    const priceCompareHigh = BigNumber(price).comparedTo(bar.high);

    return priceCompareLow >= 0 && priceCompareHigh <= 0;
  }
}
