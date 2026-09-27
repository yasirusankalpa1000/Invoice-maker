import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Printer,
  Download,
  Loader2,
  Sparkles,
  RotateCcw,
  Globe,
  Coins,
  ChevronDown,
  Check,
  History,
  Edit3,
  Eye,
  Coffee,
  Smartphone,
  Plus,
  TrendingUp,
  Menu,
  X,
  Users,
  Package,
  Database,
  Building,
  User,
  CreditCard,
  QrCode,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Crown,
  Lock,
} from 'lucide-react';
import { CURRENCIES } from '../types/invoice';
import { translations, Language, SUPPORTED_LANGUAGES } from '../utils/i18n';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface NavbarProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  currency: string;
  onCurrencyChange: (currencyCode: string) => void;
  onOpenAiModal: () => void;
  onNewInvoice?: () => void;
  onResetSample: () => void;
  onDownloadPdf: () => void;
  onPrint?: () => void;
  isDownloading?: boolean;
  onOpenRecentInvoices: () => void;
  onOpenReports?: () => void;
  onOpenClients?: () => void;
  onOpenProducts?: () => void;
  onOpenBackup?: () => void;
  recentCount?: number;
  activeTab: 'editor' | 'preview';
  onTabChange: (tab: 'editor' | 'preview') => void;
  onOpenSupportModal?: () => void;
  onOpenOwnerSettings?: () => void;
  isAdFree?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onLanguageChange,
  currency,
  onCurrencyChange,
  onOpenAiModal,
  onNewInvoice,
  onResetSample,
  onDownloadPdf,
  onPrint,
  isDownloading = false,
  onOpenRecentInvoices,
  onOpenReports,
  onOpenClients,
  onOpenProducts,
  onOpenBackup,
  recentCount = 0,
  activeTab,
  onTabChange,
  onOpenSupportModal,
  onOpenOwnerSettings,
  isAdFree = false,
}) => {
  const t = translations[lang];
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close desktop language menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(event.target as Node)
      ) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  // Jump to section shortcut handler
  const handleJumpToSection = (sectionId: string) => {
    setMobileDrawerOpen(false);
    if (activeTab !== 'editor') {
      onTabChange('editor');
    }
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2', 'ring-offset-slate-950');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2', 'ring-offset-slate-950');
        }, 1500);
      }
    }, 120);
  };

  const handleJumpToPreview = () => {
    setMobileDrawerOpen(false);
    onTabChange('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <>
      <header className="no-print sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md w-full max-w-full">
        {/* Row 1: Brand & Top Tools */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2 sm:py-2.5 gap-2">
          {/* Brand identity */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/10">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-none">
                  {t.appTitle}
                </span>
                <span className="rounded bg-emerald-500/10 px-1 py-0.2 text-[9px] font-bold text-emerald-400 border border-emerald-500/20 hidden sm:inline">
                  Free
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-400 mt-0.5">
                {t.badge}
              </p>
            </div>
          </div>

          {/* Desktop Controls (Shown on lg and above screens) */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Language Switcher Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:text-white transition-colors cursor-pointer"
                title="Change Language / භාෂාව වෙනස් කරන්න"
                aria-expanded={langMenuOpen}
              >
                <span className="text-sm leading-none">{currentLangObj.flag}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                  {lang}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-xl border border-slate-800 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                    <span>Language / භාෂාව</span>
                    <Globe className="h-3 w-3 text-teal-400" />
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/40">
                    {SUPPORTED_LANGUAGES.map((item) => (
                      <button
                        key={item.code}
                        onClick={() => {
                          onLanguageChange(item.code);
                          setLangMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs rounded-lg transition-colors cursor-pointer ${
                          lang === item.code
                            ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{item.flag}</span>
                          <span>{item.nativeName}</span>
                          <span className="text-[10px] text-slate-500">({item.name})</span>
                        </span>
                        {lang === item.code && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Currency Selector */}
            <div className="relative flex items-center">
              <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="appearance-none rounded-lg border border-slate-800 bg-slate-900 py-1.5 px-2 text-xs font-semibold text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer hover:bg-slate-850"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200">
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* New Invoice Button */}
            {onNewInvoice && (
              <button
                onClick={onNewInvoice}
                className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer shrink-0"
                title={lang === 'si' ? 'අලුත් Invoice එකක් හදන්න (+ New)' : 'Create a fresh new invoice'}
              >
                <Plus className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
                <span>{lang === 'si' ? 'අලුත්' : 'New'}</span>
              </button>
            )}

            {/* Recent Invoices History Trigger */}
            <button
              onClick={onOpenRecentInvoices}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-850 transition-all cursor-pointer shrink-0"
              title={lang === 'si' ? 'මෑතකදී සෑදූ Invoices සහ ඉතිහාසය' : 'Recent Invoices History'}
            >
              <History className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>{lang === 'si' ? 'ඉතිහාසය' : 'Recent'}</span>
              {recentCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950">
                  {recentCount}
                </span>
              )}
            </button>

            {/* Business Reports & Analytics Trigger */}
            {onOpenReports && (
              <button
                onClick={onOpenReports}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer shrink-0"
                title={lang === 'si' ? 'ව්‍යාපාරික ආදායම් & අලෙවි වාර්තාව' : 'Sales Analytics & Reports'}
              >
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{lang === 'si' ? 'වාර්තා (Reports)' : 'Reports'}</span>
              </button>
            )}

            {/* Pro Plan / Upgrade Mode */}
            {onOpenSupportModal && (
              <button
                onClick={onOpenSupportModal}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
                  isAdFree
                    ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-400 font-bold'
                    : 'border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 text-amber-300 hover:text-white hover:border-amber-400'
                }`}
                title={lang === 'si' ? 'Pro සැලැස්ම (රු. 500 / $5)' : 'QuickInvoice Pro Plan'}
              >
                <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-bold">
                  {isAdFree ? 'Pro Active' : lang === 'si' ? '⭐ Pro (රු. 500)' : '⭐ Pro ($5)'}
                </span>
              </button>
            )}

            {/* 1-Tap PWA Install App Button */}
            {isInstallable && !isInstalled && (
              <button
                onClick={install}
                className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer shrink-0 font-bold animate-pulse"
                title={lang === 'si' ? 'දුරකථනයට Install කරගන්න (1-Tap)' : 'Install as Phone App'}
              >
                <Smartphone className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px]">
                  {lang === 'si' ? 'Install App' : 'Install'}
                </span>
              </button>
            )}

            {/* Reset button */}
            <button
              onClick={onResetSample}
              title={t.resetDefault}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {/* Download PDF button */}
            <button
              onClick={onDownloadPdf}
              disabled={isDownloading}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 transition-all cursor-pointer shrink-0"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-950 shrink-0" />
              ) : (
                <Download className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
              )}
              <span className="text-xs">PDF</span>
            </button>

            {/* Desktop Menu button to access all shortcuts */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-all cursor-pointer ml-1"
              title="Open Navigation Menu & Shortcuts"
            >
              <Menu className="h-4 w-4 stroke-[2.5] text-emerald-400" />
            </button>
          </div>

          {/* Mobile & Tablet Controls */}
          <div className="flex lg:hidden items-center gap-1.5">
            {/* Mobile History Button - NEVER hidden, with badge count */}
            <button
              onClick={onOpenRecentInvoices}
              className="relative flex items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
              title={lang === 'si' ? 'මෑතකදී සෑදූ Invoices සහ ඉතිහාසය' : 'Recent Invoices History'}
            >
              <History className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-300">
                {lang === 'si' ? 'ඉතිහාසය' : 'History'}
              </span>
              {recentCount > 0 && (
                <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950">
                  {recentCount}
                </span>
              )}
            </button>

            {/* Mobile Download PDF Button */}
            <button
              onClick={onDownloadPdf}
              disabled={isDownloading}
              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 transition-all cursor-pointer"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-950 shrink-0" />
              ) : (
                <Download className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
              )}
              <span className="text-xs font-extrabold">PDF</span>
            </button>

            {/* Hamburger Menu Trigger Button (3 lines ☰) */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="flex items-center justify-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer shadow-sm"
              title="Open Navigation Menu & Shortcuts / කෙටිමං මෙනුව"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Row 2: Mobile Tab Switcher */}
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-950 px-3 py-1.5">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800 w-full">
            <button
              onClick={() => onTabChange('editor')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'editor'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t.tabEditor}</span>
            </button>
            <button
              onClick={() => onTabChange('preview')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'preview'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t.tabPreview}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Render Mobile Navigation Drawer using React Portal directly into document.body */}
      {mobileDrawerOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] overflow-hidden flex justify-end">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
              onClick={() => setMobileDrawerOpen(false)}
            />

            {/* Slide-out Drawer Panel */}
            <div className="relative w-full max-w-sm sm:max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col z-[10000] animate-in slide-in-from-right duration-250">
              {/* Drawer Top Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md">
                    <FileText className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <span>{lang === 'si' ? 'ඉක්මන් කෙටිමං & මෙනුව' : 'Shortcuts & Features'}</span>
                    </h3>
                    <p className="text-[10px] text-emerald-400 font-medium">
                      {lang === 'si' ? 'කෙළින්ම අදාළ තැනට Jump කරන්න' : 'Tap to jump directly to any section'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800"
                  title="Close Menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Drawer Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* SECTION 1: QUICK JUMP SHORTCUTS (The exact feature the user requested to stop scrolling up & down!) */}
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      {lang === 'si' ? 'පිටුවේ තැන් වලට කෙළින්ම යන්න (Shortcuts)' : 'Quick Jump to Section'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal lowercase">no scrolling</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {/* Shortcut 1: Your Business */}
                    <button
                      onClick={() => handleJumpToSection('section-business')}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-850 text-left transition-all cursor-pointer group"
                    >
                      <Building className="h-4 w-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">
                          {lang === 'si' ? 'ඔබේ ව්‍යාපාරය' : 'Your Business'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {lang === 'si' ? 'නම, Logo, ලිපිනය' : 'Logo & details'}
                        </div>
                      </div>
                    </button>

                    {/* Shortcut 2: Bill To Client */}
                    <button
                      onClick={() => handleJumpToSection('section-client')}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-850 text-left transition-all cursor-pointer group"
                    >
                      <User className="h-4 w-4 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">
                          {lang === 'si' ? 'පාරිභෝගිකයා' : 'Bill To Client'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {lang === 'si' ? 'නම & දුරකථනය' : 'Client info'}
                        </div>
                      </div>
                    </button>

                    {/* Shortcut 3: Items & Pricing */}
                    <button
                      onClick={() => handleJumpToSection('section-items')}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-850 text-left transition-all cursor-pointer group"
                    >
                      <Package className="h-4 w-4 text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">
                          {lang === 'si' ? 'භාණ්ඩ හා මිල' : 'Items & Pricing'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {lang === 'si' ? 'ප්‍රමාණය & අනුපාත' : 'Rates, discount'}
                        </div>
                      </div>
                    </button>

                    {/* Shortcut 4: Bank & Payment Instructions */}
                    <button
                      onClick={() => handleJumpToSection('section-payment')}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-850 text-left transition-all cursor-pointer group"
                    >
                      <CreditCard className="h-4 w-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">
                          {lang === 'si' ? 'ගෙවීම් තොරතුරු' : 'Bank & Payment'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {lang === 'si' ? 'Account විස්තර' : 'Account notes'}
                        </div>
                      </div>
                    </button>

                    {/* Shortcut 5: LankaQR / QR Code */}
                    <button
                      onClick={() => handleJumpToSection('section-qr')}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-850 text-left transition-all cursor-pointer group"
                    >
                      <QrCode className="h-4 w-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">
                          {lang === 'si' ? 'Payment QR' : 'LankaQR / Pay'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {lang === 'si' ? 'Scan QR Code' : 'LankaQR, UPI'}
                        </div>
                      </div>
                    </button>

                    {/* Shortcut 6: Invoice Dates & Reference */}
                    <button
                      onClick={() => handleJumpToSection('section-details')}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-850 text-left transition-all cursor-pointer group"
                    >
                      <Calendar className="h-4 w-4 text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">
                          {lang === 'si' ? 'දිනයන් & අංකය' : 'Dates & Number'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {lang === 'si' ? 'Issue & Due Date' : 'Invoice Number'}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Switch to Live Preview directly */}
                  <button
                    onClick={handleJumpToPreview}
                    className="w-full mt-2 flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:text-white transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold">
                        {lang === 'si' ? 'බිල්පත පෙරදසුන (Live Bill Preview)' : 'View Live Invoice Preview'}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-emerald-400" />
                  </button>
                </div>

                {/* SECTION 2: CORE BUSINESS & APP FEATURES */}
                <div>
                  <div className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>{lang === 'si' ? 'ප්‍රධාන විශේෂාංග (Main Features)' : 'Features & Data Hub'}</span>
                  </div>

                  <div className="divide-y divide-slate-800/60 rounded-2xl bg-slate-950/70 border border-slate-800/80 overflow-hidden">
                    {/* Feature: Recent Invoices History */}
                    <button
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        onOpenRecentInvoices();
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-850 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                          <History className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{lang === 'si' ? 'මෑතකදී සෑදූ Invoices (ඉතිහාසය)' : 'Recent Invoices & History'}</span>
                            {recentCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                                {recentCount}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {lang === 'si' ? 'කලින් හැදූ Invoices නැවත බැලීම & Duplicate කිරීම' : 'Review, load, edit or duplicate saved invoices'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400" />
                    </button>

                    {/* Feature: Clients Directory */}
                    {onOpenClients && (
                      <button
                        onClick={() => {
                          setMobileDrawerOpen(false);
                          onOpenClients();
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-850 transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {lang === 'si' ? 'පාරිභෝගික නාමාවලිය (Saved Clients)' : 'Saved Clients Directory'}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {lang === 'si' ? 'Customers ලැයිස්තුව කළමනාකරණය' : 'Saved customers with phone & address'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
                      </button>
                    )}

                    {/* Feature: Business Reports & Sales Analytics */}
                    {onOpenReports && (
                      <button
                        onClick={() => {
                          setMobileDrawerOpen(false);
                          onOpenReports();
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-850 transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {lang === 'si' ? 'ව්‍යාපාරික ආදායම් & ණය වාර්තා' : 'Sales Analytics & Credit Ledger'}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {lang === 'si' ? 'මාසික ලාභ, ලැබීම් සහ ණය පොත' : 'Monthly revenue, net profit & customer dues'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-teal-400" />
                      </button>
                    )}

                    {/* Feature: Product Catalog */}
                    {onOpenProducts && (
                      <button
                        onClick={() => {
                          setMobileDrawerOpen(false);
                          onOpenProducts();
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-850 transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {lang === 'si' ? 'භාණ්ඩ තොග ලැයිස්තුව (Product Catalog)' : 'Product & Item Catalog'}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {lang === 'si' ? 'භාණ්ඩ හා ස්ථාවර මිල ගණන්' : 'Pre-saved items & rate cards'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400" />
                      </button>
                    )}

                    {/* Feature: Backup & Restore */}
                    {onOpenBackup && (
                      <button
                        onClick={() => {
                          setMobileDrawerOpen(false);
                          onOpenBackup();
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-850 transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                            <Database className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {lang === 'si' ? 'දත්ත Backup & Restore' : 'Database Backup & Restore'}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {lang === 'si' ? 'දත්ත සියල්ල JSON ගොනුවක් ලෙස save කරගැනීම' : 'Download full backup JSON or restore'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400" />
                      </button>
                    )}

                    {/* Feature: AI Bill Photo Scanner */}
                    <button
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        onOpenAiModal();
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-850 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">
                            {lang === 'si' ? 'AI බිල්පත් ස්කෑනරය' : 'AI Invoice Photo Autofill'}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {lang === 'si' ? 'බිලක photo එකක් දමා autofill කරන්න' : 'Snap photo to auto-fill items & totals'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-violet-400" />
                    </button>

                    {/* Feature: New Blank Invoice */}
                    {onNewInvoice && (
                      <button
                        onClick={() => {
                          setMobileDrawerOpen(false);
                          onNewInvoice();
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-850 transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                            <Plus className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {lang === 'si' ? '+ අලුත් Invoice එකක් සෑදීම' : '+ Create New Blank Invoice'}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {lang === 'si' ? 'හිස් අලුත් පත්‍රිකාවක් ආරම්භ කරන්න' : 'Clear form for a new invoice'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400" />
                      </button>
                    )}

                    {/* Feature: Direct Print */}
                    {onPrint && (
                      <button
                        onClick={() => {
                          setMobileDrawerOpen(false);
                          onPrint();
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-850 transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                            <Printer className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {lang === 'si' ? 'මුද්‍රණය කරන්න (Print)' : 'Print Invoice'}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {lang === 'si' ? 'Printer එකෙන් print කිරීම' : 'Direct system print'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </button>
                    )}
                  </div>
                </div>

                {/* SECTION 3: CURRENCY & LANGUAGE PREFERENCES */}
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{lang === 'si' ? 'මුදල් වර්ගය (Currency)' : 'Currency'}</span>
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => onCurrencyChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs font-semibold text-slate-100 focus:border-emerald-500 focus:outline-none"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-teal-400" />
                      <span>{lang === 'si' ? 'භාෂාව (Language)' : 'Language'}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => onLanguageChange(l.code)}
                          className={`flex items-center gap-1.5 p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                            lang === l.code
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-sm">{l.flag}</span>
                          <span className="truncate">{l.nativeName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Bottom Actions: Pro Plan, Install & Owner Controls */}
              <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2 shrink-0">
                {onOpenSupportModal && (
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onOpenSupportModal();
                    }}
                    className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isAdFree
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400'
                        : 'border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-yellow-500/15 text-amber-300 hover:text-white'
                    }`}
                  >
                    <Crown className="h-4 w-4 text-amber-400" />
                    <span>
                      {isAdFree
                        ? 'Pro Plan Active (Ad-Free)'
                        : lang === 'si'
                        ? '⭐ QuickInvoice Pro (රු. 500 / $5)'
                        : '⭐ Upgrade to Pro ($5 / mo)'}
                    </span>
                  </button>
                )}

                {isInstallable && !isInstalled && (
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      install();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold shadow-md cursor-pointer hover:bg-emerald-400 transition-all"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>{lang === 'si' ? 'Install App (දුරකථනයට ගන්න)' : 'Install as Mobile App'}</span>
                  </button>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>100% Client-Side Private</span>
                  {onOpenOwnerSettings && (
                    <button
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        onOpenOwnerSettings();
                      }}
                      className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Lock className="h-2.5 w-2.5" />
                      <span>{lang === 'si' ? 'Owner සැකසුම් (PIN: 1234)' : 'Owner Panel'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
