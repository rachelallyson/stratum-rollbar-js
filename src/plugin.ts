import { BasePlugin } from "@capitalone/stratum-observability";
import type { PluginFactory } from "@capitalone/stratum-observability";

import { RollbarPublisher } from "./publisher";
import { RollbarPluginOptions, RollbarEventTypes } from "./types";
import {
  RollbarCriticalEventModel,
  RollbarErrorEventModel,
  RollbarWarningEventModel,
  RollbarInfoEventModel,
  RollbarDebugEventModel,
  BaseRollbarEventModel,
} from "./model";

/**
 * Rollbar plugin for Stratum Observability
 *
 * Registers Rollbar event types (log levels + identify/clear_person) with Stratum
 * and publishes events to Rollbar via the RollbarPublisher.
 */
export class RollbarPlugin extends BasePlugin<never, RollbarPluginOptions> {
  name = "RollbarPlugin";
  protected publisher: RollbarPublisher;

  eventTypes = {
    [RollbarEventTypes.CRITICAL]: RollbarCriticalEventModel,
    [RollbarEventTypes.ERROR]: RollbarErrorEventModel,
    [RollbarEventTypes.WARNING]: RollbarWarningEventModel,
    [RollbarEventTypes.INFO]: RollbarInfoEventModel,
    [RollbarEventTypes.DEBUG]: RollbarDebugEventModel,
    [RollbarEventTypes.IDENTIFY]: BaseRollbarEventModel,
    [RollbarEventTypes.CLEAR_PERSON]: BaseRollbarEventModel,
  };

  constructor(options: RollbarPluginOptions) {
    super();
    this.options = options;
    this.publisher = new RollbarPublisher(options);
    this.publishers = [this.publisher];
  }

  /**
   * Check if Rollbar is available and initialized.
   */
  async isAvailable(): Promise<boolean> {
    return this.publisher.isAvailable();
  }

  /**
   * Test helper to simulate Rollbar not being initialized.
   * @internal
   */
  _setRollbarUndefined(): void {
    this.publisher.rollbar = undefined;
  }
}

export const RollbarPluginFactory: PluginFactory<
  RollbarPlugin,
  RollbarPluginOptions
> = (options) => {
  if (!options) {
    throw new Error("RollbarPluginOptions are required");
  }
  return new RollbarPlugin(options);
};
