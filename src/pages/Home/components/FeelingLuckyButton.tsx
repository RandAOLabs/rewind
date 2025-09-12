import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ARIORewindService } from 'ao-js-sdk';
import './FeelingLuckyButton.css';

/**
 * Compatibility shim: supports ao-js-sdk <=0.2.42 (sync autoConfiguration)
 * and >=0.2.43 (async autoConfiguration with getRandomARNSName()).
 */
async function getRewind(): Promise<{ getRandomARNSName(): Promise<string> }> {
  const maybe = (ARIORewindService as any).autoConfiguration();
  // If it returned a Promise (>=0.2.43), await it; else use value directly.
  return typeof (maybe as any)?.then === 'function' ? await maybe : (maybe as any);
}

export default function FeelingLuckyButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const rewind = await getRewind();
      const name = await rewind.getRandomARNSName();
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
