// src/pages/History/EventDetails.tsx
import React, { useEffect, useState } from 'react';
import { arTxidToHttps } from '../../wayfinder';

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

const shorten = (s?: string, n = 5) =>
  s ? (s.length <= n ? s : `${s.slice(0, n)}…`) : '—';
const fmtDateTime = (tsSec?: number) =>
  tsSec ? new Date(tsSec * 1000).toLocaleString() : '—';

/** Simple Wayfinder link component */
function ArTxLink({ txid, label }: { txid: string; label?: string }) {
  const [href, setHref] = useState<string>();

  useEffect(() => {
    let alive = true;
    arTxidToHttps(txid).then((url) => {
      if (alive) setHref(url);
    });
    return () => {
      alive = false;
    };
  }, [txid]);

  const text = label ?? shorten(txid);
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {text}
    </a>
  ) : (
    <span>{text}</span>
  );
}

export default function EventDetails({ uiEvent }: { uiEvent: DetailEvent }) {
  const snap = uiEvent.snapshot;

  const metaChips = snap
    ? [
        // {
        //   k: 'Expiry',
        //   v: snap.expiryTs
        //     ? new Date(snap.expiryTs * 1000).toLocaleDateString()
        //     : '—',
        // },
        //{ k: 'TTL', v: `${snap.ttlSeconds ?? 0}s` },
        { k: 'Undernames', v: String(snap.undernames?.length ?? 0) },
        { k: 'Labels', v: String(Object.keys(snap.contentHashes ?? {}).length) },
      ]
    : [];

  return (
    <div className="event-detail">
      <div className="event-detail-header">
        <h3 className="event-title">{uiEvent.action}</h3>
        <div className="sub">
          <span className={`legend-square ${uiEvent.legendKey}`} />
          <span className="actor">Actor: {uiEvent.actor}</span>
          <span className="date">{fmtDateTime(uiEvent.timestamp)}</span>
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
        {!!metaChips.length && (
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {metaChips.map(({ k, v }) => (
              <span key={k} className="chip">
                <span className="chip-k">{k}</span>
                <span className="chip-v">{v}</span>
              </span>
            ))}
          </div>
        )}
      </div>

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
                  {snap.controllers?.length
                    ? snap.controllers.map((c, idx) => (
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
                    : '—'}
                </code>
              </div>

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
                    <ArTxLink txid={snap.targetId} label={shorten(snap.targetId)} />
                  </code>
                </div>
              )}
            </div>

            <div className="subsection">
              <h4>Undernames &amp; Content</h4>
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
                              <ArTxLink txid={h} label={shorten(h)} />
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
