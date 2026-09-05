/**
 * Thin re-export of the ArNS history service.
 *
 * Previously this lazily constructed `ao-js-sdk`'s `ARIORewindService`. There is
 * no service object to build any more — the replacement is stateless functions
 * over Arweave GraphQL and the AR.IO gateway REST API.
 */
export {
  getEventHistory,
  getEventHistory$,
  getAntDetail,
} from '../../../services/arns';

export type { RewindEvent, ArNameDetail } from '../../../services/arns';
