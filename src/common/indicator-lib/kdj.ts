import BigNumber from 'bignumber.js';

import { StringNum } from '../types/common.type';
import { Kline } from 'common/types/kline.type';

type KDJConfig = {
    period: StringNum;
    signal: StringNum;
    precision: StringNum;
};

export type KDJResult = {
    pk: StringNum;
    pd: StringNum;
    pj: StringNum;
};

export default class KDJ {
    private config: KDJConfig;
    private highs: StringNum[];
    private lows: StringNum[];
    private lastPK: StringNum;
    private lastPD: StringNum;

    constructor(config: KDJConfig) {
        this.config = config;
        this.highs = [];
        this.lows = [];
        this.lastPK = 0;
        this.lastPD = 0;
    }

    nextValue(bar: Kline) {
        const { period } = this.config;

        this.highs.push(bar.high);
        this.lows.push(bar.low);

        if (this.highs.length <= +period) {
            return {
                pk: 0,
                pd: 0,
                pj: 0,
            };
        }

        this.highs.shift();
        this.lows.shift();

        const price = bar.close;
        const highestPrice = BigNumber.max(...this.highs).toFixed();
        const lowestPrice = BigNumber.min(...this.lows).toFixed();
        const priceLowDiff = BigNumber(price).minus(lowestPrice).toFixed();
        const highLowDiff = BigNumber(highestPrice).minus(lowestPrice).toFixed();
        const rsv = BigNumber(priceLowDiff).dividedBy(highLowDiff).multipliedBy(100).toFixed();
        const pk = this._calculateBCWSMA(rsv, this.lastPK);
        const pd = this._calculateBCWSMA(pk, this.lastPD);
        const multipliedPK = BigNumber(3).multipliedBy(pk).toFixed();
        const multipliedPD = BigNumber(2).multipliedBy(pd).toFixed();
        const pj = BigNumber(multipliedPK).minus(multipliedPD).toFixed();

        this.lastPK = pk;
        this.lastPD = pd;

        return {
            pk: this._roundValue(pk),
            pd: this._roundValue(pd),
            pj: this._roundValue(pj),
        };
    }

    private _calculateBCWSMA(val: StringNum, last: StringNum) {
        const subSignal = +this.config.signal - 1;
        const lastMultiplied = BigNumber(subSignal).multipliedBy(last).toFixed();

        return BigNumber(val).plus(lastMultiplied).dividedBy(this.config.signal).toFixed();
    }

    private _roundValue(val: StringNum) {
        const { precision } = this.config;
        const roundNum = BigNumber(val).dividedBy(precision).toFixed(0);

        return BigNumber(roundNum).multipliedBy(precision).toFixed();
    }
}
