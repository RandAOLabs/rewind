// src/pages/History/History.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../shared/components/Header/Header';
import Footer from '../../shared/components/Footer/Footer';
import './History.css';
import { useNavigate } from 'react-router-dom'
import { AiOutlineArrowLeft } from 'react-icons/ai'

interface HistoricalState {
  timestamp: string;
  txHash: string;
  action: string;
}

interface Undername {
  name: string;
  lastUpdated: string;
}

// dummy data for the “current” ANT
const dummyAntData = {
  leaseInfo:    '3 years',
  processId:    'YWaDxx9CQwDBdp09klnYU5mNAxvu7oqS6YJ4oWr9T4Y',
  targetId:     '-ornXYCNRA3dhXcV3LMMcRx-NbWcjVKIvjO0Q9ciJqk',
  controllers:  ['bob', 'alice'],
  owner:        'LTxNyUaVVm-lwR-Wa7Z4LXbz3TvW5btEm-qoD9VhGm4',
  ttl:          '3600s',
  logoTxId:     'hJ3kDfl98a7-AXY12bc34EfGhIjKlmNoPqRsTuVwXyZ',
  description:  'This is a dummy description for the ANT.',
};

const dummyUndernames: Undername[] = [
  { name: 'gamma', lastUpdated: '2023-02-10 11:00 UTC' },
  { name: 'alpha', lastUpdated: '2023-03-20 09:15 UTC' },
  { name: 'beta',  lastUpdated: '2023-04-01 14:30 UTC' },
];
const sortedUndernames = [...dummyUndernames].sort(
  (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
);

const dummyHistoricalStates: HistoricalState[] = [
  { timestamp: '2023-01-01 12:00 UTC', txHash: '9LpDNTTzo9oHasWWloZm8GRVRa5-1AVBu_IjxCBC_vo', action: 'Added undername' },
  { timestamp: '2023-02-15 08:30 UTC', txHash: 'AOydg-WqezTa2F0wjE9xdmSdjQVBwMQGB4OjQl-KB4o', action: 'Changed page contents' },
  { timestamp: '2023-03-10 17:45 UTC', txHash: 'mLzoyxWrL1afrHHTMmQLoVzT0qgTsK_ho2Tk4Mc9o2o', action: 'Removed undername' },
];

export default function History() {
  const { arnsname } = useParams<{ arnsname: string }>();
  const navigate = useNavigate()

  return (
    <div className="history">
      <Header />

      {/* back arrow */}
      <button
        className="back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <AiOutlineArrowLeft size={32} />
      </button>
      <main className="history-page wrapper">
        {!arnsname ? (
          <div className="no-name">No ARNS name provided</div>
        ) : (
          <>
            {/* Page Title */}
            <section className="page-header">
              <h1 className="page-title">ARNS Name Data</h1>
              <p className="page-subtitle">
                Details and history for <code>{arnsname}</code>
              </p>
            </section>

            {/* Current ANT State + Undernames */}
            <section className="section current-state">
              <div className="card-row">
                <div className="card">
                  <p><strong>Name:</strong> <code>{arnsname}</code></p>
                  <p><strong>Lease Info:</strong> <code>{dummyAntData.leaseInfo}</code></p>
                  <p><strong>Process ID:</strong> <code>{dummyAntData.processId}</code></p>
                  <p><strong>Target ID:</strong> <code>{dummyAntData.targetId}</code></p>
                  <p>
                    <strong>Controllers:</strong>{' '}
                    {dummyAntData.controllers.map((c, index) => (
                      <React.Fragment key={c}>
                        {index > 0 && ', '}
                        <code>{c}</code>
                      </React.Fragment>
                    ))}
                  </p>
                  <p><strong>Owner:</strong> <code>{dummyAntData.owner}</code></p>
                  <p><strong>TTL:</strong> <code>{dummyAntData.ttl}</code></p>
                  <p><strong>Undername Count:</strong> <code>{sortedUndernames.length}</code></p>
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
                  <p><strong>Description:</strong> {dummyAntData.description}</p>
                </div>

                <div className="card undernames-card">
                  <h3>Undernames</h3>
                  <div className="undername-buttons">
                    {sortedUndernames.map((u) => (
                      <div key={u.name} className="undername-item">
                        <Link
                          to={`/history/${arnsname}/${u.name}`}
                          className="undername-button"
                        >
                          {`${u.name}_${arnsname}`}
                        </Link>
                        <small className="undername-updated">{u.lastUpdated}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Historical ANT States – now inside the same .card-row */}
            <section className="section historical-states">
              <h2 className="section-title">Historical ANT States</h2>
              <div className="card-row">
                {dummyHistoricalStates.map((st, i) => (
                  <div key={i} className="card">
                    <p><strong>Time:</strong> {st.timestamp}</p>
                    <p>
                      <strong>Transaction:</strong>{' '}
                      <a
                        href={`https://arweave.net/${st.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tx-link"
                      >
                        {st.txHash}
                      </a>
                    </p>
                    <span className="tag">{st.action}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
