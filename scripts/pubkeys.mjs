#!/usr/bin/env node
// Print the public keys (and ids) of the keys in the keychain, to check them against the app.
import { ACCOUNTS, has, read } from './keychain.mjs';
import { keyId, publicFromSecret } from './ed25519.mjs';

for (const [name, account] of Object.entries({ ...ACCOUNTS, 'backup (restored)': 'backup' })) {
  if (!(await has(account))) continue;
  const pub = publicFromSecret(await read(account));
  console.log(`${name.padEnd(18)} id ${keyId(pub)}  ${pub}`);
}
