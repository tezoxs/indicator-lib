import { RSI } from "technicalindicators";
import { MaximumDca, RSIGridV2Config } from "./type";
import BaseIndicator from "indicators/base-indicator";
import { Kline } from "common/types/kline.type";
import {
  EEntryAmountType,
  EIndicatorType,
  EPositionSide,
  ESignalType,
  ETPSLMode,
} from "common/enum/indicator.enum";
import { CLOSING_SCALE_ALL } from "common/constants/signal.constant";
import BigNumber from "bignumber.js";
import { isValueInRange } from "common/utils/util";
import { StringNum } from "common/types/common.type";

export default class RSIGridV2 extends BaseIndicator<RSIGridV2Config> {
  private rsiInstance: RSI;
  private valueOfZone: number;
  private overBoughtZone: number;
  private overSoldZone: number;
  private maximumDca: MaximumDca;

  constructor(config: RSIGridV2Config) {
    super(config);

    this.rsiInstance = new RSI({
      period: Number(config.rsiPeriod),
      values: [],
    });
    this.valueOfZone = 100 / this.config.numberOfZone;
    this._initOverZone();
    this._initMaximumDca();
  }

  nextSignal(bar: Kline) {
    const signalPrice = bar.close;
    const rsiValue = this.rsiInstance.nextValue(Number(signalPrice));

    if (bar.isInitBar || !rsiValue) {
      return [];
    }

    const positions = this._getPositions(rsiValue, signalPrice);

    if (!positions.length) {
      return [];
    }

    const currentZone = this._getZone(rsiValue);
    const signalConfig = {
      indicator: EIndicatorType.RsiGridV2,
      leverage: this.config.leverage,
      maximumEntry: Infinity,
      maximumDca: this.maximumDca[currentZone],
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
      zoneName: this._getZoneName(currentZone),
      rsiValue,
      tpslMode: this.config.tpslMode,
      isOverZone: this._isOverZone(currentZone),
      entryZone: Number(this.config.entryZone),
      closeZone: Number(this.config.closeZone),
      dcaZone: Number(this.config.dcaZone),
      numberOfZone: Number(this.config.numberOfZone),
      dcaMultipliedRates: 1,
    };

    if (signalConfig.tpslMode !== ETPSLMode.Normal) {
      signalConfig["takeProfitRate"] = this.config.takeProfitRate;
      signalConfig["stopLossRate"] = this.config.stopLossRate;
    }

    const signalTypes = [ESignalType.Close, ESignalType.Entry];
    const signals = [];

    signalTypes.forEach((signalType) => {
      positions.forEach((position) => {
        const signalPositionSide = this._getPositionSide(position.positionSide);

        signals.push({
          type: signalType,
          symbol: this.config.symbol,
          exchange: this.config.exchange,
          positionSide: signalType === ESignalType.Entry ? signalPositionSide : null,
          price: position.price,
          signalId: this.config.signalId,
          signalConfig,
          signalScale: CLOSING_SCALE_ALL,
        });
      });
    });

    return signals;
  }

  private _getZone(rsiValue: number) {
    if (this.config.enableOverbought && rsiValue > Number(this.config.overboughtLevel)) {
      return this.overBoughtZone;
    }

    if (this.config.enableOversold && rsiValue <= Number(this.config.oversoldLevel)) {
      return this.overSoldZone;
    }

    const zone = this._calculateZone(rsiValue);

    return zone;
  }

  private _calculateZone(rsiValue: number) {
    return Math.ceil(rsiValue / this.valueOfZone);
  }

  private _initOverZone() {
    const { enableOverbought, overboughtLevel, enableOversold, oversoldLevel } = this.config;

    this.overBoughtZone = 0;
    this.overSoldZone = this.config.numberOfZone + 1;

    if (enableOverbought) {
      const currentZone = this._calculateZone(overboughtLevel);
      const minValueOfZone = (currentZone - 1) * this.valueOfZone;

      this.overBoughtZone = currentZone;

      if (BigNumber(overboughtLevel).comparedTo(minValueOfZone) == 1) {
        const minValueOfNextZone = this.valueOfZone * currentZone;
        this.config.overboughtLevel = minValueOfNextZone;
        this.overBoughtZone = currentZone + 1;
      }
    }

    if (enableOversold) {
      const currentZone = this._calculateZone(oversoldLevel);
      const maxValueOfZone = currentZone * this.valueOfZone;

      this.overSoldZone = currentZone;

      if (BigNumber(oversoldLevel).comparedTo(maxValueOfZone) == -1) {
        const maxValueOfPrevZone = (currentZone - 1) * this.valueOfZone;
        this.config.oversoldLevel = maxValueOfPrevZone;
        this.overSoldZone = currentZone - 1;
      }
    }
  }

  private _isOverZone(zone: number) {
    const { enableOverbought, enableOversold } = this.config;

    if (enableOverbought && zone == this.overBoughtZone) {
      return true;
    }

    if (enableOversold && zone == this.overSoldZone) {
      return true;
    }

    return false;
  }

  private _getZoneName(zone: number) {
    switch (zone) {
      case this.overBoughtZone:
        return "OVERBOUGHT";
      case this.overSoldZone:
        return "OVERSOLD";
      default:
        return "NORMAL";
    }
  }

  private _initMaximumDca() {
    this.maximumDca = {};
    for (let i = 1; i <= this.config.numberOfZone; i++) {
      if (i <= this.overSoldZone) {
        this.maximumDca[i] = Number(this.config.maximumDCAOverSoldZone);
      } else if (i >= this.overBoughtZone) {
        this.maximumDca[i] = Number(this.config.maximumDCAOverBoughtZone);
      } else {
        this.maximumDca[i] = Number(this.config.maximumDCANormalZone);
      }
    }
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
