import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  Save,
  Key,
  DollarSign,
  Building,
  Phone,
  Globe,
  Radio,
  CheckCircle2,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  Mail,
  Smartphone,
  AlertTriangle,
  Fingerprint,
  ArrowLeft,
  QrCode,
  Check,
  Copy,
} from 'lucide-react';
import {
  MonetizationConfig,
  getMonetizationConfig,
  saveMonetizationConfig,
} from '../utils/monetizationConfig';
import { verifyTOTP, generateAuthenticatorQrCode } from '../utils/totp';
import {
  generateLicenseKey,
  getGeneratedKeysHistory,
  GeneratedLicenseKey,
  LicensePlanType,
} from '../utils/licenseKeys';
import { Language } from '../utils/i18n';

interface OwnerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onConfigUpdated: (config: MonetizationConfig) => void;
}

export const OwnerSettingsModal: React.FC<OwnerSettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onConfigUpdated,
}) => {
  const [currentConfig, setCurrentConfig] = useState<MonetizationConfig>(() =>
    getMonetizationConfig()
  );

  // Modal Stages:
  // 'login' -> 'settings' -> 'verify_2fa'
  const [modalStage, setModalStage] = useState<'login' | 'settings' | 'verify_2fa'>('login');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Google 2-Step Verification (TOTP)
  const [totpInput, setTotpInput] = useState('');
  const [totpError, setTotpError] = useState(false);
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);
  const [pendingAction, setPendingAction] = useState<'change_password' | 'save_settings' | null>(null);

  // Google Authenticator QR Code Setup
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Password Modification States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordMismatchError, setPasswordMismatchError] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Anti-Brute-Force & Rate Limiting
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);

  // Pro License Keys Generator State
  const [selectedLicensePlan, setSelectedLicensePlan] = useState<LicensePlanType>('1m');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [lastGeneratedKey, setLastGeneratedKey] = useState<GeneratedLicenseKey | null>(null);
  const [keysHistory, setKeysHistory] = useState<GeneratedLicenseKey[]>(() => getGeneratedKeysHistory());
  const [copiedKeyText, setCopiedKeyText] = useState(false);
  const [copiedMsgText, setCopiedMsgText] = useState(false);

  // AUTO-LOCK & RESET on open/close
  useEffect(() => {
    if (isOpen) {
      const cfg = getMonetizationConfig();
      setCurrentConfig(cfg);
      setKeysHistory(getGeneratedKeysHistory());
      setLastGeneratedKey(null);
      setModalStage('login');
      setPasswordInput('');
      setPasswordError(false);
      setShowPassword(false);
      setTotpInput('');
      setTotpError(false);
      setPendingAction(null);
      setSaveSuccess(false);
      setShowQrModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMismatchError(false);
      setPasswordChangeSuccess(false);
    } else {
      setModalStage('login');
      setPasswordInput('');
      setPasswordError(false);
      setTotpInput('');
      setTotpError(false);
      setPendingAction(null);
      setShowQrModal(false);
    }
  }, [isOpen]);

  // Lockout Countdown
  useEffect(() => {
    if (lockoutCountdown <= 0) return;
    const interval = setInterval(() => {
      setLockoutCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutCountdown]);

  // Generate QR Code for Google Authenticator Setup
  useEffect(() => {
    if (showQrModal && currentConfig.totpSecret) {
      generateAuthenticatorQrCode(
        currentConfig.ownerEmail || 'yasirusankalpa2026@gmail.com',
        currentConfig.totpSecret,
        'QuickInvoice Pro'
      ).then((url) => setQrCodeDataUrl(url));
    }
  }, [showQrModal, currentConfig.totpSecret, currentConfig.ownerEmail]);

  // STEP 1: Verify Initial Password
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutCountdown > 0) return;

    const entered = passwordInput.trim();
    const activePassword = String(currentConfig.adminPin || '1234').trim();

    if (entered === activePassword || (entered === '1234' && !currentConfig.adminPin)) {
      setPasswordError(false);
      setFailedAttempts(0);
      setModalStage('settings');
    } else {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      setPasswordError(true);
      if (nextFailures >= 3) {
        setLockoutCountdown(60);
      }
    }
  };

  // Trigger Google 2FA Challenge before password changes
  const handleRequestPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNew = newPassword.trim();
    if (!trimmedNew) return;

    if (trimmedNew !== confirmPassword.trim()) {
      setPasswordMismatchError(true);
      return;
    }

    setPasswordMismatchError(false);
    setTotpInput('');
    setTotpError(false);
    setPendingAction('change_password');
    setModalStage('verify_2fa');
  };

  // Trigger Google 2FA Challenge before saving settings modifications
  const handleRequestSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.trim() && newPassword.trim() !== confirmPassword.trim()) {
      setPasswordMismatchError(true);
      return;
    }
    setPasswordMismatchError(false);
    setTotpInput('');
    setTotpError(false);
    setPendingAction('save_settings');
    setModalStage('verify_2fa');
  };

  // STEP 2: Verify Real Google Authenticator TOTP or Backup Key
  const handleVerifyGoogle2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutCountdown > 0 || isVerifyingTotp) return;

    setIsVerifyingTotp(true);
    setTotpError(false);

    const entered = totpInput.trim();
    const secret = currentConfig.totpSecret || 'JBSWY3DPEHPK3PXP';
    const masterBackup = String(currentConfig.twoFactorMasterKey || 'YASIRU-2026-KEY').trim().toUpperCase();

    // Check TOTP code against Google Authenticator algorithm OR master backup key
    const isValidTotp = await verifyTOTP(entered, secret);
    const isMasterKey = entered.toUpperCase() === masterBackup;

    setIsVerifyingTotp(false);

    if (isValidTotp || isMasterKey) {
      setTotpError(false);

      if (pendingAction === 'change_password') {
        const updated = {
          ...currentConfig,
          adminPin: newPassword.trim(),
        };
        setCurrentConfig(updated);
        saveMonetizationConfig(updated);
        onConfigUpdated(updated);
        setPasswordChangeSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        setModalStage('settings');
        setTimeout(() => setPasswordChangeSuccess(false), 3500);
      } else if (pendingAction === 'save_settings') {
        let updated = { ...currentConfig };
        if (newPassword.trim() && newPassword.trim() === confirmPassword.trim()) {
          updated.adminPin = newPassword.trim();
        }
        setCurrentConfig(updated);
        saveMonetizationConfig(updated);
        onConfigUpdated(updated);
        setSaveSuccess(true);

        setTimeout(() => {
          setSaveSuccess(false);
          setModalStage('login'); // Auto-lock immediately upon saving!
          setPasswordInput('');
          onClose();
        }, 1200);
      }
    } else {
      setTotpError(true);
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      if (nextFailures >= 3) {
        setLockoutCountdown(60);
      }
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(currentConfig.totpSecret || 'JBSWY3DPEHPK3PXP');
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleGenerateKey = () => {
    const record = generateLicenseKey(selectedLicensePlan, customerNameInput);
    setLastGeneratedKey(record);
    setKeysHistory(getGeneratedKeysHistory());
    setCustomerNameInput('');
  };

  const handleCopySingleKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyText(true);
    setTimeout(() => setCopiedKeyText(false), 2000);
  };

  const handleCopyWhatsAppMessage = (key: string) => {
    const msg = `ස්තූතියි! ඔබගේ QuickInvoice Pro Activation Key එක: ${key}\n\nකරුණාකර App එකේ 'Pro Upgrade' මෙනුව වෙත ගොස් මෙම Key එක Paste කර Activate කරගන්න. දැන්වීම් (Ads) සම්පූර්ණයෙන්ම අක්‍රිය වනු ඇත!`;
    navigator.clipboard.writeText(msg);
    setCopiedMsgText(true);
    setTimeout(() => setCopiedMsgText(false), 2000);
  };

  const handleManualLock = () => {
    setModalStage('login');
    setPasswordInput('');
    setPasswordError(false);
    setTotpInput('');
  };

  const handleClose = () => {
    setModalStage('login');
    setPasswordInput('');
    setPasswordError(false);
    setTotpInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {lang === 'si' ? 'Owner / Admin පාලක පුවරුව' : 'Owner Control Panel'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {modalStage === 'settings'
                  ? lang === 'si'
                    ? '🔓 Unlocked (වෙනස්කම් සඳහා Google 2FA අවශ්‍ය වේ)'
                    : '🔓 Unlocked (Google 2FA required for changes)'
                  : modalStage === 'verify_2fa'
                  ? lang === 'si'
                    ? '🛡️ Google 2-Step Verification (දුරකථන App කේතය)'
                    : '🛡️ Google 2-Step Verification (App Code)'
                  : lang === 'si'
                  ? '🔒 Locked (මුරපදයෙන් සුරක්ෂිතයි)'
                  : '🔒 Password Protected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {modalStage === 'settings' && (
              <button
                type="button"
                onClick={handleManualLock}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg hover:bg-amber-500/20 transition-colors cursor-pointer"
                title="Lock Immediately"
              >
                <LogOut className="h-3 w-3" />
                <span>{lang === 'si' ? 'Lock කරන්න' : 'Lock'}</span>
              </button>
            )}
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Anti-Brute-Force Lockout Banner */}
        {lockoutCountdown > 0 && (
          <div className="bg-red-950/90 border-b border-red-500/40 p-3 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{lang === 'si' ? '🚨 ආරක්ෂක පියවරක්: උත්සාහයන් සීමා කර ඇත' : '🚨 Anti-Brute Force Lockout Active'}</span>
            </div>
            <p className="text-[11px] text-red-300">
              {lang === 'si'
                ? `වැරදි උත්සාහයන් නිසා තත්පර ${lockoutCountdown}ක් රැඳී සිටින්න.`
                : `Too many failed attempts. Locked for ${lockoutCountdown} seconds.`}
            </p>
          </div>
        )}

        {/* ================= STAGE 1: INITIAL PASSWORD LOGIN ================= */}
        {modalStage === 'login' && (
          <form onSubmit={handleVerifyPassword} className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <Lock className="h-7 w-7 stroke-[2.5]" />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white">
                {lang === 'si' ? 'Owner මුරපදය ඇතුළත් කරන්න' : 'Enter Owner Password'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'si'
                  ? 'මෙහි ඇතුල් විය හැක්කේ නියම හිමිකරුට (Owner) පමණි.'
                  : 'Restricted area protected with multi-layered verification.'}
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-2">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  disabled={lockoutCountdown > 0}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder={lang === 'si' ? 'මුරපදය ටයිප් කරන්න...' : 'Password...'}
                  className="w-full text-center text-sm font-mono font-bold rounded-xl border border-slate-700 bg-slate-950 p-3 pr-10 text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {passwordError && (
                <p className="text-xs text-red-400 font-semibold animate-pulse">
                  {lang === 'si' ? 'මුරපදය වැරදියි! නැවත උත්සාහ කරන්න.' : 'Incorrect password! Please try again.'}
                </p>
              )}
            </div>

            <div className="max-w-xs mx-auto pt-1">
              <button
                type="submit"
                disabled={lockoutCountdown > 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 px-4 text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Key className="h-4 w-4" />
                <span>{lang === 'si' ? 'Unlock කර ඇතුල් වන්න' : 'Unlock Settings'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= STAGE 2: REAL GOOGLE 2-STEP VERIFICATION (TOTP) ================= */}
        {modalStage === 'verify_2fa' && (
          <form onSubmit={handleVerifyGoogle2Fa} className="p-5 sm:p-6 space-y-4">
            <div className="text-center">
              {/* Google Brand Logo Accent */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 shadow-xl relative">
                <Fingerprint className="h-8 w-8 text-blue-400 stroke-[2.2]" />
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-black text-[9px]">
                  G
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-bold text-blue-400 border border-blue-500/20 mt-3 mb-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Google 2-Step Verification</span>
              </div>

              <h4 className="text-base font-extrabold text-white">
                {lang === 'si' ? 'Google Authenticator කේතය ඇතුළත් කරන්න' : 'Enter Google Authenticator Code'}
              </h4>

              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                {lang === 'si'
                  ? 'ඔබගේ දුරකථනයේ (Phone) Google Authenticator App එක විවෘත කර එහි පෙන්වන ඉලක්කම් 6ක කේතය මෙහි ඇතුළත් කරන්න.'
                  : 'Open the Google Authenticator app on your phone and enter the 6-digit code for your account.'}
              </p>
            </div>

            {/* Account Info Box (No OTP code leaked on screen!) */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-1 text-center">
              <div className="text-[11px] text-slate-400">
                {lang === 'si' ? 'ආරක්ෂිත ගිණුම (Protected Account):' : 'Protected Account:'}
              </div>
              <div className="text-xs font-mono font-bold text-emerald-400">
                {currentConfig.ownerEmail || 'yasirusankalpa2026@gmail.com'}
              </div>
            </div>

            {/* 6-Digit Code Input */}
            <div className="max-w-xs mx-auto space-y-2">
              <input
                type="text"
                maxLength={16}
                value={totpInput}
                disabled={lockoutCountdown > 0}
                onChange={(e) => {
                  setTotpInput(e.target.value);
                  setTotpError(false);
                }}
                placeholder="• • • • • •"
                className="w-full text-center text-xl font-mono font-bold tracking-widest rounded-xl border border-slate-700 bg-slate-950 p-3 text-white focus:border-blue-500 focus:outline-none placeholder:text-slate-600 uppercase"
                autoFocus
              />

              {totpError && (
                <div className="text-xs text-red-400 font-semibold space-y-1 text-center animate-pulse">
                  <p>{lang === 'si' ? 'කේතය වැරදියි! Google Authenticator එක පරීක්ෂා කරන්න.' : 'Invalid code! Check your Google Authenticator app.'}</p>
                  <p className="text-[10px] text-slate-400">
                    {lang === 'si' ? '(නැතහොත් Master Key එක ඇතුළත් කළ හැක)' : '(Or enter your Master Backup Key)'}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 max-w-xs mx-auto pt-1">
              <button
                type="submit"
                disabled={lockoutCountdown > 0 || isVerifyingTotp}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-400 hover:to-indigo-400 text-white py-3 px-4 text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {isVerifyingTotp
                    ? 'Verifying...'
                    : pendingAction === 'change_password'
                    ? (lang === 'si' ? 'සත්‍යාපනය කර මුරපදය මාරු කරන්න' : 'Verify & Update Password')
                    : (lang === 'si' ? 'සත්‍යාපනය කර වෙනස්කම් සුරකින්න' : 'Verify & Save Changes')}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 py-2 px-3 text-[11px] font-semibold transition-all cursor-pointer"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>{lang === 'si' ? 'QR Code එක (Setup)' : 'View QR Setup'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalStage('settings');
                    setTotpInput('');
                    setTotpError(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white py-2 px-3 text-[11px] font-semibold transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>{lang === 'si' ? 'ආපසු (Back)' : 'Cancel'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ================= STAGE 3: OWNER SETTINGS & CONFIGURATION ================= */}
        {modalStage === 'settings' && (
          <div className="p-4 sm:p-5 max-h-[75vh] overflow-y-auto space-y-4">
            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-950 border border-emerald-500/40 p-3 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{lang === 'si' ? 'සියලු සැකසුම් සුරැකිණි! Auto-locking...' : 'Settings successfully saved! Auto-locking...'}</span>
              </div>
            )}

            {/* Google 2FA Security Status Bar */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{lang === 'si' ? 'Google 2-Step Verification සක්‍රියයි' : 'Google 2-Step Verification Active'}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Phone Protected
                </span>
              </div>

              <p className="text-[11px] text-slate-300">
                {lang === 'si'
                  ? 'ඔබගේ දුරකථනයේ Google Authenticator App එක නොමැතිව කිසිවෙකුට මෙම සැකසුම් හෝ මුරපදය වෙනස් කළ නොහැක.'
                  : 'Modifications are strictly locked behind your phone’s Google Authenticator app.'}
              </p>
            </div>

            {/* Google Authenticator Setup & Secret Key Box */}
            <div className="p-3.5 rounded-xl border border-blue-500/40 bg-blue-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                  <Fingerprint className="h-4 w-4" />
                  <span>Google Authenticator Setup</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2.5 py-1 rounded-lg hover:bg-blue-500/30 transition-all cursor-pointer"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>{lang === 'si' ? 'QR Code එක Scan කරන්න' : 'Scan QR Code'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 flex items-center gap-1">
                    <Mail className="h-3 w-3 text-blue-400" />
                    <span>Owner Email</span>
                  </label>
                  <input
                    type="email"
                    value={currentConfig.ownerEmail}
                    onChange={(e) =>
                      setCurrentConfig({ ...currentConfig, ownerEmail: e.target.value })
                    }
                    placeholder="yourname@gmail.com"
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-medium text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 flex items-center gap-1">
                    <Key className="h-3 w-3 text-amber-400" />
                    <span>Master Backup 2FA Key</span>
                  </label>
                  <input
                    type="text"
                    value={currentConfig.twoFactorMasterKey}
                    onChange={(e) =>
                      setCurrentConfig({ ...currentConfig, twoFactorMasterKey: e.target.value })
                    }
                    placeholder="YASIRU-2026-KEY"
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-mono font-bold text-amber-300 focus:border-amber-500 focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            {/* PRO LICENSE KEY GENERATOR (Unique keys for each customer) */}
            <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Key className="h-4 w-4" />
                  <span>{lang === 'si' ? 'පාරිභෝගිකයන්ට Pro Activation Keys හැදීම' : 'Pro License Key Generator'}</span>
                </div>
                <span className="text-[10px] text-emerald-300 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Unique Keys
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {lang === 'si'
                  ? 'සල්ලි ගෙවූ පාරිභෝගිකයාට වෙන වෙනම Unique Pro Key එකක් Generate කර WhatsApp මඟින් යවන්න. එක කෙනෙකුගේ Key එකක් තව කෙනෙකුට භාවිතා කළ නොහැක.'
                  : 'Generate a unique mathematical license key for each paying customer so keys cannot be shared.'}
              </p>

              {/* Plan Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLicensePlan('1m')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    selectedLicensePlan === '1m'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
                  }`}
                >
                  1 Month Pass
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLicensePlan('1y')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    selectedLicensePlan === '1y'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
                  }`}
                >
                  1 Year Pass
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLicensePlan('lifetime')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    selectedLicensePlan === 'lifetime'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
                  }`}
                >
                  Lifetime VIP
                </button>
              </div>

              {/* Customer Reference */}
              <div>
                <input
                  type="text"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  placeholder={lang === 'si' ? 'පාරිභෝගිකයාගේ නම හෝ WhatsApp (උදා: Kasun - 0771234567)' : 'Customer Name or WhatsApp (Optional)'}
                  className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerateKey}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 py-2.5 px-4 text-xs font-black transition-all shadow-md cursor-pointer"
              >
                <Key className="h-3.5 w-3.5" />
                <span>{lang === 'si' ? 'අලුත් Unique Pro Key එකක් සාදන්න (Generate Key)' : 'Generate Unique Pro Key'}</span>
              </button>

              {/* Newly Generated Key Display Box */}
              {lastGeneratedKey && (
                <div className="rounded-xl border border-emerald-500/50 bg-slate-950 p-3 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      {lang === 'si' ? 'නිකුත් කළ අලුත්ම Pro Key එක:' : 'Newly Generated Key:'}
                    </span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono uppercase">
                      {lastGeneratedKey.planType}
                    </span>
                  </div>

                  <div className="text-center py-1">
                    <span className="text-lg sm:text-xl font-mono font-black text-emerald-300 tracking-wider bg-emerald-950/80 px-3 py-1 rounded border border-emerald-500/30 inline-block">
                      {lastGeneratedKey.key}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopySingleKey(lastGeneratedKey.key)}
                      className="flex-1 flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedKeyText ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedKeyText ? 'Key Copied!' : 'Copy Key'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyWhatsAppMessage(lastGeneratedKey.key)}
                      className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedMsgText ? <Check className="h-3.5 w-3.5 text-white" /> : <Smartphone className="h-3.5 w-3.5" />}
                      <span>{copiedMsgText ? 'Copied for WhatsApp!' : 'Copy for WhatsApp'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Previously Generated Keys History */}
              {keysHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1.5">
                    {lang === 'si' ? 'මෑතකදී නිකුත් කළ Keys (Recent Generated Keys):' : 'Recent Generated Keys:'}
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {keysHistory.slice(0, 5).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800 text-[11px] font-mono"
                      >
                        <div className="truncate mr-2">
                          <span className="text-white font-bold">{item.key}</span>
                          {item.customerName && (
                            <span className="text-slate-400 ml-1.5 font-sans">({item.customerName})</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopySingleKey(item.key)}
                          className="text-slate-400 hover:text-emerald-400 p-1 cursor-pointer shrink-0"
                          title="Copy Key"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 0.5: PRIVATE PASSWORD CHANGER (Requires Google 2FA) */}
            <form onSubmit={handleRequestPasswordChange} className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Key className="h-4 w-4" />
                  <span>{lang === 'si' ? 'ඔබගේ මුරපදය මාරු කිරීම (Google 2FA මඟින්)' : 'Change Owner Password (Google 2FA Protected)'}</span>
                </div>
                <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {lang === 'si' ? '2FA ආරක්ෂිතයි' : '2FA Protected'}
                </span>
              </div>

              {passwordChangeSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-950/90 border border-emerald-500/50 p-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{lang === 'si' ? 'ඔබගේ නව මුරපදය සාර්ථකව යාවත්කාලීන විය!' : 'New password updated successfully!'}</span>
                </div>
              )}

              {passwordMismatchError && (
                <div className="text-xs text-red-400 font-medium">
                  {lang === 'si' ? 'මුරපද දෙක එකිනෙකට නොගැලපේ!' : 'Passwords do not match!'}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    {lang === 'si' ? 'නව මුරපදය (New Password)' : 'New Password'}
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordMismatchError(false);
                    }}
                    placeholder={lang === 'si' ? 'කැමති ඕනෑම නව මුරපදයක්...' : 'Type new password...'}
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-mono font-bold text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    {lang === 'si' ? 'නව මුරපදය නැවත තහවුරු කරන්න' : 'Confirm Password'}
                  </label>
                  <input
                    type="text"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordMismatchError(false);
                    }}
                    placeholder={lang === 'si' ? 'මුරපදය නැවත ටයිප් කරන්න...' : 'Confirm password...'}
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-mono font-bold text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {newPassword.trim().length > 0 && (
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 py-1.5 px-3 text-xs font-black transition-all cursor-pointer shadow-sm"
                >
                  <Fingerprint className="h-3.5 w-3.5" />
                  <span>{lang === 'si' ? 'Google 2FA කේතය ගසා මුරපදය මාරු කරන්න' : 'Verify via Google 2FA & Update Password'}</span>
                </button>
              )}
            </form>

            {/* General Settings Form */}
            <form onSubmit={handleRequestSaveSettings} className="space-y-4">
              {/* Section 1: Pricing */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <DollarSign className="h-4 w-4" />
                  <span>{lang === 'si' ? 'මිල නියම කිරීම් (Subscription Pricing)' : 'Subscription Pricing'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      {lang === 'si' ? '🇱🇰 ලංකාවේ මිල (LKR)' : 'Sri Lanka Price (LKR)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500">Rs.</span>
                      <input
                        type="number"
                        value={currentConfig.localPlanPriceLkr}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            localPlanPriceLkr: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      {lang === 'si' ? '🌍 පිටරට මිල (USD)' : 'Global Price (USD)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500">$</span>
                      <input
                        type="number"
                        value={currentConfig.globalPlanPriceUsd}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            globalPlanPriceUsd: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Sri Lanka Bank & WhatsApp */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                  <Building className="h-4 w-4" />
                  <span>{lang === 'si' ? 'ලංකාවේ බැංකු ගිණුම් විස්තර (සල්ලි ලබාගැනීමට)' : 'Sri Lanka Bank & Payment Slip Receipt'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">බැංකුවේ නම (Bank)</label>
                    <input
                      type="text"
                      value={currentConfig.ownerBankName}
                      onChange={(e) =>
                        setCurrentConfig({ ...currentConfig, ownerBankName: e.target.value })
                      }
                      placeholder="Commercial Bank, Sampath, etc."
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ගිණුම් අංකය (Account No)</label>
                    <input
                      type="text"
                      value={currentConfig.ownerAccountNo}
                      onChange={(e) =>
                        setCurrentConfig({ ...currentConfig, ownerAccountNo: e.target.value })
                      }
                      placeholder="8001234567"
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ගිණුම් හිමියාගේ නම (Account Name)</label>
                    <input
                      type="text"
                      value={currentConfig.ownerAccountName}
                      onChange={(e) =>
                        setCurrentConfig({ ...currentConfig, ownerAccountName: e.target.value })
                      }
                      placeholder="Yasiru Sankalpa"
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ශාඛාව (Branch)</label>
                    <input
                      type="text"
                      value={currentConfig.ownerBranch}
                      onChange={(e) =>
                        setCurrentConfig({ ...currentConfig, ownerBranch: e.target.value })
                      }
                      placeholder="Main Branch"
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{lang === 'si' ? 'Bank Slip එවීමට ඔබේ WhatsApp අංකය' : 'WhatsApp for Payment Slips'}</span>
                  </label>
                  <input
                    type="text"
                    value={currentConfig.ownerWhatsApp}
                    onChange={(e) =>
                      setCurrentConfig({ ...currentConfig, ownerWhatsApp: e.target.value })
                    }
                    placeholder="+947XXXXXXXX"
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 3: Global Payment Link */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Globe className="h-4 w-4" />
                  <span>{lang === 'si' ? 'පිටරට අයට ගෙවීමට Payment Link' : 'Global Payment Link (PayPal / Stripe)'}</span>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">PayPal / Stripe Checkout URL</label>
                  <input
                    type="url"
                    value={currentConfig.globalPaymentLink}
                    onChange={(e) =>
                      setCurrentConfig({ ...currentConfig, globalPaymentLink: e.target.value })
                    }
                    placeholder="https://paypal.me/yourusername"
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 4: Google AdSense Control */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                    <Radio className="h-4 w-4" />
                    <span>Google AdSense Controls</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentConfig.adsEnabled}
                      onChange={(e) =>
                        setCurrentConfig({ ...currentConfig, adsEnabled: e.target.checked })
                      }
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                    />
                    <span>Ads සක්‍රියයි (Active)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">AdSense Publisher ID</label>
                    <input
                      type="text"
                      value={currentConfig.adsenseClientId}
                      onChange={(e) =>
                        setCurrentConfig({ ...currentConfig, adsenseClientId: e.target.value })
                      }
                      placeholder="ca-pub-XXXXXXXXXXXXX"
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Banner Slot ID</label>
                    <input
                      type="text"
                      value={currentConfig.adsenseBannerSlot}
                      onChange={(e) =>
                        setCurrentConfig({ ...currentConfig, adsenseBannerSlot: e.target.value })
                      }
                      placeholder="8271625341"
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Save All Button (Triggers Google 2FA) */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 py-3 px-4 text-xs font-black transition-all shadow-md cursor-pointer"
                >
                  <Fingerprint className="h-4 w-4" />
                  <span>{lang === 'si' ? 'Google 2FA මඟින් තහවුරු කර සුරකින්න (Save via Google 2FA)' : 'Authorize & Save All via Google 2FA'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* QR Code Setup Sub-Modal */}
        {showQrModal && (
          <div className="fixed inset-0 z-[10060] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-sm rounded-2xl border border-blue-500/40 bg-slate-900 p-5 shadow-2xl text-center space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">Google Authenticator Setup</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                {lang === 'si'
                  ? 'ඔබගේ Phone එකේ Google Authenticator App එකෙන් පහත QR කේතය Scan කරන්න.'
                  : 'Scan this QR code with your Google Authenticator app on your phone.'}
              </p>

              {qrCodeDataUrl ? (
                <div className="mx-auto inline-block p-3 rounded-2xl bg-white shadow-xl">
                  <img src={qrCodeDataUrl} alt="Google Authenticator QR Code" className="w-44 h-44 mx-auto" />
                </div>
              ) : (
                <div className="h-44 w-44 mx-auto flex items-center justify-center text-xs text-slate-500">
                  Generating QR...
                </div>
              )}

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-left space-y-1">
                <span className="text-[10px] text-slate-400 block">Secret Key (Manual Entry):</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-300 tracking-wider">
                    {currentConfig.totpSecret || 'JBSWY3DPEHPK3PXP'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded"
                  >
                    {copiedSecret ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 py-2.5 text-xs font-bold transition-all cursor-pointer"
              >
                {lang === 'si' ? 'හරි, මම Scan කර ගත්තා' : 'Done, I have scanned it'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
