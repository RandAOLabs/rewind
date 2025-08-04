import React from 'react';
import FieldList, { FieldDescriptor } from './FieldList';
import { StateNoticeEvent } from 'ao-js-sdk';

const reassignFields: FieldDescriptor<StateNoticeEvent>[] = [
  { label: 'Actor',                 getter: async e => e.getANTProcessId() },
  { label: 'Process ID',            getter: async e => e.getANTProcessId() },
  { label: 'Event Tx ID',           getter: async e => e.getEventMessageId() },
];

export default function StateNoticeDetails({
  evt,
}: {
  evt: StateNoticeEvent;
}) {
  return (
    <div className="event-detail-section">
      <h4>State Notice Details</h4>
      <FieldList evt={evt} fields={reassignFields} />
    </div>
  );
}
