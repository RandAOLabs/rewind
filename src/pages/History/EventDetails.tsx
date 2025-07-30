import React from 'react';
import type { TimelineEvent } from './History';
import BuyNameEventDetail from './details/BuyNameEventDetail';
import IncreaseUndernameDetail from './details/IncreaseUndernameDetail';
// → import your other detail components here

export default function EventDetails({
  uiEvent,
}: {
  uiEvent: TimelineEvent & { rawEvent: any };
}) {
  const raw = uiEvent.rawEvent;

  return (
    <div className="detailed-card">
      {(() => {
        switch (raw.constructor.name) {
          case 'BuyNameEvent':
            return <BuyNameEventDetail evt={raw} />;
          case 'IncreaseUndernameEvent':
            return <IncreaseUndernameDetail evt={raw} />;
          // …other cases…
          default:
            return <BuyNameEventDetail evt={raw} />;
            // return (
            //   <div className="event-detail-section">
            //     <h4>Unknown Event Type</h4>
            //     <p>No detailed view for <code>{raw.constructor.name}</code></p>
            //   </div>
            // );
        }
      })()}
    </div>
  );
}