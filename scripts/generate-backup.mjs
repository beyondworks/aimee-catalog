#!/usr/bin/env node
// Make a new backup signing key only (the old backup key was lost; the operating key is untouched).
// node scripts/generate-backup.mjs
// → keychain item aimee-catalog-signing/backup-temporary (move it to the password manager, then delete it).
// It never reads or changes the operating key's item, and prints only the new public key and its id.
import { ACCOUNTS, add, has } from './keychain.mjs';
import { keyId, newPair } from './ed25519.mjs';

if (process.platform !== 'darwin') {
  console.error('macOS only (keychain).');
  process.exit(1);
}
if (await has(ACCOUNTS.backup)) {
  console.error(`A temporary backup key is already in the keychain (aimee-catalog-signing/${ACCOUNTS.backup}). Nothing was made.`);
  console.error('Move that one to the password manager first, or delete it if it is not needed.');
  process.exit(1);
}
const backup = newPair();
await add(ACCOUNTS.backup, backup.secret);
console.log(`backup  id ${keyId(backup.publicKey)}  ${backup.publicKey}`);
