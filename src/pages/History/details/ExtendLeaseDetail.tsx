import React from 'react';
import FieldList, { FieldDescriptor } from './FieldList';
import { ExtendLeaseEvent } from 'ao-js-sdk';
const extendLeaseFields: FieldDescriptor<ExtendLeaseEvent>[] = [
  { label: 'Actor',                 getter: async e => e.getARNSProcessId() },
  { label: 'Process ID',            getter: async e => e.getARNSProcessId() },
  { label: 'Event Tx ID',           getter: async e => e.getEventMessageId() },
  { label: 'Total Fee',             getter: async e => e.getTotalFee().toString() },
  { label: 'End Time',              getter: async e => e.getEndTime().toString() },
];
export default function ExtendLeaseDetails({
  evt,
}: {
  evt: ExtendLeaseEvent;
}) {
  return (
    <div className="event-detail-section">
      <h4>Extend Lease Details</h4>
      <FieldList evt={evt} fields={extendLeaseFields} />
    </div>
  );
}
