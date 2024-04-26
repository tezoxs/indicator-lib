import { Kline, Orderbook } from "../common/types/kline.type";
import { SignalResult, StringNum } from "../common/types/common.type";
import { EOrderMode } from "common/enum/order.enum";
import { EPositionSide, ESignalType } from "common/enum/indicator.enum";
import { ExchangeSignal } from "common/types/signal";
import { EExchangeMode, ExchangeSignalType } from "common/enum/exchange.enum";
import * as EventEmitter from "events";

export default abstract class BaseIndicator extends EventEmitter {
  protected config: any;
  protected orderbook: Orderbook;

  constructor(config: any) {
    super();
    this.config = config;
    this.config.entryOrderType = config.entryOrderType || EOrderMode.MARKET;
    this.config.closeOrderType = config.closeOrderType || EOrderMode.MARKET;
    this.orderbook = null;
  }

  abstract nextSignal(bar: Kline, conditions?: any): SignalResult[];

  abstract handleExchangeSignal(data: any): void;

  setOrderbook(orderbook: Orderbook): void {
    this.orderbook = orderbook;
  }

  getSignalPrice(signalType: ESignalType, price: StringNum, positionSide: EPositionSide) {
    let signalPrice = price;

    if (
      (this.config.entryOrderType == EOrderMode.LIMIT && signalType == ESignalType.Entry) ||
      (this.config.closeOrderType == EOrderMode.LIMIT && signalType == ESignalType.Close)
    ) {
      signalPrice = this._getPriceBySignalTypeAndPositionSide(signalType, positionSide);
    }

    return signalPrice;
  }

  isValidExchangeSignal(exchangeSignal: ExchangeSignal) {
    if (exchangeSignal.type == ExchangeSignalType.Kline) {
      return this._validateKlineExchangeSignal(exchangeSignal);
    }

    if (exchangeSignal.type == ExchangeSignalType.Order) {
      return this._validateOrderExchangeSignal(exchangeSignal);
    }

    if (exchangeSignal.type == ExchangeSignalType.Price) {
      return this._validatePriceExchangeSignal(exchangeSignal);
    }
  }

  updateConfig(configs: any) {
    Object.assign(this.config, configs);
  }

  private _getPriceBySignalTypeAndPositionSide(
    signalType: ESignalType,
    positionSide: EPositionSide
  ) {
    const orderbookBestOffer = this._getOrderbookBestOffer();
    const { bidPrice, askPrice } = orderbookBestOffer;

    if (signalType == ESignalType.Entry) {
      return positionSide == EPositionSide.Long ? bidPrice : askPrice;
    }

    return positionSide == EPositionSide.Long ? askPrice : bidPrice;
  }

  private _getOrderbookBestOffer() {
    const { bids, asks } = this.orderbook;
    const topBid = bids[0];
    const topAsk = asks[0];

    return {
      bidPrice: topBid?.price,
      askPrice: topAsk?.price,
    };
  }

  private _validateKlineExchangeSignal(exchangeSignal: ExchangeSignal) {
    const signalData: any = exchangeSignal.data;

    return (
      signalData.mode == EExchangeMode.FUTURE &&
      signalData.exchange == this.config.signalExchange &&
      signalData.symbol == this.config.signalSymbol &&
      signalData.interval == this.config.interval
    );
  }

  private _validateOrderExchangeSignal(exchangeSignal: ExchangeSignal) {
    const signalData: any = exchangeSignal.data;

    return (
      signalData.accountType == this.config.accountType &&
      signalData.accountId == this.config.accountId &&
      signalData.accountApiId == this.config.accountApiId
    );
  }

  private _validatePriceExchangeSignal(exchangeSignal: ExchangeSignal) {
    const signalData: any = exchangeSignal.data;

    return (
      signalData.mode == EExchangeMode.FUTURE &&
      signalData.exchange == this.config.signalExchange &&
      signalData.symbol == this.config.signalSymbol
    );
  }
}
