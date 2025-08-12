// src/pages/History/antState.ts
import {
    IARNSEvent,
    BuyNameEvent,
    ReassignNameEvent,
    ReturnedNameEvent,
    ExtendLeaseEvent,
    IncreaseUndernameEvent,
    RecordEvent,
    UpgradeNameEvent,
  } from 'ao-js-sdk';
  
  export interface AntSnapshot {
    owner: string;
    controllers: string[];
    expiryTs: number;
    ttlSeconds: number;
    processId?: string;
    targetId?: string;
    undernames: string[];                        // list of undername labels (include '@' for root)
    contentHashes: Record<string, string>;       // undername -> content hash
  }
  
  export const initialSnapshot: AntSnapshot = {
    owner: '',
    controllers: [],
    expiryTs: 0,
    ttlSeconds: 0,
    processId: undefined,
    targetId: undefined,
    undernames: [],
    contentHashes: {},
  };
  
  // small helpers
  const addUnique = (list: string[], item: string) =>
    list.includes(item) ? list : [...list, item];
  
  export function applyEvent(prev: AntSnapshot, ev: IARNSEvent): AntSnapshot {
    const name = ev.constructor.name;
    const e: any = ev; // SDK getters vary per event; use any + optional chaining safely.
  
    switch (name) {
      case BuyNameEvent.name: {
        const newOwner =
          e.getBuyer?.() ??
          e.getNewOwner?.() ??
          e.getInitiator?.() ??
          prev.owner;
  
        // If controllers are exposed by this event, prefer them; otherwise keep prev
        const maybeControllers: string[] | undefined = e.getControllers?.();
  
        return {
          ...prev,
          owner: newOwner,
          controllers: maybeControllers ?? prev.controllers,
          // some SDKs provide process/target on buy/assign
          processId: e.getProcessId?.() ?? prev.processId,
          targetId:  e.getTargetId?.()  ?? prev.targetId,
          // expiry/ttl may or may not be emitted here
          expiryTs:  e.getNewExpiry?.() ?? prev.expiryTs,
          ttlSeconds: e.getTtlSeconds?.() ?? prev.ttlSeconds,
        };
      }
  
      case ReassignNameEvent.name: {
        const newOwner =
          e.getNewOwner?.() ??
          e.getInitiator?.() ??
          prev.owner;
  
        return {
          ...prev,
          owner: newOwner,
          // process/target might change on reassignment in some models:
          processId: e.getProcessId?.() ?? prev.processId,
          targetId:  e.getTargetId?.()  ?? prev.targetId,
        };
      }
  
      case ReturnedNameEvent.name: {
        // Typically “returned” transfers to registry/previous owner; without explicit API, clear to unknown.
        const newOwner = e.getNewOwner?.() ?? '';
        return {
          ...prev,
          owner: newOwner,
        };
      }
  
      case ExtendLeaseEvent.name: {
        const newExpiry = e.getNewExpiry?.() ?? prev.expiryTs;
        const newTtl = e.getTtlSeconds?.() ?? prev.ttlSeconds;
        return { ...prev, expiryTs: newExpiry, ttlSeconds: newTtl };
      }
  
      case IncreaseUndernameEvent.name: {
        const label = e.getUndername?.() ?? e.getName?.() ?? '';
        if (!label) return prev;
        return {
          ...prev,
          undernames: addUnique(prev.undernames, label),
        };
      }
  
      case RecordEvent.name: {
        // Treat as a content-hash change for some undername (use '@' for root)
        const label = e.getUndername?.() ?? '@';
        const hash  = e.getContentHash?.() ?? e.getRecordValue?.();
        if (!hash) return prev;
        return {
          ...prev,
          undernames: addUnique(prev.undernames, label),
          contentHashes: {
            ...prev.contentHashes,
            [label]: String(hash),
          },
        };
      }
  
      case UpgradeNameEvent.name: {
        // If upgrade changes process/target/etc, pick up what’s exposed
        return {
          ...prev,
          processId: e.getProcessId?.() ?? prev.processId,
          targetId:  e.getTargetId?.()  ?? prev.targetId,
        };
      }
  
      default:
        // Unknown event: leave state unchanged.
        return prev;
    }
  }
  