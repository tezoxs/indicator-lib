export enum EChartMode {
    Spot = 'spot',
    Future = 'future',
    Forex = 'forex',
}

export enum EExchangeType {
    Spot = 'spot',
    Future = 'future',
}

export enum EExchange {
    Binance = 'binance',
    Bitget = 'bitget',
    Bybit = 'bybit',
    Okx = 'okx',
    Bingx = 'bingx',
    Gateio = 'gateio',
    Upbit = 'upbit',
}

export const Exchanges = [
    EExchange.Binance,
    EExchange.Bitget,
    EExchange.Bybit,
    EExchange.Okx,
    EExchange.Bingx,
    EExchange.Gateio,
    EExchange.Upbit,
];

export enum EMaximumEntryMode {
    Separate = 'separate',
}

export enum EOpenningSignalType {
    Main = 'main',
    Sub = 'sub',
}
