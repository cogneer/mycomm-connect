# @mycomm/connect

A drop-in widget that lets the people using your product pair their Android phone and connect its SIM to
[MyComm](https://mycomm.cogneer.tech), without leaving your app and without a MyComm login. Built for partners
whose tenants each bring their own phone: each tenant has a line, and the widget opens a hosted link for it.

The widget shows MyComm's hosted page in a popup (default) or inline, and tells your page how it ended. It never
sees an API key: your server creates a short-lived **hosted link** for the tenant's line and gives the browser only its
URL.

## 1. Create a hosted link on your server

With the PHP SDK and a partner key, for the line you made for the tenant (`$partner->partner->lines->create(...)`):

```php
use MyComm\Enums\HostedLinkPurpose;

$link = $partner->partner->lines->links->create(
    $tenant->mycomm_line_id,
    purpose: HostedLinkPurpose::Connect,
    return_url: 'https://app.example.com/settings/sms',
    allowed_origins: ['https://app.example.com'],
);

// Hand $link->url to the page. It is a credential for this line, valid 30 minutes by default.
```

With Node: `await partner.partner.lines.links.create(lineId, { purpose: 'connect', return_url, allowed_origins })`. With
Laravel, `<x-mycomm-connect :line="$lineId" purpose="connect" />` creates the link and renders this element in one step.
Or with any HTTP client: `POST /partner/v1/lines/{id}/links` with your partner key, or `POST /v1/lines/{id}/links` with an
account key for its own line. `allowed_origins` must list the origin of the page that shows the widget: the hosted page
reports back only to those origins, and only they may frame it.

`purpose` is what the hosted page does:

| Purpose          | The page                                                                   | Default button label |
| ---------------- | -------------------------------------------------------------------------- | -------------------- |
| `connect`        | Pairs the first phone and verifies its number (joining the user's account) | Connect your phone   |
| `add_channel`    | Adds one more phone or SIM to the line                                     | Add a phone or SIM   |
| `replace_device` | Pairs a new phone in place of `replaces_device_id`                         | Replace a phone      |
| `manage`         | Lets the user manage the line's phones and rules                           | Manage messaging     |
| `claim`          | Lets the user claim the account the line lives in                          | Connect your phone   |

## 2. Show the widget

```bash
npm install @mycomm/connect
```

```js
import '@mycomm/connect';
```

```html
<mycomm-connect url="https://mycomm.cogneer.tech/connect/k3J…" purpose="connect"></mycomm-connect>
```

Without a bundler, load an exact version with its integrity hash (printed by the build and listed in the
[changelog](CHANGELOG.md) and on each release):

```html
<!-- as a module: import "@mycomm/connect" semantics, the element registers itself -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@mycomm/connect@1.1.0/dist/mycomm-connect.min.js"
        integrity="sha384-zjWec3DjfJ6L9dOntS8rV1NHiuArH5Oo4+O5bo8vdVaUfs4Miq8aajK3HBn/wLpq" crossorigin="anonymous"></script>

<!-- as a classic script: also sets window.MyCommConnect.open() -->
<script src="https://cdn.jsdelivr.net/npm/@mycomm/connect@1.1.0/dist/mycomm-connect.iife.min.js"
        integrity="sha384-FJH/73HNHR3zwVzMoLwPOkK/F2ymI5R+4kdQ9YNKb0ovxVMiHjR0XaLxeZw//Yap" crossorigin="anonymous"></script>
```

| Attribute | |
|---|---|
| `url` | The link URL from step 1. Required; without it the element reports a `missing-url` error. |
| `purpose` | The link's purpose, for the default button label only (see the table in step 1). Optional. |
| `mode` | `popup` (default): a button that opens the flow in a popup. `inline`: the flow in an iframe on your page. |
| `label` | Button text in popup mode. Default: the label of `purpose`, else "Connect your phone". |
| `height` | Iframe height in pixels in inline mode. Default 640. |
| `timeout` | Minutes after which an unfinished flow ends in a `timeout` error. Default: no limit. |

Changing `url` or `mode`, or removing the element, abandons a flow in progress: the popup is closed and nothing is reported
for the old link.

## 3. Listen for the outcome

Every flow ends in exactly one of these. Every detail also carries `purpose` and `lineId`, the link's purpose and line
as the hosted page reported them, or `null` when no message from the page said so (`closed`, `error`):

| Event | Detail | When |
|---|---|---|
| `mycomm-connect:completed` | `{sessionId, deviceId, channelId, purpose, lineId}` | The link's work is done: for `connect`, the phone is paired and its SIM connected |
| `mycomm-connect:ended` | `{sessionId, reason, purpose, lineId}` | The link cannot be used: `expired`, `revoked`, `completed_elsewhere` (or `unknown` for a reason newer than this version) |
| `mycomm-connect:cancelled` | `{purpose, lineId}` | The person cancelled |
| `mycomm-connect:closed` | `{purpose, lineId}` | The popup was closed before any outcome |
| `mycomm-connect:error` | `{code, message, purpose, lineId}` | The flow could not start or finish. `code` is `missing-url`, `invalid-url`, `blocked-popup`, `invalid-option` or `timeout` |

```js
const widget = document.querySelector('mycomm-connect');

widget.addEventListener('mycomm-connect:completed', (event) => {
  const { sessionId, deviceId, channelId, purpose, lineId } = event.detail;
  // The phone is paired and its number verified. Confirm on your server:
  // GET /partner/v1/links/{sessionId} (or /v1/links/{sessionId}) reads "completed".
});
widget.addEventListener('mycomm-connect:ended', (event) => { /* ask your server for a new link */ });
widget.addEventListener('mycomm-connect:cancelled', () => { /* the person cancelled */ });
widget.addEventListener('mycomm-connect:closed', () => { /* the popup was closed before the end */ });
widget.addEventListener('mycomm-connect:error', (event) => {
  console.error(event.detail.code, event.detail.message);
});
```

Treat these events as a signal to refresh, not as proof: confirm on your server with `GET /partner/v1/links/{id}`
(`GET /v1/links/{id}` for an account key) or `GET /partner/v1/lines/{id}/status`, or with the `line.connected`,
`device.paired` and `channel.connected` webhooks.

Or without an element (call it from a click handler, so the browser allows the popup):

```js
import { open, MyCommConnectError } from '@mycomm/connect';

button.addEventListener('click', async () => {
  try {
    const outcome = await open(linkUrl, { timeout: 30 });   // { status: 'completed' | 'ended' | 'cancelled' | 'closed', purpose, lineId, ... }
  } catch (error) {
    if (error instanceof MyCommConnectError) {
      console.error(error.code, error.message);
    }
  }
});
```

`open()` resolves with the outcome (`ended`, `cancelled` and `closed` are outcomes, not failures) and rejects with a
`MyCommConnectError` only when the flow cannot start or times out. It checks its options first and throws
`invalid-option` before it touches the page.

| Option | |
|---|---|
| `mode` | `'popup'` (default) or `'inline'` |
| `container` | An element for an inline frame; `document.body` by default |
| `height` | Inline frame height in pixels (default 640) |
| `timeout` | Minutes until the flow ends in a `timeout` error |

### TypeScript

Types are included. `ConnectOutcome` is a union you can `switch` on by `status`, and the event names are typed on
`HTMLElementEventMap`, so `event.detail` is typed in `addEventListener('mycomm-connect:completed', ...)`.

### React

```jsx
import '@mycomm/connect';
import { useEffect, useRef } from 'react';

export function ConnectPhone({ linkUrl, onDone }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const done = (event) => onDone(event.type.split(':')[1], event.detail);
    const names = ['completed', 'ended', 'cancelled', 'closed', 'error'].map((name) => `mycomm-connect:${name}`);
    names.forEach((name) => el.addEventListener(name, done));
    return () => names.forEach((name) => el.removeEventListener(name, done));
  }, [onDone]);

  return <mycomm-connect ref={ref} url={linkUrl} purpose="connect" />;
}
```

### Livewire and Blade

```blade
<x-mycomm-connect :line="$lineId" purpose="connect"
                  x-on:mycomm-connect:completed="$wire.phoneConnected($event.detail.sessionId)" />
```

The component of `mycomm/mycomm-laravel` creates the link per page view (step 1); never cache or log it. Without the
package, render `<mycomm-connect url="{{ $linkUrl }}" purpose="connect">` with a link you create per visit.

## Browser support and your Content-Security-Policy

Chrome 86+, Safari 14+ and Firefox 78+ (custom elements, shadow DOM, `postMessage`). If your page sets a
Content-Security-Policy:

| Directive | Needs | For |
|---|---|---|
| `frame-src https://mycomm.cogneer.tech` | inline mode | the iframe |
| `script-src https://cdn.jsdelivr.net` | CDN use only | the script tag (not needed with a bundler) |

A popup needs no directive. The widget makes no network requests of its own and loads no fonts or images.

## Styling

The button and frame are in a shadow root. Style them with `::part(button)`, `::part(frame)` and
`::part(fallback)`, or the custom properties `--mycomm-connect-background`, `--mycomm-connect-color`,
`--mycomm-connect-radius` and `--mycomm-connect-padding`.

## Popup or inline?

Popup works everywhere. Inline needs the browser to keep MyComm's cookie inside a cross-site frame, which
browsers that block third-party cookies allow only as a partitioned cookie; when they block even that, the
hosted page asks for a popup and the widget opens one. A "Trouble? Open in a new window" link sits under the
frame for the same reason.

## Security

- The link URL must be `https://…/connect/<token>` (no user info). `http://localhost` links work only in a build made with
  `MYCOMM_CONNECT_DEV=1`; the published bundles refuse them.
- The iframe has no `sandbox` attribute: the hosted page needs its cookies, `postMessage` and top-level navigation to pair a
  phone, and a sandbox that allows them adds nothing. What protects you is that the widget accepts messages only from the
  link URL's origin and only from the window it opened.
- Messages are accepted only from the link URL's origin and from the popup or frame the widget opened, and
  only with the documented types.
- The link URL is a credential for one line: create it per visit, do not log it, do not put it in a URL
  of your own.

## Development

`./dev npm install`, then `./dev check` (types, a TypeScript consumer snippet, tests, build). Everything runs in a Node
container. `./dev build` prints the SRI hash of each bundle; paste them into the changelog when you release.

## License

MIT
