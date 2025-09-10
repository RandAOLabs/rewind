import {
    BuyNameEvent,
    ReassignNameEvent,
    ReturnedNameEvent,
    ExtendLeaseEvent,
    IncreaseUndernameEvent,
    RecordEvent,
    SetRecordEvent,
    UpgradeNameEvent,
    StateNoticeEvent,
    CreditNoticeEvent,
    DebitNoticeEvent
  } from 'ao-js-sdk';
  
  export function classToAction(cls: string): string {
    switch (cls) {
      case BuyNameEvent.name:           return 'Purchased ANT Name';
      case ReassignNameEvent.name:      return 'ANT Process Change';
      case ReturnedNameEvent.name:      return 'Returned ANT Name';
      case ExtendLeaseEvent.name:       return 'Extended Lease';
      case IncreaseUndernameEvent.name: return 'Increased Undername Limit';
      case RecordEvent.name:            return 'RecordEvent';
      case SetRecordEvent.name:         return 'Set Record Content';
      case UpgradeNameEvent.name:       return 'Permanent ANT Purchase';
      case StateNoticeEvent.name:       return 'State Notice';
      case CreditNoticeEvent.name:      return 'Ownership Transfer';
      case DebitNoticeEvent.name:       return 'Debit Notice';
      default:                          return 'Unknown Event';
    }
  }
  
  export function classToLegend(cls: string): string {
    switch (cls) {
      case BuyNameEvent.name:           return 'ant-buy-event';
      case ReassignNameEvent.name:      return 'ant-reassign-event';
      case ReturnedNameEvent.name:      return 'ant-return-event';
      case ExtendLeaseEvent.name:       return 'ant-extend-lease-event';
      case IncreaseUndernameEvent.name: return 'undername-creation';
      case RecordEvent.name:            return 'ant-content-change';
      case SetRecordEvent.name:         return 'ant-content-change';
      case UpgradeNameEvent.name:       return 'ant-upgrade-event';
      case StateNoticeEvent.name:       return 'ant-state-change';
      case CreditNoticeEvent.name:      return 'ant-ownership-transfer';
      case DebitNoticeEvent.name:       return 'ant-debit-notice';
      default:                          return 'multiple-changes';
    }
  }
  