import BigNumber from 'bignumber.js';
import { EMA } from 'technicalindicators';

import { StringNum } from '../types/common.type';
import { Kline, KlineSource } from '../types/kline.type';

type RangeFilterConfig = {
    source: KlineSource;
    period: StringNum;
    multiplier: StringNum;
    precision: StringNum;
};

export type RangeFilterResult = {
    highBand: StringNum;
    lowBand: StringNum;
    filter: StringNum;
    isUpTrend: boolean;
};

export default class RangeFilter {
    private config: RangeFilterConfig;
    private emaAvrngInstance: EMA;
    private emaAcInstance: EMA;
    private lastSourcePrice: StringNum;
    private lastFilter: any;

    constructor(config: RangeFilterConfig) {
        this.config = config;
        this.emaAvrngInstance = new EMA({
            period: +this.config.period,
            values: [],
        });
        this.emaAcInstance = new EMA({
            period: +this.config.period * 2 - 1,
            values: [],
        });

        this.lastSourcePrice = 0;
        this.lastFilter = {};
    }

    nextValue(bar: Kline) {
        const { source } = this.config;

        const sourcePrice = bar[source];

        const rngSize = this._calculateSize(sourcePrice);

        const rngFilter = this._calculateFilter(sourcePrice, rngSize);

        this.lastSourcePrice = sourcePrice;
        this.lastFilter = rngFilter;

        return rngFilter;
    }

    private _calculateSize(price: StringNum) {
        if (!this.lastSourcePrice) {
            return 0;
        }

        const priceDiff = BigNumber(price).minus(this.lastSourcePrice).abs().toFixed();
        const avrngEMA = this.emaAvrngInstance.nextValue(parseFloat(priceDiff));

        if (!avrngEMA) {
            return 0;
        }

        const acEMA = this.emaAcInstance.nextValue(avrngEMA);

        if (!acEMA) {
            return 0;
        }

        const { multiplier } = this.config;
        const size = BigNumber(acEMA).multipliedBy(multiplier).toFixed();

        return this._roundValue(size);
    }

    private _calculateFilter(sourcePrice: StringNum, rngSize: StringNum) {
        const lastFilter = this.lastFilter.filter || sourcePrice;
        let rfilt = BigNumber(lastFilter);

        if (!rngSize) {
            return {
                highBand: 0,
                lowBand: 0,
                filter: this._roundValue(rfilt),
                isUpTrend: this.lastFilter.isUpTrend,
            };
        }

        const subPriceSize = BigNumber(sourcePrice).minus(rngSize);
        const addPriceSize = BigNumber(sourcePrice).plus(rngSize);

        if (subPriceSize.comparedTo(lastFilter) > 0) {
            rfilt = subPriceSize;
        }

        if (addPriceSize.comparedTo(lastFilter) < 0) {
            rfilt = addPriceSize;
        }

        const highBand = rfilt.plus(rngSize);
        const lowBand = rfilt.minus(rngSize);
        const isUpTrend = this._calculateTrend(rfilt);

        return {
            highBand: this._roundValue(highBand),
            lowBand: this._roundValue(lowBand),
            filter: this._roundValue(rfilt),
            isUpTrend,
        };
    }

    private _calculateTrend(rngFilter: StringNum | BigNumber) {
        const comparedPrev = BigNumber(rngFilter).comparedTo(this.lastFilter.filter);

        if (comparedPrev == 0) {
            return this.lastFilter.isUpTrend;
        }

        return comparedPrev > 0;
    }

    private _roundValue(val: string | number | BigNumber) {
        const { precision } = this.config;
        const roundNum = BigNumber(val).dividedBy(precision).toFixed(0);

        return BigNumber(roundNum).multipliedBy(precision).toFixed();
    }
}
