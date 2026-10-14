// Keychain access for the catalog signing keys. A private key never goes on a command line (argv is
// visible to other processes), into a file, or to the terminal: it goes to `security -i` on stdin and
// comes back from `security find-generic-password -w` into this process only.
import { execFile, spawn } from 'node:child_process';

export const SERVICE = 'aimee-catalog-signing';
/** operating: signs every catalog (Mac one keychain). backup-temporary: until 유건 moves it to the password manager. */
export const ACCOUNTS = { operating: 'operating', backup: 'backup-temporary' };

const SAFE = /^[A-Za-z0-9+/=_.-]+$/;

export function has(account) {
  return new Promise((resolve) => execFile('/usr/bin/security', ['find-generic-password', '-s', SERVICE, '-a', account], (err) => resolve(!err)));
}

/** Add an item; refuses to replace one that exists. */
export async function add(account, secret) {
  if (!SAFE.test(secret) || !SAFE.test(account)) throw new Error('unexpected characters');
  if (await has(account)) throw new Error(`keychain item ${SERVICE}/${account} already exists; nothing was changed`);
  await new Promise((resolve, reject) => {
    const p = spawn('/usr/bin/security', ['-i'], { stdio: ['pipe', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 && !err.trim() ? resolve() : reject(new Error(`security failed (${code})`))));
    p.stdin.end(`add-generic-password -s ${SERVICE} -a ${account} -l "Aimee catalog signing (${account})" -w ${secret}\n`);
  });
  if (!(await has(account))) throw new Error('the keychain item was not created');
}

/** The secret, into this process only (macOS may ask once to allow access). */
export function read(account) {
  return new Promise((resolve, reject) =>
    execFile('/usr/bin/security', ['find-generic-password', '-s', SERVICE, '-a', account, '-w'], { maxBuffer: 1 << 16 }, (err, out) => (err ? reject(new Error(`no keychain item ${SERVICE}/${account}`)) : resolve(out.trim()))),
  );
}
