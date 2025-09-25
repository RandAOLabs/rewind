import React, { useId, useMemo, useState } from 'react';
import TxidLink, { shortTx } from './TxidLink';

interface CurrentAntBarProps {
  name: string;
  expiryTs: number;
  processId: string;
  controllers: string[];
  owner: string;
  ttlSeconds: number;
  onBack: () => void;           // kept for API compatibility (not rendered here)
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

function fmtDate(ts?: number) {
  return ts
    ? new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';
}

export default function CurrentAntBar({
  name,
  expiryTs,
  leaseDuration,
  processId,
  controllers,
  owner,
  ttlSeconds,              // available for future display; leaving out of the chip row to avoid crowding
  onBack,                  // eslint-disable-line @typescript-eslint/no-unused-vars
  logoTxId,                // available; not shown in bar
  records,                 // available; not shown in bar
  targetId,
  undernameLimit,
  expiryDate,              // available; we show expiryTs already
}: CurrentAntBarProps) {
  const [open, setOpen] = useState(false);
  const ctrls = controllers ?? [];

  // stable ids for a11y
  const panelId = useId();
  const btnLabel = useMemo(() => `Expand current information for ${name}`, [name]);

  // ===== FULL BAR (desktop / normal screens) =====
  // Visible by default; hidden via CSS on small/odd screens.
  const FullBar = (
    <div className="current-ant-bar" role="region" aria-label="Current ANT summary">
      <div className="cab-aurora" aria-hidden="true" />
      <div className="cab-glass">
        <div className="cab-main" aria-hidden={false}>
          <div className="cab-name">
            <span className="cab-label">Name</span>
            <code className="cab-code">{name}</code>
          </div>

          <div className="cab-chips" role="list">
            <span className="chip" role="listitem">
              <span className="chip-k">Expiry</span>
              <span className="chip-v">{fmtDate(expiryTs) === '—' ? 'PermaBuy' : fmtDate(expiryTs)}</span>
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

  // ===== COMPACT VARIANT (small/odd screens) =====
  // CSS shows this only when the media queries hide the full bar.
  const Compact = (
    <div className="cab-compact-anchor" role="region" aria-label="Current ANT information (compact)">
      <button
        type="button"
        className="cab-compact-btn"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(v => !v)}
      >
        {/* Keep label concise; name is in the panel too */}
        <span>Current info</span>
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="cab-compact-panel" id={panelId}>
          <div className="cab-compact-row">
            <span className="cab-compact-k">Name</span>
            <span className="cab-compact-v">{name}</span>
          </div>

          <div className="cab-compact-row">
            <span className="cab-compact-k">Expiry</span>
            <span className="cab-compact-v">
              {fmtDate(expiryTs) === '—' ? 'PermaBuy' : fmtDate(expiryTs)}
              {leaseDuration ? ` · ${leaseDuration}` : ''}
            </span>
          </div>

          <div className="cab-compact-row">
            <span className="cab-compact-k">Process</span>
            <span className="cab-compact-v">
              {processId ? (
                <a
                  className="link"
                  href={`https://www.ao.link/#/entity/${processId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ellip(processId)}
                </a>
              ) : '—'}
            </span>
          </div>

          <div className="cab-compact-row">
            <span className="cab-compact-k">Owner</span>
            <span className="cab-compact-v">
              {owner ? (
                <a
                  className="link"
                  href={`https://www.ao.link/#/entity/${owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ellip(owner, 4)}
                </a>
              ) : '—'}
            </span>
          </div>

          <div className="cab-compact-row">
            <span className="cab-compact-k">Controllers</span>
            <span className="cab-compact-v">
              {ctrls.length ? (
                <>
                  {ctrls.slice(0, 2).map((c, i) => (
                    <React.Fragment key={`${c}-${i}`}>
                      <a
                        className="link"
                        href={`https://www.ao.link/#/entity/${c}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {ellip(c, 4)}
                      </a>
                      {i < Math.min(ctrls.length, 2) - 1 ? ', ' : ''}
                    </React.Fragment>
                  ))}
                  {ctrls.length > 2 ? ` +${ctrls.length - 2}` : ''}
                </>
              ) : '—'}
            </span>
          </div>

          <div className="cab-compact-row">
            <span className="cab-compact-k">Content Target</span>
            <span className="cab-compact-v">
              <TxidLink txid={targetId} label={shortTx(targetId)} />
            </span>
          </div>

          <div className="cab-compact-row">
            <span className="cab-compact-k">Undername Limit</span>
            <span className="cab-compact-v">{undernameLimit ?? '—'}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {FullBar}
      {Compact}
    </>
  );
}
