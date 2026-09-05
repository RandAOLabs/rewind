import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FeelingLuckyButton.css';
import namesRaw from './arns-names.csv?raw';

// Parse CSV once
const arnsNames: string[] = namesRaw
  .split(/\r?\n/)
  .map(l => l.split(',')[0]?.trim())
  .filter(Boolean)
  .filter(n => n.toLowerCase() !== 'name');

/**
 * Pick a name from the bundled list.
 *
 * This used to await RandAO's entropy process first, but the name was always
 * chosen with `Math.random()` from the local CSV regardless — the network call
 * changed nothing about the result. When that process went offline the await
 * never settled, which is why the home page sat on "Random names loading…"
 * forever.
 */
export async function getRandomArNSName(): Promise<string> {
  return arnsNames[Math.floor(Math.random() * arnsNames.length)];
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
