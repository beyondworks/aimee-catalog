#!/usr/bin/env node
// Make the two catalog signing key pairs (run once, on Mac one). Prints only the public keys and ids.
// operating → keychain item aimee-catalog-signing/operating (stays).
// backup    → keychain item aimee-catalog-signing/backup-temporary (move it to the password manager, then delete).
import { ACCOUNTS, add, has } from './keychain.mjs';
import { keyId, newPair } from './ed25519.mjs';

if (process.platform !== 'darwin') {
  console.error('macOS only (keychain).');
  process.exit(1);
}
for (const a of Object.values(ACCOUNTS)) {
  if (await has(a)) {
    console.error(`A key already exists in the keychain (aimee-catalog-signing/${a}). Nothing was made. Keys are made once.`);
    process.exit(1);
  }
}
const operating = newPair();
const backup = newPair();
await add(ACCOUNTS.operating, operating.secret);
await add(ACCOUNTS.backup, backup.secret);
console.log('Made two ed25519 key pairs. Private keys are in the keychain only (not printed, not in files).\n');
console.log('Public keys for the Aimee app (src/main/tools/catalog-keys.ts in beyondworks/aimee):');
console.log(`  operating  id ${keyId(operating.publicKey)}  ${operating.publicKey}`);
console.log(`  backup     id ${keyId(backup.publicKey)}  ${backup.publicKey}`);
console.log('\nNext: move the backup key to the password manager (see README.md), then delete the temporary keychain item.');
