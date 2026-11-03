/**
 * LunarSafe Mission Software — Persistent Scan Store
 * Team Rocket · AEROX Club · Parul University · Project Head: Darshan Patil
 *
 * Persists up to 50 ScanRecords in localStorage ('lunarsafe_scan_history') and file system in Node.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ScanRecord } from './scanRecord';
import { encryptData, decryptData, EncryptedPayload } from './encryption';

const nodeFs: any = fs;
const nodePath: any = path;

const LEGACY_STORAGE_KEY = 'lunarsafe_scan_history';
const STORAGE_KEY = 'lunarsafe_nasa_scan_history';
const MAX_SCANS = 50;

type ScanCallback = (scans: ScanRecord[]) => void;

let inMemoryScans: ScanRecord[] = [];
const subscribers = new Set<ScanCallback>();

// Helper to filter out any pre-NASA ISRO test records
function sanitizeNasaScans(records: any[]): ScanRecord[] {
  if (!Array.isArray(records)) return [];
  return records.filter(s => {
    if (!s || typeof s !== 'object') return false;
    const inst = String(s.instrument || '');
    const id = String(s.id || '');
    const reasoning = String(s.reasoning || '');
    if (inst.includes('TMC-2') || inst.includes('ISRO') || inst.includes('OHRC')) return false;
    if (id.includes('isro') || id.includes('tmc2')) return false;
    if (reasoning.includes('ISRO')) return false;
    return true;
  });
}

// Attempt to load initial state from localStorage (browser) or file (Node)
function loadInitialScans(): ScanRecord[] {
  if (typeof window !== 'undefined') {
    if (window.localStorage) {
      try {
        // Automatically purge any old legacy pre-NASA test scans from browser storage
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const sanitized = sanitizeNasaScans(parsed);
          return sanitized;
        }
      } catch (e) {
        console.warn('[ScanStore] Failed to load scans from localStorage:', e);
      }
    }
    return [];
  }

  // Node.js fallback
  if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
    try {
      const cwd = process.cwd();
      const encPath = nodePath?.resolve ? nodePath.resolve(cwd, '.scan_history.enc') : '.scan_history.enc';
      const jsonPath = nodePath?.resolve ? nodePath.resolve(cwd, '.scan_history.json') : '.scan_history.json';
      const password = typeof process !== 'undefined' && process.env ? process.env.ENCRYPT_SCAN_PASSWORD : undefined;

      if (nodeFs?.existsSync && nodeFs.existsSync(encPath) && password) {
        const encContent = JSON.parse(nodeFs.readFileSync(encPath, 'utf8')) as EncryptedPayload;
        const salt = Buffer.from(encContent.salt, 'base64');
        const iv = Buffer.from(encContent.iv, 'base64');
        const ciphertext = Buffer.from(encContent.ciphertext, 'base64');
        const tag = Buffer.from(encContent.tag, 'base64');
        const crypto = require('crypto');
        const key = crypto.pbkdf2Sync(password, salt, encContent.iterations || 100000, 32, 'sha256');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
        const parsed = JSON.parse(plaintext);
        if (Array.isArray(parsed)) return parsed;
      } else if (nodeFs?.existsSync && nodeFs.existsSync(jsonPath)) {
        const fileData = nodeFs.readFileSync(jsonPath, 'utf8');
        const parsed = JSON.parse(fileData);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
  }
  return [];
}

export async function loadScans(): Promise<ScanRecord[]> {
  if (typeof window !== 'undefined') {
    if (window.localStorage) {
      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const sanitized = sanitizeNasaScans(parsed);
          inMemoryScans = sanitized;
          return sanitized;
        }
      } catch {
        // ignore
      }
    }
    return inMemoryScans;
  }

  if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
    const cwd = process.cwd();
    const encPath = nodePath?.resolve ? nodePath.resolve(cwd, '.scan_history.enc') : '.scan_history.enc';
    const jsonPath = nodePath?.resolve ? nodePath.resolve(cwd, '.scan_history.json') : '.scan_history.json';
    const password = typeof process !== 'undefined' && process.env ? process.env.ENCRYPT_SCAN_PASSWORD : undefined;

    if (nodeFs?.existsSync && nodeFs.existsSync(encPath)) {
      if (!password) {
        throw new Error('Encrypted scan history found but ENCRYPT_SCAN_PASSWORD is not set');
      }
      const encContent = JSON.parse(nodeFs.readFileSync(encPath, 'utf8')) as EncryptedPayload;
      const plaintext = await decryptData(encContent, password);
      const parsed = JSON.parse(plaintext);
      inMemoryScans = sanitizeNasaScans(parsed);
      return inMemoryScans;
    }

    if (nodeFs?.existsSync && nodeFs.existsSync(jsonPath)) {
      const parsed = JSON.parse(nodeFs.readFileSync(jsonPath, 'utf8'));
      inMemoryScans = sanitizeNasaScans(parsed);
      return inMemoryScans;
    }
  }

  return [];
}

// Save state to persistent storage
async function persistScans(scans: ScanRecord[]): Promise<void> {
  if (typeof window !== 'undefined') {
    if (window.localStorage) {
      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        if (scans.length === 0) {
          window.localStorage.removeItem(STORAGE_KEY);
        } else {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
        }
      } catch (e) {
        console.warn('[ScanStore] Failed to save scans to localStorage:', e);
      }
    }
    return;
  }

  if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
    const cwd = process.cwd();
    const encPath = nodePath?.resolve ? nodePath.resolve(cwd, '.scan_history.enc') : '.scan_history.enc';
    const jsonPath = nodePath?.resolve ? nodePath.resolve(cwd, '.scan_history.json') : '.scan_history.json';

    if (scans.length === 0) {
      if (nodeFs?.existsSync && nodeFs.existsSync(encPath)) {
        try { nodeFs.unlinkSync(encPath); } catch {}
      }
      if (nodeFs?.existsSync && nodeFs.existsSync(jsonPath)) {
        try { nodeFs.unlinkSync(jsonPath); } catch {}
      }
      return;
    }

    const envObj = typeof process !== 'undefined' && process.env ? process.env : {};
    const useEncryption = envObj.ENCRYPT_SCAN_HISTORY === 'true';
    const password = envObj.ENCRYPT_SCAN_PASSWORD;

    if (useEncryption && password) {
      // Save encrypted
      const plaintext = JSON.stringify(scans, null, 2);
      const encrypted = await encryptData(plaintext, password);
      if (nodeFs?.writeFileSync) {
        nodeFs.writeFileSync(encPath, JSON.stringify(encrypted, null, 2), 'utf8');
      }
    } else {
      // Save plaintext (backward compatible)
      if (nodeFs?.writeFileSync) {
        nodeFs.writeFileSync(jsonPath, JSON.stringify(scans, null, 2), 'utf8');
      }
    }
  }
}

// Initialize on module load
inMemoryScans = loadInitialScans();

/**
 * Adds a new ScanRecord to the store.
 * Caps history at 50 records; oldest drops when cap exceeded.
 */
