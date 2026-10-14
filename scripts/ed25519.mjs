// ed25519 helpers shared by the scripts (the Aimee app verifies with the same algorithm in src/main/tools/catalog.ts).
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign } from 'node:crypto';

/** A new pair: the private key as base64 PKCS8 DER (never printed), the public key as raw 32 bytes base64. */
export function newPair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return { secret: privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64'), publicKey: rawPublic(publicKey) };
}

export function rawPublic(keyObject) {
  // SPKI DER for ed25519 = 12-byte header + 32-byte key.
  return keyObject.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64');
}

export function publicFromSecret(secret) {
  return rawPublic(createPublicKey(createPrivateKey({ key: Buffer.from(secret, 'base64'), format: 'der', type: 'pkcs8' })));
}

/** Key id: the first 16 hex characters of SHA-256 of the raw public key. */
export function keyId(publicKeyBase64) {
  return createHash('sha256').update(Buffer.from(publicKeyBase64, 'base64')).digest('hex').slice(0, 16);
}

export function signBytes(secret, bytes) {
  return sign(null, bytes, createPrivateKey({ key: Buffer.from(secret, 'base64'), format: 'der', type: 'pkcs8' })).toString('base64');
}
