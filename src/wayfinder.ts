import { Wayfinder, NetworkGatewaysProvider } from '@ar.io/wayfinder-core'
import { ARIO } from '@ar.io/sdk'

const wayfinder = new Wayfinder({
  gatewaysProvider: new NetworkGatewaysProvider({
    ario: ARIO.mainnet(),
    sortBy: 'operatorStake',
    sortOrder: 'desc',
    limit: 10,
  })
})

export async function arTxidToHttps(txid: string): Promise<string> {
  const url = await wayfinder.resolveUrl({ txId: txid });
  return url.toString();
}