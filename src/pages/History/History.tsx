// src/pages/History/History.tsx
import { useState, useEffect } from 'react';
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
} from 'ao-js-sdk';
import { from, forkJoin, Observable, of } from 'rxjs';
import { switchMap, mergeMap, map } from 'rxjs/operators';
import './History.css';

// (Optional) Data for your fixed bar at the top
const dummyAntData = {
  leaseDuration: '3 years',
  expiry:        '2027-08-11',
};

// in History.tsx
interface ARNameDetail {
  name: string;
  startTimestamp: number;
  endTimestamp: number;
  type: string;
  processId: string;
  controllers: string[];
  owner: string;
  ttlSeconds: number;
}

// The shape we render into cards
interface UIEvent {
  action:     string;
  actor:      string;
  legendKey:  string;
  timestamp:  number;
  txHash:     string;
}


interface CurrentAntBarProps {
  name: string;
  expiryTs: number;
  leaseDuration: string;
  processId: string;
  controllers: string[];
  owner: string;
  ttlSeconds: number;
  onBack: () => void;
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
    </div>
  );
}

export default function History() {
  const { arnsname = '' } = useParams<{ arnsname: string }>();
  const navigate = useNavigate();
  const [events, setEvents]   = useState<UIEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // 🆕 state for ANT detail
  const [antDetail, setAntDetail]     = useState<ARNameDetail | null>(null);
  const [antLoading, setAntLoading]   = useState(true);
  const [antError, setAntError]       = useState<string | null>(null);

  useEffect(() => {
    setAntLoading(true);
    setAntError(null);
    
    const service = ARIORewindService.autoConfiguration();
    service
      .getAntDetail(arnsname)
      .then(detail => {
        setAntDetail(detail);
      })
      .catch(err => {
        console.error(err);
        setAntError(err.message || 'Failed to load ANT details');
      })
      .finally(() => {
        setAntLoading(false);
      });
  }, [arnsname]);

  useEffect(() => {
    // reset on new name
    setEvents([]);
    setLoading(true);
    setError(null);

    const service = ARIORewindService.autoConfiguration();
    const sub = service
      .getEventHistory$(arnsname)          // Observable<IARNSEvent[]>
      .pipe(
        // flatten the array into individual emissions
        switchMap((raw: IARNSEvent[]) => from(raw)),
        // for each event, do its async getters in parallel
        mergeMap( (e: IARNSEvent) => {
          let action: string,
              legendKey: string,
              actor$: Observable<string>,
              timestamp$: Observable<number>,
              txHash$: Observable<string>;
          //console.log(e);
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
            // fallback
            default: {
              console.warn('Unknown event:', e.constructor.name);
              action    = 'Unknown Event';
              legendKey = 'multiple-changes';
              actor$    = of(e.getInitiator());
              timestamp$= of(e.getEventTimeStamp());
              txHash$   = of('');
            }
          }

          // wait for the three async getters, then emit a UIEvent
          return forkJoin({ actor: actor$, timestamp: timestamp$, txHash: txHash$ }).pipe(
            map(({ actor, timestamp, txHash }) => ({
              action,
              actor,
              legendKey,
              timestamp,
              txHash,
            } as UIEvent))
          );
        })
      )
      .subscribe({
        next: (uiEvt: UIEvent) => {
          // append each as it arrives
          setEvents(prev => [...prev, uiEvt]);
        },
        error: err => {
          console.error(err);
          setError(err.message || 'Failed to load history');
          setLoading(false);
        },
        complete: () => {
          setLoading(false);
        },
      });

    return () => sub.unsubscribe();
  }, [arnsname]);

  if (loading) return <div className="loading">Loading history…</div>;
  if (error)   return <div className="error">{error}</div>;

  // Build the timeline cards
  const timelineEvents = events.map((st, i) => ({
    key: `${st.txHash}-${i}`,
    content: (
      <div className="chain-card">
        <div className="chain-card-header">
          <span className="action-text">{st.action}</span>
          <span className="actor">{st.actor.slice(0, 4)}</span>
          <span className={`legend-square ${st.legendKey}`}></span>
        </div>
        <hr />
        <div className="chain-card-footer">
          <span className="date">
            {new Date(st.timestamp*1000).toLocaleDateString(undefined, {
              year: 'numeric', month: 'short', day: 'numeric'
            })}
          </span>
          <span className="txid">
            <a
              href={`https://arweave.net/${st.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {st.txHash}
            </a>
          </span>
        </div>
      </div>
    ),
  }));

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
            ? `${Math.floor((antDetail.endTimestamp - antDetail.startTimestamp)/(60*60*24*365))} years`
            : antDetail.type
          }
          processId={antDetail.processId}
          controllers={antDetail.controllers}
          owner={antDetail.owner}
          ttlSeconds={antDetail.ttlSeconds}
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
    </div>
  );
}
