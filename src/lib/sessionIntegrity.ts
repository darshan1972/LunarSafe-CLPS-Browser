import * as crypto from 'crypto';
import * as os from 'os';

export interface SessionMetadata {
  timestamp: string;
  deviceId: string;
  softwareVersion: string;
  nodeVersion: string;
  platform: string;
  pipelineVersion: string;
}

export function getSessionMetadata(): SessionMetadata {
  const isBrowser = typeof window !== 'undefined';
  const nodeOs: any = os;
  const nodeCrypto: any = crypto;

  const hostname = (!isBrowser && nodeOs && typeof nodeOs.hostname === 'function')
    ? nodeOs.hostname()
    : 'browser-client';
  const platform = (typeof process !== 'undefined' && process.platform)
    ? process.platform
    : (typeof navigator !== 'undefined' ? navigator.platform : 'browser');
  const nodeVersion = (typeof process !== 'undefined' && process.version)
    ? process.version
    : 'browser';

  let deviceId = 'offline-device';
  if (nodeCrypto && typeof nodeCrypto.createHash === 'function') {
    deviceId = nodeCrypto
      .createHash('sha256')
      .update(hostname + '|' + platform)
      .digest('hex')
      .substring(0, 16);
  }

  let softwareVersion = '1.0.0';
  if (!isBrowser) {
    try {
      const pkg = require('../../package.json');
      softwareVersion = pkg.version || '1.0.0';
    } catch {
      // fallback
    }
  }

  return {
    timestamp: new Date().toISOString(),
    deviceId,
    softwareVersion,
    nodeVersion,
    platform,
    pipelineVersion: 'lunarsafe-1.0.0',
  };
}

export function computeSessionIntegrityHash(
  metadata: SessionMetadata
): string {
  const nodeCrypto: any = crypto;
  const canonical = JSON.stringify({
    timestamp: metadata.timestamp,
    deviceId: metadata.deviceId,
    softwareVersion: metadata.softwareVersion,
    nodeVersion: metadata.nodeVersion,
    platform: metadata.platform,
    pipelineVersion: metadata.pipelineVersion,
  });
  if (nodeCrypto && typeof nodeCrypto.createHash === 'function') {
    return nodeCrypto
      .createHash('sha256')
      .update(canonical)
      .digest('hex');
  }
  return '';
}
