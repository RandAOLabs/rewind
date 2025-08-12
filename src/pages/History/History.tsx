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
} from 'ao-js-sdk';
import { from, forkJoin, of, Observable, EMPTY } from 'rxjs';
import { switchMap, mergeMap, map, catchError } from 'rxjs/operators';
import './History.css';
import EventDetails from './EventDetails';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  );
}

/* ===== Running ANT state (added) ===== */

type ContentHashes = Record<string, string>;

interface AntSnapshot {
  owner: string;
  controllers: string[];
  expiryTs: number;
  ttlSeconds: number;
  processId?: string;
  targetId?: string;
  undernames: string[];       // include '@' for root if you use it
  contentHashes: ContentHashes;
}

const initialSnapshot: AntSnapshot = {
  owner: '',
  controllers: [],
  expiryTs: 0,
  ttlSeconds: 0,
  processId: undefined,
  targetId: undefined,
  undernames: [],
  contentHashes: {},
};

const addUnique = (list: string[], item: string) =>
  item && !list.includes(item) ? [...list, item] : list;

// Pure, sync reducer – keeps this defensive, since SDK getters vary by event
function applyEvent(prev: AntSnapshot, ev: IARNSEvent): AntSnapshot {
  const e: any = ev;
  switch (ev.constructor.name) {
    case BuyNameEvent.name: {
      const newOwner =
        e.getBuyer?.() ??
        e.getNewOwner?.() ??
        e.getInitiator?.() ??
        prev.owner;
      const maybeControllers: string[] | undefined = e.getControllers?.();
      return {
        ...prev,
        owner: newOwner,
        controllers: maybeControllers ?? prev.controllers,
        processId: e.getProcessId?.() ?? prev.processId,
        targetId:  e.getTargetId?.()  ?? prev.targetId,
        expiryTs:  e.getNewExpiry?.() ?? prev.expiryTs,
        ttlSeconds: e.getTtlSeconds?.() ?? prev.ttlSeconds,
      };
    }

    case ReassignNameEvent.name: {
      const newOwner = e.getNewOwner?.() ?? e.getInitiator?.() ?? prev.owner;
      return {
        ...prev,
        owner: newOwner,
        processId: e.getProcessId?.() ?? prev.processId,
        targetId:  e.getTargetId?.()  ?? prev.targetId,
      };
    }

    case ReturnedNameEvent.name: {
      const newOwner = e.getNewOwner?.() ?? '';
      return { ...prev, owner: newOwner };
    }

    case ExtendLeaseEvent.name: {
      const newExpiry = e.getNewExpiry?.() ?? prev.expiryTs;
      const newTtl    = e.getTtlSeconds?.() ?? prev.ttlSeconds;
      return { ...prev, expiryTs: newExpiry, ttlSeconds: newTtl };
    }

    case IncreaseUndernameEvent.name: {
      const label = e.getUndername?.() ?? e.getName?.() ?? '';
      return { ...prev, undernames: addUnique(prev.undernames, label) };
    }

    case RecordEvent.name:
    case SetRecordEvent.name: {
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
      return {
        ...prev,
        processId: e.getProcessId?.() ?? prev.processId,
        targetId:  e.getTargetId?.()  ?? prev.targetId,
      };
    }

    case StateNoticeEvent.name: {
      // If this conveys concrete state, wire it here later
      return prev;
    }

    default:
      return prev;
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
  rawEvent:   IARNSEvent;
  // added (optional) so we can tuck the snapshot in when selected, without breaking callers
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
      <span>Lease: {leaseDuration }</span>
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

  // snapshots aligned 1:1 with events as they stream in
  const [snapshots, setSnapshots] = useState<AntSnapshot[]>([]);
  // map first occurrence of txHash -> event index (so deduped cards still map to a snapshot)
  const firstIndexByTxHashRef = useRef<Record<string, number>>({});

  // selection state (kept as-is)
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // ANT detail state (unchanged)
  const [antDetail, setAntDetail]     = useState<ARNameDetail | null>(null);
  const [antLoading, setAntLoading]   = useState(true);
  const [antError, setAntError]       = useState<string | null>(null);

  // 1️⃣ Refs for pan/zoom and each card
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

  // fetch ANT detail (unchanged)
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

  // fetch & stream history events; also build running snapshots (added)
  useEffect(() => {
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
          return EMPTY; // stop the stream
        }),
        
        switchMap((raw: IARNSEvent[]) => from(raw)),
        mergeMap((e: IARNSEvent) => {
          let action: string, legendKey: string;
          let actor$: Observable<string> = of('');
          let timestamp$: Observable<number> = of(Date.now());
          let txHash$: Observable<string> = of('');

          switch (e.constructor.name) {
            case BuyNameEvent.name: {
              const ev = e as BuyNameEvent;
              action    = 'Purchased ANT Name';
              legendKey = 'ant-buy-event';
              actor$    = of(ev.getInitiator());
              timestamp$= of(ev.getEventTimeStamp());
              txHash$   = of(ev.getEventMessageId());
              break;
            }
            case ReassignNameEvent.name: {
              const ev = e as ReassignNameEvent;
              action    = 'Reassigned ANT Name';
              legendKey = 'ant-reassign-event';
              actor$    = of(ev.getInitiator());
              timestamp$= of(ev.getEventTimeStamp());
              txHash$   = of(ev.getEventMessageId());
              break;
            }
            case ExtendLeaseEvent.name: {
              const ev = e as ExtendLeaseEvent;
              action    = 'Extended Lease';
              legendKey = 'ant-extend-lease-event';
              actor$    = of(ev.getInitiator());
              timestamp$= of(ev.getEventTimeStamp());
              txHash$   = of(ev.getEventMessageId());
              break;
            }
            case ReturnedNameEvent.name: {
              const ev = e as ReturnedNameEvent;
              action    = 'Returned ANT Name';
              legendKey = 'ant-return-event';
              actor$    = of(ev.getInitiator());
              timestamp$= of(ev.getEventTimeStamp());
              txHash$   = of(ev.getEventMessageId());
              break;
            }
            case ExtendLeaseEvent.name: {
              const ev = e as ExtendLeaseEvent;
              action    = 'Renewed ANT Name';
              legendKey = 'ant-renewal';
              actor$    = of(ev.getInitiator());
              timestamp$= of(ev.getEventTimeStamp());
              txHash$   = of(ev.getEventMessageId());
              break;
            }
            case IncreaseUndernameEvent.name: {
              const ev = e as IncreaseUndernameEvent;
              action    = 'Added undername';
              legendKey = 'undername-creation';
              actor$    = of(ev.getInitiator());
              timestamp$= of(ev.getEventTimeStamp());
              txHash$   = of(ev.getEventMessageId());
              break;
            }
            case RecordEvent.name: {
              const ev = e as RecordEvent;
              action    = 'Changed page contents';
              legendKey = 'ant-content-change';
              actor$    = of(ev.getInitiator());
              timestamp$= of(ev.getEventTimeStamp());
              txHash$   = of(ev.getEventMessageId());
              break;
            }
            case SetRecordEvent.name: {
              const ev = e as SetRecordEvent;
              action    = 'Set Record';
              legendKey = 'ant-content-change';
              actor$    = of(ev.getInitiator());
              timestamp$= of(ev.getEventTimeStamp());
              txHash$   = of(ev.getEventMessageId());
              break;
            }
            case UpgradeNameEvent.name: {
              const ev = e as UpgradeNameEvent;
              action    = 'Upgraded ANT Name';
              legendKey = 'ant-upgrade-event';
              actor$    = of(ev.getInitiator());
              timestamp$= of(ev.getEventTimeStamp());
              txHash$   = of(ev.getEventMessageId());
              break;
            }
            case StateNoticeEvent.name: {
              const ev = e as StateNoticeEvent;
              action    = 'State Notice';
              legendKey = 'ant-state-change';
              actor$    = of(ev.getInitiator());
              timestamp$= of(ev.getEventTimeStamp());
              txHash$   = of(ev.getEventMessageId());
              break;
            }
            default: {
              console.warn('Unknown event:', e.constructor.name);
              action    = 'Unknown Event';
              legendKey = 'multiple-changes';
              actor$    = of(e.getInitiator());
              timestamp$= of(e.getEventTimeStamp());
              txHash$   = of(e.getEventMessageId());
            }
          }

          return forkJoin({ actor: actor$, timestamp: timestamp$, txHash: txHash$ }).pipe(
            map(({ actor, timestamp, txHash }) => ({ action, actor, legendKey, timestamp, txHash, rawEvent: e } as TimelineEvent))
          );
        })
      )
      .subscribe({
        next: (uiEvt: TimelineEvent) => {
          // append event
          setEvents(prev => {
            const nextIdx = prev.length; // index of this event as it streams in
            // record first index for this txHash if not seen yet
            if (firstIndexByTxHashRef.current[uiEvt.txHash] === undefined) {
              firstIndexByTxHashRef.current[uiEvt.txHash] = nextIdx;
            }
            return [...prev, uiEvt];
          });

          // append its snapshot
          setSnapshots(prevSnaps => {
            const last = prevSnaps.length ? prevSnaps[prevSnaps.length - 1] : initialSnapshot;
            const next = applyEvent(last, uiEvt.rawEvent);
            return [...prevSnaps, next];
          });
        },
        error: err => {
          console.error(err);
          setError(err.message || 'Failed to load history');
          setLoading(false);
        },
        complete: () => setLoading(false),
      });

    return () => sub.unsubscribe();
  }, [arnsname, retryToken]);

  // After selection paints, pan/zoom to it (unchanged)
  useLayoutEffect(() => {
    if (!selectedEvent) return;
    const node = cardRefs.current[selectedEvent.txHash];
    if (transformRef.current && node) {
      transformRef.current.zoomToElement(node, 300);
    }
  }, [selectedEvent]);
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

if (!loading && (error || events.length === 0)) {
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

  const uniqueMap = new Map<string, TimelineEvent>();
  events.forEach(evt => {
    if (!uniqueMap.has(evt.txHash)) {
      uniqueMap.set(evt.txHash, evt);
    }
  });

  // Build the timeline cards & make them clickable (unchanged)
  const timelineEvents = Array.from(uniqueMap.values())
    .sort((a, b) => a.timestamp - b.timestamp)
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
