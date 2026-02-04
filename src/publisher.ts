import { BaseEventModel, BasePublisher } from "@capitalone/stratum-observability";
import type { StratumSnapshot } from "@capitalone/stratum-observability";

import Rollbar from "rollbar";
import type { RollbarPluginOptions, RollbarInstance } from "./types";

export class RollbarPublisher extends BasePublisher {
  name = "RollbarPublisher";
  rollbar?: RollbarInstance;
  options: RollbarPluginOptions;

  constructor(options: RollbarPluginOptions) {
    super();
    this.options = options;

    this.validateOptions(options);

    if (options.rollbarInstance) {
      this.rollbar = options.rollbarInstance;
    } else {
      this.initializeRollbar();
    }
  }

  /** True when running in Node (e.g. Next.js server, API routes). */
  private readonly isServer: boolean =
    typeof window === "undefined";

  private validateOptions(options: RollbarPluginOptions) {
    if (options.rollbarInstance) return;

    const hasToken =
      options.ACCESS_TOKEN ||
      options.SERVER_ACCESS_TOKEN ||
      options.CLIENT_ACCESS_TOKEN;
    if (!hasToken) {
      throw new Error(
        "Either ACCESS_TOKEN, SERVER_ACCESS_TOKEN, CLIENT_ACCESS_TOKEN, or rollbarInstance must be provided",
      );
    }

    if (options.rollbarInstance && options.ACCESS_TOKEN) {
      console.warn(
        "Both rollbarInstance and ACCESS_TOKEN provided. Using rollbarInstance and ignoring token options.",
      );
    }
  }

  private initializeRollbar() {
    const token = this.getTokenForRuntime();
    if (!token) {
      if (this.options.DEBUG) {
        console.log(
          "Rollbar plugin: No token for this runtime (server=%s). Rollbar will not be initialized.",
          this.isServer,
        );
      }
      return;
    }
    const config = this.buildConfig(token);
    this.rollbar = new Rollbar(config as Record<string, unknown>) as RollbarInstance;
  }

  /** Resolve token for current runtime (server vs browser) for Next.js and similar. */
  private getTokenForRuntime(): string | undefined {
    if (this.isServer) {
      return (
        this.options.SERVER_ACCESS_TOKEN ??
        this.options.ACCESS_TOKEN
      );
    }
    return (
      this.options.CLIENT_ACCESS_TOKEN ??
      this.options.ACCESS_TOKEN
    );
  }

  private buildConfig(accessToken: string): Record<string, unknown> {
    const base = this.options.config ?? {};
    const envOverrides = this.isServer
      ? this.options.serverConfig ?? {}
      : this.options.clientConfig ?? {};
    const config: Record<string, unknown> = {
      accessToken,
      ...base,
      ...envOverrides,
    };
    return config;
  }

  shouldPublishEvent(): boolean {
    return true;
  }

  async isAvailable(): Promise<boolean> {
    return typeof this.rollbar !== "undefined";
  }

  getEventOutput(event: BaseEventModel, snapshot: StratumSnapshot): unknown {
    // Stratum copies pluginData[pluginName] into eventOptions.data for this publisher and
    // removes pluginData. Only send when the caller included RollbarPlugin in pluginData,
    // i.e. when eventOptions.data is present (otherwise we'd send every event to Rollbar).
    const data = snapshot.eventOptions?.data;
    if (data == null) {
      return null;
    }

    const eventType = event.item.eventType;
    const properties = data?.properties ?? {};

    return {
      eventName: snapshot.event.id,
      properties,
      eventType,
    };
  }

  async publish(content: unknown, _snapshot: StratumSnapshot): Promise<void> {
    if (!content) {
      if (this.options.DEBUG) {
        console.log("Rollbar plugin: No content to publish");
      }
      return;
    }

    if (!this.rollbar) {
      console.warn("Rollbar plugin: Rollbar not initialized");
      return;
    }

    const { eventName, properties, eventType } = content as {
      eventName: string;
      properties: Record<string, unknown>;
      eventType: string;
    };

    if (this.options.DEBUG) {
      console.log("Rollbar plugin: Publishing", {
        eventName,
        eventType,
        properties,
      });
    }

    if (eventType === "identify") {
      const personId =
        (properties.id as string) ??
        (properties.distinct_id as string) ??
        (properties.user_id as string);
      this.rollbar.configure({
        payload: {
          person: {
            id: personId,
            username: (properties.username as string) ?? undefined,
            email: (properties.email as string) ?? undefined,
          },
        },
      });
      return;
    }

    if (eventType === "clear_person") {
      this.rollbar.configure({
        payload: {
          person: { id: null },
        },
      });
      return;
    }

    // For error/critical, allow passing an Error in properties for stack traces (per Rollbar docs).
    const err =
      (properties?.error instanceof Error && properties.error) || undefined;
    const extraWithoutError =
      err && "error" in properties
        ? Object.fromEntries(
            Object.entries(properties).filter(([k]) => k !== "error"),
          )
        : (properties as Record<string, unknown>);
    const extra = { ...extraWithoutError, originalEvent: eventName };

    switch (eventType) {
      case "critical":
        if (err) {
          this.rollbar.critical(eventName, err, extra);
        } else {
          this.rollbar.critical(eventName, extra);
        }
        break;
      case "error":
        if (err) {
          this.rollbar.error(eventName, err, extra);
        } else {
          this.rollbar.error(eventName, extra);
        }
        break;
      case "warning":
        this.rollbar.warning(eventName, extra);
        break;
      case "info":
        this.rollbar.info(eventName, extra);
        break;
      case "debug":
        this.rollbar.debug(eventName, extra);
        break;
      default:
        this.rollbar.info(eventName, extra);
    }
  }

  async shutdown(): Promise<void> {
    // Rollbar SDK does not require explicit shutdown for typical usage
  }
}