export function addScan(record: ScanRecord): void {
  // Ensure unified field names are populated directly from record properties
  if (record.hazardPatchCount === undefined) {
    record.hazardPatchCount = record.craterCount;
  }
  if (record.hazardCount === undefined) {
    record.hazardCount = record.hazardPatchCount ?? record.craterCount;
  }
  if (record.safeZoneCount === undefined) {
    record.safeZoneCount = record.contiguousZoneCount;
  }

  // Prevent duplicate by id
  const existingIdx = inMemoryScans.findIndex(s => s.id === record.id);
  if (existingIdx >= 0) {
    inMemoryScans[existingIdx] = record;
  } else {
    inMemoryScans.unshift(record); // newest first
  }

  // Cap at 50 records (drop oldest from the end)
  if (inMemoryScans.length > MAX_SCANS) {
    inMemoryScans = inMemoryScans.slice(0, MAX_SCANS);
  }

  persistScans(inMemoryScans).catch(() => {});
  notifySubscribers();

  if (typeof window !== 'undefined') {
    try {
      fetch('/api/scan/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }
}

/**
 * Returns all stored scan records (newest first).
 */
export function getAllScans(): ScanRecord[] {
  // If in browser, refresh from localStorage in case of cross-tab or external update
  if (typeof window !== 'undefined') {
    if (window.localStorage) {
      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            inMemoryScans = sanitizeNasaScans(parsed);
          }
        }
      } catch {
        // ignore
      }
    }
    return [...inMemoryScans];
  }

  if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
    // Refresh from file in Node.js
    try {
      const cwd = process.cwd();
      const encPath = nodePath?.resolve ? nodePath.resolve(cwd, '.scan_history.enc') : '.scan_history.enc';
      const jsonPath = nodePath?.resolve ? nodePath.resolve(cwd, '.scan_history.json') : '.scan_history.json';
      const password = typeof process !== 'undefined' && process.env ? process.env.ENCRYPT_SCAN_PASSWORD : undefined;

      if (nodeFs?.existsSync && nodeFs.existsSync(encPath) && password) {
        const encContent = JSON.parse(nodeFs.readFileSync(encPath, 'utf8')) as EncryptedPayload;
        const salt = Buffer.from(encContent.salt, 'base64');
        const iv = Buffer.from(encContent.iv, 'base64');
        const ciphertext = Buffer.from(encContent.ciphertext, 'base64');
        const tag = Buffer.from(encContent.tag, 'base64');
        const crypto = require('crypto');
        const key = crypto.pbkdf2Sync(password, salt, encContent.iterations || 100000, 32, 'sha256');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
        const parsed = JSON.parse(plaintext);
        if (Array.isArray(parsed)) inMemoryScans = parsed;
      } else if (nodeFs?.existsSync && nodeFs.existsSync(jsonPath)) {
        const fileData = nodeFs.readFileSync(jsonPath, 'utf8');
        const parsed = JSON.parse(fileData);
        if (Array.isArray(parsed)) inMemoryScans = parsed;
      }
    } catch {
      // ignore
    }
  }
  return [...inMemoryScans];
}

/**
 * Retrieves a single scan by its unique ID.
 */
export function getScanById(id: string): ScanRecord | undefined {
  const all = getAllScans();
  return all.find(s => s.id === id);
}

/**
 * Clears all scan history.
 */
export function clearAllScans(): void {
  inMemoryScans = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  persistScans([]).catch(() => {});
  notifySubscribers();
}

/**
 * Subscribes to updates when scans are added or cleared.
 * Returns an unsubscribe cleanup function.
 */
export function subscribe(callback: ScanCallback): () => void {
  subscribers.add(callback);
  // Immediate trigger with current records
  callback([...inMemoryScans]);
  return () => {
    subscribers.delete(callback);
  };
}

function notifySubscribers(): void {
  const current = [...inMemoryScans];
  subscribers.forEach(cb => {
    try {
      cb(current);
    } catch (err) {
      console.error('[ScanStore] Subscriber callback error:', err);
    }
  });
}
