# Changelog

## [1.1.0] - Unreleased

For the API `2.0.0`, where hosted links for a line replace connect sessions. Only adds: a 1.0.0 page keeps working.

### Integrity (SRI)

- `dist/mycomm-connect.js`: `sha384-KUahyGj/uqBYUqLbVlp2cCYhXEcKiKMr8RLTQiJdN/Or5szT29+MN1gv5jHaSHXM`
- `dist/mycomm-connect.min.js`: `sha384-cEJ9jtIJGmPBNr6tAAXMaka94O8cJEUME8PSA7FR6IuVe/9vhOcaVGPKGZ0OvTIV`
- `dist/mycomm-connect.iife.min.js`: `sha384-8bubOxMkou37YAN3w7Neldo2Ig2auDHoULBqYh6PHZIOtu5sAtSYxh3Va8dubKgp`

### Added

- `purpose` and `lineId` in the detail of every event (`completed`, `ended`, `cancelled`, `closed`, `error`) and in what
  `open()` resolves with, read from the hosted page's messages (`mycomm.connect.completed` carries `{session_id,
  device_id, channel_id, purpose, line_id}`); `null` when no message said so.
- The optional `purpose` attribute, for the default button label only: `connect` "Connect your phone", `add_channel`
  "Add a phone or SIM", `replace_device` "Replace a phone", `manage` "Manage messaging". `label` still wins.
- Types `LinkPurpose`, `LinkContext` and `EndedDetail`.
- README: hosted links (`POST /partner/v1/lines/{id}/links`, `POST /v1/lines/{id}/links`) instead of connect sessions,
  the purposes, and the Laravel component.

## [1.0.0] - 2026-10-26

The first stable release, for the frozen API `1.0.0`. From here the package follows semantic versioning: `1.x` releases
only add. Breaking against 0.1.0, and nothing from 0.1.0 is kept as an alias (0.2.0 was never released; its changes are
here). The `ended` outcome needs the hosted page to post `mycomm.connect.ended`; until it does, an ended session shows its
own message and no event fires.

### Integrity (SRI)

- `dist/mycomm-connect.js`: `sha384-Ji+SZqHBRDf7npukVMQUUVwwqdTQbMmpkDWlm7DaQ+Dm4w3vhpxTEvrwxHdd3n6+`
- `dist/mycomm-connect.min.js`: `sha384-RnjF+Gn70M3rRVDW52U1GrcAatKnWRl8XGW1k3s5KKY8a4NIkV1+0Mo3/bFpLOjv`
- `dist/mycomm-connect.iife.min.js`: `sha384-Y7JqAI9m3TXZQgCgvUrmxDUTKmoGTWrvfMvXYNB/C+8/9ce0+fRRV7ylmhmDAK/k`

### Added

- The `ended` outcome (`mycomm-connect:ended`, `{sessionId, reason}`) for a session that expired, was revoked or was
  completed elsewhere; `open()` resolves with `{status: 'ended', ...}`.
- `MyCommConnectError` with a `code` (`missing-url`, `invalid-url`, `blocked-popup`, `invalid-option`, `timeout`). The error
  event carries `{code, message}`; `open()` rejects with it.
- The `timeout` attribute and option (minutes).
- A classic-script build, `dist/mycomm-connect.iife.min.js`, that sets `window.MyCommConnect`; source maps; the SRI hash of every
  bundle printed by the build.
- `readMessage` and the outcome and error types in the type declarations; a TypeScript consumer check in CI.
- README: Content-Security-Policy, browser support, options, TypeScript, React and Livewire examples.

### Changed (breaking)

- The error event detail is `{code, message}`, not `{reason}`. An empty `url` reports `missing-url`.
- `open()` rejects with `MyCommConnectError`, not a plain `Error`, and checks its options before touching the page.
- Changing `url` or `mode`, or removing the element, closes the popup, stops the timers and reports nothing for the old link.
- The published bundles no longer accept `http://localhost` session links; build with `MYCOMM_CONNECT_DEV=1` to keep them.

## [0.1.0] - 2026-10-14

First release: the `<mycomm-connect>` element with popup and inline modes, the `open()` function, and the
`completed`, `cancelled`, `closed` and `error` events.
