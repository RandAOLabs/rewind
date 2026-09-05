/**
 * Builds an ArNS name's event timeline from the Arweave message log.
 *
 * Two sources are merged:
 *   1. Registry notices  - messages emitted `From-Process` the ARIO process and
 *      tagged with this `Name` (purchases, lease extensions, reassignments).
 *   2. ANT messages      - messages sent *to* each ANT process that held the
 *      name (Set-Record, Set-Ticker, controller changes...).
 *
 * Querying ANT messages inbound (`recipients:`) rather than following the
 * registry's outbound notices is deliberate: `owner.address` is then the true
 * signer, and every change parameter arrives as an indexed tag. That removes the
 * per-card round-trip the old implementation needed and, more importantly,
 * removes any dependency on message bodies, which 404 unpredictably on older
 * data items.
 */

import { Observable } from 'rxjs';
import {
  ARIO_PROCESS_ID,
  actionToKind,
  isRecognizedAction,
  type AntEra,
  type RewindEvent,
} from './types';
import { gqlPaged, nodeTimestamp, tagsToRecord, type GqlEdge } from './gql';
import { getAntDetail } from './resolver';
import { getSolanaHistory } from './solana/history';

const REGISTRY_QUERY = `
  query($name:[String!]!, $first:Int!, $after:String) {
    transactions(
      tags: [
        { name: "From-Process", values: ["${ARIO_PROCESS_ID}"] }
        { name: "Name",         values: $name }
      ]
      first: $first, after: $after, sort: HEIGHT_ASC
    ) {
      pageInfo { hasNextPage }
      edges { cursor node { id recipient owner { address } block { height timestamp } tags { name value } } }
    }
  }`;

const ANT_INBOUND_QUERY = `
  query($ants:[String!]!, $first:Int!, $after:String) {
    transactions(
      recipients: $ants
      first: $first, after: $after, sort: HEIGHT_ASC
    ) {
      pageInfo { hasNextPage }
      edges { cursor node { id recipient owner { address } block { height timestamp } tags { name value } } }
    }
  }`;

/** Registry notices for a name, oldest first. */
async function fetchRegistryEdges(name: string): Promise<GqlEdge[]> {
  return gqlPaged(REGISTRY_QUERY, { name: [name.toLowerCase()] });
}

/**
 * Split `dapp_ardrive` into its base name and undername.
 *
 * ArNS writes an undername as `<undername>_<name>`. The registry only ever knows
 * the base name — an undername exists purely as the `Sub-Domain` tag on the
 * ANT's `Set-Record` messages — so a lookup for `dapp_ardrive` has to query
 * `ardrive` and then narrow to that sub-domain.
 */
export function parseArNSName(fullName: string): { base: string; undername?: string } {
  const s = fullName.trim().toLowerCase();
  const i = s.lastIndexOf('_');
  if (i <= 0 || i === s.length - 1) return { base: s };
  return { base: s.slice(i + 1), undername: s.slice(0, i) };
}

/**
 * Narrow a base name's timeline to one undername.
 *
 * Record changes are kept only when they target this sub-domain. Everything else
 * — purchases, reassignments, transfers, ticker changes — applies to the whole
 * ANT and therefore still affects the undername, so it stays as context.
 */
function filterToUndername(events: RewindEvent[], undername: string): RewindEvent[] {
  return events.filter(ev => {
    if (ev.kind !== 'set-record' && ev.kind !== 'remove-record') return true;
    const sub = ev.tags['Sub-Domain'];
    return sub !== undefined && sub.toLowerCase() === undername;
  });
}

/**
 * Work out which ANT process held the name over which span.
 *
 * The registry emits a `Reassign-Name-Notice` to *both* the old and the new ANT
 * at the same timestamp, so the recipients at one timestamp are a boundary, not
 * a sequence. We treat each distinct timestamp as a cut point and let the
 * `Old-Process-Id` tag on the new ANT's bootstrap messages disambiguate
 * direction where it is present.
 */
