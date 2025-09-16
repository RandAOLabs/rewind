import React from 'react';
import TxidLink, { shortTx } from '../components/TxidLink';
import { fmtDate, ellip } from '../utils/format';
import { titleizeType } from '../utils/data';
import type { TimelineEvent, ExtraItem, ExtraBox } from '../types';

const extraBoxBuilders: Record<string, (e: TimelineEvent) => ExtraBox | undefined> = {
  'ARNS Name Purchase': (e) => {
    const price = e.snapshot?.purchasePrice;
    return {
    tag: 'LEASE',
    items: [
      { label: 'Expiry',  value: fmtDate(e.snapshot?.expiryTs) == '—' ? 'PermaBuy' : fmtDate(e.snapshot?.expiryTs) },
      { label: 'Owner',   value: e.snapshot?.owner ? (
        <a
          href={`https://www.ao.link/#/entity/${e.snapshot.owner}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {shortTx(e.snapshot.owner)}
        </a>
        ) : '—',
      },
      { label: 'Purchase Price', value: e.snapshot?.purchasePrice ? e.snapshot.purchasePrice + ' ARIO' : '—' },
      { label: 'Process', value: ellip(e.snapshot?.processId) == '—' ? 'Not Yet Known' : ellip(e.snapshot?.processId)         },
    ],
  };
},

  'Extended Lease': (e) => ({
    tag: 'LEASE',
    items: [
      { label: 'New Expiry', value: fmtDate(e.snapshot?.expiryTs) == '—' ? 'PermaBuy' : fmtDate(e.snapshot?.expiryTs) },
    ],
  }),

  'Set ANT Ticker': (e) => ({
    tag: 'TICKER',
    items: [
      { label: 'New Ticker', value: String(e.snapshot?.ticker ?? '—') },
    ],
  }),

  'Set ANT Description': (e) => ({
    tag: 'DESCRIPTION',
    items: [
      { label: 'New Description', value: String(e.snapshot?.description ?? '—') },
    ],
  }),

  'Increased Undername Limit': (e) => ({
    tag: 'LIMIT',
    items: [
      { label: 'New Limit', value: String(e.snapshot?.undernameLimit ?? '—') },
    ],
  }),

  'ANT Process Change': (e) => ({
    tag: 'PROCESS',
    items: [
      { label: 'New ANT Process', value: (
        <a
          href={`https://www.ao.link/#/entity/${e.snapshot!.processId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {shortTx(e.snapshot!.processId!)}
        </a>
      )
     },
    ],
  }),

  'State Notice': (e) => ({
    tag: 'STATE',
    items: [
      {
        label: 'Process',
        value: e.snapshot?.processId ? (
          <a
            href={`https://www.ao.link/#/entity/${e.snapshot.processId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {shortTx(e.snapshot.processId)}
          </a>
        ) : '—',
      },
      {
        label: 'Target',
        value: e.snapshot?.targetId ? (
          <TxidLink txid={e.snapshot.targetId} />
        ) : '—',
      },
    ],
  }),

  'Set Record Content': (e) => {
    const sub = e.snapshot?.subDomain || '—';
    const tx  = sub !== '—' ? e.snapshot?.contentHashes?.[sub] : undefined;

    return {
      tag: 'CONTENT',
      items: [
        { label: 'Sub Domain', value: sub === '@' ? 'Root (@)' : sub },
        {
          label: 'Content Hash',
          value: tx ? <TxidLink txid={tx} /> : '—',
        },
      ],
    };
  },

  'Permanent ARNS Name Purchase': (e) => ({
    tag: 'UPGRADE',
    items: [
      { label: 'Purchase Price', value: e.snapshot?.purchasePrice ? e.snapshot.purchasePrice + ' ARIO' : '—' },
    ],
  }),

  'Updated Mainpage Contents': (e) => {
    const tx = e.snapshot?.contentHashes?.['@'];
    return {
      tag: 'UPDATE',
      items: [
        { label: 'Content Hash', value: tx ? <TxidLink txid={tx} /> : '—' },
      ],
    };
  },

  'Ownership Transfer': (e) => ({
    tag: 'TRANSFER',
    items: [
      { label: 'New Owner', value: (
        <a
          href={`https://www.ao.link/#/entity/${e.snapshot?.owner}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {shortTx(e.snapshot?.owner)}
        </a>
      ) },
    ],
  }),

  // Initial Mainnet State (conditional fields only)
  'Initial Mainnet State': (e) => {
    const items: ExtraItem[] = [];
    const desc = titleizeType(e.snapshot?.description);
    const start = e.snapshot?.startTime ?? 0;
    const end   = e.snapshot?.expiryTs ?? 0;
    const limit = e.snapshot?.undernameLimit ?? 0;
    const pid   = e.snapshot?.processId;
    const price = e.snapshot?.purchasePrice;

    if (desc) items.push({ label: 'Type', value: desc });
    if (start && start !== 0) items.push({ label: 'Start', value: fmtDate(start) });
    if (end && end !== 0) items.push({ label: 'End', value: fmtDate(end) });
    if (limit && Number(limit) !== 0) items.push({ label: 'Undername Limit', value: String(limit) });
    if (pid) {
      items.push({
        label: 'Process',
        value: (
          <a
            href={`https://www.ao.link/#/entity/${pid}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {shortTx(pid)}
          </a>
        )
      });
    }
    if (price && Number(price) > 0) items.push({ label: 'Purchase Price', value: price + ' ARIO' });

    return { tag: 'INITIAL', items };
  },

  // Fallback for anything unhandled:
  'default': (e) => ({
    tag: 'INFO',
    items: [
      { label: 'Tx', value: <TxidLink txid={e.txHash} /> },
      { label: 'When', value: fmtDate((e.timestamp ?? 0) * 1000) },
    ],
  }),
};

export function buildExtraBox(e: TimelineEvent): ExtraBox | undefined {
  const fn = extraBoxBuilders[e.action] ?? extraBoxBuilders['default'];
  return fn?.(e);
}
