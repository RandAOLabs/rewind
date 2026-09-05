/**
 * Solana JSON-RPC client.
 *
 * Two constraints shape this file:
 *
 *  1. **The endpoint must be archival.** ArNS moved to Solana on 2026-06-05, so
 *     a name's history starts there. `solana-rpc.publicnode.com` is CORS-open
 *     but keeps only ~3 days of ledger, and returns an empty signature list
 *     rather than an error — silently truncating history to nothing. We probe
 *     `getFirstAvailableBlock` and refuse an endpoint that cannot see genesis.
 *  2. **The endpoint must allow browser origins.** `api.mainnet-beta.solana.com`
 *     is fully archival but 403s any request carrying an `Origin` header, so it
 *     is unusable from a page without a proxy.
 *
 * The endpoints below are keyless, archival and CORS-open. They are courtesy
 * infrastructure with no SLA, which is what the failover list is for.
 */

const DEFAULT_ENDPOINTS = [
  'https://solana-rpc.debridge.finance',
  'https://docs-demo.solana-mainnet.quiknode.pro/',
  'https://public.rpc.solanavibestation.com',
];

/** Overridable at build time via VITE_SOLANA_RPCS (comma-separated). */
export const SOLANA_ENDPOINTS: string[] = (() => {
  const raw = import.meta.env?.VITE_SOLANA_RPCS as string | undefined;
  const parsed = raw?.split(',').map(s => s.trim()).filter(Boolean);
  return parsed?.length ? parsed : DEFAULT_ENDPOINTS;
})();

/** ArNS went live on Solana here; nothing we care about predates it. */
export const SOLANA_ERA_START_TS = 1780677015; // 2026-06-05T16:30:15Z

const TIMEOUT_MS = 20_000;
/** Public endpoints rate-limit around 5 rps; stay under it. */
const MIN_REQUEST_GAP_MS = 210;
const MAX_RETRIES = 3;

export interface SignatureInfo {
  signature: string;
  blockTime: number | null;
  err: unknown;
}

let lastRequestAt = 0;
async function throttle(): Promise<void> {
  const wait = lastRequestAt + MIN_REQUEST_GAP_MS - Date.now();
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

/** Endpoints confirmed archival this session, so we probe each only once. */
const archivalChecked = new Map<string, boolean>();

async function callOne(endpoint: string, method: string, params: unknown[]): Promise<unknown> {
  await throttle();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) {
      const code = json.error.code;
      // -32005 / -32007 are rate limits: worth retrying, unlike a bad request.
      const retryable = code === -32005 || code === -32007;
      const err = new Error(`RPC ${code}: ${json.error.message ?? ''}`);
      (err as { retryable?: boolean }).retryable = retryable;
      throw err;
    }
    return json.result;
  } finally {
    clearTimeout(timer);
  }
}

async function isArchival(endpoint: string): Promise<boolean> {
  const cached = archivalChecked.get(endpoint);
  if (cached !== undefined) return cached;
  try {
    const first = (await callOne(endpoint, 'getFirstAvailableBlock', [])) as number;
    // The Solana era starts around slot ~4.4e8; an endpoint whose ledger begins
    // after that cannot serve the history we need.
    const ok = typeof first === 'number' && first < 400_000_000;
    archivalChecked.set(endpoint, ok);
    return ok;
  } catch {
    archivalChecked.set(endpoint, false);
    return false;
  }
}

/** Call a method, trying each archival endpoint with backoff on rate limits. */
export async function solanaRpc(method: string, params: unknown[]): Promise<unknown> {
  let lastErr: unknown;

  for (const endpoint of SOLANA_ENDPOINTS) {
    if (!(await isArchival(endpoint))) continue;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await callOne(endpoint, method, params);
      } catch (err) {
        lastErr = err;
        if (!(err as { retryable?: boolean }).retryable) break;
        await new Promise(r => setTimeout(r, 400 * 2 ** attempt));
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('All Solana RPC endpoints failed');
}

/**
 * Every signature that touched an address, oldest first.
 *
 * Pages backwards with `before` (the only direction the RPC supports) and
 * reverses at the end.
 */
export async function getSignatures(address: string, maxPages = 10): Promise<SignatureInfo[]> {
  const all: SignatureInfo[] = [];
  let before: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const opts: Record<string, unknown> = { limit: 1000 };
    if (before) opts.before = before;

    const batch = (await solanaRpc('getSignaturesForAddress', [address, opts])) as SignatureInfo[] | null;
    if (!batch?.length) break;

    all.push(...batch);
    if (batch.length < 1000) break;
    before = batch[batch.length - 1].signature;
  }

  return all
    .filter(s => !s.err && s.blockTime)
    .sort((a, b) => (a.blockTime ?? 0) - (b.blockTime ?? 0));
}

export interface TxLogs {
  signature: string;
  blockTime: number;
  logs: string[];
}

/** Fetch one transaction's log messages. Returns null for anything unusable. */
export async function getTransactionLogs(signature: string): Promise<TxLogs | null> {
  const tx = (await solanaRpc('getTransaction', [
    signature,
    { maxSupportedTransactionVersion: 0, encoding: 'json' },
  ])) as { blockTime?: number; meta?: { logMessages?: string[]; err?: unknown } } | null;

  if (!tx?.meta || tx.meta.err) return null;
  return {
    signature,
    blockTime: tx.blockTime ?? 0,
    logs: tx.meta.logMessages ?? [],
  };
}
