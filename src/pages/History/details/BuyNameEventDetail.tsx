import React from 'react';
import FieldList, { FieldDescriptor } from './FieldList';
import { BuyNameEvent } from 'ao-js-sdk';

const buyFields: FieldDescriptor<BuyNameEvent>[] = [
  { label: 'Buyer',           getter: async e => e.getARNSProcessId() },
  { label: 'Process ID',      getter: async e => e.getARNSProcessId() },
  { label: 'Start Time',      getter: async e => e.getStartTime() },
  { label: 'Event Tx ID',     getter: async e => e.getEventMessageId() },
  { label: 'Purchase Price',  getter: async e => e.getPurchasePrice().toString() },
];

export default function BuyNameEventDetail({
  evt,
}: {
  evt: BuyNameEvent;
}) {
  return (
    <div className="event-detail-section">
      <h4>Buy Name Event Details</h4>
      <FieldList evt={evt} fields={buyFields} />
    </div>
  );
}
