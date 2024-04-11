import { EPositionSide } from '../enum/indicator.enum';
import { EOrderType } from '../enum/order.enum';

export interface IOrderLog {
    executedPrice?: string;
    type?: EOrderType;
    side?: EPositionSide;
    executedContract?: string;
    logNo: number;
    fromLogNo?: number;
    executedAt: number;
    fee: string;
    pnl?: string;
    closeReason?: string;
    positionClosedTime?: number;
    executedAmount: string;
    entryType?: any;
    symbol: string;
    reEntryTime?: number;
    dcaTimes?: number;
    signalZoneId?: number;
    hitDcaStopLoss?: any;
}
