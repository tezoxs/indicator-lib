export interface IParamKlines {
    symbol: string;
    interval: string;
    startTime?: number;
    endTime?: number;
}

export interface IParamGetKlines {
    symbol?: string;
    interval?: string | number;
    limit?: number;
    startTime?: number;
    endTime?: number;
    granularity?: string;
    category?: string;
    contract?: string;
    from?: number;
    to?: number;
    currency_pair?: string;
    instId?: string;
    bar?: string;
    before?: number;
    after?: number;
    start?: number;
    end?: number;
}
