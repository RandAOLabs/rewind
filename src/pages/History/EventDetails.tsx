// src/pages/History/EventDetails.tsx
import React from 'react';

type DetailEvent = {
  action: string;
  actor: string;
  legendKey: string;
  timestamp: number; // seconds
  txHash: string;
  snapshot?: {
    owner: string;
    controllers: string[];
    expiryTs: number;        // seconds
    ttlSeconds: number;
    processId?: string;
    targetId?: string;
    undernames: string[];
    contentHashes: Record<string, string>;
  };
};

const shorten = (s?: string, n = 5) => (s ? `${s.slice(0, n)}…` : '—');

export default function EventDetails({ uiEvent }: { uiEvent: DetailEvent }) {
  const snap = uiEvent.snapshot; // may be undefined briefly

  return (
    <div className="event-detail">
      {/* Header */}
      <div className="event-detail-header">
        <h3 className="event-title">{uiEvent.action}</h3>
        <div className="sub">
          <span className={`legend-square ${uiEvent.legendKey}`} />
          <span className="actor">Actor: {uiEvent.actor}</span>
          <span className="date">
            {new Date(uiEvent.timestamp * 1000).toLocaleString()}
          </span>
        </div>
        <div className="txline">
          <span>Tx:</span>{' '}
          <a
            href={`https://www.ao.link/#/message/${uiEvent.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {shorten(uiEvent.txHash)}
          </a>
        </div>
      </div>

      {/* State snapshot */}
      <div className="event-detail-section">
        <h4>ANT state at this point</h4>

        {!snap ? (
          <p className="muted">Building state…</p>
        ) : (
          <>
            <div className="kv">
              <div>
                <span>Owner</span>
                <code>
                  {snap.owner ? (
                    <a
                      href={`https://www.ao.link/#/entity/${snap.owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {shorten(snap.owner)}
                    </a>
                  ) : (
                    '—'
                  )}
                </code>
              </div>

              <div>
                <span>Controllers</span>
                <code>
                  {snap.controllers?.length ? (
                    snap.controllers.map((c, idx) => (
                      <React.Fragment key={c || idx}>
                        <a
                          href={`https://www.ao.link/#/entity/${c}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {shorten(c)}
                        </a>
                        {idx < snap.controllers.length - 1 ? ', ' : ''}
                      </React.Fragment>
                    ))
                  ) : (
                    '—'
                  )}
                </code>
              </div>

              {/* <div>
                <span>Expiry</span>
                <code>
                  {snap.expiryTs
                    ? new Date(snap.expiryTs * 1000).toLocaleDateString()
                    : '—'}
                </code>
              </div>

              <div>
                <span>TTL (s)</span>
                <code>{snap.ttlSeconds ?? 0}</code>
              </div> */}

              {snap.processId && (
                <div>
                  <span>Process ID</span>
                  <code>
                    <a
                      href={`https://www.ao.link/#/entity/${snap.processId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {shorten(snap.processId)}
                    </a>
                  </code>
                </div>
              )}

              {snap.targetId && (
                <div>
                  <span>Target ID</span>
                  <code>
                    <a
                      href={`ar://${snap.targetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {shorten(snap.targetId)}
                    </a>
                  </code>
                </div>
              )}
            </div>
              
            <div className="subsection">
              <h4>Undernames & Content</h4>
              {snap.undernames?.length ? (
                  <div className="undername-scroll">

                <ul className="undername-list">
                  {snap.undernames.map((u) => {
                    const h = snap.contentHashes?.[u];
                    return (
                      <li key={u}>
                        <span className="uname">{u}</span>
                        {h ? (
                          <code className="hash">
                            <a
                              href={`ar://${h}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {shorten(h)}
                            </a>
                          </code>
                        ) : (
                          <code className="hash">—</code>
                        )}
                      </li>
                    );
                  })}
                </ul>
                </div>
              ) : (
                <p className="muted">No undernames yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
