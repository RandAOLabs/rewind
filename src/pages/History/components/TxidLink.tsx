import React, { useEffect, useState } from 'react';
// NOTE: from this nested folder, the relative path to wayfinder goes up 3 levels
import { arTxidToHttps } from '../../../wayfinder';

export function shortTx(id?: string, head = 5, tail = 5) {
  if (!id) return '—';
  return id.length <= head + tail + 1 ? id : `${id.slice(0, head)}…${id.slice(-tail)}`;
}

export default function TxidLink({ txid, label }: { txid?: string; label?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (txid) {
      arTxidToHttps(txid).then(u => { if (alive) setUrl(u); });
    } else {
      setUrl(null);
    }
    return () => { alive = false; };
  }, [txid]);

  if (!txid) return <span>—</span>;
  const text = label ?? shortTx(txid);
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer">{text}</a>
  ) : (
    <span>{text}</span>
  );
}
