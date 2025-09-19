// src/features/holobar/Holobar.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { HOLOBAR_MINIMAL } from './holobarConfig';
import './Holobar.css';

type HoloEvent = { txHash: string; timestamp: number; legendKey?: string };

interface HolobarProps {
  events: HoloEvent[];
  selectedTxHash?: string | null;
  onSelectEventId: (txHash: string) => void;
  config?: typeof HOLOBAR_MINIMAL;
  bottomOffsetCss?: string;
}

export default function Holobar({
  events,
  selectedTxHash,
  onSelectEventId,
  config = HOLOBAR_MINIMAL,
  bottomOffsetCss = 'calc(var(--footer-height) + 10px)',
}: HolobarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrubbing, setScrubbing] = useState(false);

  const { minTs, maxTs } = useMemo(() => {
    if (!events.length) return { minTs: 0, maxTs: 1 };
    let min = events[0].timestamp, max = events[0].timestamp;
    for (let i = 1; i < events.length; i++) {
      const t = events[i].timestamp;
      if (t < min) min = t;
      if (t > max) max = t;
    }
    if (min === max) max = min + 1;
    return { minTs: min, maxTs: max };
  }, [events]);

  const xPct = (ts: number) => ((ts - minTs) / (maxTs - minTs)) * 100;

  const pickNearestByClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el || events.length === 0) return;

    const rect = el.getBoundingClientRect();
    const padX = config.paddingX ?? 16; // px padding on each side (1rem)

    // Work within the INNER width (track minus left/right pad)
    const innerWidth = Math.max(0, rect.width - padX * 2);
    const relX = Math.max(0, Math.min(innerWidth, clientX - rect.left - padX));
    const pct = innerWidth > 0 ? (relX / innerWidth) : 0;
    const ts = minTs + pct * (maxTs - minTs);

    let nearest = events[0];
    let best = Math.abs(nearest.timestamp - ts);
    for (let i = 1; i < events.length; i++) {
      const d = Math.abs(events[i].timestamp - ts);
      if (d < best) { best = d; nearest = events[i]; }
    }
    if (nearest && nearest.txHash !== selectedTxHash) onSelectEventId(nearest.txHash);
  };

  useEffect(() => {
    const up = () => setScrubbing(false);
    window.addEventListener('mouseup', up);
    window.addEventListener('mouseleave', up);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mouseleave', up);
    };
  }, []);

  const styleContainer: React.CSSProperties = {
    position: 'absolute',
    left: `${config.paddingX}px`,
    right: `${config.paddingX}px`,
    bottom: bottomOffsetCss,
    height: `${config.heightPx}px`,
    zIndex: 10_000,
  };

  const styleTrack: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    background: config.style.background,
    border: `${config.style.borderWidthPx}px solid ${config.style.border}`,
    borderRadius: `${config.style.borderRadiusPx}px`,
    boxSizing: 'border-box',
    backdropFilter: `blur(${config.style.backdropBlurPx}px)`,
    WebkitBackdropFilter: `blur(${config.style.backdropBlurPx}px)`,
    boxShadow: `${config.style.innerShadow}, ${config.style.dropShadow}`,
  };

  // Inner content area inset by paddingX so first/last ticks have a gutter
  const styleInner: React.CSSProperties = {
    position: 'absolute',
    left: config.paddingX ?? 16,
    right: config.paddingX ?? 16,
    top: 0,
    bottom: 0,
  };

  const styleAxis: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    transform: 'translateY(-50%)',
    background: config.style.axisColor,
  };

  const styleLabelRow: React.CSSProperties = {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 0,
    fontSize: 11,
    letterSpacing: 0.2,
    color: config.style.labelColor,
    display: config.labels.show ? 'flex' : 'none',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  };

  const leftLabel = useMemo(() => {
    const d = new Date(minTs * (minTs > 2_000_000_000 ? 1 : 1000));
    return d.toLocaleDateString(undefined, config.labels.format.short as any);
  }, [minTs, config.labels.format.short]);

  const rightLabel = useMemo(() => {
    const d = new Date(maxTs * (maxTs > 2_000_000_000 ? 1 : 1000));
    return d.toLocaleDateString(undefined, config.labels.format.short as any);
  }, [maxTs, config.labels.format.short]);

  // === New: selected marker (vertical line + date chip) ===
  const selectedEvent = useMemo(
    () => events.find(e => e.txHash === selectedTxHash) || null,
    [events, selectedTxHash]
  );

  const selectedLeft = selectedEvent ? `${xPct(selectedEvent.timestamp)}%` : null;

  const selectedDateLabel = useMemo(() => {
    if (!selectedEvent) return '';
    const ts = selectedEvent.timestamp;
    const date = new Date(ts * (ts > 2_000_000_000 ? 1 : 1000));
    // Use short format if present, otherwise a simple readable fallback
    const fmt =
      (config.labels?.format as any)?.short ??
      ({ year: 'numeric', month: 'short', day: 'numeric' } as const);
    return date.toLocaleDateString(undefined, fmt as any);
  }, [selectedEvent, config.labels]);

  return (
    <div style={styleContainer} aria-label={config.a11y.ariaLabel}>
      <div
        ref={trackRef}
        style={styleTrack}
        className="holo-track"
        role="slider"
        aria-valuemin={minTs}
        aria-valuemax={maxTs}
        aria-valuenow={
          selectedTxHash ? events.findIndex(e => e.txHash === selectedTxHash) : 0
        }
        onMouseDown={(e) => { setScrubbing(true); pickNearestByClientX(e.clientX); }}
        onMouseMove={(e) => { if (scrubbing) pickNearestByClientX(e.clientX); }}
      >
        {/* Inner padded content area (ticks + axis + labels + cursor) */}
        <div style={styleInner} className="holo-inner">
          <div style={styleAxis} />

          {/* Ticks */}
          {events.map((e) => {
            const left = `${xPct(e.timestamp)}%`;
            const active = e.txHash === selectedTxHash;

            // Prefer CSS class coloring; fall back to palette if needed
            const fallbackColor =
              (config.ticks.paletteByLegendKey as any)?.[e.legendKey ?? ''] ??
              config.style.tickDefaultColor;

            const styleTick: React.CSSProperties = !config.ticks.useCssClasses
              ? {
                  background: active
                    ? config.style.tickActiveColor
                    : fallbackColor,
                }
              : { background: active ? 'currentColor' : undefined };

            return (
              <button
                key={e.txHash}
                className={`holo-tick ${e.legendKey ?? ''} ${active ? 'active' : ''}`}
                style={{
                  left,
                  width: config.ticks.sizePx,
                  height: config.ticks.sizePx,
                  borderRadius: config.ticks.radiusPx,
                  ...styleTick,
                }}
                aria-label={`Jump to event at ${new Date(
                  e.timestamp * (e.timestamp > 2_000_000_000 ? 1 : 1000)
                ).toISOString()}`}
                onClick={() => {
                  if (e.txHash !== selectedTxHash) onSelectEventId(e.txHash);
                }}
              />
            );
          })}

          {/* Labels at ends */}
          <div style={styleLabelRow} className="holo-labels">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </div>

          {/* === Selected cursor (line + floating date) === */}
          {selectedEvent && selectedLeft && (
            <div
              className="holo-cursor"
              style={{
                left: selectedLeft,
                // style from CSS handles the rest; keep this minimal + align to inner padding
              }}
              aria-hidden="true"
            >
              <div className="holo-cursor-line" />
              <div className="holo-cursor-chip">{selectedDateLabel}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}