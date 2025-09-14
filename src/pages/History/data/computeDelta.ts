import {
    BuyNameEvent,
    ExtendLeaseEvent,
    IncreaseUndernameEvent,
    ReassignNameEvent,
    SetRecordEvent,
    UpgradeNameEvent,
    StateNoticeEvent,
    CreditNoticeEvent,
    ReturnedNameEvent,
    SetNameNoticeEvent,
    SetDescriptionNoticeEvent,
    SetTickerNoticeEvent,
    IARNSEvent,
    CurrencyAmount
  } from 'ao-js-sdk';
  
  import { Observable, forkJoin, of } from 'rxjs';
  import { map } from 'rxjs/operators';
  import type { SnapshotDelta } from '../types';
  import { toObs, stripUndef, sanitizeDelta, firstDefined } from '../utils/data';
  
  export function computeDelta$(ev: IARNSEvent): Observable<SnapshotDelta> {
    switch (ev.constructor.name) {
      case StateNoticeEvent.name: {
        const e = ev as StateNoticeEvent;
        const records$ = toObs((e as any).getRecords?.());
  
        const contentHashes$ = records$.pipe(
          map((records: any) => records
            ? Object.fromEntries(Object.entries(records).map(([k, v]: [string, any]) => [k, v.transactionId]))
            : {})
        );
        const undernames$ = records$.pipe(map((records: any) => records ? Object.keys(records) : []));
        const target$     = records$.pipe(map((records: any) => records?.['@']?.transactionId));
  
        return forkJoin({
          owner:       toObs((e as any).getOwner?.()),
          targetId:    target$,
          controllers: toObs((e as any).getControllers?.()),
          processId:   toObs((e as any).getANTProcessId?.()),
          expiryTs:    toObs((e as any).getNewExpiry?.()),
          description: toObs((e as any).getDescription?.()),
          ticker:      toObs((e as any).getTicker?.()),
          keywords:    toObs((e as any).getKeywords?.()),
          contentHashes: contentHashes$,
          undernames:    undernames$,
        }).pipe(
          map(stripUndef),
          map(sanitizeDelta)
        );
      }
  
      case BuyNameEvent.name: {
        const e = ev as BuyNameEvent;

        const purchasePrice$ = toObs((e as any).getPurchasePrice?.());
        const displayPrice$ = purchasePrice$.pipe(map((pp: CurrencyAmount) => pp.amount() / BigInt(10 ** 6)));
        return forkJoin({
          ownerBuyer: toObs((e as any).getBuyer?.()),
          initiator:  toObs((e as any).getInitiator?.()),
          processId:  toObs((e as any).getProcessId?.()),
          leaseEnd:   toObs((e as any).getLeaseEnd?.()),
          newExpiry:  toObs((e as any).getNewExpiry?.()),
          purchasePrice: displayPrice$,
        }).pipe(
          map((res: any) =>
            stripUndef({
              owner:     firstDefined(res.ownerBuyer, res.initiator),
              processId: res.processId,
              expiryTs:  firstDefined(res.leaseEnd, res.newExpiry),
              purchasePrice: res.purchasePrice,
            })
          ),
          map(sanitizeDelta)
        );
      }
  
      case ReassignNameEvent.name: {
        const e = ev as ReassignNameEvent;
        return forkJoin({
          processId: toObs((e as any).getReassignedProcessId?.()),
        }).pipe(
          map((res: any) => stripUndef({ processId: res.processId })),
          map(sanitizeDelta)
        );
      }
  
      case ExtendLeaseEvent.name: {
        const e = ev as ExtendLeaseEvent;
        return forkJoin({
          leaseEnd:  toObs((e as any).getLeaseEnd?.()),
          newExpiry: toObs((e as any).getNewExpiry?.()),
        }).pipe(
          map((res: any) => stripUndef({ expiryTs: firstDefined(res.leaseEnd, res.newExpiry) })),
          map(sanitizeDelta)
        );
      }
  
      case IncreaseUndernameEvent.name: {
        const e = ev as IncreaseUndernameEvent;
        return forkJoin({ undernameLimit: toObs((e as any).getUndernameLimit?.()) }).pipe(
          map(stripUndef),
          map(sanitizeDelta)
        );
      }
  
      case SetRecordEvent.name: {
        const e = ev as SetRecordEvent;
        const subDomain$ = toObs((e as any).getSubDomain?.());
        const txid$      = toObs((e as any).getTransactionId?.());
        return forkJoin({ subDomain: subDomain$, txid: txid$ }).pipe(
          map(({ subDomain, txid }: any) => {
            if (!subDomain || !txid) return {} as SnapshotDelta;
            const key = subDomain === '' ? '@' : subDomain;
            const delta: SnapshotDelta = {
              subDomain: key,
              contentHashes: { [key]: String(txid) },
              ...(key === '@'
                ? { targetId: String(txid) }
                : { undernames: [key] }
              ),
            };
            return delta;
          }),
          map(sanitizeDelta)
        );
      }
  
      case UpgradeNameEvent.name: {
        const e = ev as UpgradeNameEvent;
        const startTime        = toObs((e as any).getStartTime?.());
        const getPurchasePrice = toObs((e as any).getPurchasePrice?.()).pipe(map((pp: CurrencyAmount) => pp.amount() / BigInt(10 ** 6)));
        const undernameLimit   = toObs((e as any).getUndernameLimit?.());
        return forkJoin({ startTime, getPurchasePrice, undernameLimit }).pipe(
          map(({ startTime, getPurchasePrice, undernameLimit }: any) => ({
            startTime,
            purchasePrice: getPurchasePrice?.toString?.() ?? String(getPurchasePrice ?? ''),
            undernameLimit,
          })),
          map(sanitizeDelta)
        );
      }
  
      case CreditNoticeEvent.name: {
        const e = ev as CreditNoticeEvent;
        const owner = toObs((e as any).getRecipient?.());
        return forkJoin({ owner }).pipe(
          map((res: any) => stripUndef({ owner: res.owner })),
          map(sanitizeDelta)
        );
      }
  
      case ReturnedNameEvent.name: {
        return of({} as SnapshotDelta);
      }
  
      default:
        return of({} as SnapshotDelta);
    }
  }
  