import React from 'react';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import TxidLink, { shortTx } from './TxidLink';

interface CurrentAntBarProps {
  name: string;
  expiryTs: number;
  processId: string;
  controllers: string[];
  owner: string;
  ttlSeconds: number;
  onBack: () => void;
  logoTxId: string;
  records: Record<string, any>;
  targetId: string;
  undernameLimit?: number;
  expiryDate: Date;
  leaseDuration: string;
}

function ellip(s?: string, keep = 4) {
  if (!s) return '—';
  return s.slice(0, keep);
}

export default function CurrentAntBar({
  name,
  expiryTs,
  leaseDuration,
  processId,
  controllers,
  owner,
  ttlSeconds,
  onBack,
  logoTxId,
  records,
  targetId,
  undernameLimit,
  expiryDate,
}: CurrentAntBarProps) {
  const fmt = (ts?: number) =>
    ts
      ? new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';

  const ctrls = controllers ?? [];

  return (
    <div className="current-ant-bar" role="region" aria-label="Current ANT summary">
      <div className="cab-aurora" aria-hidden="true" />
      <div className="cab-glass">
        <button className="back-button" onClick={onBack} aria-label="Go back">
          <AiOutlineArrowLeft size={16} />
        </button>

        <div className="cab-main">
          <div className="cab-name">
            <span className="cab-label">Name</span>
            <code className="cab-code">{name}</code>
          </div>

          <div className="cab-chips" role="list">
            <span className="chip" role="listitem">
              <span className="chip-k">Expiry</span>
              <span className="chip-v">{fmt(expiryTs) == '—' ? 'PermaBuy' : fmt(expiryTs)}</span>
            </span>

            {/* Process (clickable) */}
            <span className="chip" role="listitem">
              <span className="chip-k">Process</span>
              {processId ? (
                <a
                  className="chip-v"
                  href={`https://www.ao.link/#/entity/${processId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ellip(processId)}
                </a>
              ) : (
                <span className="chip-v">—</span>
              )}
            </span>

            {/* Owner (clickable) */}
            <span className="chip" role="listitem">
              <span className="chip-k">Owner</span>
              {owner ? (
                <a
                  className="chip-v"
                  href={`https://www.ao.link/#/entity/${owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ellip(owner, 4)}
                </a>
              ) : (
                <span className="chip-v">—</span>
              )}
            </span>

            {/* Controllers (clickable first 2, with +N if more) */}
            <span className="chip" role="listitem">
              <span className="chip-k">Controllers</span>
              <span className="chip-v">
                {ctrls.length
                  ? ctrls.slice(0, 2).map((c, idx) => (
                      <React.Fragment key={c}>
                        <a
                          href={`https://www.ao.link/#/entity/${c}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {ellip(c, 4)}
                        </a>
                        {idx < ctrls.slice(0, 2).length - 1 ? ', ' : ''}
                      </React.Fragment>
                    ))
                  : '—'}
                {ctrls.length > 2 ? ` +${ctrls.length - 2}` : ''}
              </span>
            </span>

            {/* Content Target via Wayfinder */}
            <span className="chip" role="listitem">
              <span className="chip-k">Content Target</span>
              <span className="chip-v">
                <TxidLink txid={targetId} label={shortTx(targetId)} />
              </span>
            </span>

            <span className="chip" role="listitem">
              <span className="chip-k">Undername Limit</span>
              <span className="chip-v">{undernameLimit ?? '—'}</span>
            </span>
          </div>

          <div className="cab-fade" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
