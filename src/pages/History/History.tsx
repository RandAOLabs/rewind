// src/pages/History/History.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  ARIORewindService,
  IARNSEvent,
  IBuyNameEvent,
  IExtendLeaseEvent,
  IIncreaseUndernameEvent,
  IReassignNameEvent,
  IRecordEvent,
  IANTEvent,
} from 'ao-js-sdk';
import './History.css';

// (Optional) Data for your fixed bar at the top
const dummyAntData = {
  leaseDuration: '3 years',
  expiry: '2027-08-11',
};

// The shape we render into cards
interface UIEvent {
  action:     string;
  controller: string;
  legendKey:  string;
  timestamp:  string;
  txHash:     string;
}

// Tiny fixed bar under the header
function CurrentAntBar({
  name,
  onBack,
}: {
  name: string;
  onBack: () => void;
}) {
  return (
    <div className="current-ant-bar">
      <button className="back-button" onClick={onBack} aria-label="Go back">
        <AiOutlineArrowLeft size={20} />
      </button>
      <span>ANT Name: <code>{name}</code></span>
      <span>Expiry: {dummyAntData.expiry}</span>
      <span>Lease: {dummyAntData.leaseDuration}</span>
    </div>
  );
}

export default function History() {
  const { arnsname = '' } = useParams<{ arnsname: string }>();
  const navigate = useNavigate();
  const [events, setEvents]   = useState<UIEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const service = ARIORewindService.autoConfiguration();
    const sub = service.getEventHistory$(arnsname).subscribe({
      next: (raw: IARNSEvent[]) => {
        console.log(raw);
        const ui = raw.map((e): UIEvent => {
          switch (true) {
            // PURCHASE (ANT Ownership Transfer)
            case 'getPurchasedProcessId' in e: {
              const be = e as unknown as IBuyNameEvent;
              return {
                action:     'Purchased ANT Name',
                controller: 'be.getController()',
                legendKey:  'ant-ownership-transfer',
                timestamp:  'be.getTimestamp()',
                txHash:     'be.getTxId()',
              };
            }
            // CONTENT CHANGE (Page / Undername)
            case 'getContentHash' in e: {
              const cc = e as unknown as IRecordEvent;
              return {
                action:     'Changed page contents',
                controller: 'cc.getController()',
                legendKey:  'ant-content-change',
                timestamp:  'cc.getTimestamp()',
                txHash:     'cc.getTxId()',
              };
            }
            // RENEWAL
            case 'getNewExpiry' in e: {
              const re = e as unknown as IExtendLeaseEvent;
              return {
                action:     'Renewed ANT Name',
                controller: 're.getController()',
                legendKey:  'ant-renewal',
                timestamp:  're.getTimestamp()',
                txHash:     're.getTxId()',
              };
            }
            // UNDERNAME CREATION
            case 'getUndername' in e: {
              const uc = e as unknown as IIncreaseUndernameEvent;
              return {
                action:     'Added undername',
                controller: 'uc.getController()',
                legendKey:  'undername-creation',
                timestamp:  'uc.getTimestamp()',
                txHash:     'uc.getTxId()',
              };
            }
            // CONTROLLER ADDITION
            case 'getReassignedProcessId' in e: {
              const ca = e as unknown as IReassignNameEvent;
              return {
                action:     'Reassigned Name Event',
                controller: 'ca.getController()',
                legendKey:  'ant-controller-addition',
                timestamp:  'ca.getTimestamp()',
                txHash:     'ca.getTxId()',
              };
            }
            // UNDERNAME CONTENT CHANGE
            case 'getNewContentHash' in e: {
              const uc = e as unknown as IANTEvent;
              return {
                action:     'Changed Undername Content',
                controller: 'uc.getController()',
                legendKey:  'undername-content-change',
                timestamp:  'uc.getTimestamp()',
                txHash:     'uc.getTxId()',
              };
            }
            // Fallback
            default: {
              console.warn('Unknown event type, falling back:', e);
              return {
                action:     'Unknown Event',
                controller: '',
                legendKey:  'multiple-changes',
                timestamp:  (e as any).getTimestamp?.() || '',
                txHash:     (e as any).getTxId?.()       || '',
              };
            }
          }
        });

        setEvents(ui);
        setLoading(false);
      },
      error: err => {
        console.error(err);
        setError(err.message || 'Failed to load history');
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
          <span className="controller">{st.controller.slice(0, 4)}</span>
          <span className={`legend-square ${st.legendKey}`}></span>
        </div>
        <hr />
        <div className="chain-card-footer">
          <span className="date">
            {new Date(st.timestamp + ' UTC').toLocaleDateString(undefined, {
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
      <CurrentAntBar name={arnsname} onBack={() => navigate(-2)} />

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
