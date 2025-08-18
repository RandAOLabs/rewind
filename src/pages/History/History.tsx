// src/pages/History/History.tsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import FailureView from './FailureView';
import { useParams, useNavigate } from 'react-router-dom';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import {
  ARIORewindService,
  BuyNameEvent,
  ExtendLeaseEvent,
  IncreaseUndernameEvent,
  ReassignNameEvent,
  RecordEvent,
  UpgradeNameEvent,
  ReturnedNameEvent,
  IARNSEvent,
  AntRecord,
  ARNameDetail,
  StateNoticeEvent,
  SetRecordEvent,
  CreditNoticeEvent,
} from 'ao-js-sdk';
import { from, forkJoin, of, Observable, EMPTY } from 'rxjs';
import { switchMap, mergeMap, map, catchError, concatMap, toArray } from 'rxjs/operators';
import './History.css';
import EventDetails from './EventDetails';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  );
}

/** Wrap a sync value or Promise into an Observable (undefined-safe). */
function toObs<T>(v: T | Promise<T> | undefined): Observable<T | undefined> {
  if (v === undefined) return of(undefined as T | undefined);
  return from(Promise.resolve(v));
}

/** Remove keys whose value is strictly undefined (keeps null). */
function stripUndef<T extends Record<string, any>>(o: T): Partial<T> {
  const entries = Object.entries(o).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}

/** Pick the first non-undefined value. */
function firstDefined<T>(...vals: Array<T | undefined>): T | undefined {
  for (const v of vals) if (v !== undefined) return v;
  return undefined;
}

// ---------- Running snapshot shapes ----------
type ContentHashes = Record<string, string>;

export interface AntSnapshot {
  owner: string;
  controllers: string[];
  expiryTs: number;
  ttlSeconds: number;
  processId?: string;
  targetId?: string;
  undernames: string[];
  contentHashes: ContentHashes;
  description?: string;
  ticker?: string;
  keywords?: string[];
}

export const initialSnapshot: AntSnapshot = {
  owner: '',
  controllers: [],
  expiryTs: 0,
  ttlSeconds: 0,
  processId: '',
  targetId: '',
  undernames: [],
  contentHashes: {},
  description: '',
  ticker: 'ANT',
  keywords: [],
};

type SnapshotDelta = Partial<AntSnapshot>;

function uniq(arr: string[] = []) { return Array.from(new Set(arr)); }

/**
 * Default behavior:
 *  - arrays are UNIONed
 *  - objects (contentHashes) are MERGED (prev ... delta)
 * If opts.authoritative === true:
 *  - arrays are REPLACED
 *  - objects are REPLACED
 */
function applyDelta(
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
    ...delta, // scalar fields (owner, expiryTs, ttlSeconds, processId, targetId, description, ticker)
    controllers: nextControllers ?? [],
    undernames: nextUndernames ?? [],
    contentHashes: nextContentHashes ?? {},
    keywords: nextKeywords,
  };
}

