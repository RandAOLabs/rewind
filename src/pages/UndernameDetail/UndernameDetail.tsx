import React from 'react'
import { useParams } from 'react-router-dom'
import Header from '../../shared/components/Header/Header'
import Footer from '../../shared/components/Footer/Footer'
import './UndernameDetail.css'
import { useNavigate } from 'react-router-dom'
import { AiOutlineArrowLeft } from 'react-icons/ai'

interface HistoricalState {
  timestamp: string
  txHash: string
  action: string
}

// dummy data for this undername
const dummyUndernameData = {
  lastUpdated:   '2023-04-01 14:30 UTC',
  controller:    'alice',
}

const dummyHistoricalStates: HistoricalState[] = [
  { timestamp: '2023-01-01 12:00 UTC', txHash: 'AAAaaa111...', action: 'Created undername' },
  { timestamp: '2023-02-15 08:30 UTC', txHash: 'BBBbbb222...', action: 'Transferred controller' },
  { timestamp: '2023-03-10 17:45 UTC', txHash: 'CCCccc333...', action: 'Updated metadata' },
]

export default function UndernameDetail() {
  const { arnsname, undername } = useParams<{ arnsname: string; undername: string }>()
  const navigate = useNavigate()
  return (
    <div className="undername-detail-page">
      <Header />

      {/* back arrow */}
      <button
        className="back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <AiOutlineArrowLeft size={32} />
      </button>

      <main className="wrapper">
        {!arnsname || !undername ? (
          <div className="no-name">Missing ARNS name or undername</div>
        ) : (
          <>
            {/* Page Header */}
            <section className="page-header">
              <h1 className="page-title">Undername Details</h1>
              <p className="page-subtitle">
                <code>{undername}_{arnsname}</code>
              </p>
            </section>

            {/* Current Undername State */}
            <section className="section current-state">
              <div className="card">
                <p>
                  <strong>Undername:</strong>{' '}
                  <code>{undername}_{arnsname}</code>
                </p>
                <p>
                  <strong>Last Updated:</strong>{' '}
                  <code>{dummyUndernameData.lastUpdated}</code>
                </p>
                <p>
                  <strong>Controller:</strong>{' '}
                  <code>{dummyUndernameData.controller}</code>
                </p>
              </div>
            </section>

            {/* Historical States */}
            <section className="section historical-states">
              <h2 className="section-title">Historical Undername States</h2>
              <div className="card-row stacked">
                {dummyHistoricalStates.map((st, i) => (
                  <div key={i} className="card">
                    <p><strong>Time:</strong> {st.timestamp}</p>
                    <p>
                      <strong>TX:</strong>{' '}
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
  )
}
