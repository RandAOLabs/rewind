import type { RewindEventKind } from '../../../services/arns';

/**
 * Maps an event kind to its card title and legend class.
 *
 * Previously this switched on `ao-js-sdk` class names via `SomeEvent.name`,
 * which broke under minification (class names are mangled) and coupled the UI to
 * a third-party package. Kinds are plain strings and survive the build.
 */

const ACTION_LABELS: Record<RewindEventKind, string> = {
  'buy-name': 'ArNS Name Purchase',
  'returned-name': 'Returned ANT Name',
  'extend-lease': 'Extended Lease',
  'increase-undername': 'Increased Undername Limit',
  'upgrade-name': 'Permanent ArNS Name Purchase',
  'reassign-name': 'ANT Process Change',
  'set-record': 'Set Record Content',
  'remove-record': 'Removed Record',
  'set-name': 'Set ANT Name',
  'set-ticker': 'Set ANT Ticker',
  'set-description': 'Set ANT Description',
  'set-keywords': 'Set ANT Keywords',
  'set-logo': 'Set ANT Logo',
  'set-controller': 'Added Controller',
  'remove-controller': 'Removed Controller',
  'state-notice': 'State Notice',
  'credit-notice': 'Ownership Transfer',
  'debit-notice': 'Debit Notice',
  unknown: 'Unknown Event',
};

const LEGEND_KEYS: Record<RewindEventKind, string> = {
  'buy-name': 'ant-buy-event',
  'returned-name': 'ant-return-event',
  'extend-lease': 'ant-extend-lease-event',
  'increase-undername': 'undername-creation',
  'upgrade-name': 'ant-upgrade-event',
  'reassign-name': 'ant-reassign-event',
  'set-record': 'ant-content-change',
  'remove-record': 'ant-content-change',
  'set-name': 'ant-name-set',
  'set-ticker': 'ant-ticker-set',
  'set-description': 'ant-description-set',
  'set-keywords': 'ant-description-set',
  'set-logo': 'ant-description-set',
  'set-controller': 'ant-controller-change',
  'remove-controller': 'ant-controller-change',
  'state-notice': 'ant-state-change',
  'credit-notice': 'ant-ownership-transfer',
  'debit-notice': 'ant-debit-notice',
  unknown: 'multiple-changes',
};

export function kindToAction(kind: RewindEventKind): string {
  return ACTION_LABELS[kind] ?? ACTION_LABELS.unknown;
}

export function kindToLegend(kind: RewindEventKind): string {
  return LEGEND_KEYS[kind] ?? LEGEND_KEYS.unknown;
}

/** @deprecated Retained so older call sites keep compiling. */
export const classToAction = kindToAction;
/** @deprecated Retained so older call sites keep compiling. */
export const classToLegend = kindToLegend;
