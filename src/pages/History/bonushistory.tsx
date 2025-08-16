
    case ReassignNameEvent.name: {
      const e = ev as ReassignNameEvent;
      return {
        ...prev,
        owner: e.getInitiator() ?? prev.owner,
      };
    }

    case ReturnedNameEvent.name: {
      const e = ev as ReturnedNameEvent;
      return { ...prev };
    }

    case ExtendLeaseEvent.name: {
      const e = ev as ExtendLeaseEvent;
      return { ...prev };
    }

    case IncreaseUndernameEvent.name: {
      const e = ev as IncreaseUndernameEvent;
      return { ...prev };
    }

    case SetRecordEvent.name: {
      const e = ev as SetRecordEvent;
      return { ...prev };
    }

    case UpgradeNameEvent.name: {
      const e = ev as UpgradeNameEvent;
      return { ...prev };
    }

    case SetRecordEvent.name: {
      const e = ev as SetRecordEvent;
      return { ...prev };
    }

    // case RecordEvent.name: {
    //   const e = ev as RecordEvent;
    //   const label = e.getUndername() ?? '@';
    //   const hash  = e.getContentHash() ?? e.getRecordValue();
    //   if (!hash) return prev;
    //   return {
    //     ...prev,
    //     undernames: addUnique(prev.undernames, label),
    //     contentHashes: {
    //       ...prev.contentHashes,
    //       [label]: String(hash),
    //     },
    //   };
    // }
