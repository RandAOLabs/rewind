// src/pages/History/History.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import './History.css';

interface HistoricalState {
  timestamp: string;
  txHash: string;
  action: string;
  controller: string;   // who did it
  legendKey: string;    // matches your legend dot classes
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
  {
    timestamp: '2023-01-01 12:00 UTC',
    txHash:    '9LpDNTTzo9oHasWWloZm8GRVRa5-1AVBu_IjxCBC_vo',
    action:    'Purchased ANT Name',
    controller:'ttOZLNyBZokWYmAlNIDq',   // full ID, we’ll truncate
    legendKey: 'ant-ownership-transfer',
  },
  {
    timestamp: '2023-02-15 08:30 UTC',
    txHash:    'AOydg-WqezTa2F0wjE9xdmSdjQVBwMQGB4OjQl-KB4o',
    action:    'Changed Page Contents',
    controller:'ttOZLNyBZokWYmAlNIDq', 
    legendKey: 'ant-content-change',
  },
  {
    timestamp: '2023-03-10 17:45 UTC',
    txHash:    'mLzoyxWrL1afrHHTMmQLoVzT0qgTsK_ho2Tk4Mc9o2o',
    action:    'Renewed ANT Name',
    controller:'ttOZLNyBZokWYmAlNIDq', 
    legendKey: 'ant-renewal',
  },
  {
    timestamp: '2023-04-15 08:30 UTC',
    txHash:    'AOydg-WqezTa2F0wjE9xdmSdjQVBwMQGB4OjQl-KB4o',
    action:    'Added Undername',
    controller:'ttOZLNyBZokWYmAlNIDq', 
    legendKey: 'undername-creation',
  },
  {
    timestamp: '2023-05-15 08:30 UTC',
    txHash:    'AOydg-WqezTa2F0wjE9xdmSdjQVBwMQGB4OjQl-KB4o',
    action:    'Added Controller',
    controller:'ttOZLNyBZokWYmAlNIDq', 
    legendKey: 'ant-controller-addition',
  },
  {
    timestamp: '2023-06-10 17:45 UTC',
    txHash:    'mLzoyxWrL1afrHHTMmQLoVzT0qgTsK_ho2Tk4Mc9o2o',
    action:    'Changed Undername Content',
    controller:'C_3j4_d-GNK0jJrCK65OTkN0Iq6xK-YejtixDRevG7o', 
    legendKey: 'undername-content-change',
  },
];

const truncate4 = (s: string) => s.slice(0, 4);
const formatDate = (ts: string) =>
  new Date(ts + ' UTC').toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });

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

  const timelineEvents = dummyHistoricalStates.map((st, i) => ({
    key: `hist-${i}`,
    content: (
      <div className="chain-card">
  <div className="chain-card-header">
    {/* 1) Action first */}
    <span className="action-text">{st.action}</span>

    {/* 2) Then the truncated controller ID */}
    <span className="controller">{truncate5(st.controller)}</span>

    {/* 3) Finally the colored square */}
    <span className={`legend-square ${st.legendKey}`}></span>
  </div>

  <hr />

  <div className="chain-card-footer">
    <span>Date:</span>
    <span className="date">{formatDate(st.timestamp)} </span>
    <span className="txid">
      <span>&nbsp;</span>
      <span> Hash: </span>
      <span className="txid">
        <a href={`https://arweave.net/${st.txHash}`} target="_blank" rel="noopener noreferrer">
          {truncate5(st.txHash)}
        </a>
      </span>
    </span>
  </div>
</div>
    )
  }));

  return (
    <div className="history">

      {/* Floating Legend */}
      <div className="legend">
        <h4>Legend</h4>
        <div className="legend-section">
          <div className="legend-title">Event Legend:</div>
          <div className="legend-item">
            <span className="dot ant-ownership-transfer" /> Ownership Transfer
          </div>
          <div className="legend-item">
            <span className="dot ant-content-change" /> Content Change
          </div>
          <div className="legend-item">
            <span className="dot ant-renewal" /> Renewal
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