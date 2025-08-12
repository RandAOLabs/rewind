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

export default function EventDetails({ uiEvent }: { uiEvent: DetailEvent }) {
  const snap = uiEvent.snapshot; // may be undefined for a moment

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
            {uiEvent.txHash}
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
              <div><span>Owner</span><code>{snap.owner || '—'}</code></div>
              <div><span>Controllers</span>
                <code>{snap.controllers?.length ? snap.controllers.join(', ') : '—'}</code>
              </div>
              <div><span>Expiry</span>
                <code>
                  {snap.expiryTs
                    ? new Date(snap.expiryTs * 1000).toLocaleDateString()
                    : '—'}
                </code>
              </div>
              <div><span>TTL (s)</span><code>{snap.ttlSeconds ?? 0}</code></div>
              {snap.processId && (
                <div><span>Process ID</span><code>{snap.processId}</code></div>
              )}
              {snap.targetId && (
                <div><span>Target ID</span><code>{snap.targetId}</code></div>
              )}
            </div>

            <div className="subsection">
              <h5>Undernames & Content</h5>
              {snap.undernames?.length ? (
                <ul className="undername-list">
                  {snap.undernames.map((u) => (
                    <li key={u}>
                      <span className="uname">{u}</span>
                      <code className="hash">{snap.contentHashes?.[u] ?? '—'}</code>
                    </li>
                  ))}
                </ul>
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
