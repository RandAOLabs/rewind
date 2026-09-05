/**
 * Current ArNS record state, read from an AR.IO gateway.
 *
 * AR.IO's contracts now live on Solana, but every gateway exposes the resolved
 * record over plain REST, so we need no Solana client and no chain RPC — one
 * `fetch` returns everything the header bar renders.
 *
 * Gateway choice matters: gateways can be pointed at different program
 * deployments and will disagree. `ar-io.dev` is a staging gateway and returns
 * different antIds than the mainnet fleet, so it is deliberately not in this
 * list.
 */

import type { ArNameDetail } from './types';

const DEFAULT_GATEWAYS = [
  'https://permagate.io',
  'https://vilenarios.com',
  'https://frostor.xyz',
];

/** Overridable at build time via VITE_ARIO_GATEWAYS (comma-separated). */
export const ARIO_GATEWAYS: string[] = (() => {
  const raw = import.meta.env?.VITE_ARIO_GATEWAYS as string | undefined;
  const parsed = raw?.split(',').map(s => s.trim()).filter(Boolean);
  return parsed?.length ? parsed : DEFAULT_GATEWAYS;
})();

const TIMEOUT_MS = 12_000;

interface ResolverResponse {
  txId?: string;
  ttlSeconds?: number;
  antId?: string;
  limit?: number;
  index?: number;
  resolvedAt?: number;
}

async function resolveOnce(gateway: string, name: string): Promise<ResolverResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${gateway}/ar-io/resolver/${encodeURIComponent(name)}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${gateway}`);
    return (await res.json()) as ResolverResponse;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve a name's current record, failing over between gateways.
 *
 * Returns `null` rather than throwing when the name simply does not resolve, so
 * the caller can distinguish "no such name" from "the network is down".
 */
export async function getAntDetail(fullName: string): Promise<ArNameDetail | null> {
  // The resolver accepts `undername_name` directly and resolves that record.
  const name = fullName.trim().toLowerCase();
  let lastErr: unknown;

  for (const gateway of ARIO_GATEWAYS) {
    try {
      const r = await resolveOnce(gateway, name);
      if (!r?.antId && !r?.txId) return null;
      return {
        name,
        processId: r.antId,
        targetId: r.txId,
        ttlSeconds: r.ttlSeconds,
        undernameLimit: r.limit,
      };
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error('Every AR.IO gateway failed to resolve the name');
}
