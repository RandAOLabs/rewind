/**
 * In-house ArNS history types.
 *
 * Replaces the `ao-js-sdk` event classes. The old code dispatched on
 * `ev.constructor.name`, which broke under minification and coupled the UI to a
 * third-party package. Everything here is a plain discriminated union on `kind`.
 *
 * Data source: Arweave GraphQL. AR.IO's contracts moved to Solana in mid-2026,
 * but the AO-era message log (Feb 2025 - Jun 2026) is permanently on Arweave and
 * is what this timeline renders.
 */

/** ARIO network process on AO. Registry-level notices are emitted `From-Process` this id. */
export const ARIO_PROCESS_ID = 'qNvAoz0TgcH7DMg8BCVn8jF32QH5L6T29VjHxhHqqGE';

export type RewindEventKind =
  // registry-level (emitted by the ARIO process)
  | 'buy-name'
  | 'extend-lease'
  | 'increase-undername'
  | 'upgrade-name'
  | 'reassign-name'
  | 'returned-name'
  // ANT-level (messages sent to the name's ANT process)
  | 'set-record'
  | 'remove-record'
  | 'set-name'
  | 'set-ticker'
  | 'set-description'
  | 'set-keywords'
  | 'set-logo'
  | 'set-controller'
  | 'remove-controller'
  | 'state-notice'
  | 'credit-notice'
  | 'debit-notice'
  | 'unknown';

/**
 * One timeline event, fully described by its Arweave message tags.
 *
 * Deliberately flat: every field the UI needs is derived from tags, which are
 * indexed by GraphQL and therefore always available. Message *bodies* are
 * fetched from gateways and 404 unpredictably for older data items, so nothing
 * required for rendering may depend on one.
 */
export interface RewindEvent {
  kind: RewindEventKind;
  /** Arweave message id (this is the tx hash the UI links to). */
  txId: string;
  /** Epoch seconds. Block timestamp; 0 when the message is not yet mined. */
  ts: number;
  /** Address that signed the message. */
  actor: string;
  /** Which process this event came from. */
  source: 'registry' | 'ant';
  /** ANT process that owned the name when this event happened. */
  antId?: string;
  /**
   * Position within its transaction.
   *
   * One Solana transaction can emit several events, all sharing a signature, so
   * `txId` alone is not a unique key there. AO messages are one event each and
   * leave this undefined.
   */
  seq?: number;
  /** Raw tag bag, for the details drawer and for kinds we don't model yet. */
  tags: Record<string, string>;
}

/**
 * One span of time during which a single ANT process controlled the name.
 *
 * `toTs` matters: an ANT can be reassigned away from a name and later reused for
 * a *different* name. Without an upper bound, that other name's events leak into
 * this timeline.
 */
export interface AntEra {
  antId: string;
  fromTs: number;
  /** Exclusive upper bound; `Infinity` for the era that is still current. */
  toTs: number;
}

/**
 * Current record state, read from an AR.IO gateway's resolver.
 *
 * The gateway resolver returns the record's resolution (target, ttl, ANT id,
 * undername limit) but not the ANT's own metadata. Fields it cannot supply are
 * optional and the header bar renders a placeholder for them; reading owner,
 * controllers and logo would mean talking to the Solana ANT program directly,
 * which is deliberately out of scope for now.
 */
export interface ArNameDetail {
  name: string;
  processId?: string;
  targetId?: string;
  ttlSeconds?: number;
  undernameLimit?: number;
  startTimestamp?: number;
  endTimestamp?: number;
  type?: string;
  purchasePrice?: string;
  owner?: string;
  /** Lease length in milliseconds; undefined for permabuy. */
  leaseDuration?: number;
  controllers?: string[];
  logoTxId?: string;
  /** Undername -> target transaction id. */
  records?: Record<string, string>;
  expiryDate?: Date;
}

/** Maps an AO `Action` tag to our event kind. */
const ACTION_TO_KIND: Record<string, RewindEventKind> = {
  // registry notices
  'Buy-Name-Notice': 'buy-name',
  'Buy-Record-Notice': 'buy-name',
  'Extend-Lease-Notice': 'extend-lease',
  'Increase-Undername-Limit-Notice': 'increase-undername',
  'Upgrade-Name-Notice': 'upgrade-name',
  'Reassign-Name-Notice': 'reassign-name',
  'Returned-Name-Notice': 'returned-name',
  // ANT handlers
  // `Transfer` is the user-signed ownership change; `Credit-Notice` is the
  // recipient-side echo of the same thing. Both carry `Recipient`.
  Transfer: 'credit-notice',
  'Set-Record': 'set-record',
  'Remove-Record': 'remove-record',
  'Set-Name': 'set-name',
  'Set-Ticker': 'set-ticker',
  'Set-Description': 'set-description',
  'Set-Keywords': 'set-keywords',
  'Set-Logo': 'set-logo',
  'Add-Controller': 'set-controller',
  'Set-Controller': 'set-controller',
  'Remove-Controller': 'remove-controller',
  'State-Notice': 'state-notice',
  'Credit-Notice': 'credit-notice',
};

/**
 * `ACTION_TO_KIND` is an **allowlist**, and that is deliberate.
 *
 * An ANT is an ordinary AO process, so anything can send it a message. The
 * `arweave` name's process receives traffic from unrelated applications —
 * `LogConfirmation` (188 of them), `NewPageCreated`, `VideoAdded`, `Pong` —
 * none of which is name history. A denylist cannot work here because there is
 * no bound on what third-party apps might send.
 *
 * So: an action we do not explicitly recognise is dropped, not rendered as
 * "Unknown Event". Adding support for a new ArNS action means adding it above.
 *
 * Two categories are recognised-but-deliberately-absent:
 *   - **Echo notices** (`Set-Record-Notice`, `Add-Controller-Notice`, ...). An
 *     ANT pushes one back after handling the real message; `randao` has 334
 *     against 334 real `Set-Record`s, so including them doubles the timeline.
 *   - **`Debit-Notice`** — the sender side of a transfer. `Credit-Notice` and
 *     `Transfer` already cover ownership changes; including the debit renders
 *     every transfer twice.
 */
export function isRecognizedAction(action: string | undefined): boolean {
  return action !== undefined && action in ACTION_TO_KIND;
}

export function actionToKind(action: string | undefined): RewindEventKind {
  if (!action) return 'unknown';
  return ACTION_TO_KIND[action] ?? 'unknown';
}