function deriveEras(edges: GqlEdge[]): AntEra[] {
  const byTs = new Map<number, Set<string>>();

  for (const e of edges) {
    const recipient = e.node.recipient;
    if (!recipient) continue;
    const ts = nodeTimestamp(e.node);
    if (!byTs.has(ts)) byTs.set(ts, new Set());
    byTs.get(ts)!.add(recipient);
  }

  const cuts = [...byTs.keys()].sort((a, b) => a - b);
  const eras: AntEra[] = [];

  for (let i = 0; i < cuts.length; i++) {
    const ts = cuts[i];
    const next = i + 1 < cuts.length ? cuts[i + 1] : Infinity;
    for (const antId of byTs.get(ts)!) {
      eras.push({ antId, fromTs: ts, toTs: next });
    }
  }

  // Collapse repeats of the same ANT across adjacent cuts into one span.
  const merged = new Map<string, AntEra>();
  for (const era of eras) {
    const seen = merged.get(era.antId);
    if (!seen) merged.set(era.antId, { ...era });
    else {
      seen.fromTs = Math.min(seen.fromTs, era.fromTs);
      seen.toTs = Math.max(seen.toTs, era.toTs);
    }
  }
  return [...merged.values()].sort((a, b) => a.fromTs - b.fromTs);
}

/**
 * Walk `Old-Process-Id` back from the known ANTs to pick up predecessors that
 * never produced a registry notice (names registered before the indexed window).
 */
function collectPredecessors(edges: GqlEdge[]): string[] {
  const out = new Set<string>();
  for (const e of edges) {
    const old = e.node.tags.find(t => t.name === 'Old-Process-Id')?.value;
    if (old) out.add(old);
  }
  return [...out];
}

function edgeToEvent(
  edge: GqlEdge,
  source: 'registry' | 'ant',
  antId?: string,
): RewindEvent | null {
  const tags = tagsToRecord(edge.node.tags);
  const action = tags['Action'];
  // Allowlist: anything we don't explicitly model is not name history.
  if (!isRecognizedAction(action)) return null;

  return {
    kind: actionToKind(action),
    txId: edge.node.id,
    ts: nodeTimestamp(edge.node),
    actor: edge.node.owner?.address ?? '',
    source,
    antId: antId ?? edge.node.recipient ?? undefined,
    tags,
  };
}

/** Deduplicate by message id and sort oldest-first, deterministically. */
function normalize(events: RewindEvent[]): RewindEvent[] {
  // Key on txId + intra-transaction position: AO messages are one event each,
  // but a single Solana transaction can emit several under one signature.
  const byTx = new Map<string, RewindEvent>();
  for (const ev of events) {
    const key = `${ev.txId}#${ev.seq ?? 0}`;
    if (!byTx.has(key)) byTx.set(key, ev);
  }

  /*
   * A reassignment emits one notice to the outgoing ANT and another to the
   * incoming one. They are distinct messages with distinct ids, so id-dedupe
   * keeps both and the timeline shows every process change twice. Collapse them
   * on timestamp, preferring the notice that names the new process.
   */
  const reassignByTs = new Map<number, string>();
  for (const [key, ev] of byTx) {
    if (ev.kind !== 'reassign-name') continue;
    const keep = reassignByTs.get(ev.ts);
    if (keep === undefined) {
      reassignByTs.set(ev.ts, key);
    } else {
      const incumbent = byTx.get(keep)!;
      const better = ev.tags['Process-Id'] && !incumbent.tags['Process-Id'];
      byTx.delete(better ? keep : key);
      if (better) reassignByTs.set(ev.ts, key);
    }
  }

  return [...byTx.values()].sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    // Stable tiebreak so repeated runs produce identical output.
    return a.txId < b.txId ? -1 : a.txId > b.txId ? 1 : 0;
  });
}

/**
 * Solana-era events for a name, or [] if it has none.
 *
 * The name's current ANT is a Solana asset address, which the gateway resolver
 * already gives us. Failures here are swallowed: the AO era is the bulk of most
 * timelines and must still render if a courtesy RPC endpoint is down.
 */
