/**
 * Anchor event decoding for the Solana era.
 *
 * AR.IO's own decoders are shipped as no-ops (`parseEventsFromLogs` returns `[]`,
 * `AnyArioAntEvent = never`) pending a release of `@ar.io/solana-contracts` that
 * has never landed, and none of the five programs publishes an on-chain IDL. But
 * AR.IO does publish the frozen event ABI — discriminators and ordered Borsh
 * field lists for all 88 events — which is vendored here as `eventAbi.json`.
 * That is enough to decode everything ourselves without the SDK, without
 * `@solana/kit`, and without an Anchor runtime.
 *
 * Verified against live mainnet traffic: the `RecordSetEvent` discriminator
 * `458deadb9ccfadc1` and its field offsets were derived by hand from a real
 * transaction before this file existed, and match the ABI byte for byte.
 */

import abi from './eventAbi.json';

/** Mainnet program ids, keyed by the ABI's program names. */
export const PROGRAM_IDS: Record<string, string> = {
  ario_core: '73YoECm6NKXpVRoe5f1Q9BcP5DJGPFUjnFy6AxBE5Nvh',
  ario_gar: '89fNiiwgpFSPHKuqfNUkgYTYjtAJAhyqHjXmgXeppGpf',
  ario_arns: '2yCUx5edFvUrkibYaUa2ZXWyx9kuJkS8CwyzsgHPWdZZ',
  ario_ant: '2MWexMHfMhGJwMHv9Qm9YAVCqjUFUJwDJAysW4oCUGk5',
  ario_ant_escrow: '5HZhe9Uq7QaBFribbTNKPnFmYnr9J3AoAjGmDdM8Vhbn',
};

/** Frozen u8 enums. These are part of the ABI contract and never change. */
export const ENUMS = {
  fundingSource: ['Balance', 'Delegation', 'OperatorStake', 'Withdrawal', 'FundingPlan', 'Turbo'],
  purchaseType: ['Lease', 'Permabuy'],
  prunedKind: ['ExpiredLease', 'Returned', 'ExpiredReservation'],
  antMetadata: ['name', 'ticker', 'description', 'keywords', 'logo'],
  aclRole: ['Owner', 'Controller'],
  targetProtocol: ['Arweave', 'IPFS'],
} as const;

type AbiField = { name: string; type: unknown };
type AbiEvent = { name: string; discriminator: number[]; fields?: AbiField[] };

export interface DecodedEvent {
  /** ABI event name, e.g. `RecordSetEvent`. */
  name: string;
  /** Program that emitted it (mainnet address). */
  programId: string;
  fields: Record<string, unknown>;
}

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Base58-encode 32 raw bytes into a Solana address. No dependency needed. */
function toBase58(bytes: Uint8Array): string {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits: number[] = [];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = '1'.repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) out += BASE58[digits[i]];
  return out;
}

