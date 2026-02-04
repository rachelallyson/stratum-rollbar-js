import { BaseEventModel } from "@capitalone/stratum-observability";

import { RollbarEvent, RollbarSnapshot } from "./types";

export class BaseRollbarEventModel extends BaseEventModel<RollbarEvent> {
  get id() {
    return this.item.id;
  }

  protected checkValidity(): boolean {
    return super.checkValidity();
  }

  getData(options?: RollbarSnapshot): RollbarEvent {
    const item = super.getData(options);

    const properties = options?.eventOptions?.data?.properties;

    if (properties && item.properties) {
      Object.keys(item.properties).forEach((key) => {
        if (
          properties[key] &&
          typeof item.properties![key] !== typeof properties[key]
        ) {
          throw new Error(
            `Property ${key} is not a type of ${typeof item.properties![key]}`,
          );
        }
        if (!properties[key] && typeof item.properties![key] !== "undefined") {
          throw new Error(`Property ${key} is not defined in the properties`);
        }
      });
    }

    return { ...item, properties: item.properties };
  }
}

export class RollbarCriticalEventModel extends BaseRollbarEventModel {}
export class RollbarErrorEventModel extends BaseRollbarEventModel {}
export class RollbarWarningEventModel extends BaseRollbarEventModel {}
export class RollbarInfoEventModel extends BaseRollbarEventModel {}
export class RollbarDebugEventModel extends BaseRollbarEventModel {}
