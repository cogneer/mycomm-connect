/** What a hosted link is for. A newer purpose arrives as its plain string. */
export type LinkPurpose = 'connect' | 'add_channel' | 'replace_device' | 'manage' | 'claim';

/** Which link a flow was for, as the hosted page reports it; `null` when no message from the page said so. */
export interface LinkContext {
  purpose: LinkPurpose | (string & {}) | null;
  lineId: string | null;
}

/** The ids the hosted page reports when a phone was paired and its SIM connected. */
export interface ConnectResult extends LinkContext {
  sessionId: string | null;
  deviceId: string | null;
  channelId: string | null;
}

/** The detail of `mycomm-connect:ended`. */
export interface EndedDetail extends LinkContext {
  sessionId: string | null;
  reason: EndReason;
}

/** Why a session ended without being completed on this page. */
export type EndReason = 'expired' | 'revoked' | 'completed_elsewhere' | 'unknown';

/** What `open()` resolves with. Every flow ends in exactly one of these, or rejects with a `MyCommConnectError`. */
export type ConnectOutcome =
  | ({ status: 'completed' } & ConnectResult)
  | ({ status: 'ended' } & EndedDetail)
  | ({ status: 'cancelled' } & LinkContext)
  | ({ status: 'closed' } & LinkContext);

export type ConnectErrorCode = 'missing-url' | 'invalid-url' | 'blocked-popup' | 'invalid-option' | 'timeout';

/** Why a flow could not start or finish. */
export declare class MyCommConnectError extends Error {
  readonly name: 'MyCommConnectError';
  readonly code: ConnectErrorCode;
  constructor(code: ConnectErrorCode, message?: string);
}

export interface OpenOptions {
  /** `popup` (default) or `inline`. */
  mode?: 'popup' | 'inline';
  /** Where an inline frame goes; the document body by default. */
  container?: HTMLElement;
  /** Inline frame height in pixels (default 640). */
  height?: number;
  /** Minutes after which an unfinished flow rejects with a `timeout` error. No limit by default. */
  timeout?: number;
}

/** The origin of a valid session link, or `null` when the link is not one. */
export declare function sessionOrigin(url: string | null | undefined): string | null;

/** The result of reading a message from the hosted page; `null` for anything not documented, or not from the page. */
export type PageMessage =
  | { kind: 'completed' | 'cancelled'; detail: ConnectResult }
  | { kind: 'ended'; detail: EndedDetail }
  | { kind: 'needs-popup' };

/** Reads a message from the hosted page: only from its origin and its window, and only documented types. */
export declare function readMessage(event: MessageEvent, origin: string, source: Window | null): PageMessage | null;

/**
 * Opens a connect session. Call it from a click handler, or the browser may block the popup. Rejects with a
 * `MyCommConnectError` only when the flow cannot start (bad link, bad option, blocked popup) or times out.
 */
export declare function open(url: string, options?: OpenOptions): Promise<ConnectOutcome>;

export declare class MyCommConnectElement extends HTMLElement {
  static observedAttributes: string[];
  readonly url: string;
  readonly mode: 'popup' | 'inline';
  /** Set the `purpose` attribute to pick the default button label; it changes nothing else. */
  /** Minutes after which an unfinished flow ends in a `timeout` error; 0 for no limit. */
  readonly timeout: number;
  /** Opens the flow in a popup, as a click on the button does. */
  open(): void;
}

export declare const MyCommConnect: { open: typeof open; version: string; MyCommConnectError: typeof MyCommConnectError };
export default MyCommConnect;

declare global {
  interface HTMLElementTagNameMap {
    'mycomm-connect': MyCommConnectElement;
  }
  interface HTMLElementEventMap {
    'mycomm-connect:completed': CustomEvent<ConnectResult>;
    'mycomm-connect:ended': CustomEvent<EndedDetail>;
    'mycomm-connect:cancelled': CustomEvent<ConnectResult>;
    'mycomm-connect:closed': CustomEvent<LinkContext>;
    'mycomm-connect:error': CustomEvent<{ code: ConnectErrorCode; message: string } & LinkContext>;
  }
}
