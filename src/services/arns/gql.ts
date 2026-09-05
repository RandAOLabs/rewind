/**
 * Minimal Arweave GraphQL client.
 *
 * No SDK: the whole surface we need is one POST and cursor paging. Endpoints are
 * a configurable list because the indexers are independent third parties with no
 * SLA — they return byte-identical results, so any one of them will do, and we
 * fail over on error rather than trusting a single host.
 */

export interface GqlTag {
  name: string;
  value: string;
}

export interface GqlNode {
  id: string;
  recipient?: string | null;
  owner?: { address: string } | null;
  block?: { height: number; timestamp: number } | null;
  tags: GqlTag[];
}

export interface GqlEdge {
  cursor: string;
  node: GqlNode;
}

export interface GqlTransactionsPage {
  pageInfo?: { hasNextPage?: boolean };
  edges?: GqlEdge[];
}

/** The only root field these queries select. */
export interface GqlData {
  transactions?: GqlTransactionsPage;
}

const DEFAULT_ENDPOINTS = [
  'https://arweave.net/graphql',
  'https://arweave-search.goldsky.com/graphql',
  'https://permagate.io/graphql',
];

/** Overridable at build time via VITE_GRAPHQL_ENDPOINTS (comma-separated). */
export const GRAPHQL_ENDPOINTS: string[] = (() => {
  const raw = import.meta.env?.VITE_GRAPHQL_ENDPOINTS as string | undefined;
  const parsed = raw?.split(',').map(s => s.trim()).filter(Boolean);
  return parsed?.length ? parsed : DEFAULT_ENDPOINTS;
})();

const REQUEST_TIMEOUT_MS = 20_000;
/** Hard ceiling so a pathological name can't page forever. */
const MAX_PAGES = 25;
const PAGE_SIZE = 100;

export class GqlError extends Error {
  constructor(message: string, readonly endpoint?: string) {
    super(message);
    this.name = 'GqlError';
  }
}

async function postOnce(endpoint: string, query: string, variables: unknown): Promise<GqlData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
    if (!res.ok) throw new GqlError(`HTTP ${res.status}`, endpoint);
    const json = await res.json();
    if (json.errors?.length) {
      throw new GqlError(json.errors[0]?.message ?? 'GraphQL error', endpoint);
    }
    return json.data as GqlData;
  } finally {
    clearTimeout(timer);
  }
}

/** POST a query, trying each endpoint in turn. Throws only if every endpoint fails. */
export async function gqlQuery(query: string, variables: unknown): Promise<GqlData> {
  let lastErr: unknown;
  for (const endpoint of GRAPHQL_ENDPOINTS) {
    try {
      return await postOnce(endpoint, query, variables);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new GqlError('All GraphQL endpoints failed');
}

/**
 * Page a `transactions` query to completion.
 *
 * `buildQuery` receives the page size and must return a query whose root field
 * is `transactions` and which accepts an `$after` variable.
 */
export async function gqlPaged(
  query: string,
  variables: Record<string, unknown>,
): Promise<GqlEdge[]> {
  const all: GqlEdge[] = [];
  let after: string | null = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await gqlQuery(query, { ...variables, first: PAGE_SIZE, after });
    const tx = data?.transactions;
    const edges: GqlEdge[] = tx?.edges ?? [];
    all.push(...edges);
    if (!tx?.pageInfo?.hasNextPage || edges.length === 0) break;
    after = edges[edges.length - 1].cursor;
  }
  return all;
}

export function tagsToRecord(tags: GqlTag[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const t of tags ?? []) out[t.name] = t.value;
  return out;
}

/**
 * Block timestamps are epoch seconds, but a message that is not yet mined has no
 * block at all. Return 0 so callers can sort it last rather than crashing.
 */
export function nodeTimestamp(node: GqlNode): number {
  const ts = node.block?.timestamp;
  return typeof ts === 'number' && Number.isFinite(ts) ? ts : 0;
}
