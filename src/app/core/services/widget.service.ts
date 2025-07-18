import { inject, Injectable } from '@angular/core';
import { SignalkPluginsService } from './signalk-plugins.service';

export const WIDGET_CATEGORIES = ['Basic', 'Gauges', 'Components'] as const;
export type TWidgetCategories = typeof WIDGET_CATEGORIES[number];
export enum WidgetCategories {
  Basic = "Basic",
  Gauges = "Gauges",
  Components = "Components"
}
export interface WidgetDescription {
  /**
   * The name of the widget, which will be displayed in the widget list.
   * It should be concise and descriptive to help users identify the widget's purpose.
   */
  name: string;
  /**
   * A brief description of the widget's functionality and purpose.
   * This will be displayed in the widget list to help users understand
   * what the widget does.
   */
  description: string;
  /**
   * The icon name in the SVG icon file to be used with MatIconModule.
   */
  icon: string;
  /**
   * An array of plugin names that this widget requires to be installed
   * and enabled on the Signal K server. If the widget does not have any
   * dependencies, this can be an empty array.
   */
  pluginDependency: string[];
  /**
   * The category of the widget, used for filtering in the widget list.
   */
  category: TWidgetCategories;
  /**
   * The selector for the widget component, which will be used in the dashboard
   * to instantiate the widget.
   */
  selector: string;
  /**
   * The class name of the component that implements the widget.
   * This is used to dynamically load the component when the widget is added to the dashboard.
   */
  componentClassName: string;
}

export interface WidgetDescriptionWithPluginStatus extends WidgetDescription {
  isDependencyValid: boolean;
  pluginsStatus: { name: string; enabled: boolean }[];
}

@Injectable({
  providedIn: 'root'
})
export class WidgetService {
  private readonly _plugins = inject(SignalkPluginsService);
  private readonly _widgetCategories = ["Basic", "Gauges", "Components"];
  private readonly _widgetDefinition: WidgetDescription[] = [
    {
      name: 'Numeric',
      description: 'Displays numeric data in a clear and concise format with option to display minimum and maximum recorded values.',
      icon: 'numericWidget',
      pluginDependency: [],
      category: 'Basic',
      selector: 'widget-numeric',
      componentClassName: 'WidgetNumericComponent'
    },
    {
      name: 'Text',
      description: 'Displays text data with customizable color formatting option.',
      icon: 'textWidget',
      pluginDependency: [],
      category: 'Basic',
      selector: 'widget-text',
      componentClassName: 'WidgetTextComponent'
    },
    {
      name: 'Date & Time',
      description: 'Displays date and time data with fully custom formatting options and timezone correction.',
      icon: 'datetimeWidget',
      pluginDependency: [],
      category: 'Basic',
      selector: 'widget-datetime',
      componentClassName: 'WidgetDatetimeComponent'
    },
    {
      name: 'Position',
      description: 'Displays latitude and longitude for location tracking and navigation.',
      icon: 'positionWidget',
      pluginDependency: [],
      category: 'Basic',
      selector: 'widget-position',
      componentClassName: 'WidgetPositionComponent',
    },
    {
      name: 'Switch Panel',
      description: 'A switch panel group with multiple controls including toggle switches, indicator lights, and press buttons for digital switching and other operations.',
      icon: 'switchpanelWidget',
      pluginDependency: [],
      category: 'Basic',
      selector: 'widget-boolean-switch',
      componentClassName: 'WidgetBooleanSwitchComponent'
    },
    {
      name: 'Slider',
      description: 'A range slider that allows users to adjust values, such as controlling lighting intensity from 0% to 100%.',
      icon: 'sliderWidget',
      pluginDependency: [],
      category: 'Basic',
      selector: 'widget-slider',
      componentClassName: 'WidgetSliderComponent'
    },
    {
      name: 'Static Label',
      description: 'A static text widget that allows you to add customizable labels to your dashboard, helping to organize and clarify your layout effectively.',
      icon: 'labelWidget',
      pluginDependency: [],
      category: 'Basic',
      selector: 'widget-label',
      componentClassName: 'WidgetLabelComponent'
    },
    {
      name: 'Simple Linear',
      description: "A simple horizontal linear gauge with a large value label offering a clean, compact modern look.",
      icon: 'simpleLinearGauge',
      pluginDependency: [],
      category: 'Gauges',
      selector: 'widget-simple-linear',
      componentClassName: 'WidgetSimpleLinearComponent'
    },
    {
      name: 'Linear',
      description: 'A horizontal or vertical linear gauge that supports zones highlights. ',
      icon: 'linearGauge',
      pluginDependency: [],
      category: 'Gauges',
      selector: 'widget-gauge-ng-linear',
      componentClassName: 'WidgetGaugeNgLinearComponent'
    },
    {
      name: 'Radial',
      description: 'A radial gauge that supports various configurations, including capacity and measurement dials and zones highlight.',
      icon: 'radialGauge',
      pluginDependency: [],
      category: 'Gauges',
      selector: 'widget-gauge-ng-radial',
      componentClassName: 'WidgetGaugeNgRadialComponent'
    },
    {
      name: 'Compass',
      description: 'A faceplate or card rotating compass gauge with various cardinal point indicator options.',
      icon: 'compassGauge',
      pluginDependency: [],
      category: 'Gauges',
      selector: 'widget-gauge-ng-compass',
      componentClassName: 'WidgetGaugeNgCompassComponent'
    },
    {
      name: 'Steel Style',
      description: 'A traditional steel looking linear & radial gauges replica that supports range sizes and zones highlights.',
      icon: 'steelGauge',
      pluginDependency: [],
      category: 'Gauges',
      selector: 'widget-gauge-steel',
      componentClassName: 'WidgetSteelGaugeComponent'
    },
    {
      name: 'Wind Steering',
      description: 'A wind steering display that combines wind, wind sectors, heading, course over ground and next waypoint information',
      icon: 'windsteeringWidget',
      pluginDependency: [],
      category: 'Components',
      selector: 'widget-wind-steer',
      componentClassName: 'WidgetWindComponent'
    },
    {
      name: 'Freeboard-SK',
      description: 'Add Freeboard-SK Chart Plotter as a widget with auto sign-in to your dashboard.',
      icon: 'freeboardWidget',
      pluginDependency: ['freeboard-sk', 'tracks', 'resources-provider', 'course-provider' ],
      category: 'Components',
      selector: 'widget-freeboardsk',
      componentClassName: 'WidgetFreeboardskComponent'
    },
    {
      name: 'Data Chart',
      description: 'Visualize data on a realtime chart with multiple series pre configured such as averages, SMA, EMA and DEMA. The use the Data Chart widget KIP Dataset must be configured.',
      icon: 'datachartWidget',
      pluginDependency: [],
      category: 'Components',
      selector: 'widget-data-chart',
      componentClassName: 'WidgetDataChartComponent'
    },
    {
      name: 'Autopilot Head',
      description: 'A basic Autopilot Head for supported Signal K v1 API autopilot devices.',
      icon: 'autopilotWidget',
      pluginDependency: ['autopilot'],
      category: 'Components',
      selector: 'widget-autopilot',
      componentClassName: 'WidgetAutopilotComponent'
    },
    {
      name: 'Race Timer',
      description: "A simple race start countdown timer. The timer can be started, paused, reset and the countdown duration specified.",
      icon: 'racetimerWidget',
      pluginDependency: [],
      category: 'Components',
      selector: 'widget-racetimer',
      componentClassName: 'WidgetRaceTimerComponent',
    },
    {
      name: 'Embed Webpage Viewer',
      description: 'Use this widget to embed a view of an external web based applications, such as Grafana graphs, other Signal K Apps and related tools, in your dashboard for a seamless integration. Interactions with the embedded page are not supported.',
      icon: 'embedWidget',
      pluginDependency: [],
      category: 'Components',
      selector: 'widget-iframe',
      componentClassName: 'WidgetIframeComponent',
    },
    {
      name: 'Tutorial',
      description: "KIP's getting started tutorial widget.",
      icon: 'tutorialWidget',
      pluginDependency: [],
      category: 'Components',
      selector: 'widget-tutorial',
      componentClassName: 'WidgetTutorialComponent',
    }
  ];

