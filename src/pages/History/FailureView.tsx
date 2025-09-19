import React from 'react';

export default function FailureView({
  title = 'Something went wrong',
  message = 'We couldn’t load this data, its possible the ANT name does not exist or has not been updated since the hyperbeam upgrade.',
  onRetry,
  onHome,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onHome?: () => void;
}) {
  return (
    <div className="failure-view">
      <div className="failure-card">
        <h2>{title}</h2>
        <p className="failure-msg">{message}</p>
        <div className="failure-actions">
          {onRetry && <button onClick={onRetry}>Retry</button>}
          {onHome &&  <button onClick={onHome} className="ghost">Go Home</button>}
        </div>
      </div>
    </div>
  );
}