/** Resolve only the fields you want to carry forward for each event type. */
function computeDelta$(ev: IARNSEvent): Observable<SnapshotDelta> {
  switch (ev.constructor.name) {
    case StateNoticeEvent.name: {
      const e = ev as StateNoticeEvent;
      const records$ = toObs(e.getRecords?.());
      const contentHashes$ = records$.pipe(
        map(records =>
          records
            ? Object.fromEntries(
                Object.entries(records).map(([k, v]: [string, any]) => [k, v?.transactionId])
              )
            : {}
        )
      );
      const undernames$ = records$.pipe(map(records => (records ? Object.keys(records) : [])));
      const target$ = records$.pipe(map(records => records?.['@']?.transactionId));

      return forkJoin({
        owner:       toObs(e.getOwner?.()),
        targetId:    target$,
        controllers: toObs(e.getControllers?.()),
        processId:   toObs(e.getANTProcessId?.()),
        expiryTs:    toObs((e as any).getNewExpiry?.()),
        description: toObs(e.getDescription?.()),
        ticker:      toObs(e.getTicker?.()),
        keywords:    toObs(e.getKeywords?.()),
        contentHashes: contentHashes$,
        undernames:    undernames$,
      }).pipe(map(stripUndef));
    }

    case BuyNameEvent.name: {
      const e = ev as BuyNameEvent;
      return forkJoin({
        ownerBuyer: toObs((e as any).getBuyer?.()),
        initiator:  toObs(e.getInitiator?.()),
        processId:  toObs((e as any).getProcessId?.()),
        leaseEnd:   toObs((e as any).getLeaseEnd?.()),
        newExpiry:  toObs((e as any).getNewExpiry?.()),
      }).pipe(
        map(res =>
          stripUndef({
            owner:     firstDefined(res.ownerBuyer, res.initiator),
            processId: res.processId,
            expiryTs:  firstDefined(res.leaseEnd, res.newExpiry),
          })
        )
      );
    }

    case ReassignNameEvent.name: {
      const e = ev as ReassignNameEvent;
      return forkJoin({
        newOwner:  toObs((e as any).getNewOwner?.()),
        initiator: toObs(e.getInitiator?.()),
        processId: toObs((e as any).getProcessId?.()),
      }).pipe(
        map(res =>
          stripUndef({
            owner: firstDefined(res.newOwner, res.initiator),
            processId: res.processId,
          })
        )
      );
    }

    case ExtendLeaseEvent.name: {
      const e = ev as ExtendLeaseEvent;
      return forkJoin({
        leaseEnd:  toObs((e as any).getLeaseEnd?.()),
        newExpiry: toObs((e as any).getNewExpiry?.()),
      }).pipe(map(res => stripUndef({ expiryTs: firstDefined(res.leaseEnd, res.newExpiry) })));
    }

    case IncreaseUndernameEvent.name: {
      // TODO: adapt when SDK exposes fields you need
      return of({} as SnapshotDelta);
    }

    case RecordEvent.name:
    case SetRecordEvent.name: {
      // TODO: adapt when SDK exposes label/key/value
      return of({} as SnapshotDelta);
    }

    case UpgradeNameEvent.name: {
      return of({} as SnapshotDelta);
    }

    case ReturnedNameEvent.name: {
      return of({} as SnapshotDelta);
    }

    default:
      return of({} as SnapshotDelta);
  }
}

/* ===== Events & UI types ===== */

export interface TimelineEvent {
  action:     string;
  actor:      string;
  legendKey:  string;
  timestamp:  number; // seconds (canonical)
  txHash:     string;
  rawEvent:   IARNSEvent;
  snapshot?:  AntSnapshot; // attached on selection or pre-attached after fold
}

type ResolvedForBuild = TimelineEvent & { delta: SnapshotDelta };

interface CurrentAntBarProps {
  name: string;
  expiryTs: number;
  processId: string;
  controllers: string[];
  owner: string;
  ttlSeconds: number;
  onBack: () => void;
  logoTxId: string;
  records: Record<string, AntRecord>;
  targetId: string;
  undernameLimit: number;
  expiryDate: Date;
  leaseDuration: string;
}

function CurrentAntBar({
  name,
  expiryTs,
  leaseDuration,
  processId,
  controllers,
  owner,
  ttlSeconds,
  onBack,
  logoTxId,
  records,
  targetId,
  undernameLimit,
  expiryDate,
}: CurrentAntBarProps) {
  return (
    <div className="current-ant-bar">
      <button className="back-button" onClick={onBack} aria-label="Go back">
        <AiOutlineArrowLeft size={20} />
      </button>
      <span>Name: <code>{name}</code></span>
      <span>
        Expiry: {new Date(expiryTs).toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric'
        })}
      </span>
      {/* <span>Lease: {leaseDuration }</span> */}
      <span>
        Process ID: <code>{processId.slice(0,5)}...</code>
      </span>
      <span>
        Controllers: {controllers.map(c => c.slice(0,5) + '...').join(', ')}
      </span>
      <span>
        Owner: <code>{owner.slice(0,5)}...</code>
      </span>
      <span>TTL: {ttlSeconds}s</span>
      <span>Logo Tx ID: <code>{logoTxId.slice(0,5)}...</code></span>
      <span>Target ID: <code>{targetId.slice(0,5)}...</code></span>
      <span>Undername Limit: {undernameLimit}</span>
    </div>
  );
}

