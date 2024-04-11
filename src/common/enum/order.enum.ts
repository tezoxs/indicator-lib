export enum EEntryStatus {
  Pending = "pending",
  Executed = "executed",
  Closing = "closing",
  Closed = "closed",
}

export enum EOrderType {
  Entry = "entry",
  TakeProfit = "take_profit",
  StopLoss = "stop_loss",
  DcaStopLoss = "dca_stop_loss",
  TrailingStopLoss = "trailing_stop_loss",
  Dca = "dca",
}

export enum ETPSLMode {
  Fixed = "fixed",
  Normal = "normal",
}

export enum EBacktradeRequestStatus {
  Pending = "pending",
  Queued = "queued",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
  Cancelling = "cancelling",
  Cancelled = "cancelled",
}

export enum EPhaseMode {
  Dca = "PHASE_MODE_DCA",
  Trailing = "PHASE_MODE_TRAILING",
  ZoneStoploss = "PHASE_MODE_ZONE_STOPLOSS",
  DCACaseNumber = "DCA_CASE_NUMBER",
}

export enum EOrderMode {
  LIMIT = "limit",
  MARKET = "market",
}
