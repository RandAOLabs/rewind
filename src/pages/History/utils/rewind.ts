// src/services/rewind.ts
import { ARIORewindService, type IARIORewindService } from 'ao-js-sdk';

/**
 * Lazy, one-time async init of the rewind service.
 * Subsequent calls share the same Promise.
 */
let _rewindPromise: Promise<IARIORewindService> | null = null;

export function getRewind(): Promise<IARIORewindService> {
  if (!_rewindPromise) {
    // autoConfiguration() is async in latest ao-js-sdk
    _rewindPromise = (ARIORewindService as any).autoConfiguration();
  }
  return _rewindPromise;
}
