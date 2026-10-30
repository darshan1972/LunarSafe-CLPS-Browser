import * as crypto from 'crypto';

const nodeCrypto: any = crypto;

export interface EncryptedPayload {
  version: '1.0';
  algorithm: 'AES-256-GCM';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  tag: string;
}

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function deriveKey(password: string, salt: Buffer): Buffer {
  return nodeCrypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

export async function encryptData(
  plaintext: string,
  password: string
): Promise<EncryptedPayload> {
  const salt = nodeCrypto.randomBytes(SALT_LENGTH);
  const iv = nodeCrypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = nodeCrypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    version: '1.0',
    algorithm: 'AES-256-GCM',
    iterations: PBKDF2_ITERATIONS,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export async function decryptData(
  payload: EncryptedPayload,
  password: string
): Promise<string> {
  if (payload.version !== '1.0') {
    throw new Error('Unsupported payload version: ' + payload.version);
  }
  if (payload.algorithm !== 'AES-256-GCM') {
    throw new Error('Unsupported algorithm: ' + payload.algorithm);
  }

  const salt = Buffer.from(payload.salt, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const key = deriveKey(password, salt);

  const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  try {
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  } catch (err) {
    throw new Error('Decryption failed: authentication tag mismatch');
  }
}
