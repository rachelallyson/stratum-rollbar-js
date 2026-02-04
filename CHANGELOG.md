# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [2.0.0] - 2026-02-04

### Changed

- **Opt-in publishing (breaking):** The Rollbar publisher only sends events when the caller includes `RollbarPlugin` in `pluginData` (Stratum then passes this as `eventOptions.data`). If `eventOptions.data` is missing, `getEventOutput` returns `null` and nothing is sent to Rollbar. Upgrade from 1.x: pass `pluginData: { RollbarPlugin: { properties: { ... } } }` (or `{ properties: {} }`) for any event you want sent to Rollbar.

## [1.0.0] - 2026-02-04

### Added

- Initial release.
- Rollbar plugin for [Stratum Observability](https://www.npmjs.com/package/@capitalone/stratum-observability).
- Browser and Node support with separate tokens (e.g. Next.js: `CLIENT_ACCESS_TOKEN` / `SERVER_ACCESS_TOKEN`).
- Event types: `critical`, `error`, `warning`, `info`, `debug`, `IDENTIFY`, `CLEAR_PERSON`.
- Optional `serverConfig` / `clientConfig` and pre-initialized `rollbarInstance`.
- Example app in `src/example/` (Parcel + React) and Playwright e2e tests.
- Documentation site (Nextra) deployable to GitHub Pages.
