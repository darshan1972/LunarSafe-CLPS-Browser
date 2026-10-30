import * as crypto from 'crypto';

export interface SignedReport {
  reportHash: string;
  signature: string;
  publicKey: string;
  timestamp: string;
  algorithm: 'Ed25519';
}

export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

export function signReport(
  pdfBytes: Uint8Array,
  privateKeyPem: string
): SignedReport {
  const reportHash = crypto
    .createHash('sha256')
    .update(pdfBytes)
    .digest('hex');

  const signature = crypto.sign(
    null,
    Buffer.from(reportHash, 'hex'),
    privateKeyPem
  );

  const publicKey = crypto
    .createPublicKey(privateKeyPem)
    .export({ type: 'spki', format: 'pem' }) as string;

  return {
    reportHash,
    signature: signature.toString('base64'),
    publicKey,
    timestamp: new Date().toISOString(),
    algorithm: 'Ed25519',
  };
}

export function verifyReport(
  pdfBytes: Uint8Array,
  signedReport: SignedReport
): boolean {
  try {
    const reportHash = crypto
      .createHash('sha256')
      .update(pdfBytes)
      .digest('hex');

    if (reportHash !== signedReport.reportHash) {
      return false;
    }

    const signature = Buffer.from(signedReport.signature, 'base64');
    return crypto.verify(
      null,
      Buffer.from(reportHash, 'hex'),
      signedReport.publicKey,
      signature
    );
  } catch {
    return false;
  }
}
