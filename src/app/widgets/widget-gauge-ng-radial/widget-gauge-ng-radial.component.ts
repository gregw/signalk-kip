/**
 * ng canvas gauge options should be set before ngViewInit for the gauge to be
 * instantiated with the correct options.
 *
 * Gauge .update() function should ONLY be called after ngAfterViewInit. Used to update
 * instantiated gauge config.
 */
import { ViewChild, Component, OnInit, OnDestroy, AfterViewInit, ElementRef, effect } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgxResizeObserverModule } from 'ngx-resize-observer';

import { IDataHighlight } from '../../core/interfaces/widgets-interface';
import { GaugesModule, RadialGaugeOptions, RadialGauge } from '@godind/ng-canvas-gauges';
import { BaseWidgetComponent } from '../../core/utils/base-widget.component';
import { WidgetHostComponent } from '../../core/components/widget-host/widget-host.component';
import { IWidgetSvcConfig } from '../../core/interfaces/widgets-interface';
import { adjustLinearScaleAndMajorTicks } from '../../core/utils/dataScales.util';
import { ISkZone, States } from '../../core/interfaces/signalk-interfaces';

@Component({
    selector: 'widget-gauge-ng-radial',
    templateUrl: './widget-gauge-ng-radial.component.html',
    styleUrls: ['./widget-gauge-ng-radial.component.scss'],
    standalone: true,
    imports: [WidgetHostComponent, NgxResizeObserverModule, GaugesModule]
})
export class WidgetGaugeNgRadialComponent extends BaseWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  // Gauge option setting constant
  private readonly LINE: string = "line";
  private readonly ANIMATION_TARGET_NEEDLE:string = "needle";

  @ViewChild('radialGauge', { static: true }) ngGauge: RadialGauge;
  @ViewChild('radialGauge', { static: true, read: ElementRef }) gauge: ElementRef;

  // Gauge text value for value box rendering
  protected textValue = "";
  // Gauge value
  protected value: number = null;

  // Gauge options
  protected gaugeOptions = {} as RadialGaugeOptions;
  // fix for RadialGauge GaugeOptions object ** missing color-stroke-ticks property
  protected colorStrokeTicks = "";
  protected unitName: string = null;

  // Zones support
  private metaSub: Subscription;
  private state: string = States.Normal;

  constructor() {
    super();

    this.defaultConfig = {
      displayName: 'Gauge Label',
      filterSelfPaths: true,
      paths: {
        "gaugePath": {
          description: "Numeric Data",
          path: null,
          source: null,
          pathType: "number",
          isPathConfigurable: true,
          showPathSkUnitsFilter: true,
          pathSkUnitsFilter: null,
          convertUnitTo: "unitless",
          sampleTime: 500
        }
      },
      displayScale: {
        lower: 0,
        upper: 100,
        type: "linear"
      },
      gauge: {
        type: 'ngRadial',
        subType: 'measuring', // capacity, measuring
        enableTicks: true,
        compassUseNumbers: false,
        highlightsWidth: 5,
        scaleStart: 180
      },
      numInt: 1,
      numDecimal: 0,
      enableTimeout: false,
      color: "contrast",
      dataTimeout: 5,
      ignoreZones: false
    };

    effect(() => {
      if (this.theme()) {
       this.startWidget();
      }
    });
  }

  ngOnInit() {
    this.validateConfig();
    this.setGaugeConfig();
  }

  protected startWidget(): void {
    this.setGaugeConfig();
    this.ngGauge.update(this.gaugeOptions);

    this.unsubscribeDataStream();
    this.unsubscribeMetaStream();
    this.metaSub?.unsubscribe();

    this.observeDataStream('gaugePath', newValue => {
      if (!newValue || !newValue.data || newValue.data.value === null) {
        newValue = {
          data: {
            value: 0,
            timestamp: new Date(),
          },
          state: States.Normal // Default state
        };
        this.textValue = '--';
      } else if (this.textValue === '--') {
          this.textValue = '';
      }

      // Compound value to displayScale
      this.value = Math.min(Math.max(newValue.data.value, this.widgetProperties.config.displayScale.lower), this.widgetProperties.config.displayScale.upper);

      if (newValue.state == null) {
        newValue.state = States.Normal; // Provide a default value for state
      }

      if (this.state !== newValue.state) {
        this.state = newValue.state;
        const option: RadialGaugeOptions = {};
        if (!this.widgetProperties.config.ignoreZones) {
          // Set value color: reduce color changes to only warn & alarm states else it too much flickering and not clean
          switch (newValue.state) {
            case States.Alarm:
              option.colorBorderMiddle = this.theme().cardColor;
              option.colorBarProgress = this.theme().zoneAlarm;
              option.colorValueText = this.theme().zoneAlarm;
              break;
            case States.Warn:
              option.colorBorderMiddle = this.theme().cardColor;
              option.colorBarProgress = this.theme().zoneWarn;
              option.colorValueText = this.theme().zoneWarn;
              break;
            case States.Alert:
              option.colorBorderMiddle = this.theme().cardColor;
              option.colorBarProgress = this.theme().zoneAlert;
              option.colorValueText = this.theme().zoneAlert;
              break;
            default:
              option.colorBorderMiddle = this.theme().cardColor;
              option.colorBarProgress = this.widgetProperties.config.gauge.subType == 'measuring' ? this.getColors(this.widgetProperties.config.color).color : this.getColors(this.widgetProperties.config.color).dim;
              option.colorValueText = this.getColors(this.widgetProperties.config.color).color;
          }
        }
        this.ngGauge.update(option);
      }
    });

    if (!this.widgetProperties.config.ignoreZones) {
      this.observeMetaStream();
      this.metaSub = this.zones$.subscribe(zones => {
        if (zones && zones.length > 0 && this.widgetProperties.config.gauge.subType == "measuring") {
          this.setHighlights(zones);
        }
      });
    }
  }

  protected updateConfig(config: IWidgetSvcConfig): void {
    this.widgetProperties.config = config;
    this.setCanvasHight();
    this.startWidget();
  }

  private setCanvasHight(): void {
    const gaugeSize = this.gauge.nativeElement.getBoundingClientRect();
    const resize: RadialGaugeOptions = {};
    resize.height = gaugeSize.height;
    resize.width = gaugeSize.width;

    this.ngGauge.update(resize);
  }

  ngAfterViewInit(): void {
    this.setCanvasHight();
    this.startWidget();
  }

  public onResized(event: ResizeObserverEntry): void {
      const resize: RadialGaugeOptions = {};
      resize.height = event.contentRect.height;
      resize.width = event.contentRect.width;

      this.ngGauge.update(resize);
  }

  private setGaugeConfig(): void {
    this.gaugeOptions.title = this.widgetProperties.config.displayName ? this.widgetProperties.config.displayName : "";
    this.gaugeOptions.highlights = [];

    this.gaugeOptions.fontTitle = "Roboto";
    this.gaugeOptions.fontTitleWeight = "bold";
    this.gaugeOptions.fontUnits = "Roboto";
    this.gaugeOptions.fontUnitsSize = 25;
    this.gaugeOptions.fontUnitsWeight = "normal";
    this.gaugeOptions.barStrokeWidth = 0;
    this.gaugeOptions.barShadow = 0;
    this.gaugeOptions.colorBarStroke = "";
    this.gaugeOptions.fontValue = "Roboto";
    this.gaugeOptions.fontValueWeight = "bold";
    this.gaugeOptions.valueTextShadow = false;
    this.gaugeOptions.colorValueBoxShadow = "";
    this.gaugeOptions.fontNumbers = "Roboto";
    this.gaugeOptions.fontNumbersWeight = "bold";

    this.gaugeOptions.valueInt = this.widgetProperties.config.numInt !== undefined && this.widgetProperties.config.numInt !== null ? this.widgetProperties.config.numInt : 1;
    this.gaugeOptions.valueDec = this.widgetProperties.config.numDecimal !== undefined && this.widgetProperties.config.numDecimal !== null ? this.widgetProperties.config.numDecimal : 2;
    this.gaugeOptions.majorTicksInt = this.widgetProperties.config.numInt !== undefined && this.widgetProperties.config.numInt !== null ? this.widgetProperties.config.numInt : 1;
    this.gaugeOptions.majorTicksDec = this.widgetProperties.config.numDecimal !== undefined && this.widgetProperties.config.numDecimal !== null ? this.widgetProperties.config.numDecimal : 2;
    this.gaugeOptions.highlightsWidth = this.widgetProperties.config.gauge.highlightsWidth;

    this.gaugeOptions.animation = true;
    this.gaugeOptions.animateOnInit = false;
    this.gaugeOptions.animatedValue = false;
    this.gaugeOptions.animationRule = "linear";
    this.gaugeOptions.animationDuration = this.widgetProperties.config.paths['gaugePath'].sampleTime - 25; // prevent data and animation delay collisions

    // Borders
    this.gaugeOptions.colorBorderShadow = false;
    this.gaugeOptions.colorBorderOuter = this.theme().cardColor;
    this.gaugeOptions.colorBorderOuterEnd = '';
    this.gaugeOptions.colorBorderMiddle = this.theme().cardColor;
    this.gaugeOptions.colorBorderMiddleEnd = '';

    // Progress bar
    this.gaugeOptions.colorBarProgress = this.getColors(this.widgetProperties.config.color).color;
    this.gaugeOptions.colorNeedle = this.getColors(this.widgetProperties.config.color).dim;
    this.gaugeOptions.colorNeedleEnd = this.getColors(this.widgetProperties.config.color).dim;
    // Labels
    this.gaugeOptions.colorTitle = this.theme().contrastDim;
    this.gaugeOptions.colorUnits = this.theme().contrastDim;
    this.gaugeOptions.colorValueText = this.getColors(this.widgetProperties.config.color).color;
    // Ticks
    this.colorStrokeTicks = this.theme().contrastDim; // missing property in gaugeOptions
    this.gaugeOptions.colorMinorTicks = this.theme().contrastDim;
    this.gaugeOptions.colorNumbers = this.theme().contrastDim;
    this.gaugeOptions.colorMajorTicks = this.theme().contrastDim;
    // Plate
    this.gaugeOptions.colorPlate = this.gaugeOptions.colorPlateEnd = this.theme().cardColor;
    this.gaugeOptions.colorBar = this.theme().background;

    this.gaugeOptions.colorNeedleShadowUp = "";
    this.gaugeOptions.colorNeedleShadowDown = "black";
    this.gaugeOptions.colorNeedleCircleInner = this.gaugeOptions.colorPlate;
    this.gaugeOptions.colorNeedleCircleInnerEnd = this.gaugeOptions.colorPlate;
    this.gaugeOptions.colorNeedleCircleOuter = this.gaugeOptions.colorPlate;
    this.gaugeOptions.colorNeedleCircleOuterEnd = this.gaugeOptions.colorPlate;

    // Radial gauge subType
    switch(this.widgetProperties.config.gauge.subType) {
      case "capacity":
        this.configureCapacityGauge();
        break;
      case "measuring":
        this.configureMeasuringGauge();
        break;
      default:
    }
  }

  private getColors(color: string): { color: string, dim: string, dimmer: string } {
    const themePalette = {
      "contrast": { color: this.theme().contrast, dim: this.theme().contrastDim, dimmer: this.theme().contrastDimmer },
      "blue": { color: this.theme().blue, dim: this.theme().blueDim, dimmer: this.theme().blueDimmer },
      "green": { color: this.theme().green, dim: this.theme().greenDim, dimmer: this.theme().greenDimmer },
      "pink": { color: this.theme().pink, dim: this.theme().pinkDim, dimmer: this.theme().pinkDimmer },
      "orange": { color: this.theme().orange, dim: this.theme().orangeDim, dimmer: this.theme().orangeDimmer },
      "purple": { color: this.theme().purple, dim: this.theme().purpleDim, dimmer: this.theme().purpleDimmer },
      "yellow": { color: this.theme().yellow, dim: this.theme().yellowDim, dimmer: this.theme().yellowDimmer },
      "grey": { color: this.theme().grey, dim: this.theme().greyDim, dimmer: this.theme().yellowDimmer }
    };
    return themePalette[color];
  }

  private configureCapacityGauge(): void {
    this.gaugeOptions.minValue = this.widgetProperties.config.displayScale.lower;
    this.gaugeOptions.maxValue = this.widgetProperties.config.displayScale.upper;
    this.gaugeOptions.units = this.widgetProperties.config.paths['gaugePath'].convertUnitTo;
    this.gaugeOptions.fontTitleSize = 40;
    this.gaugeOptions.barProgress = true;
    this.gaugeOptions.barWidth = 20;

    this.gaugeOptions.colorBarProgress = this.getColors(this.widgetProperties.config.color).dim;

    this.gaugeOptions.valueBox = true;
    this.gaugeOptions.fontValueSize = 60;
    this.gaugeOptions.valueBoxWidth = 10;
    this.gaugeOptions.valueBoxBorderRadius = 5;
    this.gaugeOptions.valueBoxStroke = 0;
    this.gaugeOptions.colorValueBoxBackground = '';
    this.gaugeOptions.colorValueBoxRect = '';
    this.gaugeOptions.colorValueBoxRectEnd = '';

    this.gaugeOptions.ticksAngle = 360;
    this.gaugeOptions.startAngle = this.widgetProperties.config.gauge.scaleStart || 180;
    this.gaugeOptions.majorTicks = 0;
    this.gaugeOptions.exactTicks = true;
    this.gaugeOptions.strokeTicks = false;
    this.gaugeOptions.minorTicks = 0;
    this.gaugeOptions.numbersMargin = 0;
    this.gaugeOptions.fontNumbersSize = 0;

    this.gaugeOptions.colorMajorTicks = this.gaugeOptions.colorPlate; // canvas gauge bug with MajorTicks; always drawing first tick and using color="" does not work
    this.gaugeOptions.colorNumbers = this.gaugeOptions.colorMinorTicks = "";

    this.gaugeOptions.needle = true;
    this.gaugeOptions.needleType = this.LINE;
    this.gaugeOptions.needleWidth = 2;
    this.gaugeOptions.needleShadow = false;
    this.gaugeOptions.needleStart = 75;
    this.gaugeOptions.needleEnd = 95;
    this.gaugeOptions.needleCircleSize = 1;
    this.gaugeOptions.needleCircleInner = false;
    this.gaugeOptions.needleCircleOuter = false;

    this.gaugeOptions.borders = true;
    this.gaugeOptions.borderOuterWidth = 2;
    this.gaugeOptions.borderMiddleWidth = 1;
    this.gaugeOptions.borderInnerWidth = 0;
    this.gaugeOptions.borderShadowWidth = 0;

    this.gaugeOptions.animationTarget = this.ANIMATION_TARGET_NEEDLE;
    this.gaugeOptions.useMinPath = false;
  }

  private configureMeasuringGauge(): void {
    const scale = adjustLinearScaleAndMajorTicks(this.widgetProperties.config.displayScale.lower, this.widgetProperties.config.displayScale.upper);

    this.gaugeOptions.minValue = scale.min;
    this.gaugeOptions.maxValue = scale.max;

    this.gaugeOptions.units = this.widgetProperties.config.paths['gaugePath'].convertUnitTo;
    this.gaugeOptions.fontTitleSize = 24;

    this.gaugeOptions.barProgress = true;
    this.gaugeOptions.barWidth = 15;

    this.gaugeOptions.valueBox = true;
    this.gaugeOptions.fontValueSize = 60;
    this.gaugeOptions.valueBoxWidth = 100;
    this.gaugeOptions.valueBoxBorderRadius = 0;
    this.gaugeOptions.valueBoxStroke = 0;
    this.gaugeOptions.colorValueBoxBackground = "";

    this.gaugeOptions.exactTicks = false;
    this.gaugeOptions.majorTicks = scale.majorTicks;
    this.gaugeOptions.minorTicks = 2;
    this.gaugeOptions.ticksAngle = 270;
    this.gaugeOptions.startAngle = 45;
    this.gaugeOptions.strokeTicks = true;
    this.gaugeOptions.numbersMargin = 3;
    this.gaugeOptions.fontNumbersSize = 15;

    this.gaugeOptions.needle = true;
    this.gaugeOptions.needleType = this.LINE;
    this.gaugeOptions.needleWidth = 2;
    this.gaugeOptions.needleShadow = false;
    this.gaugeOptions.needleStart = 0;
    this.gaugeOptions.needleEnd = 95;
    this.gaugeOptions.needleCircleSize = 10;
    this.gaugeOptions.needleCircleInner = false;
    this.gaugeOptions.needleCircleOuter = false;

    this.gaugeOptions.borders = true;
    this.gaugeOptions.borderOuterWidth = 2;
    this.gaugeOptions.borderMiddleWidth = 1;
    this.gaugeOptions.borderInnerWidth = 0;
    this.gaugeOptions.borderShadowWidth = 0;

    this.gaugeOptions.animationTarget = this.ANIMATION_TARGET_NEEDLE;
    this.gaugeOptions.useMinPath = false;
  }

  private setHighlights(zones: ISkZone[]): void {
    const gaugeZonesHighlight: IDataHighlight[] = [];
    // Sort zones based on lower value
    const sortedZones = [...zones].sort((a, b) => a.lower - b.lower);
    for (const zone of sortedZones) {
      let lower: number = null;
      let upper: number = null;

      let color: string;
      switch (zone.state) {
        case States.Emergency:
          color = this.theme().zoneEmergency;
          break;
        case States.Alarm:
          color = this.theme().zoneAlarm;
          break;
        case States.Warn:
          color = this.theme().zoneWarn;
          break;
        case States.Alert:
          color = this.theme().zoneAlert;
          break;
        case States.Nominal:
          color = this.theme().zoneNominal;
          break;
        default:
          color = "rgba(0,0,0,0)";
      }

      lower = this.unitsService.convertToUnit(this.widgetProperties.config.paths['gaugePath'].convertUnitTo, zone.lower);
      upper =this.unitsService.convertToUnit(this.widgetProperties.config.paths['gaugePath'].convertUnitTo, zone.upper);

      // Skip zones that are completely outside the gauge range
      if (upper < this.widgetProperties.config.displayScale.lower || lower > this.widgetProperties.config.displayScale.upper) {
        continue;
      }

      // If lower or upper are null, set them to displayScale min or max
      lower = lower !== null ? lower : this.widgetProperties.config.displayScale.lower;
      upper = upper !== null ? upper : this.widgetProperties.config.displayScale.upper;

      // Ensure lower does not go below min
      lower = Math.max(lower, this.widgetProperties.config.displayScale.lower);

      // Ensure upper does not exceed max
      if (upper > this.widgetProperties.config.displayScale.upper) {
        upper = this.widgetProperties.config.displayScale.upper;
        gaugeZonesHighlight.push({from: lower, to: upper, color: color});
        break;
      }

      gaugeZonesHighlight.push({from: lower, to: upper, color: color});
    };
    //@ts-expect-error - bug in highlights property definition
    const highlights: LinearGaugeOptions = {};
    highlights.highlightsWidth = this.widgetProperties.config.gauge.highlightsWidth;
    highlights.highlights = JSON.stringify(gaugeZonesHighlight, null, 1);
    this.ngGauge.update(highlights);
  }

  ngOnDestroy() {
    this.destroyDataStreams();
    this.metaSub?.unsubscribe();
    // Clear references to DOM elements
    this.ngGauge = null;
    this.gauge = null;

  }
}
