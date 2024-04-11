export enum EBollingerBandEntryMode {
  Both = "both",
}

export enum EGridTrendType {
  Middle = "middle",
  Upper = "upper",
  Lower = "lower",
}

export enum EIndicatorType {
  Grid = "grid",
  GridTrailing = "gridTrailing",
  Trailing = "trailing",
  Trailingv2 = "trailingv2",
  Titan = "titan",
  Titanv2 = "titanv2",
  RangeFilterDca = "rangeFilterDca",
  BollingerBand = "bollingerBand",
  RsiDivergence = "rsiDivergence",
  RsiDivergenceAdvanced = "rsiDivergenceAdvanced",
  RsiGrid = "rsiBasedFlexibleGrid",
  RsiGridV2 = "rsiBasedFlexibleGridV2",
  RsiBasedFlexibleGrid = "RsiBasedFlexibleGrid",
}

export enum EntryStatusEnum {
  Pending = "pending",
  Executed = "executed",
  Closing = "closing",
  Closed = "closed",
}

export enum EPositionSide {
  Long = "long",
  Short = "short",
}

export enum EEntryAmountType {
  Fixed = "fixed",
  Rate = "rate",
}

export enum ETPSLMode {
  Fixed = "fixed",
  Normal = "normal",
}

export enum EBacktradeType {
  BollingerBand = "bollinger_band",
  Combination = "combination",
  CombinationV2 = "combination_v2",
  ContinueCandles = "continue_candles",
  FutureMarginArbitrade = "future_margin_arbitrade",
  Grid = "grid",
  GridFibonacci = "grid_fibonacci",
  GridFibonacciOneWay = "grid_fibonacci_one_way",
  MovingAverageDCA = "moving_avarage_dca",
  MovingAverageMartingale = "moving_average_martigale",
  MovingMovingAverageDCA = "moving_moving_avarage_dca",
  RSIDivergenceAdvanced = "rsi_divergence_advanced",
  RSIDivergenceDCA = "rsi_divergence_dca",
  RangeFilterDCA = "range_filter_dca",
  RangeFilterDCAAdvanced = "range_filter_dca_advanced",
  RSIDivergence = "rsi_divergence",
  ScalingDCA = "scaling_dca",
  TitanV1 = "titan_v1",
  TitanV2 = "titan_v2",
  Trailing = "trailing",
  TrailingV2 = "trailing_v2",
  GridTrailing = "grid_trailing",
}

export enum EBacktradeRequestStatus {
  Pending = "pending",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
}
export enum EBacktestRequestStatus {
  Pending = "pending",
  Queued = "queued",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
}

export enum ESignalType {
  Entry = "entry",
  Close = "close",
}

export enum EBollingerBandIndicatorMode {
  ModeUpperLower = "upper_lower",
  ModeMiddle = "middle",
  ModeUpperLowerStraight = "upper_lower_straight",
}

export enum EBollingerBandPriceSignalMode {
  Interval = "interval",
  Ticker = "ticker",
}

export enum ERSISource {
  Close = "close",
  Open = "open",
  High = "high",
  Low = "low",
}
