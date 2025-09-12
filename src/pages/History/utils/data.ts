import { from, of, Observable } from 'rxjs';
import type { AntSnapshot, SnapshotDelta } from '../types';

export function toObs<T>(v: T | Promise<T> | undefined): Observable<T | undefined> {
  if (v === undefined) return of(undefined as T | undefined);
  return from(Promise.resolve(v));
}

export function stripUndef<T extends Record<string, any>>(o: T): Partial<T> {
  const entries = Object.entries(o).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}

export function firstDefined<T>(...vals: Array<T | undefined>): T | undefined {
  for (const v of vals) if (v !== undefined) return v;
  return undefined;
}

export function uniq(arr: string[] = []) { return Array.from(new Set(arr)); }

/** prevent empties (""/0) from wiping good state */
export function sanitizeDelta<T extends Record<string, any>>(delta: T): Partial<T> {
  const out: any = {};
  for (const [k, v] of Object.entries(delta)) {
    if (v === undefined || v === null) continue;
    if (
      (k === 'owner' || k === 'processId' || k === 'targetId' ||
       k === 'description' || k === 'ticker' || k === 'purchasePrice' ||
       k === 'subDomain') && v === ''
    ) continue;
    if (
      (k === 'expiryTs' || k === 'ttlSeconds' || k === 'undernameLimit' || k === 'startTime') &&
      (v === 0 || v === '0')
    ) continue;
    out[k] = v;
  }
  return out;
}

export function applyDelta(
  prev: AntSnapshot,
  delta: Partial<AntSnapshot>,
  opts?: { authoritative?: boolean }
): AntSnapshot {
  const replace = !!opts?.authoritative;

  const nextControllers = delta.controllers
    ? (replace ? delta.controllers : uniq([...(prev.controllers ?? []), ...delta.controllers]))
    : prev.controllers;

  const nextUndernames = delta.undernames
    ? (replace ? delta.undernames : uniq([...(prev.undernames ?? []), ...delta.undernames]))
    : prev.undernames;

  const nextKeywords = delta.keywords
    ? (replace ? delta.keywords : uniq([...(prev.keywords ?? []), ...delta.keywords]))
    : prev.keywords;

  const nextContentHashes = delta.contentHashes
    ? (replace ? delta.contentHashes : { ...(prev.contentHashes ?? {}), ...delta.contentHashes })
    : prev.contentHashes;

  return {
    ...prev,
    ...delta,
    controllers: nextControllers ?? [],
    undernames: nextUndernames ?? [],
    contentHashes: nextContentHashes ?? {},
    keywords: nextKeywords,
  };
}

export function toEpochSeconds(ts: any): number {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n >= 1e12 ? Math.floor(n / 1000) : Math.floor(n);
}

export function titleizeType(raw?: string): string | undefined {
  if (!raw) return undefined;
  const t = String(raw).trim();
  if (!t) return undefined;
  const lower = t.toLowerCase();
  if (lower === 'lease') return 'Lease';
  return t.charAt(0).toUpperCase() + t.slice(1);
}
