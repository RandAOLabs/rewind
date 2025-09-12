// src/pages/History/History.tsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import FailureView from './FailureView';
import { useParams, useNavigate } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import Holobar from './components/Holobar/Holobar';
import Legend from './Legend';

import {
  ARIORewindService,
  IARNSEvent,
  ARNameDetail,
} from 'ao-js-sdk';

import { EMPTY, firstValueFrom, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import './History.css';
import EventDetails from './EventDetails';

// Extracted components & mappings
import LoadingScreen from './components/LoadingScreen';
import CurrentAntBar from './components/CurrentAntBar';
import { classToAction, classToLegend } from './data/eventMappings';

// Extracted types, data helpers, and computeDelta$
import { AntSnapshot, TimelineEvent, initialSnapshot } from './types';
import { applyDelta, toEpochSeconds, firstDefined } from './utils/data';
import { buildExtraBox } from './data/extraBoxBuilders';
import { computeDelta$ } from './data/computeDelta';

export default function History() {
  const { arnsname = '' } = useParams<{ arnsname: string }>();
  const navigate = useNavigate();

  const [retryToken, setRetryToken] = useState(0);
  const doRetry = () => setRetryToken(t => t + 1);

  const [events, setEvents]       = useState<TimelineEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // snapshots aligned 1:1 with events as they are built globally
  const [snapshots, setSnapshots] = useState<AntSnapshot[]>([]);

  // selection state
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // ANT detail state
  const [antDetail, setAntDetail]     = useState<ARNameDetail | null>(null);
  const [antLoading, setAntLoading]   = useState(true);
  const [antError, setAntError]       = useState<string | null>(null);

  // holobar cursor focus (kept in sync with both card clicks and holobar scrubs)
  const [holoFocusTx, setHoloFocusTx] = useState<string | null>(null);

  // NEW: cache initial mainnet state once (normalize name to avoid misses)
  const [initialMainnetState, setInitialMainnetState] = useState<any | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const service = await ARIORewindService.autoConfiguration();
        const canonical = arnsname.trim().toLowerCase();
        const ims = service.getMainnetInitialState
          ? service.getMainnetInitialState(canonical)
        : undefined;
      setInitialMainnetState(ims ?? null);
      console.log('[History] Initial Mainnet State:', ims ?? 'none');
    } catch (e) {
      console.warn('[History] getMainnetInitialState failed:', e);
      setInitialMainnetState(null);
    }
  })(), [arnsname]});

  // Refs for pan/zoom and each card
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const cardRefs     = useRef<Record<string, HTMLDivElement | null>>({});

  // helper: pan/zoom to a card by tx without opening details
  const focusByTxHash = (tx: string) => {
    setHoloFocusTx(tx);
    const node = cardRefs.current[tx];
    if (node && transformRef.current) {
      transformRef.current.zoomToElement(node, 300); // navigate only
    }
  };

  // onClick toggles selection; attach snapshot by current index
  const onCardClick = (evt: TimelineEvent) => {
    setHoloFocusTx(evt.txHash);
    if (selectedEvent?.txHash === evt.txHash) {
      setSelectedEvent(null);
      return;
    }
    const idx = events.findIndex(e => e.txHash === evt.txHash);
    const snap = idx >= 0 ? snapshots[idx] : undefined;
    // console.groupCollapsed(`[Select] ${evt.action} ${evt.txHash}`);
    // console.log('index', idx, 'snapshot', snap);
    // console.groupEnd();
    setSelectedEvent(snap ? { ...evt, snapshot: snap } : evt);
  };

  // keep holobar cursor synced
  useEffect(() => {
    if (selectedEvent?.txHash) setHoloFocusTx(selectedEvent.txHash);
  }, [selectedEvent?.txHash]);

  // fetch ANT detail
  useEffect(() => {
    (async () => {
      setAntLoading(true);
      setAntError(null);

      const service = await ARIORewindService.autoConfiguration();
      service
        .getAntDetail(arnsname)
      .then(detail => setAntDetail(detail))
      .catch(err => setAntError(err.message || 'Failed to load ANT details'))
      .finally(() => setAntLoading(false));
    })();
  }, [arnsname, retryToken]);

  // Chronological, deterministic rebuild
  useEffect(() => {
    let cancelled = false;
    let sub: Subscription | null = null;
  
    (async () => {
      try {
        // reset UI state
        setEvents([]);
        setSnapshots([]);
        setLoading(true);
        setError(null);
        setSelectedEvent(null);
  
        type Item = { e: IARNSEvent; ts: number; tx: string; ord: number };
        const byTx = new Map<string, Item>();
        let ordCounter = 0;
        let rebuildPass = 0;
  
        const service = await ARIORewindService.autoConfiguration();
        if (cancelled) return;
  
        sub = service
          .getEventHistory$(arnsname)
          .pipe(
            catchError((err: unknown) => {
              if (!cancelled) setError((err as any)?.message ?? 'Failed to load history');
              return EMPTY;
            })
          )
          .subscribe({
            next: async (raw: IARNSEvent[]) => {
              // build batch with safe awaits
              const batch = await Promise.all(
                (raw ?? []).map(async (e, idx) => {
                  const tsAny = await Promise.resolve((e as any).getEventTimeStamp?.());
                  const tsNum = typeof tsAny === 'number' ? tsAny : Number(tsAny ?? 0);
                  const ts = Number.isFinite(tsNum) ? tsNum : 0;
  
                  const txRaw = await Promise.resolve(e.getEventMessageId?.());
                  const tx = String(txRaw ?? `fallback:${ts}:${idx}`);
  
                  return { e, ts, tx };
                })
              );
  
              // dedupe/merge by tx
              for (const { e, ts, tx } of batch) {
                if (!byTx.has(tx)) {
                  byTx.set(tx, { e, ts, tx, ord: ordCounter++ });
                } else {
                  const cur = byTx.get(tx)!;
                  if (cur.ts === 0 && ts > 0) cur.ts = ts;
                  cur.e = e;
                }
              }
  
              const all = Array.from(byTx.values()).sort((a, b) => {
                const at = a.ts || 0, bt = b.ts || 0;
                return at !== bt ? at - bt : a.ord - b.ord;
              });
  
              let snap = initialSnapshot;
              const ui: TimelineEvent[] = [];
              const snaps: AntSnapshot[] = [];
  
              for (const { e, ts, tx } of all) {
                const [actor, delta] = await Promise.all([
                  Promise.resolve(e.getInitiator?.()),
                  firstValueFrom(computeDelta$(e)),
                ]);
  
                const before = snap;
                const after = applyDelta(snap, delta);
                void before; // keep if you log; otherwise silence TS
  
                snap = after;
  
                const cls = e.constructor?.name ?? 'Unknown';
                const action = classToAction(cls);
                const legendKey = classToLegend(cls);
  
                const uiEvt: TimelineEvent = {
                  action,
                  actor: actor ?? '',
                  legendKey,
                  timestamp: ts ?? 0,
                  txHash: tx,
                  rawEvent: e,
                  snapshot: snap,
                };
                uiEvt.extraBox = buildExtraBox(uiEvt);
  
                ui.push(uiEvt);
                snaps.push(snap);
              }
  
              // Inject Initial Mainnet State (if present)
              try {
                const ims = initialMainnetState;
                if (ims) {
                  const [
                    processId,
                    purchasePriceCA,
                    type,
                    startTime,
                    endTime,
                    undernameLimit,
                  ] = await Promise.all([
                    Promise.resolve(ims.getProcessId?.()),
                    Promise.resolve(ims.getPurchasePrice?.()),
                    Promise.resolve(ims.getType?.()),
                    Promise.resolve(ims.getStartTime?.()),
                    Promise.resolve(ims.getEndTime?.()),
                    Promise.resolve(ims.getUndernameLimit?.()),
                  ]);
  
                  const microAmt = purchasePriceCA?.amount?.();
                  const purchasePrice =
                    typeof microAmt === 'bigint'
                      ? (microAmt / 1_000_000n).toString()
                      : undefined;
  
                  const toEpochSeconds = (v: any): number => {
                    const n =
                      typeof v === 'number'
                        ? v
                        : typeof v === 'bigint'
                        ? Number(v)
                        : Number(v ?? 0);
                    return Number.isFinite(n) ? n : 0;
                  };
  
                  const initialSnap: AntSnapshot = {
                    ...initialSnapshot,
                    processId: processId ?? '',
                    purchasePrice,
                    startTime: toEpochSeconds(startTime) * 1000,
                    expiryTs: toEpochSeconds(endTime) * 1000,
                    undernameLimit,
                    description: type ? String(type) : undefined,
                  };
  
                  const tsCandidate = ims.getEventTimeStamp?.();
                  const tsSec = toEpochSeconds(tsCandidate ?? startTime);
  
                  const initEvt: TimelineEvent = {
                    action: 'Initial Mainnet State',
                    actor: '',
                    legendKey: 'initial-mainnet-state',
                    timestamp: tsSec,
                    txHash: `initial:${arnsname}`,
                    rawEvent: {} as IARNSEvent,
                    snapshot: initialSnap,
                  };
                  initEvt.extraBox = buildExtraBox(initEvt);
  
                  ui.unshift(initEvt);
                  snaps.unshift(initialSnap);
                }
              } catch (e) {
                console.warn('[InitialMainnetState] failed to attach:', e);
              }
  
              rebuildPass += 1;
              void rebuildPass; // silence TS if unused
  
              if (!cancelled) {
                setEvents(ui);
                setSnapshots(snaps);
                setLoading(false);
              }
            },
            error: (err: any) => {
              if (!cancelled) {
                setError(err?.message ?? 'Failed to load history');
                setLoading(false);
              }
            },
          });
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to initialize history service');
          setLoading(false);
        }
      }
    })();
  
    return () => {
      cancelled = true;
      if (sub) sub.unsubscribe();
    };
  }, [arnsname, retryToken, initialMainnetState]);

  // After selection paints, pan/zoom to it
  useLayoutEffect(() => {
    if (!selectedEvent) return;
    const node = cardRefs.current[selectedEvent.txHash];
    if (transformRef.current && node) {
      transformRef.current.zoomToElement(node, 300);
    }
  }, [selectedEvent]);

  // Legend state
  const [activeLegend, setActiveLegend] = useState<Set<string>>(new Set());
  const toggleLegend = (k: string) => {
    setActiveLegend(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };
  const clearLegend = () => setActiveLegend(new Set());

  if (antLoading || loading) return <LoadingScreen />;

  if (!antLoading && (antError || !antDetail)) {
    return (
      <div className="history">
        <FailureView
          title="Couldn’t load ANT details"
          message={antError || 'The name may not exist, or the gateway is unavailable.'}
          onRetry={doRetry}
          onHome={() => navigate('/')}
        />
      </div>
    );
  }

  if (error || events.length < 1) {
    return (
      <div className="history">
        <FailureView
          title={error ? 'Couldn’t load history' : 'No history yet'}
          message={
            error
              ? error
              : 'We couldn’t find any events for this name. Try another name or retry.'
          }
          onRetry={doRetry}
          onHome={() => navigate('/')}
        />
      </div>
    );
  }

  const uniqueMap = new Map<string, TimelineEvent>();
  events.forEach(evt => {
    if (!uniqueMap.has(evt.txHash)) uniqueMap.set(evt.txHash, evt);
  });

  const excludedActions = [
    'Credit Notice',
    'Debit Notice',
    'Returned ANT Name',
    'RecordEvent',
    'State Notice',
    'Unknown Event'
  ];
  const baseEvents = Array.from(uniqueMap.values());

  const visibleEvents = activeLegend.size === 0
    ? baseEvents
    : baseEvents.filter(e => activeLegend.has(e.legendKey));

  const timelineEvents = visibleEvents
    .slice()
    .sort((a, b) => {
      const aInit = a.legendKey === 'initial-mainnet-state' ? 1 : 0;
      const bInit = b.legendKey === 'initial-mainnet-state' ? 1 : 0;
      if (aInit !== bInit) return bInit - aInit;
      return a.timestamp - b.timestamp;
    })
    .filter(st => !excludedActions.includes(st.action))
    .map((st, i) => {
      const isSelected = selectedEvent?.txHash === st.txHash;
      const isInitial  = st.legendKey === 'initial-mainnet-state';
      return {
        key: `${st.txHash}-${i}`,
        content: (
          <div
            className={`chain-card${!isInitial ? ' clickable' : ''}${isSelected ? ' selected' : ''}`}
            ref={el => { cardRefs.current[st.txHash] = el; }}
            onClick={!isInitial ? () => onCardClick(st) : undefined}
          >
            <div className="chain-card-header">
              <span className="action-text">{st.action}</span>
              {!isInitial && <span className="actor">Actor: {st.actor.slice(0,5)}</span>}
              <span className={`legend-square ${st.legendKey}`}></span>
            </div>
            <hr />
            <div className="chain-card-footer">
              <span className="date">
                {new Date(st.timestamp * 1000).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric'
                })}
              </span>
              {!isInitial && (
                <span className="txid">
                  <a
                    href={`https://www.ao.link/#/message/${st.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {st.txHash}
                  </a>
                </span>
              )}
            </div>

            {st.extraBox && (
              <div className="chain-card-extra">
                <span className="extra-tag">{st.extraBox.tag}</span>
                <div className="extra-items">
                  {st.extraBox.items.map((it, idx) => (
                    <div className="extra-item" key={idx}>
                      <span className="extra-key">{it.label}</span>
                      <span className="extra-sep">:</span>
                      <span className="extra-value">{it.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      };
    });

  return (
    <div className="history">
      {/* Legend */}
      <Legend
        activeLegend={activeLegend}
        onToggle={toggleLegend}
        onReset={clearLegend}
      />

      {/* Fixed ANT Bar */}
      {antDetail  && (
        <CurrentAntBar
          name={antDetail.name}
          expiryTs={antDetail.endTimestamp}
          leaseDuration={antDetail.type === 'lease'
            ? `${Math.floor(Number(antDetail.leaseDuration) / (60 * 60 * 24 * 365 * 1000))} years`
            : antDetail.type}
          processId={antDetail.processId}
          controllers={antDetail.controllers}
          owner={antDetail.owner}
          ttlSeconds={antDetail.ttlSeconds}
          logoTxId={antDetail.logoTxId}
          records={antDetail.records}
          targetId={antDetail.targetId}
          undernameLimit={antDetail.undernameLimit}
          expiryDate={antDetail.expiryDate}
          onBack={() => navigate('/')}
        />
      )}

      {/* Draggable chain */}
      <div className="chain-wrapper">
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.02}
          maxScale={2}
          wheel={{ step: 50 }}
          doubleClick={{ disabled: true }}
          limitToBounds={false}
          centerZoomedOut={false}
          centerOnInit={false}
          initialPositionX={250}
          initialPositionY={125}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="chain-controls">
                <button onClick={() => zoomIn()}>+</button>
                <button onClick={() => zoomOut()}>–</button>
                <button onClick={() => resetTransform()}>⟳</button>
              </div>
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%', position: 'relative' }}
                contentStyle={{ width: '100%', height: '100%' }}
              >
                <div className="chain-container">
                  {timelineEvents.map(ev => (
                    <div key={ev.key} className="chain-item">
                      {ev.content}
                    </div>
                  ))}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Detail pop-up */}
      {selectedEvent && (
        <div
          ref={detailRef}
          className="detailed-card"
        >
          <button
            className="close-btn"
            onClick={() => setSelectedEvent(null)}
          >
            ×
          </button>
          <EventDetails uiEvent={selectedEvent} />
        </div>
      )}

      {/* Holo nav bar */}
      <Holobar
        events={visibleEvents
          .slice()
          .sort((a, b) => {
            const ai = a.legendKey === 'initial-mainnet-state' ? 1 : 0;
            const bi = b.legendKey === 'initial-mainnet-state' ? 1 : 0;
            if (ai !== bi) return bi - ai;
            return a.timestamp - b.timestamp;
          })
          .filter(st => !excludedActions.includes(st.action))
          .map(e => ({
            txHash: e.txHash,
            timestamp: e.timestamp,
            legendKey: e.legendKey,
          }))}
        selectedTxHash={holoFocusTx}
        onSelectEventId={focusByTxHash}
      />
    </div>
  );
}
