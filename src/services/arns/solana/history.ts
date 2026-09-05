/**
 * Solana-era timeline (2026-06-05 onwards).
 *
 * Produces the same `RewindEvent` shape as the AO-era reader so the two merge
 * into one ordered timeline and the UI needs no knowledge of which chain an
 * event came from.
 *
 * Cost per name is small: one or two `getSignaturesForAddress` calls plus a
 * handful of `getTransaction`s. The median ANT asset has ~4 lifetime
 * signatures, so this is nothing like the AO-era GraphQL paging.
 */

import type { RewindEvent, RewindEventKind } from '../types';
import { ENUMS, decodeTransactionLogs, type TxEvent } from './decode';
import { getSignatures, getTransactionLogs } from './rpc';

/** ABI event name -> our timeline kind. Anything absent is not name history. */
const EVENT_TO_KIND: Record<string, RewindEventKind> = {
  // ANT program
  RecordSetEvent: 'set-record',
  RecordRemovedEvent: 'remove-record',
  AntRecordClosedEvent: 'remove-record',
  AntTransferredEvent: 'credit-notice',
  AntReconciledEvent: 'credit-notice',
  ControllerAddedEvent: 'set-controller',
  ControllerRemovedEvent: 'remove-controller',
  // ArNS program
  NamePurchasedEvent: 'buy-name',
  ReturnedNamePurchasedEvent: 'buy-name',
  ReservedNameClaimedEvent: 'buy-name',
  LeaseExtendedEvent: 'extend-lease',
  UndernameIncreasedEvent: 'increase-undername',
  NameUpgradedEvent: 'upgrade-name',
  NameReassignedEvent: 'reassign-name',
  NameReleasedEvent: 'returned-name',
};

/**
 * `AntMetadataUpdatedEvent` carries a `field` discriminant rather than being a
 * distinct event per property, so it fans out to five kinds.
 */
function metadataKind(field: unknown): RewindEventKind {
  switch (ENUMS.antMetadata[Number(field)]) {
    case 'name': return 'set-name';
    case 'ticker': return 'set-ticker';
    case 'description': return 'set-description';
    case 'keywords': return 'set-keywords';
    case 'logo': return 'set-logo';
    default: return 'unknown';
  }
}

/**
 * ACL entries encode owner-vs-controller in a `role` byte.
 *
 * Role `Owner` entries are deliberately dropped. They are ACL *seeding*, not
 * ownership changes: the `ImportAccount` migration writes several in a single
 * transaction — `ardrive` emits five for the same address in one tx on
 * 2026-06-05 — which would render as a stack of bogus "Ownership Transfer"
 * cards. Real ownership changes arrive as `AntTransferredEvent` /
 * `AntReconciledEvent`.
 */
function aclKind(role: unknown, added: boolean): RewindEventKind {
  if (ENUMS.aclRole[Number(role)] !== 'Controller') return 'unknown';
  return added ? 'set-controller' : 'remove-controller';
}

function kindFor(ev: TxEvent): RewindEventKind {
  switch (ev.name) {
    case 'AntMetadataUpdatedEvent': return metadataKind(ev.fields.field);
    case 'AclEntryAddedEvent': return aclKind(ev.fields.role, true);
    case 'AclEntryRemovedEvent': return aclKind(ev.fields.role, false);
    default: return EVENT_TO_KIND[ev.name] ?? 'unknown';
  }
}

/**
 * Flatten decoded fields into the string tag bag the UI already reads.
 *
 * Field names are translated to the AO tag names the rest of the app expects
 * (`Sub-Domain`, `Transaction-Id`, ...) so `computeDelta` needs no per-era
 * branching — the same delta logic serves both chains.
 */
