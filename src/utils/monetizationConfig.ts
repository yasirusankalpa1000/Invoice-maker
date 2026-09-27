export interface MonetizationConfig {
  localPlanPriceLkr: number;
  globalPlanPriceUsd: number;
  ownerBankName: string;
  ownerAccountNo: string;
  ownerAccountName: string;
  ownerBranch: string;
  ownerWhatsApp: string;
  globalPaymentLink: string;
  adsenseClientId: string;
  adsenseBannerSlot: string;
  adsEnabled: boolean;
  adminPin: string;
  ownerEmail: string;
  recoveryEmailOrPhone: string;
  twoFactorEnabled: boolean;
  twoFactorMasterKey: string;
  totpSecret: string;
}

const MONETIZATION_STORAGE_KEY = 'quickinvoice_monetization_config_v1';

export const DEFAULT_MONETIZATION_CONFIG: MonetizationConfig = {
  localPlanPriceLkr: 500,
  globalPlanPriceUsd: 5,
  ownerBankName: 'Commercial Bank of Ceylon',
  ownerAccountNo: '8001234567',
  ownerAccountName: 'Yasiru Sankalpa',
  ownerBranch: 'Colombo Main Branch',
  ownerWhatsApp: '+94712345678',
  globalPaymentLink: 'https://paypal.me/yourusername',
  adsenseClientId: 'ca-pub-9928172938491823',
  adsenseBannerSlot: '8271625341',
  adsEnabled: true,
  adminPin: '1234',
  ownerEmail: 'yasirusankalpa2026@gmail.com',
  recoveryEmailOrPhone: 'yasirusankalpa2026@gmail.com',
  twoFactorEnabled: true,
  twoFactorMasterKey: 'YASIRU-2026-KEY',
  totpSecret: 'JBSWY3DPEHPK3PXP',
};

export function getMonetizationConfig(): MonetizationConfig {
  if (typeof window === 'undefined') return DEFAULT_MONETIZATION_CONFIG;
  try {
    const raw = localStorage.getItem(MONETIZATION_STORAGE_KEY);
    if (!raw) return DEFAULT_MONETIZATION_CONFIG;
    return { ...DEFAULT_MONETIZATION_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to parse monetization config:', e);
    return DEFAULT_MONETIZATION_CONFIG;
  }
}

export function saveMonetizationConfig(config: MonetizationConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MONETIZATION_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save monetization config:', e);
  }
}
