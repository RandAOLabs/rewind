#!/usr/bin/env node
/**
 * Upload the built bundle to the permaweb, incrementally.
 *
 * This deliberately does NOT update an ArNS record. `rewind` is a Solana ANT
 * now, so the name cannot be updated with an Arweave JWK — this uploads what
 * changed, writes a manifest, and prints a MANIFEST_ID for an operator to link
 * by hand.
 *
 *   npm run deploy:check    # can the wallet pay for this?
 *   npm run deploy          # build + upload
 *   node scripts/deploy-site.mjs --folder website/build
 *
 * Replaces `permaweb-deploy`, which resolved ArNS through a compute unit that
 * no longer exists and died before uploading a byte.
 *
 * Reuse comes from the Turbo SDK's own `folderIndex` (turbo-sdk#453), so there
 * is nothing bespoke here: byte-identical files already on Arweave are matched
 * and skipped rather than paid for again. Two layers are stacked — a local file
 * log for speed, and a gateway sweep so a fresh CI runner with no cache still
 * gets the reuse.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TurboFactory,
  composeFolderIndex,
  createChainFolderIndex,
  createFileFolderIndex,
} from '@ardrive/turbo-sdk/node';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DEPLOY_DIR = path.join(ROOT, '.deploy');

const APP_NAME = 'ARNS-Rewind';
const GATEWAY = process.env.ARWEAVE_GATEWAY || 'https://arweave.net';

const argv = process.argv.slice(2);
const flagValue = name => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const checkOnly = argv.includes('--check');
const noRemoteIndex = argv.includes('--no-remote-index');

const folderName = flagValue('--folder') || process.env.DEPLOY_FOLDER || 'dist';
const DIST = path.resolve(ROOT, folderName);

// A docs or test deploy must not poison the production index or overwrite the
// receipt recording what is actually live.
const slug = folderName.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'dist';
const isProduction = slug === 'dist';
const INDEX_FILE = path.join(DEPLOY_DIR, isProduction ? 'folder-index.jsonl' : `folder-index.${slug}.jsonl`);
const RECEIPT_FILE = path.join(DEPLOY_DIR, isProduction ? 'deployment.json' : `deployment.${slug}.json`);

const isId = v => /^[A-Za-z0-9_-]{43}$/.test(v || '');

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  throw new Error(`No bundle at ${path.relative(ROOT, DIST)} — run npm run build first`);
}

// Wallet ---------------------------------------------------------------------

function normalizedDeployKey() {
  const configured = (process.env.DEPLOY_KEY || '').trim();
  if (!configured) throw new Error('DEPLOY_KEY is required (base64-encoded Arweave JWK)');

  const jsonText = configured.startsWith('{')
    ? configured
    : Buffer.from(configured.replace(/\s+/g, ''), 'base64').toString('utf8');

  let jwk;
  try {
    jwk = JSON.parse(jsonText);
  } catch {
    throw new Error('DEPLOY_KEY is not a valid base64-encoded JSON keyfile');
  }

  const privateFields = ['n', 'e', 'd', 'p', 'q', 'dp', 'dq', 'qi'];
  if (jwk?.kty !== 'RSA' || privateFields.some(f => !jwk[f])) {
    throw new Error('DEPLOY_KEY is not a private RSA Arweave JWK');
  }
  return jwk;
}

/** The address Turbo credits are billed against; the one an operator tops up. */
const addressOf = jwk =>
  crypto.createHash('sha256').update(Buffer.from(jwk.n, 'base64url')).digest('base64url');

