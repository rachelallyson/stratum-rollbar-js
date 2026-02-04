import {
  StratumService,
  StratumServiceOptions,
} from "@capitalone/stratum-observability";

import { RollbarPlugin } from "./plugin";

class RollbarService extends StratumService {
  private rollbarPlugin?: RollbarPlugin;

  constructor(options: StratumServiceOptions) {
    super(options);

    if (options.plugins) {
      const pluginsArray = Array.isArray(options.plugins)
        ? options.plugins
        : [options.plugins];
      this.rollbarPlugin = pluginsArray.find(
        (plugin: { name: string }) => plugin.name === "RollbarPlugin",
      ) as RollbarPlugin;
    }
  }

  /**
   * Check if Rollbar is available and initialized.
   */
  async isRollbarAvailable(): Promise<boolean> {
    if (!this.rollbarPlugin) {
      return false;
    }
    return this.rollbarPlugin.isAvailable();
  }
}

export default RollbarService;
