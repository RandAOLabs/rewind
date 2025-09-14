import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RandAOService } from 'ao-js-sdk';
import './FeelingLuckyButton.css';
import namesRaw from './arns-names.csv?raw';

const arnsNames: string[] = namesRaw
  .split(/\r?\n/)                       // lines
  .map(l => l.split(',')[0]?.trim())    // first column
  .filter(Boolean)                      // drop empty
  .filter(n => n.toLowerCase() !== 'name'); // optional: skip header "name"

const service = await RandAOService.autoConfiguration();


export const getRandomARNSName = async () => {
  const entropy = await service.getMostRecentEntropy();
  const name = arnsNames[Math.floor(Math.random() * arnsNames.length)];
  return name;
}

export function FeelingLuckyButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const name = await getRandomARNSName();
      
      if (name) navigate(`/history/${encodeURIComponent(name)}`);
    } catch (err) {
      console.error('FeelingLuckyButton error:', err);
      // no UI tweaks per "no cosmetic change" rule
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="feeling-lucky"
      onClick={onClick}
      disabled={loading}
      aria-label="I'm Feeling Lucky"
      aria-busy={loading}
    >
      <span className="feeling-lucky__label">{loading ? '…' : "I'm Feeling Lucky"}</span>
      <span className="feeling-lucky__wash" aria-hidden="true" />
    </button>
  );
}