async function getSolanaEra(fullName: string, undername?: string): Promise<RewindEvent[]> {
  try {
    const detail = await getAntDetail(fullName);
    if (!detail?.processId) return [];
    return await getSolanaHistory(detail.processId, undername);
  } catch (err) {
    console.warn('[arns] Solana-era history unavailable:', err);
    return [];
  }
}

/**
 * Full event history for a name, oldest first, across both eras.
 *
 * AO (Feb 2025 - Jun 2026) comes from Arweave GraphQL; Solana (Jun 2026 -) from
 * decoded Anchor events. Both produce the same RewindEvent shape, so they merge
 * on timestamp into one timeline and the UI never has to know which chain an
 * event came from.
 *
 * Deterministic: the same name returns the same events in the same order on
 * every call. (The previous implementation did not — it emitted a different
 * count per run, which is why timelines silently truncated.)
 */
export async function getEventHistory(fullName: string): Promise<RewindEvent[]> {
  const { base: name, undername } = parseArNSName(fullName);
  const narrow = (events: RewindEvent[]) =>
    undername ? filterToUndername(events, undername) : events;

  const registryEdges = await fetchRegistryEdges(name);
  const eras = deriveEras(registryEdges);

  const registryEvents = registryEdges
    .map(e => edgeToEvent(e, 'registry'))
    .filter((e): e is RewindEvent => e !== null);

  const antIds = eras.map(e => e.antId);
  if (antIds.length === 0) {
    const solanaOnly = await getSolanaEra(fullName, undername);
    return normalize([...narrow(normalize(registryEvents)), ...solanaOnly]);
  }

  // One query for all known ANTs, then a second pass for any predecessors they
  // point back to. Two round-trips regardless of how many eras there are.
  const firstPass = await gqlPaged(ANT_INBOUND_QUERY, { ants: antIds });

  const predecessors = collectPredecessors(firstPass).filter(id => !antIds.includes(id));
  const secondPass = predecessors.length
    ? await gqlPaged(ANT_INBOUND_QUERY, { ants: predecessors })
    : [];

  const eraFor = new Map(eras.map(e => [e.antId, e]));
  const antEvents: RewindEvent[] = [];

  for (const edge of [...firstPass, ...secondPass]) {
    const recipient = edge.node.recipient ?? undefined;
    const ev = edgeToEvent(edge, 'ant', recipient);
    if (!ev) continue;

    // Enforce the era bound. An ANT reassigned away and later reused for another
    // name would otherwise contribute that name's events to this timeline.
    const era = recipient ? eraFor.get(recipient) : undefined;
    if (era && ev.ts > 0 && (ev.ts < era.fromTs || ev.ts >= era.toTs)) continue;

    antEvents.push(ev);
  }

  const aoEra = narrow(normalize([...registryEvents, ...antEvents]));
  const solanaEra = await getSolanaEra(fullName, undername);
  return normalize([...aoEra, ...solanaEra]);
}

/**
 * Streaming form, kept so `History.tsx` can render incrementally.
 *
 * Emits registry events as soon as they land, then the complete merged set. The
 * page's existing settle/debounce logic coalesces the two emissions.
 */
export function getEventHistory$(fullName: string): Observable<RewindEvent[]> {
  return new Observable<RewindEvent[]>(subscriber => {
    let cancelled = false;
    const { base } = parseArNSName(fullName);

    (async () => {
      try {
        const registryEdges = await fetchRegistryEdges(base);
        if (cancelled) return;

        // Registry events apply to the whole name, so they are safe to show
        // immediately even when an undername was requested.
        const registryEvents = normalize(
          registryEdges
            .map(e => edgeToEvent(e, 'registry'))
            .filter((e): e is RewindEvent => e !== null),
        );
        if (registryEvents.length) subscriber.next(registryEvents);

        const full = await getEventHistory(fullName);
        if (cancelled) return;

        subscriber.next(full);
        subscriber.complete();
      } catch (err) {
        if (!cancelled) subscriber.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  });
}
