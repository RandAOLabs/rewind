import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../shared/components/Header/Header';
import Footer from '../../shared/components/Footer/Footer';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import './History.css';

interface HistoricalState {
  timestamp: string;
  txHash: string;
  action: string;
}

interface Undername {
  name: string;
  lastUpdated: string;
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

const dummyUndernames: Undername[] = [
  { name: 'gamma', lastUpdated: '2023-02-10 11:00 UTC' },
  { name: 'alpha', lastUpdated: '2023-03-20 09:15 UTC' },
  { name: 'beta', lastUpdated: '2023-04-01 14:30 UTC' },
];

const sortedUndernames = [...dummyUndernames].sort(
  (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
);

const dummyHistoricalStates: HistoricalState[] = [
  {
    timestamp: '2023-01-01 12:00 UTC',
    txHash: '9LpDNTTzo9oHasWWloZm8GRVRa5-1AVBu_IjxCBC_vo',
    action: 'Added undername',
  },
  {
    timestamp: '2023-02-15 08:30 UTC',
    txHash: 'AOydg-WqezTa2F0wjE9xdmSdjQVBwMQGB4OjQl-KB4o',
    action: 'Changed page contents',
  },
  {
    timestamp: '2023-03-10 17:45 UTC',
    txHash: 'mLzoyxWrL1afrHHTMmQLoVzT0qgTsK_ho2Tk4Mc9o2o',
    action: 'Removed undername',
  },
  {
    timestamp: '2023-01-01 12:00 UTC',
    txHash: '9LpDNTTzo9oHasWWloZm8GRVRa5-1AVBu_IjxCBC_vo',
    action: 'Added undername',
  },
  {
    timestamp: '2023-02-15 08:30 UTC',
    txHash: 'AOydg-WqezTa2F0wjE9xdmSdjQVBwMQGB4OjQl-KB4o',
    action: 'Changed page contents',
  },
  {
    timestamp: '2023-03-10 17:45 UTC',
    txHash: 'mLzoyxWrL1afrHHTMmQLoVzT0qgTsK_ho2Tk4Mc9o2o',
    action: 'Removed undername',
  },
  {
    timestamp: '2023-01-01 12:00 UTC',
    txHash: '9LpDNTTzo9oHasWWloZm8GRVRa5-1AVBu_IjxCBC_vo',
    action: 'Added undername',
  },
  {
    timestamp: '2023-02-15 08:30 UTC',
    txHash: 'AOydg-WqezTa2F0wjE9xdmSdjQVBwMQGB4OjQl-KB4o',
    action: 'Changed page contents',
  },
  {
    timestamp: '2023-03-10 17:45 UTC',
    txHash: 'mLzoyxWrL1afrHHTMmQLoVzT0qgTsK_ho2Tk4Mc9o2o',
    action: 'Removed undername',
  },
  {
    timestamp: '2023-01-01 12:00 UTC',
    txHash: '9LpDNTTzo9oHasWWloZm8GRVRa5-1AVBu_IjxCBC_vo',
    action: 'Added undername',
  },
  {
    timestamp: '2023-02-15 08:30 UTC',
    txHash: 'AOydg-WqezTa2F0wjE9xdmSdjQVBwMQGB4OjQl-KB4o',
    action: 'Changed page contents',
  },
  {
    timestamp: '2023-03-10 17:45 UTC',
    txHash: 'mLzoyxWrL1afrHHTMmQLoVzT0qgTsK_ho2Tk4Mc9o2o',
    action: 'Removed undername',
  },
];

export default function History() {
  const { arnsname } = useParams<{ arnsname: string }>();
  const navigate = useNavigate();

  const timelineEvents = [
    {
      key: 'current',
      content: (
        <div className="chain-card">
          <h3>Current State</h3>
          <p>
            <strong>Name:</strong> <code>{arnsname}</code>
          </p>
          <p>
            <strong>Lease Duration:</strong> {dummyAntData.leaseDuration}
          </p>
          <p>
            <strong>Expiry Date:</strong> {dummyAntData.expiry}
          </p>
          <p>
            <strong>Process ID:</strong> <code>{dummyAntData.processId}</code>
          </p>
          <p>
            <strong>Target ID:</strong> <code>{dummyAntData.targetId}</code>
          </p>
          <p>
            <strong>Controllers:</strong>{' '}
            {dummyAntData.controllers.map((c, i) => (
              <React.Fragment key={c}>
                {i > 0 && ', '}
                <code>{c}</code>
              </React.Fragment>
            ))}
          </p>
          <p>
            <strong>Owner:</strong> <code>{dummyAntData.owner}</code>
          </p>
          <p>
            <strong>TTL:</strong> {dummyAntData.ttl}
          </p>
          <p>
            <strong>Undername Count:</strong> {sortedUndernames.length}
          </p>
          <p>
            <strong>Logo TxID:</strong>{' '}
            <a
              href={`https://arweave.net/${dummyAntData.logoTxId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              {dummyAntData.logoTxId}
            </a>
          </p>
          <p>
            <strong>Description:</strong> {dummyAntData.description}
          </p>
        </div>
      ),
    },
    ...dummyHistoricalStates.map((st, i) => ({
      key: `hist-${i}`,
      content: (
        <div className="chain-card">
          <h3>{st.action}</h3>
          <p>
            <strong>Time:</strong> {st.timestamp}
          </p>
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
    })),
  ];

  return (
    <div className="history">

      <button
        className="back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <AiOutlineArrowLeft size={32} />
      </button>

      <div className="chain-wrapper">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={2}
          wheel={{ step: 50 }}
          doubleClick={{ disabled: true }}
          limitToBounds={false}
        >
          {({ zoomIn }) => (
            <>
              <div className="chain-controls">
                <button onClick={(e: React.MouseEvent) => { e.preventDefault(); zoomIn(1); }}>+</button>
              </div>
              <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                <div className="chain-container">
                  {timelineEvents.map((ev) => (
                    <div key={ev.key} className="chain-item">
                      <div className="chain-point" />
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
