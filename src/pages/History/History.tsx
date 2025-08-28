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
  DebitNoticeEvent,
} from 'ao-js-sdk';
import { from, forkJoin, of, Observable, EMPTY } from 'rxjs';
import { switchMap, map, catchError, concatMap } from 'rxjs/operators';
import './History.css';
import EventDetails from './EventDetails';

import { arTxidToHttps } from '../../wayfinder';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  );
}

function toObs<T>(v: T | Promise<T> | undefined): Observable<T | undefined> {
  if (v === undefined) return of(undefined as T | undefined);
  return from(Promise.resolve(v));
}

function stripUndef<T extends Record<string, any>>(o: T): Partial<T> {
  const entries = Object.entries(o).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}

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
  undernameLimit?: number;
  undernames: string[];
  contentHashes: ContentHashes;
  description?: string;
  ticker?: string;
  keywords?: string[];
  subDomain?: string;
  purchasePrice?: string;
  startTime?: number;
}

export const initialSnapshot: AntSnapshot = {
  owner: '',
  controllers: [],
  expiryTs: 0,
  ttlSeconds: 0,
  processId: '',
  targetId: '',
  undernameLimit: 0,
  undernames: [],
  contentHashes: {},
  description: '',
  ticker: 'ANT',
  keywords: [],
  purchasePrice: '',
  startTime: 0,
};

type SnapshotDelta = Partial<AntSnapshot>;

function uniq(arr: string[] = []) { return Array.from(new Set(arr)); }

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
    ...delta,
    controllers: nextControllers ?? [],
    undernames: nextUndernames ?? [],
    contentHashes: nextContentHashes ?? {},
    keywords: nextKeywords,
  };
}


function computeDelta$(ev: IARNSEvent): Observable<SnapshotDelta> {
  switch (ev.constructor.name) {
    case StateNoticeEvent.name: {
      const e = ev as StateNoticeEvent;
      const records$ = toObs(e.getRecords?.());
      const contentHashes$ = records$.pipe(
        map(records => Object.fromEntries(
          Object.entries(records).map(([k, v]) => [k, v.transactionId])
        ))
      );
      const undernames$ = records$.pipe(map(records => Object.keys(records)));
      const target$ = records$.pipe(map(records => records['@']?.transactionId));
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
        processId: toObs((e as any).getReassignedProcessId?.()),
      }).pipe(map(res => stripUndef({ processId: res.processId })));
    }

    case ExtendLeaseEvent.name: {
      const e = ev as ExtendLeaseEvent;
      return forkJoin({
        leaseEnd:  toObs((e as any).getLeaseEnd?.()),
        newExpiry: toObs((e as any).getNewExpiry?.()),
      }).pipe(map(res => stripUndef({ expiryTs: firstDefined(res.leaseEnd, res.newExpiry) })));
    }

    case IncreaseUndernameEvent.name: {
      const e = ev as IncreaseUndernameEvent;
      return forkJoin({ undernameLimit: toObs(e.getUndernameLimit?.()) }).pipe(
        map(({ undernameLimit }) => ({ undernameLimit }))
      );
    }

    case SetRecordEvent.name: {
      const e = ev as SetRecordEvent;
      const subDomain$ = toObs(e.getSubDomain?.());
      const txid$      = toObs((e as any).getTransactionId?.());
      return forkJoin({ subDomain: subDomain$, txid: txid$ }).pipe(
        map(({ subDomain, txid }) => {
          if (!subDomain || !txid) return {} as SnapshotDelta;
          const key = subDomain === '' ? '@' : subDomain;
          const delta: SnapshotDelta = {
            subDomain: key,
            contentHashes: { [key]: String(txid) },
            ...(key === '@'
              ? { targetId: String(txid) }
              : { undernames: [key] }
            ),
          };
          return delta;
        })
      );
    }

    case UpgradeNameEvent.name: {
      const e = ev as UpgradeNameEvent;
      const startTime = toObs(e.getStartTime?.());
      const getPurchasePrice = toObs(e.getPurchasePrice?.());
      const undernameLimit = toObs(e.getUndernameLimit?.());
      return forkJoin({ startTime, getPurchasePrice, undernameLimit }).pipe(
        map(({ startTime, getPurchasePrice, undernameLimit }) => ({
          startTime,
          getPurchasePrice,
          undernameLimit,
        }))
      );
    }

    case ReturnedNameEvent.name: {
      return of({} as SnapshotDelta);
    }

    default:
      return of({} as SnapshotDelta);
  }
}

/* ===== /running ANT state ===== */

