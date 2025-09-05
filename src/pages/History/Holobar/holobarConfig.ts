// src/features/holobar/holobarConfig.ts
export const HOLOBAR_MINIMAL = {
    id: 'holobar',
    version: 2,
  
    placement: 'bottom',
    heightPx: 44,
    paddingX: 16,
  
    style: {
      background:
        'linear-gradient(180deg, rgba(13,15,22,0.45), rgba(13,15,22,0.25))',
      border: 'rgba(255,255,255,0.08)',
      borderWidthPx: 1,
      borderRadiusPx: 12,
      labelColor: 'rgba(255,255,255,0.65)',
      axisColor: 'rgba(255,255,255,0.12)',
  
      tickDefaultColor: 'rgba(255,255,255,0.6)',
      tickActiveColor: 'var(--accent)',
      tickHoverColor: 'rgba(255,255,255,0.9)',
  
      backdropBlurPx: 8,
      innerShadow:
        'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.25)',
      dropShadow: '0 6px 24px rgba(0,0,0,0.28)',
    },
  
    labels: {
      show: true,
      cadence: 'auto',
      format: {
        short:  { month: 'short', day: 'numeric' },
        medium: { month: 'short', day: 'numeric', year: 'numeric' },
        long:   { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
      },
      tooltips: false,
    },
  
    ticks: {
      sizePx: 8,
      radiusPx: 4,
      gapMinPx: 6,
      weighting: 'none',
      useCssClasses: true as const,
  
      // Fallbacks (used only if CSS classes aren’t available)
      paletteByLegendKey: {
        'ant-reassign-event':      '#ff004c',
        'ant-content-change':      '#1E90FF',
        'undername-creation':      '#00CED1',
        'ant-controller-addition': '#C71585',
        'ant-buy-event':           '#FFA500',
        'ant-state-change':        '#896dd4',
        'ant-upgrade-event':       '#98dda4',
        'ant-extend-lease-event':  '#ffd000',
      } as const,
    },
  
    interactions: {
      mode: 'scrub-only',
      clickToJump: true,
      snap: 'nearest-event',
      snapThresholdPx: 14,
      tooltips: false,
      haptics: false,
      keyboard: { enabled: true, prevKey: 'ArrowLeft', nextKey: 'ArrowRight' },
      scroll: { enabled: true, stepPx: 64 },
    },
  
    behavior: {
      linkSelectionBothWays: true,
      panMainOnChange: true,
      panDurationMs: 160,
      panEasing: 'ease-out',
      zoomMainOnChange: 'keep-scale',
    },
  
    accessors: {
      getEvents: (): Array<{ txHash: string; timestamp: number; legendKey?: string }> => [],
      getEventId: (e: { txHash: string }) => e.txHash,
      getEventTime: (e: { timestamp: number }) => e.timestamp,
      getEventLegendKey: (e: { legendKey?: string }) => e.legendKey,
      onSelectEventId: (_txHash: string) => void 0,
      onExternalSelectionChange: (_txHash: string) => void 0,
    },
  
    a11y: {
      ariaLabel: 'Timeline overview',
      focusable: true,
      keyboardHelp: 'Use Left/Right to move between events.',
    },
  } as const;
  