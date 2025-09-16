import React from 'react';

interface LegendProps {
  activeLegend: Set<string>;
  onToggle: (key: string) => void;
  onReset: () => void;
}

const ITEMS: Array<{ key: string; label: string }> = [
  { key: 'ant-buy-event',           label: 'ARNS Name Purchase' },
  { key: 'ant-reassign-event',      label: 'ANT Process Change' },
  { key: 'ant-name-set',            label: 'ANT Name Set' },
  { key: 'ant-description-set',     label: 'ANT Description Set' },
  { key: 'ant-ticker-set',          label: 'ANT Ticker Set' },
  { key: 'ant-upgrade-event',       label: 'Permanent ARNS Name Purchase' },
  { key: 'ant-content-change',      label: 'Content Change' },
  { key: 'undername-creation',      label: 'Increased Undername Limit' },
  { key: 'ant-controller-addition', label: 'Controller Addition' },
  { key: 'ant-extend-lease-event',  label: 'Extend Lease' },
  { key: 'ant-ownership-transfer',  label: 'Ownership Transfer' },
];

export default function Legend({ activeLegend, onToggle, onReset }: LegendProps) {
  const canReset = activeLegend.size > 0;

  return (
    <div className="legend">
      <h4>Legend</h4>
      <div className="legend-section">
        <div className="legend-title">Event Legend:</div>

        {ITEMS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`legend-item-btn ${activeLegend.has(key) ? 'active' : ''}`}
            onClick={() => onToggle(key)}
            aria-pressed={activeLegend.has(key)}
          >
            <span className={`legend-swatch ${key}`} />
            <span className="legend-label">{label}</span>
          </button>
        ))}

        <div className="legend-actions">
          <button
            type="button"
            className="legend-reset"
            onClick={onReset}
            disabled={!canReset}
            aria-disabled={!canReset}
            title={canReset ? 'Show all categories' : 'All categories are already shown'}
          >
            Show All
          </button>
        </div>
      </div>
    </div>
  );
}
