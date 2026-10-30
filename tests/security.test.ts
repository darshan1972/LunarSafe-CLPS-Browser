import { computeSessionIntegrityHash, getSessionMetadata } from '../src/lib/sessionIntegrity';
import { encryptData, decryptData } from '../src/lib/encryption';
import { generateKeyPair, signReport, verifyReport } from '../src/lib/digitalSignature';

console.log('============================================================');
console.log('     LUNARSAFE SECURITY FEATURES TEST SUITE                 ');
console.log('============================================================\n');

let allPassed = true;

// Session Integrity Tests
console.log('--- SESSION INTEGRITY TESTS ---');

const meta = getSessionMetadata();
const hash1 = computeSessionIntegrityHash(meta);
const hash2 = computeSessionIntegrityHash(meta);

if (hash1.length !== 64) {
  console.error('TEST 1 FAIL: hash length is ' + hash1.length + ', expected 64');
  allPassed = false;
} else {
  console.log('[ASSERT 1] Session hash is 64-char hex: PASS');
}

if (hash1 !== hash2) {
  console.error('TEST 2 FAIL: same metadata produced different hashes');
  allPassed = false;
} else {
  console.log('[ASSERT 2] Same metadata → same hash: PASS');
}

const meta2 = { ...meta, timestamp: '2026-01-01T00:00:00.000Z' };
const hash3 = computeSessionIntegrityHash(meta2);
if (hash1 === hash3) {
  console.error('TEST 3 FAIL: different metadata produced same hash');
  allPassed = false;
} else {
  console.log('[ASSERT 3] Different metadata → different hash: PASS');
}

// Encryption Tests
console.log('\n--- ENCRYPTION TESTS ---');

async function runEncryptionTests() {
  const plaintext = 'Hello LunarSafe';
  const password = 'test-password-123';

  const encrypted = await encryptData(plaintext, password);

  if (encrypted.algorithm !== 'AES-256-GCM') {
    console.error('TEST 4 FAIL: wrong algorithm');
    allPassed = false;
  } else {
    console.log('[ASSERT 4] Encrypted payload has AES-256-GCM: PASS');
  }

  const decrypted = await decryptData(encrypted, password);
  if (decrypted !== plaintext) {
    console.error('TEST 5 FAIL: round-trip mismatch');
    allPassed = false;
  } else {
    console.log('[ASSERT 5] encrypt/decrypt round-trip: PASS');
  }

  let wrongPasswordFailed = false;
  try {
    await decryptData(encrypted, 'wrong-password');
  } catch {
    wrongPasswordFailed = true;
  }
  if (!wrongPasswordFailed) {
    console.error('TEST 6 FAIL: wrong password did not throw');
    allPassed = false;
  } else {
    console.log('[ASSERT 6] Wrong password fails: PASS');
  }

  const tampered = { ...encrypted, ciphertext: Buffer.from('tampered').toString('base64') };
  let tamperFailed = false;
  try {
    await decryptData(tampered, password);
  } catch {
    tamperFailed = true;
  }
  if (!tamperFailed) {
    console.error('TEST 7 FAIL: tampered ciphertext did not fail');
    allPassed = false;
  } else {
    console.log('[ASSERT 7] Tampered ciphertext fails: PASS');
  }

  const enc2 = await encryptData(plaintext, password);
  if (enc2.ciphertext === encrypted.ciphertext) {
    console.error('TEST 8 FAIL: different IVs produced same ciphertext');
    allPassed = false;
  } else {
    console.log('[ASSERT 8] Different IVs → different ciphertext: PASS');
  }
}

// Digital Signature Tests
console.log('\n--- DIGITAL SIGNATURE TESTS ---');

async function runSignatureTests() {
  const pdfBytes = Buffer.from('fake PDF content for testing');

  const { publicKey, privateKey } = generateKeyPair();
  if (!publicKey.includes('BEGIN PUBLIC KEY')) {
    console.error('TEST 9 FAIL: invalid public key format');
    allPassed = false;
  } else {
    console.log('[ASSERT 9] generateKeyPair returns valid Ed25519 keys: PASS');
  }

  const signed = signReport(pdfBytes, privateKey);
  const valid = verifyReport(pdfBytes, signed);
  if (!valid) {
    console.error('TEST 10 FAIL: signature verification failed');
    allPassed = false;
  } else {
    console.log('[ASSERT 10] sign/verify round-trip: PASS');
  }

  const tamperedPdf = Buffer.from('tampered PDF content');
  const tamperedValid = verifyReport(tamperedPdf, signed);
  if (tamperedValid) {
    console.error('TEST 11 FAIL: tampered PDF verified');
    allPassed = false;
  } else {
    console.log('[ASSERT 11] Tampered PDF fails verification: PASS');
  }

  const { privateKey: otherKey } = generateKeyPair();
  const otherSigned = signReport(pdfBytes, otherKey);
  const crossValid = verifyReport(pdfBytes, {
    ...signed,
    publicKey: otherSigned.publicKey,
  });
  if (crossValid) {
    console.error('TEST 12 FAIL: wrong public key verified');
    allPassed = false;
  } else {
    console.log('[ASSERT 12] Wrong public key fails verification: PASS');
  }
}

(async () => {
  await runEncryptionTests();
  await runSignatureTests();

  console.log('\n============================================================');
  if (allPassed) {
    console.log('FINAL RESULT: ALL SECURITY TESTS PASSED');
  } else {
    console.log('FINAL RESULT: SOME TESTS FAILED');
    process.exit(1);
  }
  console.log('============================================================');
})();
