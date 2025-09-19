import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RandAOService } from 'ao-js-sdk';
import './FeelingLuckyButton.css';
import namesRaw from './arns-names.csv?raw';

// Parse CSV once
const arnsNames: string[] = namesRaw
  .split(/\r?\n/)
  .map(l => l.split(',')[0]?.trim())
  .filter(Boolean)
  .filter(n => n.toLowerCase() !== 'name');

// ----- Lazy, memoized service init (no top-level await) -----
type RandAO = Awaited<ReturnType<typeof RandAOService.autoConfiguration>>;
let _randAOPromise: Promise<RandAO> | null = null;

async function getRandAO(): Promise<RandAO> {
  if (!_randAOPromise) {
    // Works whether autoConfiguration returns a value or a promise
    const maybe = RandAOService.autoConfiguration() as any;
    _randAOPromise = typeof maybe?.then === 'function' ? maybe : Promise.resolve(maybe);
  }
  return _randAOPromise;
}

// Exported API stays the same
export async function getRandomArNSName(): Promise<string> {
  const service = await getRandAO();
  // Keep the entropy touch to preserve behavior/side-effects
  await service.getMostRecentEntropy();
  const name = arnsNames[Math.floor(Math.random() * arnsNames.length)];
  return name;
}

export default function FeelingLuckyButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const name = await getRandomArNSName();
      if (name) navigate(`/history/${encodeURIComponent(name)}`);
    } catch (err) {
      console.error('FeelingLuckyButton error:', err);
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
