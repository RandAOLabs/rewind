// src/pages/History/History.tsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef
} from 'react-zoom-pan-pinch';
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
} from 'ao-js-sdk';
import { from, forkJoin, of, Observable } from 'rxjs';
import { switchMap, mergeMap, map } from 'rxjs/operators';
import { applyEvent, initialSnapshot, AntSnapshot } from './antState';
import EventDetails from './EventDetails';
import './History.css';

export interface TimelineEvent {
  action:     string;
  actor:      string;
  legendKey:  string;
  timestamp:  number;
  txHash:     string;
  rawEvent:   IARNSEvent;
}

export default function History() {
  const { arnsname = '' } = useParams<{ arnsname: string }>();
  const navigate = useNavigate();

  const [events, setEvents]         = useState<TimelineEvent[]>([]);
  const [snapshots, setSnapshots]   = useState<AntSnapshot[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [antDetail, setAntDetail]   = useState<ARNameDetail | null>(null);
  const [antLoading, setAntLoading] = useState(true);
  const [antError, setAntError]     = useState<string | null>(null);

  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const cardRefs     = useRef<Record<number, HTMLDivElement | null>>({});
  const detailRef    = useRef<HTMLDivElement>(null);

  // click handler toggles by index
  const onCardClick = (idx: number) => {
    setSelectedIndex(prev => (prev === idx ? null : idx));
  };

  // pan/zoom AFTER selection updates & DOM paints
  useLayoutEffect(() => {
    if (selectedIndex === null) return;
    const node = cardRefs.current[selectedIndex];
    if (transformRef.current && node) {
      transformRef.current.zoomToElement(node, 300);
    }
  }, [selectedIndex]);

  // ANT detail
  useEffect(() => {
    setAntLoading(true);
    setAntError(null);
    const svc = ARIORewindService.autoConfiguration();
    svc.getAntDetail(arnsname)
      .then(detail => setAntDetail(detail))
      .catch(err => setAntError(err.message || 'Failed to load ANT details'))
      .finally(() => setAntLoading(false));
  }, [arnsname]);

  // Stream history events + build snapshots incrementally
  useEffect(() => {
    setEvents([]);
    setSnapshots([]);
    setSelectedIndex(null);
    setLoading(true);
    setError(null);

    const svc = ARIORewindService.autoConfiguration();
    const sub = svc.getEventHistory$(arnsname)
      .pipe(
        switchMap((raw: IARNSEvent[]) => from(raw)),
        mergeMap((e: IARNSEvent) => {
          // (same per-event enrichment you already do)
          let action: string, legendKey: string;
          let actor$: Observable<string> = of('');
          let timestamp$: Observable<number> = of(Date.now());
          let txHash$: Observable<string> = of('');

          switch (e.constructor.name) {
            case BuyNameEvent.name: {
              const ev = e as BuyNameEvent;
              action    = 'Purchased ANT Name';
              legendKey = 'ant-ownership-transfer';
              actor$    = of(ev.getInitiator());
              timestamp$= of(ev.getEventTimeStamp());
              txHash$   = of(ev.getEventMessageId());
              break;
            }
            case ReassignNameEvent.name: {
              const ev = e as ReassignNameEvent;
              action    = 'Reassigned ANT Name';
              legendKey = 'ant-ownership-transfer';
              actor$    = of(ev.getInitiator());
              timestamp$= of(ev.getEventTimeStamp());
              txHash$   = of(ev.getEventMessageId());
              break;
            }
            case ReturnedNameEvent.name: {
              const ev = e as ReturnedNameEvent;
              action    = 'Returned ANT Name';
              legendKey = 'ant-ownership-transfer';
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
            case UpgradeNameEvent.name: {
              const ev = e as UpgradeNameEvent;
              action    = 'Upgraded ANT Name';
              legendKey = 'ant-content-change';
              actor$    = of(ev.getInitiator());
              timestamp$= of(ev.getEventTimeStamp());
              txHash$   = of(ev.getEventMessageId());
              break;
            }
            default: {
              action    = 'Unknown Event';
              legendKey = 'multiple-changes';
              actor$    = of((e as any).getInitiator?.());
              timestamp$= of((e as any).getEventTimeStamp?.() ?? Date.now());
              txHash$   = of('');
            }
          }

          return forkJoin({ actor: actor$, timestamp: timestamp$, txHash: txHash$ }).pipe(
            map(({ actor, timestamp, txHash }) => ({
              action, actor, legendKey, timestamp, txHash, rawEvent: e,
            } as TimelineEvent))
          );
        })
      )
      .subscribe({
        next: (uiEvt: TimelineEvent) => {
          // append event
          setEvents(prev => [...prev, uiEvt]);

          // append snapshot aligned to same index
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
  }, [arnsname]);

  // close detail on outside click
  useEffect(() => {
    if (selectedIndex === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (detailRef.current && !detailRef.current.contains(e.target as Node)) {
        setSelectedIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedIndex]);

  if (loading || antLoading) return <div className="loading">Loading…</div>;
  if (error)   return <div className="error">{error}</div>;
  if (antError) return <div className="error">{antError}</div>;

  // Dedupe by txHash, keep first index, then sort by timestamp asc
  const firstIndices: number[] = [];
  {
    const seen = new Set<string>();
    events.forEach((ev, idx) => {
      if (!seen.has(ev.txHash)) {
        seen.add(ev.txHash);
        firstIndices.push(idx);
      }
    });
  }
  const renderList = firstIndices
    .sort((a, b) => events[a].timestamp - events[b].timestamp)
    .map(idx => ({ idx, ev: events[idx], snap: snapshots[idx] }));

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
      {antLoading && <div className="loading">Loading ANT details…</div>}
      {antError   && <div className="error">{antError}</div>}
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
                  {renderList.map(({ idx, ev }) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={`${ev.txHash}-${idx}`}
                        className="chain-item"
                        ref={el => { cardRefs.current[idx] = el; }}
                      >
                        <div
                          className={`chain-card clickable${isSelected ? ' selected' : ''}`}
                          onClick={() => onCardClick(idx)}
                        >
                          <div className="chain-card-header">
                            <span className="action-text">{ev.action}</span>
                            <span className="actor">Actor: {ev.actor.slice(0,5)}</span>
                            <span className={`legend-square ${ev.legendKey}`} />
                          </div>
                          <hr />
                          <div className="chain-card-footer">
                            <span className="date">
                              {new Date(ev.timestamp * 1000).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'short', day: 'numeric'
                              })}
                            </span>
                            <span className="txid">
                              <a href={`https://www.ao.link/#/message/${ev.txHash}`} target="_blank" rel="noopener noreferrer">
                                {ev.txHash}
                              </a>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Detail panel now receives the SNAPSHOT for the selected index */}
      {selectedIndex !== null && (
        <div ref={detailRef} className="detailed-card">
          <button className="close-btn" onClick={() => setSelectedIndex(null)}>×</button>
          <EventDetails event={events[selectedIndex]} snapshot={snapshots[selectedIndex]} />
        </div>
      )}
    </div>
  );
}