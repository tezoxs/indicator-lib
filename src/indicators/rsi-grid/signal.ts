import { RSI } from "technicalindicators";
import { CLOSING_SCALE_ALL } from "common/constants/signal.constant";
import {
  EEntryAmountType,
  EIndicatorType,
  EPositionSide,
  ESignalType,
  ETPSLMode,
} from "common/enum/indicator.enum";
import { StringNum } from "common/types/common.type";
import { isValueInRange } from "common/utils/util";
import BaseIndicator from "indicators/base-indicator";
import { RSIGridConfig } from "./type";
import { Kline } from "common/types/kline.type";

export default class RSIGrid extends BaseIndicator<RSIGridConfig> {
  private rsiInstance: RSI;
  private startZone: number;
  private valueOfZone: number;
  private overBoughtZone: number;
  private overSoldZone: number;
  private didFirstEntry: boolean;
  private didOverDCAZone: boolean;

  constructor(config: RSIGridConfig) {
    super(config);

    this.rsiInstance = new RSI({
      period: Number(config.rsiPeriod),
      values: [],
    });
    this.valueOfZone = 100 / this.config.numberOfZone;
    this.didOverDCAZone = false;
    this.didFirstEntry = false;
  }

  nextSignal(bar: Kline) {
    const signalPrice = bar.close;
    const rsiValue = this.rsiInstance.nextValue(Number(signalPrice));

    if (bar.isInitBar || !rsiValue) {
      return;
    }

    this._initZoneIfNeed(rsiValue);

    const positions = this._getPositions(rsiValue, signalPrice);

    if (!positions.length) {
      return [];
    }

    const currentZone = this._getZone(rsiValue);
    const signalConfig: any = {
      indicator: EIndicatorType.RsiGrid,
      leverage: this.config.leverage,
      maximumEntry: Infinity,
      maximumDca: 1,
      amountType: this.config.entryAmountType,
      entryAmount:
        this.config.entryAmountType === EEntryAmountType.Rate
          ? this.config.entryAmountRate
          : this.config.entryAmount,
      pricePrecision: this.config.pricePrecision,
      quantityPrecision: this.config.quantityPrecision,
      contractValue: this.config.contractValue,
      caseNumber: currentZone,
      multipleCase: !!this.config.multipleEntry,
      dcaMultipliedRates: 1,
      zoneName: this._getZoneName(currentZone),
      rsiValue,
      tpslMode: this.config.tpslMode,
    };

    if (signalConfig.tpslMode !== ETPSLMode.Normal) {
      signalConfig["takeProfitRate"] = this.config.takeProfitRate;
      signalConfig["stopLossRate"] = this.config.stopLossRate;
    }

    const signalTypes = this._getSignalTypes(currentZone);
    const signals = [];

    signalTypes.forEach((signalType) => {
      positions.forEach((position) => {
        const positionSide = this._getPositionSide(position.positionSide);

        signals.push({
          type: signalType,
          symbol: this.config.symbol,
          exchange: this.config.exchange,
          positionSide,
          price: position.price,
          signalId: this.config.signalId,
          signalConfig,
          signalScale: CLOSING_SCALE_ALL,
        });
      });
    });

    return signals;
  }

  private _initZoneIfNeed(rsiValue: number) {
    if (this.startZone) {
      return;
    }

    this.startZone = this._calculateZone(rsiValue);
    this._setOverZone();
  }

  private _getZone(rsiValue: number) {
    if (this.config.enableOverbought && rsiValue > this.config.overboughtLevel) {
      return this.overBoughtZone;
    }

    if (this.config.enableOversold && rsiValue <= this.config.oversoldLevel) {
      return this.overSoldZone;
    }

    const zone = this._calculateZone(rsiValue);
    if (
      zone >= this.startZone + Number(this.config.dcaZone) ||
      zone <= this.startZone - this.config.dcaZone
    ) {
      this.didOverDCAZone = true;
    }

    return zone;
  }

  private _calculateZone(rsiValue: number) {
    return Math.ceil(rsiValue / this.valueOfZone);
  }

  private _setOverZone() {
    const { enableOverbought, overboughtLevel, enableOversold, oversoldLevel } = this.config;

    if (enableOverbought) {
      const currentZone = this._calculateZone(overboughtLevel);
      const minValueOfZone = (currentZone - 1) * this.valueOfZone;

      this.overBoughtZone = currentZone;

      if (this.config.overboughtLevel > minValueOfZone) {
        const minValueOfNextZone = this.valueOfZone * currentZone;
        this.config.overboughtLevel = minValueOfNextZone;
        this.overBoughtZone = currentZone + 1;
      }
    }

    if (enableOversold) {
      const currentZone = this._calculateZone(oversoldLevel);
      const maxValueOfZone = currentZone * this.valueOfZone;

      this.overSoldZone = currentZone;

      if (this.config.oversoldLevel < maxValueOfZone) {
        const maxValueOfPrevZone = (currentZone - 1) * this.valueOfZone;
        this.config.oversoldLevel = maxValueOfPrevZone;
        this.overSoldZone = currentZone - 1;
      }
    }
  }

  private _getZoneName(zone: number) {
    switch (zone) {
      case this.overBoughtZone:
        return "OVERBOUGHT ZONE";
      case this.overSoldZone:
        return "OVERSOLD ZONE";
      default:
        return "NORMAL ZONE";
    }
  }

  private _getSignalTypes(zone: number) {
    const types: ESignalType[] = [];
    const { closeZone, entryZone } = this.config;

    if (this.config.tpslMode !== ETPSLMode.Fixed) {
      if (zone <= this.startZone - closeZone || zone >= this.startZone + Number(closeZone)) {
        types.push(ESignalType.Close);
      } else if (this.didOverDCAZone && zone == this.startZone) {
        this.didOverDCAZone = false;
        types.push(ESignalType.Close);
      }
    }

    if (
      zone >= this.startZone + Number(entryZone) ||
      zone <= this.startZone - entryZone ||
      !this.didFirstEntry
    ) {
      this.didFirstEntry = true;
      types.push(ESignalType.Entry);
    }

    return types;
  }

  private _getPositions(rsiValue: number, signalPrice: StringNum) {
    const { longRangeFrom, longRangeTo, shortRangeFrom, shortRangeTo } = this.config;
    const positions = [];

    if (isValueInRange(rsiValue, shortRangeFrom, shortRangeTo)) {
      positions.push({
        positionSide: EPositionSide.Short,
        price: signalPrice,
      });
    }

    if (isValueInRange(rsiValue, longRangeFrom, longRangeTo)) {
      positions.push({
        positionSide: EPositionSide.Long,
        price: signalPrice,
      });
    }

    return positions;
  }

  private _getPositionSide(positionSide: EPositionSide) {
    let signalPositionSide = positionSide;

    if (this.config.reverse) {
      signalPositionSide =
        signalPositionSide == EPositionSide.Long ? EPositionSide.Short : EPositionSide.Long;
    }

    return signalPositionSide;
  }
}
