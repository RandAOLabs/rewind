import React from 'react';
import FieldList, { FieldDescriptor } from './FieldList';
import { ReassignNameEvent } from 'ao-js-sdk';

const reassignFields: FieldDescriptor<ReassignNameEvent>[] = [
  { label: 'Buyer',                 getter: async e => e.getARNSProcessId() },
  { label: 'Process ID',            getter: async e => e.getARNSProcessId() },
  { label: 'Start Time',            getter: async e => e.getStartTime() },
  { label: 'Event Tx ID',           getter: async e => e.getEventMessageId() },
  { label: 'Reassigned Process ID', getter: async e => e.getReassignedProcessId() }];

export default function ReassignedAntNameDetail({
  evt,
}: {
  evt: ReassignNameEvent;
}) {
  return (
    <div className="event-detail-section">
      <h4>Reassigned ANT Name Details</h4>
      <FieldList evt={evt} fields={reassignFields} />
    </div>
  );
}