export default function History() {
  const { arnsname = '' } = useParams<{ arnsname: string }>();
  const navigate = useNavigate();

  const [retryToken, setRetryToken] = useState(0);
  const doRetry = () => setRetryToken(t => t + 1);

  const [events, setEvents]       = useState<TimelineEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // snapshots aligned 1:1 with events (already sorted)
  const [snapshots, setSnapshots] = useState<AntSnapshot[]>([]);
  // txHash -> first index
  const firstIndexByTxHashRef = useRef<Record<string, number>>({});

  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const [antDetail, setAntDetail]     = useState<ARNameDetail | null>(null);
  const [antLoading, setAntLoading]   = useState(true);
  const [antError, setAntError]       = useState<string | null>(null);

  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const cardRefs     = useRef<Record<string, HTMLDivElement | null>>({});

  const onCardClick = (evt: TimelineEvent) => {
    if (selectedEvent?.txHash === evt.txHash) {
      setSelectedEvent(null);
      return;
    }
    const idx = firstIndexByTxHashRef.current[evt.txHash];
    const snap = Number.isInteger(idx) ? snapshots[idx] : undefined;
    setSelectedEvent(snap ? { ...evt, snapshot: snap } : evt);
  };

  // Fetch ANT detail (unchanged)
  useEffect(() => {
    setAntLoading(true);
    setAntError(null);

    const service = ARIORewindService.autoConfiguration();
    service
      .getAntDetail(arnsname)
      .then(detail => setAntDetail(detail))
      .catch(err => setAntError(err.message || 'Failed to load ANT details'))
      .finally(() => setAntLoading(false));
  }, [arnsname, retryToken]);

  // Canonical comparator: timestamp (sec) → txHash
  function compareEvents(a: Pick<TimelineEvent, 'timestamp' | 'txHash'>, b: Pick<TimelineEvent, 'timestamp' | 'txHash'>) {
    const ta = Number(a.timestamp || 0);
    const tb = Number(b.timestamp || 0);
    if (ta !== tb) return ta - tb;
    if (a.txHash === b.txHash) return 0;
    return a.txHash < b.txHash ? -1 : 1;
  }

  // Map event → { action, legendKey }
  function classifyEvent(ev: IARNSEvent): { action: string; legendKey: string } {
    switch (ev.constructor.name) {
      case BuyNameEvent.name:           return { action: 'Purchased ANT Name',    legendKey: 'ant-buy-event' };
      case ReassignNameEvent.name:      return { action: 'Reassigned ANT Name',   legendKey: 'ant-reassign-event' };
      case ReturnedNameEvent.name:      return { action: 'Returned ANT Name',     legendKey: 'ant-return-event' };
      case ExtendLeaseEvent.name:       return { action: 'Extended Lease',        legendKey: 'ant-extend-lease-event' };
      case IncreaseUndernameEvent.name: return { action: 'Added undername',       legendKey: 'undername-creation' };
      case RecordEvent.name:            return { action: 'Changed page contents', legendKey: 'ant-content-change' };
      case SetRecordEvent.name:         return { action: 'Set Record',            legendKey: 'ant-content-change' };
      case UpgradeNameEvent.name:       return { action: 'Upgraded ANT Name',     legendKey: 'ant-upgrade-event' };
      case StateNoticeEvent.name:       return { action: 'State Notice',          legendKey: 'ant-state-change' };
      case CreditNoticeEvent.name:      return { action: 'Credit Notice',         legendKey: 'ant-credit-notice' };
      default:                          return { action: 'Unknown Event',         legendKey: 'multiple-changes' };
    }
  }

  // Resolve one event → fields + delta (no folding here)
  function resolveEvent$(e: IARNSEvent): Observable<ResolvedForBuild> {
    const { action, legendKey } = classifyEvent(e);
    const actor$     = toObs(e.getInitiator?.());
    const timestamp$ = toObs(e.getEventTimeStamp?.()); // assume seconds
    const txHash$    = toObs(e.getEventMessageId?.());
    const delta$     = computeDelta$(e);

    return forkJoin({ actor: actor$, timestamp: timestamp$, txHash: txHash$, delta: delta$ }).pipe(
      map(({ actor, timestamp, txHash, delta }) => ({
        action,
        actor: actor ?? '',
        legendKey,
        timestamp: Number(timestamp ?? 0), // canonical seconds
        txHash: txHash ?? '',
        rawEvent: e,
        delta: delta ?? {},
      }))
    );
  }

  useEffect(() => {
    // Reset state
    setEvents([]);
    setSnapshots([]);
    firstIndexByTxHashRef.current = {};
    setLoading(true);
    setError(null);
    setSelectedEvent(null);

    const service = ARIORewindService.autoConfiguration();

    const sub = service
      .getEventHistory$(arnsname)
      .pipe(
        catchError(err => {
          setError(err?.message || 'Failed to load history');
          return of([] as IARNSEvent[]);
        }),
        switchMap((raw: IARNSEvent[]) => from(raw)),
        // Resolve concurrently; small list so modest concurrency is fine
        mergeMap((e: IARNSEvent) => resolveEvent$(e), 8),
        toArray(), // materialize full list
      )
      .subscribe({
        next: (resolved: ResolvedForBuild[]) => {
          // 1) Dedupe by txHash (keep earliest by comparator)
          // Sort first so we can keep first occurrence when scanning
          const sortedAll = [...resolved].sort(compareEvents);
          const seen = new Set<string>();
          const deduped: ResolvedForBuild[] = [];
          for (const ev of sortedAll) {
            if (!ev.txHash) continue;
            if (seen.has(ev.txHash)) continue;
            seen.add(ev.txHash);
            deduped.push(ev);
          }

          // 2) Fold snapshots in order (authoritative for StateNotice)
          const finalEvents: TimelineEvent[] = [];
          const snaps: AntSnapshot[] = [];
          let snap: AntSnapshot = initialSnapshot;

          deduped.forEach((row) => {
            const authoritative = row.rawEvent.constructor.name === StateNoticeEvent.name;
            snap = applyDelta(snap, row.delta, { authoritative });
            snaps.push(snap);
            finalEvents.push({
              action: row.action,
              actor: row.actor,
              legendKey: row.legendKey,
              timestamp: row.timestamp,
              txHash: row.txHash,
              rawEvent: row.rawEvent,
              snapshot: snap,
            });
          });

          // 3) Build txHash -> first index map
          const indexMap: Record<string, number> = {};
          finalEvents.forEach((ev, idx) => {
            if (indexMap[ev.txHash] === undefined) indexMap[ev.txHash] = idx;
          });

          // 4) Commit to state once
          firstIndexByTxHashRef.current = indexMap;
          setSnapshots(snaps);
          setEvents(finalEvents);
          setLoading(false);
        },
        error: () => setLoading(false),
        complete: () => void 0,
      });

    return () => sub.unsubscribe();
  }, [arnsname, retryToken]);

  // After selection paints, pan/zoom to it
  useLayoutEffect(() => {
    if (!selectedEvent) return;
    const node = cardRefs.current[selectedEvent.txHash];
    if (transformRef.current && node) {
      transformRef.current.zoomToElement(node, 300);
    }
  }, [selectedEvent]);

  // Failure/empty states
  if (!antLoading && (antError || !antDetail)) {
    return (
      <div className="history">
        <FailureView
          title="Couldn’t load ANT details"
          message={antError || 'The name may not exist, or the gateway is unavailable.'}
          onRetry={doRetry}
          onHome={() => navigate('/')}
        />
      </div>
    );
  }

  if (!loading && (error || events.length < 1)) {
    return (
      <div className="history">
        <FailureView
          title={error ? 'Couldn’t load history' : 'No history yet'}
          message={
            error
              ? error
              : 'We couldn’t find any events for this name. Try another name or retry.'
          }
          onRetry={doRetry}
          onHome={() => navigate('/')}
        />
      </div>
    );
  }

  if (antLoading) return <LoadingScreen />;
  if (loading)    return <div className="loading">Loading history…</div>;

  // The events array is already sorted & deduped; render as-is.
  const timelineCards = events
    .filter(ev => ev.action !== 'Credit Notice') // keep out of UI if desired
    .map((st, i) => {
      const isSelected = selectedEvent?.txHash === st.txHash;
      return {
        key: `${st.txHash}-${i}`,
        content: (
          <div
            className={`chain-card clickable${isSelected ? ' selected' : ''}`}
            ref={el => { cardRefs.current[st.txHash] = el; }}
            onClick={() => onCardClick(st)}
          >
            <div className="chain-card-header">
              <span className="action-text">{st.action}</span>
              <span className="actor">Actor: {st.actor.slice(0,5)}</span>
              <span className={`legend-square ${st.legendKey}`}></span>
            </div>
            <hr />
            <div className="chain-card-footer">
              <span className="date">
                {new Date((st.timestamp || 0) * 1000).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric'
                })}
              </span>
              <span className="txid">
                <a
                  href={`https://www.ao.link/#/message/${st.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {st.txHash}
                </a>
              </span>
            </div>
          </div>
        )
      };
    });

  return (
    <div className="history">
      {/* Legend */}
      <div className="legend">
        <h4>Legend</h4>
        <div className="legend-section">
          <div className="legend-title">Event Legend:</div>
          <div className="legend-item">
            <span className="dot ant-buy-event" /> ANT Purchase
          </div>
          <div className="legend-item">
            <span className="dot ant-ownership-transfer" /> Ownership Transfer
          </div>
          <div className="legend-item">
            <span className="dot ant-upgrade-event" /> ANT Upgrade
          </div>
          <div className="legend-item">
            <span className="dot ant-content-change" /> Content Change
          </div>
          <div className="legend-item">
            <span className="dot ant-renewal" /> Lease Renewal
          </div>
          <div className="legend-item">
            <span className="dot undername-creation" /> Undername Creation
          </div>
          <div className="legend-item">
            <span className="dot ant-controller-addition" /> Controller Addition
          </div>
          <div className="legend-item">
            <span className="dot undername-content-change" /> Undername Content Change
          </div>
          <div className="legend-item">
            <span className="dot ant-state-change" /> State Change
          </div>
          <div className="legend-item">
            <span className="dot ant-extend-lease-event" /> Extend Lease
          </div>
        </div>
      </div>

      {/* Fixed ANT Bar */}
      {antDetail  && (
        <CurrentAntBar
          name={antDetail.name}
          expiryTs={antDetail.endTimestamp}
          leaseDuration={antDetail.type === 'lease'
            ? `${Math.floor(Number(antDetail.leaseDuration) / (60 * 60 * 24 * 365 * 1000))} years`
            : antDetail.type}
          processId={antDetail.processId}
          controllers={antDetail.controllers}
          owner={antDetail.owner}
          ttlSeconds={antDetail.ttlSeconds}
          logoTxId={antDetail.logoTxId} 
          records={antDetail.records} 
          targetId={antDetail.targetId} 
          undernameLimit={antDetail.undernameLimit} 
          expiryDate={antDetail.expiryDate} 
          onBack={() => navigate(-2)} 
        />
      )}

      {/* Draggable chain */}
      <div className="chain-wrapper">
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.5}
          maxScale={2}
          wheel={{ step: 50 }}
          doubleClick={{ disabled: true }}
          limitToBounds={false}
          centerZoomedOut={false}
          centerOnInit={false}
          initialPositionX={200}
          initialPositionY={125}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="chain-controls">
                <button onClick={() => zoomIn()}>+</button>
                <button onClick={() => zoomOut()}>–</button>
                <button onClick={() => resetTransform()}>⟳</button>
              </div>
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%', position: 'relative' }}
                contentStyle={{ width: '100%', height: '100%' }}
              >
                <div className="chain-container">
                  {timelineCards.map(ev => (
                    <div key={ev.key} className="chain-item">
                      {ev.content}
                    </div>
                  ))}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Detail pop-up */}
      {selectedEvent && (
        <div
          ref={detailRef}
          className="detailed-card"
        >
          <button
            className="close-btn"
            onClick={() => setSelectedEvent(null)}
          >
            ×
          </button>
          <EventDetails uiEvent={selectedEvent} />
        </div>
      )}
    </div>
  );
}
