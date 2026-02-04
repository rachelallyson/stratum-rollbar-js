import {
  EventOptions,
  StratumSnapshot,
} from "@capitalone/stratum-observability";

export enum RollbarEventTypes {
  /** Log at critical severity */
  CRITICAL = "critical",
  /** Log at error severity */
  ERROR = "error",
  /** Log at warning severity */
  WARNING = "warning",
  /** Log at info severity */
  INFO = "info",
  /** Log at debug severity */
  DEBUG = "debug",
  /** Set the current person (user) for Rollbar */
  IDENTIFY = "identify",
  /** Clear the current person (e.g. on logout) */
  CLEAR_PERSON = "clear_person",
}

/**
 * Rollbar configuration options.
 * @see https://docs.rollbar.com/docs/javascript
 * @see https://docs.rollbar.com/docs/rollbarjs-configuration-reference
 */
export interface RollbarConfig {
  accessToken: string;
  captureUncaught?: boolean;
  captureUnhandledRejections?: boolean;
  enabled?: boolean;
  environment?: string;
  reportLevel?: "critical" | "error" | "warning" | "info" | "debug";
  payload?: {
    environment?: string;
    context?: string;
    client?: Record<string, unknown>;
    server?: Record<string, unknown>;
    person?: { id: string | number | null; username?: string; email?: string };
    custom?: Record<string, unknown>;
  };
  scrubFields?: string[];
  scrubPaths?: string[];
  verbose?: boolean;
  /** Person id is a string up to 40 characters (per Rollbar docs). */
  [key: string]: unknown;
}

export interface RollbarPluginOptions {
  /**
   * Access token used when no env-specific token is set.
   * In Next.js: use SERVER_ACCESS_TOKEN and/or CLIENT_ACCESS_TOKEN to send
   * server vs browser events to the right Rollbar project/token.
   */
  ACCESS_TOKEN?: string;
  /**
   * Token for server (Node) runtime. Falls back to ACCESS_TOKEN if not set.
   * Use Rollbar "post_server_item" token for server-side events.
   */
  SERVER_ACCESS_TOKEN?: string;
  /**
   * Token for browser (client) runtime. Falls back to ACCESS_TOKEN if not set.
   * Use Rollbar "post_client_item" token for client-side events.
   */
  CLIENT_ACCESS_TOKEN?: string;
  /** Rollbar configuration merged with defaults (applies to both runtimes) */
  config?: Partial<RollbarConfig>;
  /** Server-only config overrides (e.g. payload.server, captureUncaught: false) */
  serverConfig?: Partial<RollbarConfig>;
  /** Client-only config overrides (e.g. captureUncaught: true, captureUnhandledRejections: true) */
  clientConfig?: Partial<RollbarConfig>;
  /** Pre-initialized Rollbar instance (skips env-based token selection) */
  rollbarInstance?: RollbarInstance;
  /** Enable debug logging */
  DEBUG?: boolean;
}

interface RollbarEventOptions extends Partial<EventOptions> {
  data?: {
    properties: { [key: string]: unknown };
  };
}

export interface RollbarSnapshot extends StratumSnapshot {
  eventOptions?: RollbarEventOptions;
}

export interface RollbarEvent<EventId extends string = string> {
  id: EventId;
  description: string;
  eventType: RollbarEventTypes;
  properties?: { [key: string]: unknown };
}

/**
 * Rollbar SDK instance interface (matches rollbar npm package).
 * error/critical accept (message, err?, custom?) per Rollbar method reference.
 * @see https://docs.rollbar.com/docs/javascript
 */
export interface RollbarInstance {
  critical: (
    message: string,
    errOrExtra?: Error | Record<string, unknown>,
    custom?: Record<string, unknown>,
  ) => void;
  error: (
    message: string,
    errOrExtra?: Error | Record<string, unknown>,
    custom?: Record<string, unknown>,
  ) => void;
  warning: (message: string, extra?: Record<string, unknown>) => void;
  info: (message: string, extra?: Record<string, unknown>) => void;
  debug: (message: string, extra?: Record<string, unknown>) => void;
  log: (message: string, extra?: Record<string, unknown>) => void;
  configure: (options: Partial<RollbarConfig>) => void;
}