function toTags(ev: TxEvent): Record<string, string> {
  const tags: Record<string, string> = { Action: ev.name, Source: 'solana' };

  for (const [k, v] of Object.entries(ev.fields)) {
    if (v === null || v === undefined) continue;
    tags[k] = String(v);
  }

  const f = ev.fields as Record<string, unknown>;
  const put = (key: string, v: unknown) => {
    if (v !== undefined && v !== null && v !== '') tags[key] = String(v);
  };

  switch (ev.name) {
    case 'RecordSetEvent':
      // An empty undername is the apex record, which AO spells `@`.
      put('Sub-Domain', f.undername === '' ? '@' : f.undername);
      put('Transaction-Id', f.target);
      put('TTL-Seconds', f.ttl_seconds);
      break;
    case 'RecordRemovedEvent':
      put('Sub-Domain', f.undername === '' ? '@' : f.undername);
      break;
    case 'AntTransferredEvent':
      put('Recipient', f.to);
      break;
    case 'AntReconciledEvent':
      put('Recipient', f.new_owner);
      break;
    case 'ControllerAddedEvent':
    case 'ControllerRemovedEvent':
      put('Controller', f.controller);
      break;
    case 'AclEntryAddedEvent':
    case 'AclEntryRemovedEvent':
      put('Controller', f.address);
      put('Recipient', f.address);
      break;
    case 'AntMetadataUpdatedEvent':
      put('Value', f.new_value);
      break;
    case 'NamePurchasedEvent':
      put('Buyer', f.buyer);
      put('Process-Id', f.ant);
      put('Purchase-Price', f.cost);
      put('Type', ENUMS.purchaseType[Number(f.purchase_type)]);
      break;
    case 'ReturnedNamePurchasedEvent':
      put('Buyer', f.buyer);
      put('Process-Id', f.ant);
      put('Purchase-Price', f.cost);
      break;
    case 'LeaseExtendedEvent':
      put('End-Timestamp', f.new_end_timestamp);
      break;
    case 'UndernameIncreasedEvent':
      put('Undername-Limit', f.new_limit);
      break;
    case 'NameReassignedEvent':
      put('Process-Id', f.new_ant);
      put('Old-Process-Id', f.old_ant);
      break;
  }

  return tags;
}

/** Who signed the change, by event shape. */
function actorFor(ev: TxEvent): string {
  const f = ev.fields as Record<string, unknown>;
  const candidate = f.caller ?? f.owner ?? f.buyer ?? f.claimer ?? f.pruner ?? f.from;
  return typeof candidate === 'string' ? candidate : '';
}

/**
 * Prune instructions carry no event payload, and `NamesPrunedEvent` deliberately
 * omits the name — but the instruction lands on the name's own record account,
 * so at that address the instruction log line is itself the signal.
 */
const INSTRUCTION_ONLY: Record<string, RewindEventKind> = {
  PruneNameToReturned: 'returned-name',
  PruneReturnedNames: 'returned-name',
};

function eventsFromTx(
  logs: string[],
  signature: string,
  blockTime: number,
  antId: string,
): RewindEvent[] {
  const decoded = decodeTransactionLogs(logs, signature, blockTime);
  const out: RewindEvent[] = [];

  decoded.forEach((ev, i) => {
    const kind = kindFor(ev);
    if (kind === 'unknown') return;
    out.push({
      kind,
      txId: signature,
      // Several events can share one signature; seq keeps them distinct.
      seq: i,
      ts: blockTime,
      actor: actorFor(ev),
      source: 'ant',
      antId,
      tags: toTags(ev),
    });
  });

  // Only fall back to instruction names when the transaction produced no
  // decodable events at all, so we never double-count a real event.
  if (out.length === 0) {
    const names = decoded.length
      ? []
      : logs
          .map(l => l.match(/^Program log: Instruction: (\w+)/)?.[1])
          .filter((n): n is string => Boolean(n));

    for (const n of names) {
      const kind = INSTRUCTION_ONLY[n];
      if (!kind) continue;
      out.push({
        kind,
        txId: signature,
        ts: blockTime,
        actor: '',
        source: 'ant',
        antId,
        tags: { Action: n, Source: 'solana' },
      });
      break;
    }
  }

  return out;
}

/**
 * Solana-era events for a name, given its current ANT asset address.
 *
 * `undername` narrows record changes the same way the AO reader does.
 */
export async function getSolanaHistory(
  antId: string,
  undername?: string,
): Promise<RewindEvent[]> {
  if (!antId) return [];

  const sigs = await getSignatures(antId);
  if (!sigs.length) return [];

  const events: RewindEvent[] = [];
  for (const s of sigs) {
    const tx = await getTransactionLogs(s.signature);
    if (!tx) continue;
    events.push(...eventsFromTx(tx.logs, tx.signature, tx.blockTime || s.blockTime || 0, antId));
  }

  const scoped = undername
    ? events.filter(ev => {
        if (ev.kind !== 'set-record' && ev.kind !== 'remove-record') return true;
        return ev.tags['Sub-Domain']?.toLowerCase() === undername;
      })
    : events;

  /*
   * The migration transaction re-adds the same controller several times as it
   * replays the ACL. Keep the first mention of each (kind, address) pair within
   * a transaction so the timeline shows one card per real change.
   */
  const seen = new Set<string>();
  const deduped = scoped.filter(ev => {
    if (ev.kind !== 'set-controller' && ev.kind !== 'remove-controller') return true;
    const key = `${ev.txId}:${ev.kind}:${ev.tags['Controller'] ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // One transaction can emit several events; keep them all but order stably.
  return deduped.sort((a, b) =>
    a.ts !== b.ts ? a.ts - b.ts : a.txId < b.txId ? -1 : a.txId > b.txId ? 1 : 0,
  );
}
