import React from 'react';
import FieldList, { FieldDescriptor } from './FieldList';
import { IncreaseUndernameEvent } from 'ao-js-sdk';

const increaseUndernameFields: FieldDescriptor<IncreaseUndernameEvent>[] = [
  { label: 'Buyer',           getter: async e => e.getARNSProcessId() },
  { label: 'Process ID',      getter: async e => e.getARNSProcessId() },
  { label: 'Start Time',      getter: async e => e.getStartTime() },
  { label: 'Event Tx ID',     getter: async e => e.getEventMessageId() },
  { label: 'Undername Limit', getter: async e => e.getUndernameLimit() },
];

export default function IncreaseUndernameDetail({
  evt,
}: {
  evt: IncreaseUndernameEvent;
}) {
  return (
    <div className="event-detail-section">
      <h4>Increased Undername Count Details</h4>
      <FieldList evt={evt} fields={increaseUndernameFields} />
    </div>
  );
}