  get kipWidgets(): WidgetDescription[] {
    return this._widgetDefinition;
  }

  get categories(): string[] {
    return this._widgetCategories;
  }

  /**
   * Returns the list of widget definitions, each enriched with plugin dependency status.
   *
   * For each widget, this method:
   * - Checks all unique plugin dependencies using the SignalkPluginsService (each dependency is checked only once, even if used by multiple widgets).
   * - Adds the following properties to each widget:
   *   - `isDependencyValid`: `true` if all dependencies are enabled or if there are no dependencies; `false` otherwise.
   *   - `pluginsStatus`: an array of objects, each with `{ name: string, enabled: boolean }` for every dependency.
   *
   * @returns Promise resolving to an array of WidgetDescriptionWithPluginStatus objects.
   *
   * Example usage:
   * ```typescript
   * const widgets = await widgetService.getKipWidgetsWithStatus();
   * widgets.forEach(widget => {
   *   console.log(widget.name, widget.isDependencyValid, widget.pluginsStatus);
   * });
   * ```
   */
  public async getKipWidgetsWithStatus(): Promise<WidgetDescriptionWithPluginStatus[]> {
    const pluginCache: Record<string, boolean> = {};

    // Collect all unique plugin dependencies
    const allDeps = Array.from(
      new Set(this._widgetDefinition.flatMap(w => w.pluginDependency))
    );

    // Check each unique dependency once
    await Promise.all(
      allDeps.map(async dep => {
        pluginCache[dep] = await this._plugins.isEnabled(dep);
      })
    );

    // Map widgets using the cached results
    return this._widgetDefinition.map(widget => {
      if (!widget.pluginDependency || widget.pluginDependency.length === 0) {
        return {
          ...widget,
          isDependencyValid: true,
          pluginsStatus: []
        };
      }
      const pluginsStatus = widget.pluginDependency.map(dep => ({
        name: dep,
        enabled: pluginCache[dep]
      }));
      const isDependencyValid = pluginsStatus.every(p => p.enabled);
      return {
        ...widget,
        isDependencyValid,
        pluginsStatus
      };
    });
  }
}
