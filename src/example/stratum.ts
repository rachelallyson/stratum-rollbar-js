import { RollbarService, RollbarPluginFactory } from "..";
import { catalog } from "./catalog";
import {
  ROLLBAR_CLIENT_TOKEN as ENV_ROLLBAR_CLIENT_TOKEN,
  NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN as ENV_NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN,
  NODE_ENV as ENV_NODE_ENV,
} from "./env.generated";

const PLACEHOLDER_TOKEN = "your-post-client-item-token";

const ACCESS_TOKEN =
  ENV_ROLLBAR_CLIENT_TOKEN || ENV_NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN || PLACEHOLDER_TOKEN;

export const isPlaceholderToken = ACCESS_TOKEN === PLACEHOLDER_TOKEN;

export const stratumService = new RollbarService({
  catalog: {
    items: catalog,
  },
  plugins: [
    RollbarPluginFactory({
      ACCESS_TOKEN,
      config: {
        environment: ENV_NODE_ENV,
        captureUncaught: true,
        captureUnhandledRejections: true,
        reportLevel: "debug" as const,
      },
      clientConfig: {
        captureUncaught: true,
        captureUnhandledRejections: true,
        reportLevel: "debug" as const, // so info/debug button events are sent to Rollbar
      },
      DEBUG: true,
    }),
  ],
  productName: "stratum-rollbar-example",
  productVersion: "0.1",
});