// The shape we render into cards
export interface TimelineEvent {
  action:     string;
  actor:      string;
  legendKey:  string;
  timestamp:  number;
  txHash:     string;
  extraBox?: ExtraBox;
  rawEvent:   IARNSEvent;
  snapshot?:  AntSnapshot;
}

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
  undernameLimit?: number;
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
  const fmt = (ts?: number) =>
    ts
      ? new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';

  const ellip = (s?: string, keep = 4) => {
    if (!s) return '—';
    return s.slice(0, keep);
  };

  const ctrls = controllers ?? [];

  return (
    <div className="current-ant-bar" role="region" aria-label="Current ANT summary">
      <div className="cab-aurora" aria-hidden="true" />
      <div className="cab-glass">
        <button className="back-button" onClick={onBack} aria-label="Go back">
          <AiOutlineArrowLeft size={16} />
        </button>

        <div className="cab-main">
          <div className="cab-name">
            <span className="cab-label">Name</span>
            <code className="cab-code">{name}</code>
          </div>

          <div className="cab-chips" role="list">
            <span className="chip" role="listitem">
              <span className="chip-k">Expiry</span>
              <span className="chip-v">{fmt(expiryTs) == '—' ? 'PermaBuy' : fmt(expiryTs)}</span>
            </span>

            {/* Process (clickable) */}
            <span className="chip" role="listitem">
              <span className="chip-k">Process</span>
              {processId ? (
                <a
                  className="chip-v"
                  href={`https://www.ao.link/#/entity/${processId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ellip(processId)}
                </a>
              ) : (
                <span className="chip-v">—</span>
              )}
            </span>

            {/* Owner (clickable) */}
            <span className="chip" role="listitem">
              <span className="chip-k">Owner</span>
              {owner ? (
                <a
                  className="chip-v"
                  href={`https://www.ao.link/#/entity/${owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ellip(owner)}
                </a>
              ) : (
                <span className="chip-v">—</span>
              )}
            </span>

            {/* Controllers (clickable first 2, with +N if more) */}
            <span className="chip" role="listitem">
              <span className="chip-k">Controllers</span>
              <span className="chip-v">
                {ctrls.length
                  ? ctrls.slice(0, 2).map((c, idx) => (
                      <React.Fragment key={c}>
                        <a
                          href={`https://www.ao.link/#/entity/${c}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {ellip(c, 4)}
                        </a>
                        {idx < ctrls.slice(0, 2).length - 1 ? ', ' : ''}
                      </React.Fragment>
                    ))
                  : '—'}
                {ctrls.length > 2 ? ` +${ctrls.length - 2}` : ''}
              </span>
            </span>

            {/* Content Target via Wayfinder */}
            <span className="chip" role="listitem">
              <span className="chip-k">Content Target</span>
              <span className="chip-v">
                <TxidLink txid={targetId} label={ellip(targetId)} />
              </span>
            </span>

            <span className="chip" role="listitem">
              <span className="chip-k">Undername Limit</span>
              <span className="chip-v">{undernameLimit ?? '—'}</span>
            </span>
          </div>

          <div className="cab-fade" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────
// Wayfinder-powered link (no provider)
// ───────────────────────────────────────
function shortTx(id?: string, head = 5, tail = 5) {
  if (!id) return '—';
  return id.length <= head + tail + 1 ? id : `${id.slice(0, head)}…${id.slice(-tail)}`;
}
function TxidLink({ txid, label }: { txid?: string; label?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (txid) {
      arTxidToHttps(txid).then(u => { if (alive) setUrl(u); });
    } else {
      setUrl(null);
    }
    return () => { alive = false; };
  }, [txid]);

  if (!txid) return <span>—</span>;
  const text = label ?? shortTx(txid);
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer">{text}</a>
  ) : (
    <span>{text}</span>
  );
}

// ========================================

type ExtraItem = { label: string; value: React.ReactNode };
type ExtraBox  = { tag: string; items: ExtraItem[] };

function fmtDate(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
function ellip(str?: string, keep = 5) {
  if (!str) return '—';
  if (str.length <= keep * 2 + 3) return str;
  return `${str.slice(0, keep)}…${str.slice(-keep)}`;
}

const extraBoxBuilders: Record<string, (e: TimelineEvent) => ExtraBox | undefined> = {
  'Purchased ANT Name': (e) => ({
    tag: 'LEASE',
    items: [
      { label: 'Expiry',  value: fmtDate(e.snapshot?.expiryTs) == '—' ? 'PermaBuy' : fmtDate(e.snapshot?.expiryTs) },
      { label: 'Owner',   value: e.snapshot?.owner ? (
        <a
          href={`https://www.ao.link/#/entity/${e.snapshot.owner}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {shortTx(e.snapshot.owner)}
        </a>
        ) : '—',
      },
      { label: 'Process', value: ellip(e.snapshot?.processId) == '—' ? 'Not Yet Known' : ellip(e.snapshot?.processId) },
    ],
  }),

  'Extended Lease': (e) => ({
    tag: 'LEASE',
    items: [
      { label: 'New Expiry', value: fmtDate(e.snapshot?.expiryTs) == '—' ? 'PermaBuy' : fmtDate(e.snapshot?.expiryTs) },
    ],
  }),

  'Increased Undername Limit': (e) => ({
    tag: 'LIMIT',
    items: [
      { label: 'New Limit', value: String(e.snapshot?.undernameLimit ?? '—') },
    ],
  }),

  'ANT Process Change': (e) => ({
    tag: 'PROCESS',
    items: [
      { label: 'New ANT Process', value: ellip(e.snapshot?.processId) },
    ],
  }),

  'State Notice': (e) => ({
    tag: 'STATE',
    items: [
      {
        label: 'Process',
        value: e.snapshot?.processId ? (
          <a
            href={`https://www.ao.link/#/entity/${e.snapshot.processId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {shortTx(e.snapshot.processId)}
          </a>
        ) : '—',
      },
      {
        label: 'Target',
        value: e.snapshot?.targetId ? (
          <TxidLink txid={e.snapshot.targetId} />
        ) : '—',
      },
    ],
  }),

  'Set Record Content': (e) => {
    const sub = e.snapshot?.subDomain || '—';
    const tx  = sub !== '—' ? e.snapshot?.contentHashes?.[sub] : undefined;

    return {
      tag: 'CONTENT',
      items: [
        { label: 'Sub Domain', value: sub === '@' ? 'Root (@)' : sub },
        {
          label: 'Content Hash',
          value: tx ? <TxidLink txid={tx} /> : '—',
        },
      ],
    };
  },

  'Permanent ANT Purchase': (e) => ({
    tag: 'UPGRADE',
    items: [
      { label: 'Purchase Price', value: e.snapshot?.purchasePrice ?? '—' },
    ],
  }),

  'Updated Mainpage Contents': (e) => {
    const tx = e.snapshot?.contentHashes?.['@'];
    return {
      tag: 'UPDATE',
      items: [
        { label: 'Content Hash', value: tx ? <TxidLink txid={tx} /> : '—' },
      ],
    };
  },
  // Fallback for anything unhandled:
  'default': (e) => ({
    tag: 'INFO',
    items: [
      { label: 'Tx',   value: ellip(e.txHash) },
      { label: 'When', value: fmtDate((e.timestamp ?? 0) * 1000) },
    ],
  }),
};

function buildExtraBox(e: TimelineEvent): ExtraBox | undefined {
  const fn = extraBoxBuilders[e.action] ?? extraBoxBuilders['default'];
  return fn?.(e);
}

export default function History() {
  const { arnsname = '' } = useParams<{ arnsname: string }>();
  const navigate = useNavigate();

  const [retryToken, setRetryToken] = useState(0);
  const doRetry = () => setRetryToken(t => t + 1);

  const [events, setEvents]       = useState<TimelineEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // snapshots aligned 1:1 with events as they stream in
  const [snapshots, setSnapshots] = useState<AntSnapshot[]>([]);
  // map first occurrence of txHash -> event index
  const firstIndexByTxHashRef = useRef<Record<string, number>>({});

  // selection state
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // ANT detail state
  const [antDetail, setAntDetail]     = useState<ARNameDetail | null>(null);
  const [antLoading, setAntLoading]   = useState(true);
  const [antError, setAntError]       = useState<string | null>(null);

  // Refs for pan/zoom and each card
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const cardRefs     = useRef<Record<string, HTMLDivElement | null>>({});

  // onClick toggles selection; now also attaches snapshot (if known)
  const onCardClick = (evt: TimelineEvent) => {
    if (selectedEvent?.txHash === evt.txHash) {
      setSelectedEvent(null);
      return;
    }
    const idx = firstIndexByTxHashRef.current[evt.txHash];
    const snap = Number.isInteger(idx) ? snapshots[idx] : undefined;
    setSelectedEvent(snap ? { ...evt, snapshot: snap } : evt);
  };

  // fetch ANT detail
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

  useEffect(() => {
    setEvents([]);
    setSnapshots([]);
    firstIndexByTxHashRef.current = {};
    setLoading(true);
    setError(null);
    setSelectedEvent(null);

    // Running snapshot lives in the effect (sequentially updated)
    let snap: AntSnapshot = initialSnapshot;

    const service = ARIORewindService.autoConfiguration();
    const sub = service
      .getEventHistory$(arnsname)
      .pipe(
        catchError(err => {
          setError(err?.message || 'Failed to load history');
          return EMPTY;
        }),
        switchMap((raw: IARNSEvent[]) => from(raw)),

        // Important: keep temporal order
        concatMap((e: IARNSEvent) => {
          // Resolve the small-card UI fields correctly (await getters)
          const actor$     = toObs(e.getInitiator?.());
          const timestamp$ = toObs(e.getEventTimeStamp?.());
          const txHash$    = toObs(e.getEventMessageId?.());

          let action = 'Unknown Event';
          let legendKey = 'multiple-changes';
          switch (e.constructor.name) {
            case BuyNameEvent.name:           action = 'Purchased ANT Name';         legendKey = 'ant-buy-event';          break;
            case ReassignNameEvent.name:      action = 'ANT Process Change';        legendKey = 'ant-reassign-event';     break;
            case ReturnedNameEvent.name:      action = 'Returned ANT Name';          legendKey = 'ant-return-event';       break;
            case ExtendLeaseEvent.name:       action = 'Extended Lease';             legendKey = 'ant-extend-lease-event'; break;
            case IncreaseUndernameEvent.name: action = 'Increased Undername Limit';  legendKey = 'undername-creation';     break;
            case RecordEvent.name:            action = 'RecordEvent';  legendKey = 'ant-content-change';     break;
            case SetRecordEvent.name:         action = 'Set Record Content';                 legendKey = 'ant-content-change';     break;
            case UpgradeNameEvent.name:       action = 'Permanent ANT Purchase';     legendKey = 'ant-upgrade-event';      break;
            case StateNoticeEvent.name:       action = 'State Notice';               legendKey = 'ant-state-change';       break;
            case CreditNoticeEvent.name:      action = 'Credit Notice';              legendKey = 'ant-credit-notice';      break;
            case DebitNoticeEvent.name:       action = 'Debit Notice';               legendKey = 'ant-debit-notice';       break;
          }
          console.log(e); 
          const delta$ = computeDelta$(e);

          return forkJoin({ actor: actor$, timestamp: timestamp$, txHash: txHash$, delta: delta$ }).pipe(
            map(({ actor, timestamp, txHash, delta }) => {
              snap = applyDelta(snap, delta); // sequentially apply Delta → Snapshot

              return {
                action,
                actor: actor ?? '',
                legendKey,
                timestamp: timestamp ?? 0,
                txHash: txHash ?? '',
                rawEvent: e,
                snapshot: snap, // snapshot as-of this event
                extraBox: buildExtraBox({ action, actor: actor ?? '', legendKey, timestamp: timestamp ?? 0, txHash: txHash ?? '', rawEvent: e, snapshot: snap }),
              } as TimelineEvent;
            })
          );
        })
      )
      .subscribe({
        next: (uiEvt: TimelineEvent) => {
          setEvents(prev => {
            const idx = prev.length;
            if (firstIndexByTxHashRef.current[uiEvt.txHash] === undefined) {
              firstIndexByTxHashRef.current[uiEvt.txHash] = idx;
            }
            return [...prev, uiEvt];
          });
          setSnapshots(prev => [...prev, uiEvt.snapshot!]);
        },
        complete: () => setLoading(false),
        error: () => setLoading(false),
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

  if (antLoading || loading) return <LoadingScreen />;

  // Before your normal render of chain etc.
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

  if (error || events.length < 1) {
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

  const uniqueMap = new Map<string, TimelineEvent>();
  events.forEach(evt => {
    if (!uniqueMap.has(evt.txHash)) uniqueMap.set(evt.txHash, evt);
  });

  const excludedActions = [
    'Credit Notice',
    'Debit Notice',
    'Returned ANT Name',
    'RecordEvent',
    'State Notice',
    'Unknown Event'
  ];

  // Build the timeline cards & make them clickable
  const timelineEvents = Array.from(uniqueMap.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter(st => !excludedActions.includes(st.action))
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
                {new Date(st.timestamp * 1000).toLocaleDateString(undefined, {
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

            {st.extraBox && (
              <div className="chain-card-extra">
                <span className="extra-tag">{st.extraBox.tag}</span>
                <div className="extra-items">
                  {st.extraBox.items.map((it, idx) => (
                    <div className="extra-item" key={idx}>
                      <span className="extra-key">{it.label}</span>
                      <span className="extra-sep">:</span>
                      <span className="extra-value">{it.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            <span className="dot undername-creation" /> Undername Increase
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
                  {timelineEvents.map(ev => (
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

      {/* Detail pop-up (unchanged signature – uiEvent only) */}
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
