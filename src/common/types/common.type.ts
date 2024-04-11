import { EExchange } from '../enum/exchange.enum';
import { EPositionSide, ESignalType } from '../enum/indicator.enum';

export type StringNum = string | number;

export type SignalResult = {
    id?: string;
    type: ESignalType;
    exchange: EExchange;
    symbol: string;
    positionSide: EPositionSide;
    price: string;
    signalConfig?: any;
    signalScale?: string;
    signalId?: number;
};
