import {
    BuyNameEvent,
    ReturnedNameEvent,
    ExtendLeaseEvent,
    IncreaseUndernameEvent,
    RecordEvent,
    SetRecordEvent,
    UpgradeNameEvent,
    StateNoticeEvent,
    CreditNoticeEvent,
    DebitNoticeEvent,
    SetNameNoticeEvent,
    SetDescriptionNoticeEvent,
    SetTickerNoticeEvent,
    ReassignNameNoticeEvent,
    ReassignNameEvent
  } from 'ao-js-sdk';
  
  export function classToAction(cls: string): string {
    switch (cls) {
      case BuyNameEvent.name:           return 'ARNS Name Purchase';
      case ReturnedNameEvent.name:      return 'Returned ANT Name';
      case ExtendLeaseEvent.name:       return 'Extended Lease';
      case IncreaseUndernameEvent.name: return 'Increased Undername Limit';
      case RecordEvent.name:            return 'RecordEvent';
      case SetRecordEvent.name:         return 'Set Record Content';
      case UpgradeNameEvent.name:       return 'Permanent ARNS Name Purchase';  
      case StateNoticeEvent.name:       return 'State Notice';
      case CreditNoticeEvent.name:      return 'Ownership Transfer';
      case DebitNoticeEvent.name:       return 'Debit Notice';
      case SetNameNoticeEvent.name:     return 'Set ANT Name';
      case SetDescriptionNoticeEvent.name: return 'Set ANT Description';
      case SetTickerNoticeEvent.name:   return 'Set ANT Ticker';
      case ReassignNameEvent.name: return 'ANT Process Change';
      default:                          return 'Unknown Event';
    }
  }
  
  export function classToLegend(cls: string): string {
    switch (cls) {
      case BuyNameEvent.name:           return 'ant-buy-event';
      case ReturnedNameEvent.name:      return 'ant-return-event';
      case ExtendLeaseEvent.name:       return 'ant-extend-lease-event';
      case IncreaseUndernameEvent.name: return 'undername-creation';
      case RecordEvent.name:            return 'ant-content-change';
      case SetRecordEvent.name:         return 'ant-content-change';
      case UpgradeNameEvent.name:       return 'ant-upgrade-event';
      case StateNoticeEvent.name:       return 'ant-state-change';
      case CreditNoticeEvent.name:      return 'ant-ownership-transfer';
      case DebitNoticeEvent.name:       return 'ant-debit-notice';
      case SetNameNoticeEvent.name:     return 'ant-name-set  ';
      case SetDescriptionNoticeEvent.name: return 'ant-description-set';
      case SetTickerNoticeEvent.name:   return 'ant-ticker-set';
      case ReassignNameEvent.name: return 'ant-reassign-event';
      default:                          return 'multiple-changes';
    }
  }