const mib = bytes => `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
const ar = winc => (Number(winc) / 1e12).toFixed(6);

// ---------------------------------------------------------------------------

const deployKey = normalizedDeployKey();
const payer = addressOf(deployKey);

const turbo = TurboFactory.authenticated({ privateKey: deployKey });

/*
 * `owner` is a tagged union on purpose: a raw ed25519 public key and an owner
 * address are both 43 base64url characters, so passing the wrong one matches
 * nothing and silently re-uploads the whole folder. We hold an RSA JWK, so the
 * address is what we have — declare it as such.
 */
const folderIndex = composeFolderIndex([
  createFileFolderIndex({ filePath: INDEX_FILE }),
  noRemoteIndex
    ? undefined
    : createChainFolderIndex({ owner: { address: payer }, appName: APP_NAME, gatewayUrl: GATEWAY }),
]);

console.log('Permaweb upload:');
console.log(`  folder      ${path.relative(ROOT, DIST)}${isProduction ? '' : '  (side deploy)'}`);
console.log(`  payer       ${payer}`);
console.log(`  index       ${path.relative(ROOT, INDEX_FILE)}${noRemoteIndex ? ' (local only)' : ' + gateway sweep'}`);
console.log('  mode        incremental upload only (ArNS will not be changed)');

// Preflight ------------------------------------------------------------------
//
// Check the wallet has credits before signing anything, so a deploy cannot die
// half-finished with files paid for and no manifest. This is a floor, not a
// quote: with reuse the real cost is usually far lower.

const balance = await turbo.getBalance();
const availableWinc = BigInt(balance.winc ?? '0');
console.log(`  credits     ${availableWinc} winc (~${ar(availableWinc)} AR)`);

if (availableWinc <= 0n) {
  throw new Error(
    `No Turbo credits on ${payer}. Top up at https://turbo.ar.io, or convert AR held by that `
      + 'wallet with turbo.topUpWithTokens().',
  );
}

if (checkOnly) {
  console.log('');
  console.log('Preflight OK — wallet resolves and holds credits.');
  process.exit(0);
}

// Upload ---------------------------------------------------------------------

const gitCommit = process.env.GITHUB_SHA || null;

const result = await turbo.uploadFolder({
  folderPath: DIST,
  folderIndex,
  manifestOptions: {
    indexFile: 'index.html',
    // Route unknown paths back into the SPA so /history/<name> deep links work.
    fallbackFile: 'index.html',
  },
  /*
   * Per-file tags must be byte-identical between deploys. A commit sha here
   * would change every index key and re-upload the whole bundle at full price —
   * so it goes on the manifest, which is rewritten every deploy anyway.
   */
  dataItemOpts: { tags: [{ name: 'App-Name', value: APP_NAME }] },
  manifestDataItemOpts: {
    tags: [
      { name: 'App-Name', value: APP_NAME },
      ...(gitCommit ? [{ name: 'Git-Commit', value: gitCommit }] : []),
    ],
  },
});

const manifestId = result.manifestResponse?.id ?? result.manifest?.id;
if (!isId(manifestId)) throw new Error('Upload completed without a valid 43-character manifest id');

const summary = result.folderIndexSummary ?? {};
const gatewayUrl = `${GATEWAY}/${manifestId}/`;

// Receipt --------------------------------------------------------------------

fs.mkdirSync(DEPLOY_DIR, { recursive: true });
fs.writeFileSync(
  RECEIPT_FILE,
  `${JSON.stringify(
    {
      version: 1,
      mode: 'incremental-upload-only',
      deployedAt: new Date().toISOString(),
      commit: gitCommit,
      payer,
      folder: path.relative(ROOT, DIST).replaceAll('\\', '/'),
      manifestId,
      transactionId: manifestId,
      gatewayUrl,
      arnsUpdated: false,
      ...summary,
    },
    null,
    2,
  )}\n`,
);

if (isProduction && process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `manifest_id=${manifestId}\n`);
}
if (isProduction && process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      '## Permaweb upload complete',
      '',
      `- Manifest ID: \`${manifestId}\``,
      `- Gateway: ${gatewayUrl}`,
      `- Uploaded ${summary.uploadedFiles ?? '?'} files, reused ${summary.reusedFiles ?? '?'}`,
      '- ArNS was not changed. `rewind` is a Solana ANT — link the manifest manually.',
      '',
    ].join('\n'),
  );
}

console.log('');
console.log('=== PERMAWEB UPLOAD COMPLETE ===');
console.log(`MANIFEST_ID=${manifestId}`);
console.log(`GATEWAY_URL=${gatewayUrl}`);
console.log(
  `UPLOADED=${summary.uploadedFiles ?? '?'} (${mib(summary.uploadedBytes ?? 0)})`
    + `  REUSED=${summary.reusedFiles ?? '?'} (${mib(summary.reusedBytes ?? 0)})`,
);
console.log('ARNS_UPDATE=manual  # link MANIFEST_ID to the Solana ANT by hand');
console.log(`RECEIPT=${path.relative(ROOT, RECEIPT_FILE)}`);
