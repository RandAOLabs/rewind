import type { ReactNode } from 'react';

export type ContentHashes = Record<string, string>;

export interface AntSnapshot {
  owner: string;
  controllers: string[];
  expiryTs: number;
  ttlSeconds: number;
  processId?: string;
  targetId?: string;
  undernameLimit?: number;
  undernames: string[];
  contentHashes: ContentHashes;
  description?: string;
  ticker?: string;
  keywords?: string[];
  subDomain?: string;
  purchasePrice?: string;
  startTime?: number;
}

export const initialSnapshot: AntSnapshot = {
  owner: '',
  controllers: [],
  expiryTs: 0,
  ttlSeconds: 0,
  processId: '',
  targetId: '',
  undernameLimit: 0,
  undernames: [],
  contentHashes: {},
  description: '',
  ticker: 'ANT',
  keywords: [],
  purchasePrice: '',
  startTime: 0,
};

export type SnapshotDelta = Partial<AntSnapshot>;

export interface TimelineEvent {
  action:     string;
  actor:      string;
  legendKey:  string;
  timestamp:  number;   // seconds
  txHash:     string;
  extraBox?:  ExtraBox;
  rawEvent:   any;      // IARNSEvent; kept as any to avoid import loop
  snapshot?:  AntSnapshot;
}

export type ExtraItem = { label: string; value: ReactNode };
export type ExtraBox  = { tag: string; items: ExtraItem[] };
