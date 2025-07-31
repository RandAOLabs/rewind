import React from 'react';
import type { TimelineEvent } from './History';
import BuyNameEventDetail from './details/BuyNameEventDetail';
import IncreaseUndernameDetail from './details/IncreaseUndernameDetail';
import ReassignedAntNameDetail from './details/ReassignedAntNameDetail';
import StateNoticeDetails from './details/StateNoticeDetail';
// → import your other detail components here

export default function EventDetails({
  uiEvent,
}: {
  uiEvent: TimelineEvent & { rawEvent: any };
}) {
  const raw = uiEvent.rawEvent;
  console.log('🐛 EventDetails got:', uiEvent);
  
        switch (raw.constructor.name) {
          case 'BuyNameEvent':
            return <BuyNameEventDetail evt={raw} />;
          case 'IncreaseUndernameEvent':
            return <IncreaseUndernameDetail evt={raw} />;
          case 'ReassignNameEvent':
            return <ReassignedAntNameDetail evt={raw} />;
          case 'StateNoticeEvent':
            return <StateNoticeDetails evt={raw} />;
          // …other cases…
          default:
            return (
              <div className="event-detail-section">
                <h4>Unknown Event Type</h4>
                <p>No detailed view for <code>{raw.constructor.name}</code></p>
              </div>
            );
        }
}