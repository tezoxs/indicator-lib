import { ExchangeSignalType } from "common/enum/exchange.enum";

export type ExchangeSignal = {
  type: ExchangeSignalType;
  data: object;
};
