import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  X,
  Shield,
  Zap,
  Building,
  Copy,
  ExternalLink,
  MessageCircle,
  Lock,
  Crown,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Language } from '../utils/i18n';
import {
  MonetizationConfig,
  getMonetizationConfig,
} from '../utils/monetizationConfig';
import {
  verifyLicenseKey,
  activateLicenseOnDevice,
  getActiveLicense,
  deactivateLicenseOnDevice,
  ActivatedLicense,
} from '../utils/licenseKeys';

interface SubscriptionProModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  isAdFree: boolean;
  onToggleAdFree: (enabled: boolean) => void;
  onOpenOwnerSettings: () => void;
}

export const SubscriptionProModal: React.FC<SubscriptionProModalProps> = ({
  isOpen,
  onClose,
  lang,
  isAdFree,
  onToggleAdFree,
  onOpenOwnerSettings,
}) => {
  const [config, setConfig] = useState<MonetizationConfig>(() =>
    getMonetizationConfig()
  );
  // Auto-detect Sri Lanka vs Global based on TimeZone, Offset (-330) or Language
  const isSriLanka = (() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const offset = new Date().getTimezoneOffset(); // -330 for Asia/Colombo
      return tz.includes('Colombo') || tz.includes('Sri_Lanka') || offset === -330 || lang === 'si';
    } catch {
      return lang === 'si';
    }
  })();
  const [copiedBank, setCopiedBank] = useState(false);

  // License Key Activation States
  const [licenseInput, setLicenseInput] = useState('');
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [licenseSuccess, setLicenseSuccess] = useState(false);
  const [currentLicense, setCurrentLicense] = useState<ActivatedLicense | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getMonetizationConfig());
      const active = getActiveLicense();
      setCurrentLicense(active);
      if (active) {
        onToggleAdFree(true);
      }
      setLicenseError(null);
      setLicenseSuccess(false);
    }
  }, [isOpen, onToggleAdFree]);

  if (!isOpen) return null;

  const handleCopyBank = () => {
    const text = `Bank: ${config.ownerBankName}\nAccount No: ${config.ownerAccountNo}\nName: ${config.ownerAccountName}\nBranch: ${config.ownerBranch}\nAmount: Rs. ${config.localPlanPriceLkr}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleSendSlipWhatsApp = () => {
    const cleanPhone = (config.ownerWhatsApp || '').replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello! I have made the payment of Rs. ${config.localPlanPriceLkr} for QuickInvoice Pro Subscription. Here is my payment deposit slip. Please send me my Pro Activation Key:`
    );
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleActivateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    setLicenseError(null);

    const entered = licenseInput.trim().toUpperCase();
    if (!entered) {
      setLicenseError(lang === 'si' ? 'කරුණාකර Activation Key එක ඇතුළත් කරන්න' : 'Please enter an activation key');
      return;
    }

    const verification = verifyLicenseKey(entered);
    if (!verification.isValid || !verification.planType) {
      setLicenseError(
        lang === 'si'
          ? 'වලංගු නොවන හෝ වැරදි Activation Key එකක්! (උදා: QPRO-1M-XXXX-XXXX)'
          : verification.error || 'Invalid or unrecognized activation key.'
      );
      return;
    }

    // Successfully verified! Activate on device
    activateLicenseOnDevice(entered, verification.planType, verification.expiresAt ?? null);
    onToggleAdFree(true);
    setCurrentLicense(getActiveLicense());
    setLicenseSuccess(true);
    setLicenseInput('');
  };

  const handleDeactivate = () => {
    deactivateLicenseOnDevice();
    onToggleAdFree(false);
    setCurrentLicense(null);
    setLicenseSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-md">
              <Crown className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>QuickInvoice Pro</span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-black text-emerald-400 border border-emerald-500/30">
                  {currentLicense ? 'Active' : 'Upgrade'}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                {lang === 'si'
                  ? 'අසීමිත පහසුකම් සහ දැන්වීම් රහිත Pro අත්දැකීම'
                  : 'Distraction-free, unlimited professional invoicing'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Active Pro Status Banner (If already activated) */}
          {currentLicense ? (
            <div className="rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <span>{lang === 'si' ? 'Pro Plan සක්‍රියයි!' : 'Pro Plan Active!'}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 uppercase font-mono">
                        {currentLicense.planType === 'lifetime' ? 'Lifetime' : currentLicense.planType === '1y' ? '1 Year' : '1 Month'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      {currentLicense.expiresAt
                        ? `Valid until: ${new Date(currentLicense.expiresAt).toLocaleDateString()}`
                        : 'Lifetime VIP Access · No Expiration'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="text-[10px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer underline"
                >
                  {lang === 'si' ? 'ඉවත් කරන්න' : 'Deactivate'}
                </button>
              </div>

              <div className="text-xs text-emerald-300/90 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/20 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  {lang === 'si'
                    ? 'සියලු දැන්වීම් (Ads) සම්පූර්ණයෙන්ම අක්‍රිය කර ඇත. අසීමිතව බිල්පත් සාදන්න!'
                    : 'All advertisements removed. Enjoy unlimited professional invoicing!'}
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Plan Switcher Pills */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  onClick={() => setSelectedPlan('lkr')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPlan === 'lkr'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🇱🇰 Sri Lanka Plan</span>
                  <span className="text-[10px] opacity-80">(Rs. {config.localPlanPriceLkr}/mo)</span>
                </button>
                <button
                  onClick={() => setSelectedPlan('usd')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPlan === 'usd'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🌍 Global Plan</span>
                  <span className="text-[10px] opacity-80">(${config.globalPlanPriceUsd}/mo)</span>
                </button>
              </div>

              {/* Pricing Highlight Card */}
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 p-4 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                  <Zap className="h-3.5 w-3.5" />
                  <span>
                    {selectedPlan === 'lkr'
                      ? 'දවසකට රුපියල් 16ක් වැනි ඉතාම සුළු මුදලක්'
                      : 'Less than $0.16 per day'}
                  </span>
                </div>

                <div>
                  <div className="text-3xl font-black text-white">
                    {selectedPlan === 'lkr' ? (
                      <>
                        <span className="text-lg font-bold text-emerald-400">Rs. </span>
                        {config.localPlanPriceLkr}
                        <span className="text-xs font-normal text-slate-400"> / මසකට</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-emerald-400">$</span>
                        {config.globalPlanPriceUsd}
                        <span className="text-xs font-normal text-slate-400"> / month</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {lang === 'si'
                      ? 'ඕනෑම වේලාවක අවලංගු කළ හැක · කිසිදු සැඟවුණු ගාස්තුවක් නැත'
                      : 'Instant unique license key provided via WhatsApp upon payment'}
                  </p>
                </div>
              </div>

              {/* Pro Benefits List */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {lang === 'si' ? 'Pro සමඟ ඔබට ලැබෙන දේ:' : 'Included in Pro:'}
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>100% Ad-Free (දැන්වීම් රහිතයි)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>WhatsApp 1-Tap Direct Sharing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Unlimited Saved Invoices & Clients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Ultra HD A4 Print / PDF Engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>LankaQR / PayPal Direct QR Pay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Priority Customer Support</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              {selectedPlan === 'lkr' ? (
                <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                      <Building className="h-4 w-4" />
                      <span>ලංකාවේ බැංකු ගිණුමට තැන්පත් කරන්න</span>
                    </div>
                    <button
                      onClick={handleCopyBank}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copiedBank ? 'Copied!' : 'Copy Details'}</span>
                    </button>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs space-y-1 font-mono text-slate-300">
                    <div><span className="text-slate-500">Bank:</span> <strong className="text-white">{config.ownerBankName}</strong></div>
                    <div><span className="text-slate-500">Account No:</span> <strong className="text-emerald-400 tracking-wider">{config.ownerAccountNo}</strong></div>
                    <div><span className="text-slate-500">Name:</span> <strong className="text-white">{config.ownerAccountName}</strong></div>
                    <div><span className="text-slate-500">Branch:</span> <strong className="text-slate-300">{config.ownerBranch}</strong></div>
                    <div><span className="text-slate-500">Amount:</span> <strong className="text-emerald-400">Rs. {config.localPlanPriceLkr}</strong></div>
                  </div>

                  <button
                    onClick={handleSendSlipWhatsApp}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>ගෙවීම් Slip පත යවා Pro Key එක ලබාගන්න</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-3">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Instant Global Checkout (Credit Card / PayPal)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Secure 256-bit encrypted checkout. Instantly activate your Pro license key.
                  </p>
                  <a
                    href={config.globalPaymentLink || 'https://paypal.me'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 py-2.5 px-4 text-xs font-black transition-all shadow-md cursor-pointer"
                  >
                    <span>Pay ${config.globalPlanPriceUsd} with Card / PayPal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </>
          )}

          {/* SECURE PRO ACTIVATION KEY INPUT FORM */}
          <form onSubmit={handleActivateLicense} className="rounded-xl border border-emerald-500/40 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Key className="h-4 w-4" />
              <span>{lang === 'si' ? 'ඔබට ලැබුණු Pro Activation Key එක ඇතුළත් කරන්න:' : 'Enter Your Pro Activation Key:'}</span>
            </div>

            <p className="text-[11px] text-slate-400">
              {lang === 'si'
                ? 'මුදල් ගෙවූ පසු හිමිකරුගෙන් (Owner) ඔබගේ WhatsApp එකට ලැබුණු රහස්‍ය Pro Key එක මෙහි ඇතුළත් කරන්න.'
                : 'Enter the unique Pro license key received upon payment confirmation.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={licenseInput}
                onChange={(e) => {
                  setLicenseInput(e.target.value);
                  setLicenseError(null);
                }}
                placeholder="QPRO-1M-XXXX-XXXX"
                className="flex-1 p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-mono font-bold text-white focus:border-emerald-500 focus:outline-none uppercase tracking-wider placeholder:text-slate-600"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shrink-0"
              >
                <Check className="h-4 w-4" />
                <span>{lang === 'si' ? 'Activate කරන්න' : 'Activate Pro'}</span>
              </button>
            </div>

            {licenseError && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/50 p-2 rounded-lg border border-red-500/30">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{licenseError}</span>
              </div>
            )}

            {licenseSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/70 p-2.5 rounded-lg border border-emerald-500/40 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{lang === 'si' ? 'Pro Plan සාර්ථකව සක්‍රිය විය! සියලු දැන්වීම් අයින් කරන ලදී.' : 'Pro successfully activated! Ads removed.'}</span>
              </div>
            )}
          </form>
        </div>

        {/* Modal Bottom Footer with Owner / Admin Access */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] shrink-0">
          <span className="text-slate-500">
            {lang === 'si' ? '100% පුද්ගලික දත්ත ආරක්ෂාව' : '100% Client-Side Privacy'}
          </span>

          {/* Discreet Owner Portal Button */}
          <button
            onClick={() => {
              onClose();
              onOpenOwnerSettings();
            }}
            className="flex items-center gap-1 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
            title="Owner & Monetization Controls"
          >
            <Lock className="h-3 w-3" />
            <span>{lang === 'si' ? 'Owner Portal' : 'Owner Portal'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
