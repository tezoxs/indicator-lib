import { Kline } from "../common/types/kline.type";
import { SignalResult } from "../common/types/common.type";

export default abstract class BaseIndicator {
  protected config: any;
  constructor(config: any) {
    this.config = config;
  }

  abstract nextSignal(bar: Kline, isIntervalBar?: boolean): SignalResult[];
}
