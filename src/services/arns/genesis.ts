/**
 * ArNS state at AR.IO mainnet launch (2025-02-20).
 *
 * Names registered before mainnet have no `Buy-Name-Notice` in the AO message
 * log, so their timeline would otherwise begin mid-story with no owner, process
 * or purchase terms. `ardrive` is the obvious example.
 *
 * Vendored from `ao-js-sdk`'s `pre-mainnet-data` (2884 records) before that
 * package was removed. It is a static snapshot of a historical fact and will
 * never change, so it is checked in rather than fetched.
 *
 * Loaded through a dynamic import so the ~590KB payload becomes its own chunk
 * and never lands in the initial bundle.
 */

export interface GenesisRecord {
  name: string;
  processId: string;
  type: string;
  /** Epoch milliseconds. */
  startTimestamp: number;
  /** Epoch milliseconds; absent for permabuy. */
  endTimestamp?: number;
  purchasePrice: number;
  undernameLimit: number;
}

let cache: Record<string, GenesisRecord> | null = null;
let inflight: Promise<Record<string, GenesisRecord>> | null = null;

async function load(): Promise<Record<string, GenesisRecord>> {
  if (cache) return cache;
  if (!inflight) {
    inflight = import('./data/pre-mainnet-records.json')
      .then(m => {
        cache = (m.default ?? m) as Record<string, GenesisRecord>;
        return cache;
      })
      .catch(err => {
        // A missing chunk must not take the timeline down with it.
        console.warn('[arns] genesis dataset unavailable:', err);
        inflight = null;
        cache = {};
        return cache;
      });
  }
  return inflight;
}

/** Genesis record for a name, or `null` if it was registered after mainnet. */
export async function getGenesisRecord(name: string): Promise<GenesisRecord | null> {
  const table = await load();
  return table[name.trim().toLowerCase()] ?? null;
}
