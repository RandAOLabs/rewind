// src/errors/appError.ts
export type AppErrorCode =
  | 'OFFLINE'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'NOT_FOUND'
  | 'GATEWAY'
  | 'PARSING'
  | 'CANCELED'
  | 'UNKNOWN';

export type ErrorWhere = 'ant' | 'history' | 'bootstrap';

export interface AppError {
  code: AppErrorCode;
  message: string;
  hint?: string;
  where?: ErrorWhere;
  retryAfterMs?: number;
  cause?: unknown;        // preserve raw error for devs
}

export function classifyError(err: any, where: ErrorWhere): AppError {
  const msg = String(err?.message ?? err ?? 'Unknown error');

  // If a fetch/axios-like error is available:
  const status = err?.response?.status as number | undefined;
  const code   = (err?.code || err?.name) as string | undefined;

  if (typeof navigator !== 'undefined' && navigator && !navigator.onLine) {
    return { code: 'OFFLINE', message: 'You appear to be offline.', hint: 'Reconnect to the internet and retry.', where, cause: err };
  }

  if (code === 'ECONNABORTED' || /timeout/i.test(msg)) {
    return { code: 'TIMEOUT', message: 'The request timed out.', hint: 'Retry in a few seconds.', where, cause: err };
  }

  if (status === 429) {
    const ra = Number(err?.response?.headers?.['retry-after']) * 1000 || undefined;
    return { code: 'RATE_LIMIT', message: 'Too many requests.', hint: 'Please wait a moment and try again.', where, retryAfterMs: ra, cause: err };
  }

  if (status === 404 || /not\s*found/i.test(msg)) {
    return { code: 'NOT_FOUND', message: 'Resource not found.', hint: 'Double-check the name/ID and try again.', where, cause: err };
  }

  if (status && status >= 500) {
    return { code: 'GATEWAY', message: 'Upstream gateway error.', hint: 'Service might be temporarily unavailable.', where, cause: err };
  }

  if (/abort/i.test(msg) || code === 'AbortError') {
    return { code: 'CANCELED', message: 'Request was canceled.', hint: 'Try the action again.', where, cause: err };
  }

  if (/parse|json|codec|schema/i.test(msg)) {
    return { code: 'PARSING', message: 'We had trouble parsing the response.', hint: 'Retry; if it persists, report this.', where, cause: err };
  }

  return { code: 'UNKNOWN', message: msg || 'Unknown error', where, cause: err };
}