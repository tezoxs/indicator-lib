import TrailingSignalV2 from "indicators/trailing-v2/signal";
import TitanV2 from "indicators/titan-v2/signal";
import BollingerBand from "indicators/bollinger-band/signal";
import RangeFilterDCA from "indicators/range-filter-dca/signal";
import RSIDivergenceAdvancedSignal from "indicators/rsi-devergence-advanced/signal";
import RSIDivergenceSignal from "indicators/trailing/signal";
import RSIGrid from "indicators/rsi-grid/signal";
import RSIGridV2 from "indicators/rsi-grid-v2/signal";
import TrailingSignal from "indicators/trailing/signal";
import { EIndicatorType } from "common/enum/indicator.enum";
import BaseIndicator from "indicators/base-indicator";

export class Indicator {
  static getInstance(config: any): BaseIndicator {
    switch (config.type) {
      case EIndicatorType.Trailing:
        return new TrailingSignal(config);
      case EIndicatorType.Trailingv2:
        return new TrailingSignalV2(config);
      case EIndicatorType.Titanv2:
        return new TitanV2(config);
      case EIndicatorType.RangeFilterDca:
        return new RangeFilterDCA(config);
      case EIndicatorType.RsiDivergence:
        return new RSIDivergenceSignal(config);
      case EIndicatorType.RsiDivergenceAdvanced:
        return new RSIDivergenceAdvancedSignal(config);
      case EIndicatorType.RsiBasedFlexibleGrid:
        return new RSIGrid(config);
      case EIndicatorType.RsiGridV2:
        return new RSIGridV2(config);
      case EIndicatorType.BollingerBand:
        return new BollingerBand(config);
    }

    throw new Error("Indicator Not Found");
  }
}
