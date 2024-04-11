import BigNumber from 'bignumber.js';

export class MovingAvarage {
    private period = undefined;
    private source = undefined;
    private precision = undefined;
    private sourcePrices = [];

    constructor({ period, source, precision }) {
        this.period = period;
        this.source = source;
        this.precision = precision;
    }

    nextValue(bar) {
        const price = bar[this.source];

        this.sourcePrices.push(price);

        if (this.sourcePrices.length < this.period) {
            return;
        }

        if (this.sourcePrices.length > this.period) {
            this.sourcePrices.shift();
        }

        const result = BigNumber.sum(...this.sourcePrices)
            .dividedBy(this.period)
            .toFixed();

        return this._roundValue(result);
    }

    private _roundValue(val) {
        if (!this.precision) {
            return val;
        }

        const roundNum = BigNumber(val).dividedBy(this.precision).toFixed(0, BigNumber.ROUND_HALF_UP);
        return BigNumber(roundNum).multipliedBy(this.precision).toFixed();
    }
}
