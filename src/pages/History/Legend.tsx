import React from 'react';

interface LegendProps {
  activeLegend: Set<string>;
  onToggle: (key: string) => void;
  onReset: () => void;
}

const ITEMS: Array<{ key: string; label: string }> = [
  { key: 'ant-buy-event',           label: 'ANT Purchase' },
  { key: 'ant-reassign-event',      label: 'ANT Process Change' },
  { key: 'ant-upgrade-event',       label: 'Permanent ANT Purchase' },
  { key: 'ant-content-change',      label: 'Content Change' },
  { key: 'undername-creation',      label: 'Increased Undername Limit' },
  { key: 'ant-controller-addition', label: 'Controller Addition' },
  { key: 'ant-extend-lease-event',  label: 'Extend Lease' },
  { key: 'ant-ownership-transfer',  label: 'Ownership Transfer' },
  // { key: 'initial-mainnet-state',   label: 'Initial State' },
];

export default function Legend({ activeLegend, onToggle, onReset }: LegendProps) {
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
          <button type="button" className="legend-reset" onClick={onReset}>
            Show All
          </button>
        </div>
      </div>
    </div>
  );
}
