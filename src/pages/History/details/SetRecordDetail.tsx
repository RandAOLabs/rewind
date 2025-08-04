import React from 'react';
import FieldList, { FieldDescriptor } from './FieldList';
import { SetRecordEvent } from 'ao-js-sdk';
const setRecordFields: FieldDescriptor<SetRecordEvent>[] = [
  { label: 'Actor',                 getter: async e => e.getANTProcessId() },
  { label: 'Process ID',            getter: async e => e.getANTProcessId() },
  { label: 'Event Tx ID',           getter: async e => e.getEventMessageId() },
  { label: 'Sub Domain',            getter: async e => e.getSubDomain() },
  { label: 'Transaction ID',        getter: async e => e.getTransactionId() },
  { label: 'TTL Seconds',           getter: async e => e.getTtlSeconds() },
];
export default function SetRecordDetails({
  evt,
}: {
  evt: SetRecordEvent;
}) {
  return (
    <div className="event-detail-section">
      <h4>Set Record Details</h4>
      <FieldList evt={evt} fields={setRecordFields} />
    </div>
  );
}