function hex(bytes: number[] | Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Events are keyed on `(programId, discriminator)`, never on the discriminator
 * alone: `AuthorityTransferredEvent` shares discriminator `361f76ed9805c90b`
 * across four of the five programs, so a flat map silently merges them.
 */
const EVENTS_BY_KEY = new Map<string, AbiEvent>();
for (const [progName, events] of Object.entries(abi as Record<string, AbiEvent[]>)) {
  const programId = PROGRAM_IDS[progName];
  if (!programId) continue;
  for (const ev of events) {
    EVENTS_BY_KEY.set(`${programId}:${hex(ev.discriminator)}`, ev);
  }
}

/** Sequential Borsh reader. Little-endian throughout, per the Borsh spec. */
class Reader {
  private off = 0;
  private readonly dv: DataView;
  constructor(private readonly buf: Uint8Array) {
    this.dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  get exhausted(): boolean {
    return this.off === this.buf.length;
  }
  get remaining(): number {
    return this.buf.length - this.off;
  }
  private take(n: number): Uint8Array {
    if (this.off + n > this.buf.length) throw new RangeError('borsh: buffer overrun');
    const s = this.buf.subarray(this.off, this.off + n);
    this.off += n;
    return s;
  }
  u8() { return this.take(1)[0]; }
  bool() { return this.u8() !== 0; }
  u16() { const o = this.off; this.take(2); return this.dv.getUint16(o, true); }
  u32() { const o = this.off; this.take(4); return this.dv.getUint32(o, true); }
  u64() { const o = this.off; this.take(8); return this.dv.getBigUint64(o, true); }
  i64() { const o = this.off; this.take(8); return this.dv.getBigInt64(o, true); }
  pubkey() { return toBase58(this.take(32)); }
  string() { return new TextDecoder().decode(this.take(this.u32())); }
  bytes() { return hex(this.take(this.u32())); }
  fixed(n: number) { return hex(this.take(n)); }
}

function readField(r: Reader, type: unknown): unknown {
  if (typeof type === 'string') {
    switch (type) {
      case 'pubkey': return r.pubkey();
      case 'string': return r.string();
      case 'bytes': return r.bytes();
      case 'bool': return r.bool();
      case 'u8': return r.u8();
      case 'u16': return r.u16();
      case 'u32': return r.u32();
      // u64/i64 exceed Number.MAX_SAFE_INTEGER only for balances we never show;
      // timestamps and costs are well inside it, so narrow for ergonomics.
      case 'u64': return Number(r.u64());
      case 'i64': return Number(r.i64());
      default: throw new Error(`borsh: unsupported type ${type}`);
    }
  }
  const t = type as { option?: unknown; array?: [string, number] };
  if (t.option !== undefined) return r.bool() ? readField(r, t.option) : null;
  if (t.array) return r.fixed(t.array[1]);
  throw new Error(`borsh: unsupported type ${JSON.stringify(type)}`);
}

/** Decode one `Program data:` payload emitted by `programId`. */
export function decodeEvent(programId: string, payloadB64: string): DecodedEvent | null {
  let raw: Uint8Array;
  try {
    raw = Uint8Array.from(atob(payloadB64), c => c.charCodeAt(0));
  } catch {
    return null;
  }
  if (raw.length < 8) return null;

  const ev = EVENTS_BY_KEY.get(`${programId}:${hex(raw.subarray(0, 8))}`);
  if (!ev) return null;

  const r = new Reader(raw.subarray(8));
  const fields: Record<string, unknown> = {};
  try {
    for (const f of ev.fields ?? []) fields[f.name] = readField(r, f.type);
  } catch {
    return null;
  }

  // Leftover bytes mean the ABI no longer matches what the chain emits. Better
  // to drop the event than to render fields decoded against a stale layout.
  if (!r.exhausted) {
    console.warn(`[arns/solana] ${ev.name}: ${r.remaining} residual bytes — ABI drift?`);
    return null;
  }

  return { name: ev.name, programId, fields };
}

export interface TxEvent extends DecodedEvent {
  signature: string;
  /** Epoch seconds. */
  blockTime: number;
  /** `Program log: Instruction: X` names seen in this transaction. */
  instructions: string[];
}

/**
 * Walk a transaction's logs, decoding every event and attributing it to the
 * program that actually emitted it.
 *
 * Attribution matters because programs CPI into each other — a `BuyName` on the
 * ArNS program emits a core `TransferEvent` inside the same transaction. The
 * `Program <id> invoke [N]` / `success` / `failed` lines form a stack, and a
 * `Program data:` line belongs to whatever is on top of it.
 */
export function decodeTransactionLogs(
  logs: string[],
  signature: string,
  blockTime: number,
): TxEvent[] {
  const stack: string[] = [];
  const out: TxEvent[] = [];
  const instructions: string[] = [];

  for (const line of logs) {
    const invoke = line.match(/^Program (\S+) invoke \[\d+\]$/);
    if (invoke) { stack.push(invoke[1]); continue; }

    if (/^Program \S+ (success|failed)/.test(line)) { stack.pop(); continue; }

    const instr = line.match(/^Program log: Instruction: (\w+)/);
    if (instr) { instructions.push(instr[1]); continue; }

    const data = line.match(/^Program data: (\S+)$/);
    if (data && stack.length) {
      const decoded = decodeEvent(stack[stack.length - 1], data[1]);
      if (decoded) out.push({ ...decoded, signature, blockTime, instructions: [] });
    }
  }

  return out.map(e => ({ ...e, instructions }));
}
