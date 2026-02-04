# Stratum Rollbar Plugin

A Rollbar plugin for [Stratum Observability](https://www.npmjs.com/package/@capitalone/stratum-observability) that works in **both browser and Node**, so you can send events from Next.js server components, API routes, and client components with one plugin. **Next.js and React are not required** — the plugin is framework-agnostic and works in any JavaScript environment (Node, browser, Vite, Express, etc.); the docs emphasize Next.js for the common server+client token setup.

**Documentation:** [GitHub Pages](https://rachelallyson.github.io/stratum-rollbar-js/) (after enabling Pages and pushing to `main`). See [DOCS_SETUP.md](./DOCS_SETUP.md) for local dev and deployment.

## Features

- **Browser and server**: Same API on client and server; use separate Rollbar tokens per runtime (e.g. `post_client_item` vs `post_server_item`).
- **Log levels**: `critical`, `error`, `warning`, `info`, `debug` map to Rollbar’s methods.
- **Person tracking**: `IDENTIFY` and `CLEAR_PERSON` event types call `Rollbar.configure({ payload: { person } })`.
- **Error objects**: Pass an `Error` in event properties for error/critical so Rollbar gets stack traces.
- **Next.js**: Environment-aware token selection and optional `serverConfig` / `clientConfig`.

## Installation

```bash
npm install @rachelallyson/stratum-rollbar-js
```

## Quick start (Next.js – browser and server)

Use separate tokens so server and client events go to the right place in Rollbar. Match [Rollbar’s Next.js docs](https://docs.rollbar.com/docs/nextjs): **do not** put the server token in a `NEXT_PUBLIC_` env var so it stays server-only.

Add to `.env` (or `.env.local`):

```bash
NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN=<POST CLIENT ITEM TOKEN>
ROLLBAR_SERVER_TOKEN=<POST SERVER ITEM TOKEN>
```

Then wire the plugin:

```typescript
// lib/observability.ts or similar
import {
  RollbarService,
  RollbarPluginFactory,
  RollbarEventTypes,
} from "@rachelallyson/stratum-rollbar-js";

const catalog = {
  API_ERROR: {
    id: "API_ERROR",
    description: "API request failed",
    eventType: RollbarEventTypes.ERROR,
    properties: { error: "object", path: "string", status: "number" },
  },
  USER_SIGNED_IN: {
    id: "USER_SIGNED_IN",
    description: "User identified for Rollbar",
    eventType: RollbarEventTypes.IDENTIFY,
    properties: { id: "string", username: "string", email: "string" },
  },
  USER_SIGNED_OUT: {
    id: "USER_SIGNED_OUT",
    description: "Clear Rollbar person",
    eventType: RollbarEventTypes.CLEAR_PERSON,
    properties: {},
  },
};

export const rollbarService = new RollbarService({
  catalog: { items: catalog },
  plugins: [
    RollbarPluginFactory({
      // Server (API routes, server components): post_server_item token (not NEXT_PUBLIC)
      SERVER_ACCESS_TOKEN: process.env.ROLLBAR_SERVER_TOKEN!,
      // Client (browser): post_client_item token
      CLIENT_ACCESS_TOKEN: process.env.NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN!,
      config: {
        environment: process.env.NODE_ENV,
        payload: { context: "my-app" },
      },
      // Optional: server-only overrides (e.g. no uncaught capture on server)
      serverConfig: {
        captureUncaught: false,
        captureUnhandledRejections: false,
      },
      // Optional: client-only overrides
      clientConfig: {
        captureUncaught: true,
        captureUnhandledRejections: true,
      },
    }),
  ],
  productName: "my-app",
  productVersion: "1.0.0",
});
```

For uncaught errors and the Rollbar React Provider/Error Boundary in Next.js (App or Pages router), follow [Rollbar’s Next.js guide](https://docs.rollbar.com/docs/nextjs). This plugin handles **Stratum-driven** events (e.g. `rollbarService.publish(...)`) on both server and client and works alongside that setup. For App Router, see Rollbar's guide for Provider in root layout, `error.js`, and `global-error.js`; install `@rollbar/react` for the Provider and ErrorBoundary.

Then use the same service on server and client:

```typescript
// app/api/some-route/route.ts (server)
import { rollbarService } from "@/lib/observability";

export async function GET() {
  try {
    // ...
  } catch (e) {
    await rollbarService.publish("API_ERROR", {
      pluginData: {
        RollbarPlugin: {
          properties: {
            error: e instanceof Error ? e : new Error(String(e)),
            path: "/api/some-route",
            status: 500,
          },
        },
      },
    });
    throw e;
  }
}
```

```typescript
// components/SomeClientComponent.tsx (client)
"use client";
import { rollbarService } from "@/lib/observability";

export function SomeClientComponent() {
  const handleError = async () => {
    await rollbarService.publish("API_ERROR", {
      pluginData: {
        RollbarPlugin: {
          properties: {
            error: new Error("Client-side failure"),
            path: window.location.pathname,
          },
        },
      },
    });
  };
  // ...
}
```

## Configuration options

| Option | Description |
| -------- | ------------- |
| `ACCESS_TOKEN` | Fallback token when `SERVER_ACCESS_TOKEN` / `CLIENT_ACCESS_TOKEN` are not set |
| `SERVER_ACCESS_TOKEN` | Token for Node (Next.js server, API routes). Use Rollbar “post_server_item” |
| `CLIENT_ACCESS_TOKEN` | Token for browser. Use Rollbar “post_client_item” |
| `config` | Rollbar config for both runtimes |
| `serverConfig` | Merged only when running on server |
| `clientConfig` | Merged only when running in the browser |
| `rollbarInstance` | Pre-initialized Rollbar instance (skips token/config init) |
| `DEBUG` | Log publish calls to console |

If you only need one runtime, you can pass just `ACCESS_TOKEN` (or only `SERVER_ACCESS_TOKEN` or `CLIENT_ACCESS_TOKEN`). The plugin initializes only when the current runtime has a token.

## Event types

| Event type | Rollbar behavior |
| ------------ | ------------------ |
| `RollbarEventTypes.CRITICAL` | `rollbar.critical(message, err?, extra?)` |
| `RollbarEventTypes.ERROR` | `rollbar.error(message, err?, extra?)` |
| `RollbarEventTypes.WARNING` | `rollbar.warning(message, extra)` |
| `RollbarEventTypes.INFO` | `rollbar.info(message, extra)` |
| `RollbarEventTypes.DEBUG` | `rollbar.debug(message, extra)` |
| `RollbarEventTypes.IDENTIFY` | `rollbar.configure({ payload: { person: { id, username?, email? } } })` |
| `RollbarEventTypes.CLEAR_PERSON` | `rollbar.configure({ payload: { person: { id: null } } })` |

For **IDENTIFY**, pass in `pluginData.RollbarPlugin.properties`: `id` (or `distinct_id` / `user_id`), and optionally `username`, `email`.

## Reporting errors with stack traces

Put an `Error` in `properties.error`; the plugin will pass it through so Rollbar gets the stack:

```typescript
await rollbarService.publish("API_ERROR", {
  pluginData: {
    RollbarPlugin: {
      properties: {
        error: err, // Error instance
        path: "/api/orders",
        status: 500,
      },
    },
  },
});
```

## Single runtime (no Next.js)

You can use one token for both environments:

```typescript
RollbarPluginFactory({
  ACCESS_TOKEN: process.env.ROLLBAR_ACCESS_TOKEN!,
  config: { environment: "production" },
});
```

Or a pre-initialized Rollbar instance:

```typescript
import Rollbar from "rollbar";

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN!,
  captureUncaught: true,
});

RollbarPluginFactory({ rollbarInstance: rollbar });
```

## Example

A runnable demo lives in `src/example/`. It uses the same pattern as the [Stratum PostHog example](https://github.com/rachelallyson/stratum-posthog-js/tree/main/src/example): catalog, Stratum service with Rollbar plugin, and a small React UI to identify/clear person and send events at different log levels.

Put your token in a **`.env`** file in the package root (same folder as `package.json`). Parcel will load it when you run the example:

```bash
# .env (create this file in stratum-rollbar-js root; see .env.example)
ROLLBAR_CLIENT_TOKEN=your-post-client-item-token
```

Then run:

```bash
npm run example
```

Then open the URL Parcel prints (e.g. `http://localhost:1234`). Use **Login** to identify a person, **Logout** to clear the person, and the event buttons to send info, warning, error (with or without stack), and debug events to Rollbar.

### E2E tests

Playwright e2e tests exercise the example app (load, status, all event buttons, login/logout). They start the example server on port 3967 and run in Chromium.

```bash
npm run test:e2e
```

## Troubleshooting

**Events not showing in Rollbar?**

- **Token scope** — Use a **post client item** token for the browser (e.g. `NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN`) and a **post server item** token for the server. Don’t put the server token in a `NEXT_PUBLIC_` env var. See [Rollbar’s Next.js docs](https://docs.rollbar.com/docs/nextjs).
- **reportLevel** — Rollbar’s default can filter out `info`/`debug`. Set `config.reportLevel` and `clientConfig.reportLevel` to `"debug"` if you need those levels.
- **Placeholder token** — In the example app, ensure `.env` has a real token (see `.env.example`). If the UI warns that the token isn’t set, events won’t be sent.

More causes and fixes: [Troubleshooting](https://rachelallyson.github.io/stratum-rollbar-js/guides/troubleshooting) on the docs site.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## License

Apache-2.0
