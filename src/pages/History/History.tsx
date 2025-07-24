// src/pages/History/History.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import './History.css';

interface HistoricalState {
  timestamp: string;
  txHash: string;
  action: string;
}

const dummyAntData = {
  leaseDuration: '3 years',
  expiry: '2027-08-11',
  processId: 'YWaDxx9CQwDBdp09klnYU5mNAxvu7oqS6YJ4oWr9T4Y',
  targetId: '-ornXYCNRA3dhXcV3LMMcRx-NbWcjVKIvjO0Q9ciJqk',
  controllers: [
    'ttOZLNyBZokWYmAlNIDqngzYXj9sEIU22B0sBTJobWc',
    'C_3j4_d-GNK0jJrCK65OTkN0Iq6xK-YejtixDRevG7o',
  ],
  owner: 'LTxNyUaVVm-lwR-Wa7Z4LXbz3TvW5btEm-qoD9VhGm4',
  ttl: '3600s',
  logoTxId: 'hJ3kDfl98a7-AXY12bc34EfGhIjKlmNoPqRsTuVwXyZ',
  description: 'This is a dummy description for the ANT.',
};

const dummyHistoricalStates: HistoricalState[] = [
  { timestamp: '2023-01-01 12:00 UTC', txHash: '…', action: 'Added undername' },
  { timestamp: '2023-02-15 08:30 UTC', txHash: '…', action: 'Changed page contents' },
  { timestamp: '2023-03-10 17:45 UTC', txHash: '…', action: 'Removed undername' },
  { timestamp: '2023-01-01 12:00 UTC', txHash: '…', action: 'Added undername' },
  { timestamp: '2023-02-15 08:30 UTC', txHash: '…', action: 'Changed page contents' },
  { timestamp: '2023-03-10 17:45 UTC', txHash: '…', action: 'Removed undername' },
  { timestamp: '2023-01-01 12:00 UTC', txHash: '…', action: 'Added undername' },
  { timestamp: '2023-02-15 08:30 UTC', txHash: '…', action: 'Changed page contents' },
  { timestamp: '2023-03-10 17:45 UTC', txHash: '…', action: 'Removed undername' },
];

// Helper to truncate to first 5 chars
const truncate5 = (s: string) => s.slice(0, 5);

// Tiny bar right under header, now with back‑button inside it
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
        <AiOutlineArrowLeft size={27} />
      </button>

      <span>ANT Name: <code>{name}</code></span>
      <span>Expiry: {dummyAntData.expiry}</span>
      <span>Lease: {dummyAntData.leaseDuration}</span>
      <span>Process ID: <code>{truncate5(dummyAntData.processId)}...</code></span>
      <span>Target ID: <code>{truncate5(dummyAntData.targetId)}...</code></span>
      <span>
        Controllers: {dummyAntData.controllers.map(c => (truncate5(c)+' . . .')).join(', ')}
      </span>
      <span>Owner: <code>{truncate5(dummyAntData.owner)}...</code></span>
      <span>TTL: {dummyAntData.ttl}</span>
    </div>
  );
}

export default function History() {
  const { arnsname = '' } = useParams<{ arnsname: string }>();
  const navigate = useNavigate();

  // only historical events now
  const timelineEvents = dummyHistoricalStates.map((st, i) => ({
    key: `hist-${i}`,
    content: (
      <div className="chain-card">
        <h3>{st.action}</h3>
        <p><strong>Time:</strong> {st.timestamp}</p>
        <p>
          <strong>Tx:</strong>{' '}
          <a
            href={`https://arweave.net/${st.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link"
          >
            {st.txHash}
          </a>
        </p>
      </div>
    ),
  }));

  return (
    <div className="history">

{/* Floating Legend */}
<div className="legend">
        <h4>Legend</h4>
        <div className="legend-section">
          <div className="legend-title">Card Legend:</div>
          <div className="legend-item">
            <span className="dot text-change" /> Text Changes
          </div>
          <div className="legend-item">
            <span className="dot address-change" /> Address Changes
          </div>
          <div className="legend-item">
            <span className="dot resolver-changed" /> Resolver Changed
          </div>
          <div className="legend-item">
            <span className="dot content-hash" /> ContentHash Changed
          </div>
          <div className="legend-item">
            <span className="dot multiple-changes" /> Multiple Changes
          </div>
        </div>
        <div className="legend-section">
          <div className="legend-title">Data Legend:</div>
          <div className="legend-item">
            <span className="dot added-records" /> Added Records
          </div>
          <div className="legend-item">
            <span className="dot updated-records" /> Updated Records
          </div>
          <div className="legend-item">
            <span className="dot removed-records" /> Removed Records
          </div>
        </div>
      </div>

      {/* NEW: current-state, fixed beneath header */}
      <CurrentAntBar name={arnsname} onBack={() => navigate(-2)} />

      {/* chain, now only historical events */}
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
              <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '50%' }}>
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