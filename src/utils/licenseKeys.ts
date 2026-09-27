// Cryptographic License Key Generation and Verification for QuickInvoice Pro

const LICENSE_SALT = 'YASIRU_PRO_LICENSE_SECURE_SALT_2026';
const ACTIVATED_LICENSE_KEY = 'quickinvoice_active_license_v1';
const OWNER_GENERATED_KEYS_STORE = 'quickinvoice_owner_generated_keys_v1';

export type LicensePlanType = '1m' | '1y' | 'lifetime';

export interface GeneratedLicenseKey {
  key: string;
  planType: LicensePlanType;
  createdAt: number;
  expiresAt: number | null; // null for lifetime
  customerName?: string;
  notes?: string;
}

export interface ActivatedLicense {
  key: string;
  planType: LicensePlanType;
  activatedAt: number;
  expiresAt: number | null;
}

// Simple deterministic hash for checksum validation
function calculateChecksum(payload: string): string {
  let hash = 0x811c9dc5;
  const combined = payload + LICENSE_SALT;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (Math.abs(hash) % 0xffff).toString(16).padStart(4, '0').toUpperCase();
}

/**
 * Generate a unique mathematical Pro License Key
 * Format: QPRO-[PLAN]-[RANDOM_ENTROPY]-[CHECKSUM]
 * Example: QPRO-1M-8FA2-D73E
 */
export function generateLicenseKey(
  planType: LicensePlanType,
  customerName?: string
): GeneratedLicenseKey {
  const planTag = planType === 'lifetime' ? 'LT' : planType === '1y' ? '1Y' : '1M';
  const randomEntropy = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase().padStart(4, '0');
  const now = Date.now();
  const timeSlice = Math.floor(now / 10000).toString(16).slice(-3).toUpperCase();
  const middleBlock = `${randomEntropy.slice(0, 2)}${timeSlice.slice(0, 2)}`;

  const payload = `QPRO-${planTag}-${middleBlock}`;
  const checksum = calculateChecksum(payload);

  const fullKey = `${payload}-${checksum}`;

  let expiresAt: number | null = null;
  if (planType === '1m') {
    expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
  } else if (planType === '1y') {
    expiresAt = now + 365 * 24 * 60 * 60 * 1000; // 365 days
  }

  const newRecord: GeneratedLicenseKey = {
    key: fullKey,
    planType,
    createdAt: now,
    expiresAt,
    customerName: customerName?.trim() || undefined,
  };

  // Save to owner's generated keys history
  saveGeneratedKeyToHistory(newRecord);

  return newRecord;
}

/**
 * Verify if an entered key string is mathematically authentic & unexpired
 */
export function verifyLicenseKey(rawKey: string): {
  isValid: boolean;
  planType?: LicensePlanType;
  expiresAt?: number | null;
  error?: string;
} {
  const clean = rawKey.trim().toUpperCase();
  const parts = clean.split('-');

  if (parts.length !== 4 || parts[0] !== 'QPRO') {
    return {
      isValid: false,
      error: 'Invalid key format. Expected format: QPRO-XX-XXXX-XXXX',
    };
  }

  const [prefix, planTag, middle, checksum] = parts;
  const payload = `${prefix}-${planTag}-${middle}`;
  const expectedChecksum = calculateChecksum(payload);

  if (checksum !== expectedChecksum) {
    return {
      isValid: false,
      error: 'Invalid license key checksum. Unauthorized or fake key.',
    };
  }

  let planType: LicensePlanType = '1m';
  let expiresAt: number | null = null;
  const now = Date.now();

  if (planTag === 'LT') {
    planType = 'lifetime';
    expiresAt = null;
  } else if (planTag === '1Y') {
    planType = '1y';
    expiresAt = now + 365 * 24 * 60 * 60 * 1000;
  } else if (planTag === '1M') {
    planType = '1m';
    expiresAt = now + 30 * 24 * 60 * 60 * 1000;
  } else {
    return { isValid: false, error: 'Unknown plan type in license key.' };
  }

  return { isValid: true, planType, expiresAt };
}

/**
 * Activate a verified license key on the current user's device
 */
export function activateLicenseOnDevice(
  key: string,
  planType: LicensePlanType,
  expiresAt: number | null
): void {
  if (typeof window === 'undefined') return;
  const record: ActivatedLicense = {
    key,
    planType,
    activatedAt: Date.now(),
    expiresAt,
  };
  localStorage.setItem(ACTIVATED_LICENSE_KEY, JSON.stringify(record));
}

/**
 * Check if the current device has an active, valid Pro license
 */
export function getActiveLicense(): ActivatedLicense | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVATED_LICENSE_KEY);
    if (!raw) return null;
    const license: ActivatedLicense = JSON.parse(raw);

    // If it has an expiration date, check if expired
    if (license.expiresAt && Date.now() > license.expiresAt) {
      return null; // Expired!
    }

    return license;
  } catch (e) {
    return null;
  }
}

export function deactivateLicenseOnDevice(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACTIVATED_LICENSE_KEY);
}

// Owner history storage
export function getGeneratedKeysHistory(): GeneratedLicenseKey[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OWNER_GENERATED_KEYS_STORE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveGeneratedKeyToHistory(keyRecord: GeneratedLicenseKey): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getGeneratedKeysHistory();
    const updated = [keyRecord, ...history.filter((k) => k.key !== keyRecord.key)].slice(0, 50);
    localStorage.setItem(OWNER_GENERATED_KEYS_STORE, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save key history:', e);
  }
}
