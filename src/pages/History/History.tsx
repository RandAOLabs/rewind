// src/pages/History/History.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
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
import './History.css';
import EventDetails from './EventDetails';



// The shape we render into cards
export interface TimelineEvent {
  action:     string;
  actor:      string;
  legendKey:  string;
  timestamp:  number;
  txHash:     string;
  rawEvent:   IARNSEvent;
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
      <span>Lease: {leaseDuration}</span>
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

  const [events, setEvents]       = useState<TimelineEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // 🆕 selection state
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // ANT detail state (unchanged)
  const [antDetail, setAntDetail]     = useState<ARNameDetail | null>(null);
  const [antLoading, setAntLoading]   = useState(true);
  const [antError, setAntError]       = useState<string | null>(null);
  
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
  }, [arnsname]);

  // fetch & stream history events (unchanged)
  useEffect(() => {
    setEvents([]);
    setLoading(true);
    setError(null);
    setSelectedEvent(null);

    const service = ARIORewindService.autoConfiguration();
    const sub = service
      .getEventHistory$(arnsname)
      .pipe(
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
              console.warn('Unknown event:', e.constructor.name);
              action    = 'Unknown Event';
              legendKey = 'multiple-changes';
              actor$    = of(e.getInitiator());
              timestamp$= of(e.getEventTimeStamp());
              txHash$   = of('');
            }
          }

          return forkJoin({ actor: actor$, timestamp: timestamp$, txHash: txHash$ }).pipe(
            map(({ actor, timestamp, txHash }) => ({ action, actor, legendKey, timestamp, txHash, rawEvent: e } as TimelineEvent))
          );
        })
      )
      .subscribe({
        next: (uiEvt: TimelineEvent) => setEvents(prev => [...prev, uiEvt]),
        error: err => {
          console.error(err);
          setError(err.message || 'Failed to load history');
          setLoading(false);
        },
        complete: () => setLoading(false),
      });

    return () => sub.unsubscribe();
  }, [arnsname]);



  useEffect(() => {
    if (!selectedEvent) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (detailRef.current && !detailRef.current.contains(e.target as Node)) {
        setSelectedEvent(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedEvent]);



  if (loading) return <div className="loading">Loading history…</div>;
  if (error)   return <div className="error">{error}</div>;

  // Build the timeline cards & make them clickable
  const timelineEvents = events.map((st, i) => {
    const isSelected = selectedEvent?.txHash === st.txHash;
    return {
      key: `${st.txHash}-${i}`,
      content: (
        <div
          className={`chain-card clickable${isSelected ? ' selected' : ''}`}
          onClick={() =>
            setSelectedEvent(prev => (prev?.txHash === st.txHash ? null : st))
          }
        >
          <div className="chain-card-header">
            <span className="action-text">{st.action}</span>
            <span className="actor">{st.actor.slice(0, 4)}</span>
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
              <a href={`https://arweave.net/${st.txHash}`} target="_blank" rel="noopener noreferrer">
                {st.txHash}
              </a>
            </span>
          </div>
        </div>
      ),
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
            <span className="dot ant-ownership-transfer" /> ANT Ownership Transfer
          </div>
          <div className="legend-item">
            <span className="dot ant-content-change" /> ANT Content Change
          </div>
          <div className="legend-item">
            <span className="dot ant-renewal" /> ANT Renewal
          </div>
          <div className="legend-item">
            <span className="dot undername-creation" /> Undername Creation
          </div>
          <div className="legend-item">
            <span className="dot ant-controller-addition" /> ANT Controller Addition
          </div>
          <div className="legend-item">
            <span className="dot undername-content-change" /> Undername Content Change
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
            ? `${Math.floor((antDetail.endTimestamp - antDetail.startTimestamp) / (60 * 60 * 24 * 365))} years`
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

      {/* 🆕 Detail pop‑up → dispatch to per‑event component */}
      {selectedEvent && (
        <div ref={detailRef}>
          <EventDetails uiEvent={selectedEvent} />
        </div>
      )}
    </div>
  );
}
