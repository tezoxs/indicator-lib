import { Kline } from "../common/types/kline.type";
import { SignalResult } from "../common/types/common.type";

export default abstract class BaseIndicator<T> {
  protected config: T;
  constructor(config: T) {
    this.config = config;
  }

  abstract nextSignal(bar: Kline, isIntervalBar?: boolean): SignalResult[];
}
