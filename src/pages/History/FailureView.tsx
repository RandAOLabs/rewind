// src/pages/History/FailureView.tsx
import React, { useState } from 'react';
import type { AppError } from '../../errors/appError';

type FailureViewProps = {
  title?: string;
  /** Prefer passing error to get code-specific messages */
  error?: AppError | null;
  /** Fallback string if you don’t have a typed error yet */
  message?: string;
  /** Optional diagnostic context to show in details (small JSON) */
  context?: Record<string, unknown>;
  /** Optional ring-buffer logs (strings) */
  logs?: string[];
  onRetry?: () => void;
  onHome?: () => void;
};

export default function FailureView({
  title,
  error,
  message,
  context,
  logs,
  onRetry,
  onHome,
}: FailureViewProps) {
  const [showDetails, setShowDetails] = useState(false);

  const niceTitle =
    title ??
    (error
      ? ({
          OFFLINE: 'You’re offline',
          TIMEOUT: 'Request timed out',
          RATE_LIMIT: 'Rate limit reached',
          NOT_FOUND: 'Not found',
          GATEWAY: 'Service unavailable',
          PARSING: 'Data parsing error',
          CANCELED: 'Request canceled',
          UNKNOWN: 'Something went wrong',
        } as const)[error.code]
      : 'Something went wrong');

  const niceMessage =
    message ??
    (error
      ? error.message
      : 'An unexpected error occurred. Please try again.');

  const hint = error?.hint;

  const diagnostics = {
    code: error?.code,
    where: error?.where,
    retryAfterMs: error?.retryAfterMs,
    context: context ?? {},
    // Only include the *message* from cause to avoid massive dumps
    causeMessage: String((error as any)?.cause?.message ?? ''),
  };

  const allLogs = logs && logs.length ? logs : undefined;

  const copyDiagnostics = async () => {
    const payload = {
      title: niceTitle,
      message: niceMessage,
      ...diagnostics,
      logs: allLogs,
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  };

  return (
    <div className="failure-view">
      <div className="failure-card">
        <div className="failure-header">
          <h2>{niceTitle}</h2>
          {error?.code && <span className="failure-chip">{error.code}</span>}
        </div>

        <p className="failure-message">{niceMessage}</p>
        {hint && <p className="failure-hint">{hint}</p>}

        <div className="failure-actions">
          {onRetry && (
            <button className="primary" onClick={onRetry}>
              Retry
            </button>
          )}
          {onHome && (
            <button className="ghost" onClick={onHome}>
              Go Home
            </button>
          )}
          <button className="ghost" onClick={() => setShowDetails(v => !v)}>
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
          <button className="ghost" onClick={copyDiagnostics}>
            Copy diagnostics
          </button>
        </div>

        {showDetails && (
          <div className="failure-details">
            <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
            {allLogs && allLogs.length > 0 && (
              <>
                <h4 style={{ marginTop: 12 }}>Recent logs</h4>
                <div className="failure-logs">
                  {allLogs.map((l, i) => (
                    <div key={i} className="log-line">
                      {l}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
