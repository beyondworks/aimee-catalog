#!/usr/bin/env node
// Sign a catalog file: node scripts/sign.mjs <catalog.json> [--key operating|backup]
// Writes <catalog.json>.sig = { keyId, signature } next to it. The private key is read from the keychain
// into this process only. For --key backup, put the backup key back into the keychain as
// aimee-catalog-signing/backup first (README: emergencies).
import { readFile, writeFile } from 'node:fs/promises';
import { read } from './keychain.mjs';
import { keyId, publicFromSecret, signBytes } from './ed25519.mjs';

const file = process.argv[2];
const which = process.argv.includes('--key') ? process.argv[process.argv.indexOf('--key') + 1] : 'operating';
if (!file || !['operating', 'backup'].includes(which)) {
  console.error('usage: node scripts/sign.mjs <catalog.json> [--key operating|backup]');
  process.exit(1);
}
const bytes = await readFile(file);
const catalog = JSON.parse(bytes.toString('utf8'));
if (!Number.isInteger(catalog.version) || catalog.version < 1) throw new Error('catalog.version (a whole number that only goes up) is missing');
const secret = await read(which === 'backup' ? 'backup' : 'operating');
const id = keyId(publicFromSecret(secret));
const signature = signBytes(secret, bytes);
await writeFile(`${file}.sig`, `${JSON.stringify({ keyId: id, signature })}\n`);
console.log(`Signed ${file} (version ${catalog.version}) with key ${id}.`);
