import { Observable, of } from 'rxjs';
import type { RewindEvent } from '../../../services/arns';
import type { SnapshotDelta } from '../types';
import { sanitizeDelta } from '../utils/data';

/**
 * Turns one event into the snapshot change it represents.
 *
 * This is now pure and synchronous. The old version built an rxjs `forkJoin`
 * over a dozen async getters per event because `ao-js-sdk` resolved each field
 * with its own network call; every parameter we need is an indexed message tag,
 * so there is nothing left to await.
 */

/** Reads the first tag present from a list of candidate names. */
function tag(ev: RewindEvent, ...names: string[]): string | undefined {
  for (const n of names) {
    const v = ev.tags[n];
    if (v !== undefined && v !== '') return v;
  }
  return undefined;
}

function num(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** ArNS timestamps arrive in both seconds and milliseconds. Normalise to seconds. */
function toSeconds(v: string | undefined): number | undefined {
  const n = num(v);
  if (n === undefined || n <= 0) return undefined;
  return n >= 1e12 ? Math.floor(n / 1000) : Math.floor(n);
}

/** ARIO is denominated to 6 decimals. */
function toArio(v: string | undefined): string | undefined {
  const n = num(v);
  if (n === undefined) return undefined;
  return String(n / 1e6);
}

function splitList(v: string | undefined): string[] | undefined {
  if (!v) return undefined;
  const parts = v
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

export function computeDelta(ev: RewindEvent): SnapshotDelta {
  switch (ev.kind) {
    case 'set-record': {
      const sub = tag(ev, 'Sub-Domain') ?? '@';
      const txid = tag(ev, 'Transaction-Id');
      const ttl = num(tag(ev, 'TTL-Seconds'));
      if (!txid) return {};

      const key = sub === '' ? '@' : sub;
      return sanitizeDelta({
        subDomain: key,
        ttlSeconds: ttl,
        contentHashes: { [key]: txid },
        ...(key === '@' ? { targetId: txid } : { undernames: [key] }),
      });
    }

    case 'remove-record': {
      const sub = tag(ev, 'Sub-Domain');
      return sub ? sanitizeDelta({ subDomain: sub }) : {};
    }

    case 'set-ticker':
      return sanitizeDelta({ ticker: tag(ev, 'Ticker', 'Value') });

    case 'set-name':
      return sanitizeDelta({ subDomain: tag(ev, 'Name', 'Value') });

    case 'set-description':
      return sanitizeDelta({ description: tag(ev, 'Description', 'Value') });

    case 'set-keywords':
      return sanitizeDelta({ keywords: splitList(tag(ev, 'Keywords', 'Value')) });

    case 'set-controller': {
      const c = tag(ev, 'Controller', 'Value');
      return c ? sanitizeDelta({ controllers: [c] }) : {};
    }

    case 'credit-notice':
      return sanitizeDelta({ owner: tag(ev, 'Recipient', 'Target') });

    case 'reassign-name':
      return sanitizeDelta({
        processId: tag(ev, 'Process-Id', 'New-Process-Id') ?? ev.antId,
      });

    case 'buy-name':
      return sanitizeDelta({
        owner: tag(ev, 'Buyer', 'Initiator', 'Recipient'),
        processId: tag(ev, 'Process-Id') ?? ev.antId,
        expiryTs: toSeconds(tag(ev, 'End-Timestamp', 'Lease-End', 'New-Expiry')),
        startTime: toSeconds(tag(ev, 'Start-Timestamp')),
        purchasePrice: toArio(tag(ev, 'Purchase-Price', 'Price')),
      });

    case 'extend-lease':
      return sanitizeDelta({
        expiryTs: toSeconds(tag(ev, 'End-Timestamp', 'Lease-End', 'New-Expiry')),
      });

    case 'increase-undername':
      return sanitizeDelta({
        undernameLimit: num(tag(ev, 'Undername-Limit', 'Limit', 'Quantity')),
      });

    case 'upgrade-name':
      return sanitizeDelta({
        startTime: toSeconds(tag(ev, 'Start-Timestamp')),
        purchasePrice: toArio(tag(ev, 'Purchase-Price', 'Price')),
        undernameLimit: num(tag(ev, 'Undername-Limit', 'Limit')),
      });

    // Carry no snapshot change of their own.
    case 'returned-name':
    case 'remove-controller':
    case 'state-notice':
    case 'debit-notice':
    case 'set-logo':
    case 'unknown':
    default:
      return {};
  }
}

/** @deprecated Observable wrapper kept so existing call sites keep working. */
export function computeDelta$(ev: RewindEvent): Observable<SnapshotDelta> {
  return of(computeDelta(ev));
}
