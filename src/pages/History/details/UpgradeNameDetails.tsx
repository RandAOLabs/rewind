import React from 'react';
import FieldList, { FieldDescriptor } from './FieldList';
import { UpgradeNameEvent } from 'ao-js-sdk';
const upgradeNameFields: FieldDescriptor<UpgradeNameEvent>[] = [
  { label: 'Actor',                 getter: async e => e.getARNSProcessId() },
  { label: 'Process ID',            getter: async e => e.getARNSProcessId() },
  { label: 'Event Tx ID',           getter: async e => e.getEventMessageId() },
  { label: 'Purchase Price',        getter: async e => e.getPurchasePrice().toString() },
  { label: 'Lease Type',            getter: async e => e.getType().toString() },
];
export default function UpgradeNameDetails({
  evt,
}: {
  evt: UpgradeNameEvent;
}) {
  return (
    <div className="event-detail-section">
      <h4>Upgrade Name Details</h4>
      <FieldList evt={evt} fields={upgradeNameFields} />
    </div>
  );
}
