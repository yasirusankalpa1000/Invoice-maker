import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';
import { AiModal } from './components/AiModal';
import { AdPlaceholder } from './components/AdPlaceholder';
import { RecentInvoicesSidebar } from './components/RecentInvoicesSidebar';
import { DownloadInterstitialModal } from './components/DownloadInterstitialModal';
import { GlobalBusinessHub } from './components/GlobalBusinessHub';
import { SubscriptionProModal } from './components/SubscriptionProModal';
import { OwnerSettingsModal } from './components/OwnerSettingsModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { BusinessReportsModal } from './components/BusinessReportsModal';
import { ProductCatalogModal } from './components/ProductCatalogModal';
import {
  InvoiceData,
  DEFAULT_INVOICE,
  CURRENCIES,
  SavedInvoiceRecord,
  InvoiceItem,
} from './types/invoice';
import { Language, translations, SUPPORTED_LANGUAGES } from './utils/i18n';
import { downloadInvoicePdf } from './utils/pdfExport';
import {
  getRecentInvoices,
  saveRecentInvoice,
  deleteRecentInvoice,
  clearAllRecentInvoices,
} from './utils/recentInvoices';
import { updateProductStock } from './utils/commerceStorage';
import {
  CheckCircle2,
  Sparkles,
  Download,
  Share2,
  Lock,
  Eye,
  Edit3,
  Loader2,
  FileCheck,
  History,
  Coffee,
  Globe,
  Plus,
  TrendingUp,
} from 'lucide-react';

const STORAGE_KEY = 'quickinvoice_pro_data_v1';
const LANG_STORAGE_KEY = 'quickinvoice_lang_v1';
const AD_FREE_KEY = 'quickinvoice_ad_free_v1';

export default function App() {
  // Load initial data from localStorage if available
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load saved invoice:', e);
    }
    return DEFAULT_INVOICE;
  });

  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    } catch (e) {}
    return 'en';
  });

  const [isAdFree, setIsAdFree] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AD_FREE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isRecentSidebarOpen, setIsRecentSidebarOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isOwnerSettingsModalOpen, setIsOwnerSettingsModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isGlobalProductCatalogOpen, setIsGlobalProductCatalogOpen] = useState(false);
  const [recentSidebarTab, setRecentSidebarTab] = useState<'invoices' | 'clients'>('invoices');
  const [downloadTargetData, setDownloadTargetData] = useState<InvoiceData | null>(null);

  const [recentInvoices, setRecentInvoices] = useState<SavedInvoiceRecord[]>(() =>
    getRecentInvoices()
  );
  const [saveToast, setSaveToast] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const t = translations[lang];

  // Auto-save active invoice to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoiceData));
      setSaveToast(true);
      const timer = setTimeout(() => setSaveToast(false), 2000);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [invoiceData]);

  // Save language preference
  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (e) {}
  }, [lang]);

  // Handle Ad-Free mode toggle
  const handleToggleAdFree = (enabled: boolean) => {
    setIsAdFree(enabled);
    try {
      localStorage.setItem(AD_FREE_KEY, String(enabled));
    } catch {}
    setToastMessage(
      enabled
        ? lang === 'si'
          ? 'Ad-Free Mode සක්‍රිය විය! දැන්වීම් ඉවත් කරන ලදී.'
          : 'Ad-Free Mode Activated! All ads hidden.'
        : lang === 'si'
        ? 'නැවත සම්මත නොමිලේ මාදිලියට මාරු විය.'
        : 'Switched back to standard free mode.'
    );
    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 3000);
  };

  // Update handlers
  const handleDataChange = (updated: Partial<InvoiceData>) => {
    setInvoiceData((prev) => ({ ...prev, ...updated }));
  };

  const handleCurrencyChange = (currencyCode: string) => {
    const found = CURRENCIES.find((c) => c.code === currencyCode);
    if (found) {
      setInvoiceData((prev) => ({
        ...prev,
        currency: found.code,
        currencySymbol: found.symbol,
      }));
    }
  };

  const handleResetSample = () => {
    if (
      window.confirm(
        lang === 'si'
          ? 'නැවත Sample එකට හරවන්නද? ඔබ වෙනස් කළ තොරතුරු මැකී යනු ඇත.'
          : 'Reset to sample invoice data? Your current edits will be replaced.'
      )
    ) {
      setInvoiceData(DEFAULT_INVOICE);
    }
  };

  // Direct client-side PDF execution engine
  const executeDirectPdfDownload = async (customData?: InvoiceData): Promise<boolean> => {
    const targetData = customData || downloadTargetData || invoiceData;
    if (!targetData) return false;
    setIsDownloading(true);
    try {
      const rawNumber = String(targetData.invoiceNumber || 'INV')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .trim() || 'INV';
      const docType = String(targetData.documentType || 'invoice')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '') || 'invoice';
      const fileName = `${docType}-${rawNumber}.pdf`;
      const ok = await downloadInvoicePdf('invoice-printable-container', fileName);
      if (ok) {
        // Automatically save into recent invoices list
        const updatedRecent = saveRecentInvoice(targetData);
        setRecentInvoices(updatedRecent);

        setToastMessage(t.downloadSuccess || 'PDF downloaded successfully!');
        setDownloadSuccessToast(true);
        setTimeout(() => setDownloadSuccessToast(false), 3500);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Download error:', err);
      return false;
    } finally {
      setIsDownloading(false);
    }
  };

  // Trigger download flow (Option 1: If ad-supported, opens countdown interstitial modal)
  const handleInitiateDownload = (customData?: InvoiceData) => {
    const target = customData || invoiceData;
    setDownloadTargetData(target);

    if (isAdFree) {
      // Direct download with zero ads
      executeDirectPdfDownload(target);
    } else {
      // High-eCPM Interstitial Rewarded Ad countdown modal
      setIsDownloadModalOpen(true);
    }
  };

  // Explicit manual save to recent invoices
  const handleSaveCurrentToRecent = (forceNew = false) => {
    const updated = saveRecentInvoice(invoiceData, forceNew);
    setRecentInvoices(updated);

    // Auto deduct items from inventory stock
    (invoiceData.items || []).forEach((it) => {
      if (it.description && Number(it.quantity) > 0) {
        updateProductStock(it.description, Number(it.quantity));
      }
    });

    setToastMessage(
      lang === 'si'
        ? `"${invoiceData.invoiceNumber}" මෑත ලැයිස්තුවට සුරැකිණි (තොග යාවත්කාලීන විය)!`
        : `Saved "${invoiceData.invoiceNumber}" and updated stock!`
    );
    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 3000);
  };

  // Create a brand new blank invoice (auto-incremented number)
  const handleCreateNewInvoice = () => {
    // Save current one first so user never loses work
    saveRecentInvoice(invoiceData);
    const updatedHistory = getRecentInvoices();
    setRecentInvoices(updatedHistory);

    // Calculate next invoice number based on history
    let nextNum = 1;
    const currentNumStr = invoiceData.invoiceNumber || 'INV-001';
    const match = currentNumStr.match(/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    } else {
      nextNum = updatedHistory.length + 1;
    }
    const paddedNum = String(nextNum).padStart(3, '0');
    const prefix = currentNumStr.replace(/\d+$/, '') || 'INV-2026-';

    const newInvoice: InvoiceData = {
      ...invoiceData,
      invoiceNumber: `${prefix}${paddedNum}`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      items: [
        {
          id: `item-${Date.now()}`,
          description: '',
          quantity: 1,
          rate: 0,
        },
      ],
      amountPaid: 0,
      notes: '',
    };

    setInvoiceData(newInvoice);
    setIsRecentSidebarOpen(false);
    setActiveTab('editor');
    setToastMessage(
      lang === 'si'
        ? `අලුත් Invoice එකක් (${newInvoice.invoiceNumber}) සූදානම්!`
        : `Created new blank invoice (${newInvoice.invoiceNumber})!`
    );
    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 3000);
  };

  // Load a recent invoice into the active form & preview
  const handleLoadRecentInvoice = (savedData: InvoiceData) => {
    setInvoiceData(savedData);
    setIsRecentSidebarOpen(false);
    setToastMessage(
      lang === 'si'
        ? `"${savedData.invoiceNumber}" විවෘත කරන ලදී!`
        : `Loaded invoice "${savedData.invoiceNumber}"!`
    );
    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 3000);
  };

  // Duplicate an existing invoice
  const handleDuplicateRecentInvoice = (savedData: InvoiceData) => {
    const today = new Date().toISOString().split('T')[0];
    const newNumber = `${savedData?.invoiceNumber || 'INV'}-COPY`;
    const duplicated: InvoiceData = {
      ...savedData,
      invoiceNumber: newNumber,
      issueDate: today,
    };
    setInvoiceData(duplicated);
    const updated = saveRecentInvoice(duplicated);
    setRecentInvoices(updated);
    setIsRecentSidebarOpen(false);
    setToastMessage(
      lang === 'si'
        ? `Invoice පිටපතක් (${newNumber}) නිර්මාණය විය!`
        : `Duplicated as "${newNumber}"!`
    );
    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 3000);
  };

  // Delete a specific recent invoice
  const handleDeleteRecentInvoice = (id: string) => {
    const updated = deleteRecentInvoice(id);
    setRecentInvoices(updated);
  };

  // Clear all recent invoices
  const handleClearAllRecent = () => {
    clearAllRecentInvoices();
    setRecentInvoices([]);
    setToastMessage(
      lang === 'si'
        ? 'සියලුම මෑත Invoices ඉවත් කරන ලදී'
        : 'All recent invoices cleared'
    );
    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 3000);
  };

  // Download a specific invoice from the recent list
  const handleDownloadSpecificPdf = async (savedData: InvoiceData) => {
    if (savedData?.invoiceNumber !== invoiceData?.invoiceNumber) {
      setInvoiceData(savedData);
    }
    setTimeout(() => {
      handleInitiateDownload(savedData);
    }, 150);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 w-full max-w-full overflow-x-hidden">
      {/* Top sticky navigation bar */}
      <Navbar
        lang={lang}
        onLanguageChange={setLang}
        currency={invoiceData.currency}
        onCurrencyChange={handleCurrencyChange}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onNewInvoice={handleCreateNewInvoice}
        onResetSample={handleResetSample}
        onDownloadPdf={() => handleInitiateDownload()}
        onPrint={handlePrint}
        isDownloading={isDownloading}
        onOpenRecentInvoices={() => {
          setRecentSidebarTab('invoices');
          setIsRecentSidebarOpen(true);
        }}
        onOpenReports={() => setIsReportsModalOpen(true)}
        onOpenClients={() => {
          setRecentSidebarTab('clients');
          setIsRecentSidebarOpen(true);
        }}
        onOpenProducts={() => setIsGlobalProductCatalogOpen(true)}
        onOpenBackup={() => {
          setRecentSidebarTab('invoices');
          setIsRecentSidebarOpen(true);
        }}
        recentCount={recentInvoices.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSupportModal={() => setIsSupportModalOpen(true)}
        onOpenOwnerSettings={() => setIsOwnerSettingsModalOpen(true)}
        isAdFree={isAdFree}
      />

      {/* Floating Download / Save Success Toast */}
      {downloadSuccessToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-950/90 border border-emerald-500/40 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage || t.downloadSuccess || 'PDF downloaded successfully!'}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
        {/* PWA Install Banner */}
        <PWAInstallBanner lang={lang} />

        {/* Top AdSense Banner (Hidden in Ad-Free mode) */}
        {!isAdFree && <AdPlaceholder format="horizontal" lang={lang} />}

        {/* Hero Banner with Feature Badges */}
        <div className="no-print mb-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 p-4 sm:p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Instant Client-Side Engine</span>
              </span>
              <span className="text-slate-600 hidden xs:inline">·</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Lock className="h-3 w-3" /> 100% Private (No data leaves your device)
              </span>
              {isAdFree && (
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                  Ad-Free Pro
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {t.tagline}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Create, customize, and export clean PDF invoices, receipts, and quotes with zero watermarks and zero account registration.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <button
              onClick={handleCreateNewInvoice}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer shadow-sm"
              title={lang === 'si' ? 'අලුත් Invoice එකක් හදන්න' : 'Create a fresh new invoice'}
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
              <span>{lang === 'si' ? '+ අලුත් එකක්' : '+ New Invoice'}</span>
            </button>

            <button
              onClick={() => setIsRecentSidebarOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              <History className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>{lang === 'si' ? 'මෑත Invoices' : 'Recent'}</span>
              {recentInvoices.length > 0 && (
                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  {recentInvoices.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsReportsModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30 transition-all cursor-pointer shadow-sm"
              title={lang === 'si' ? 'ව්‍යාපාරික ආදායම් & අලෙවි වාර්තාව' : 'View Sales Analytics & Reports'}
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>{lang === 'si' ? 'වාර්තා (Reports)' : 'Reports'}</span>
            </button>
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-violet-600/15 border border-violet-500/30 px-3 py-2 text-xs font-bold text-violet-300 hover:bg-violet-600/25 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              <span>{t.magicAi}</span>
            </button>
            <button
              onClick={() => handleInitiateDownload()}
              disabled={isDownloading}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-60 transition-all cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-950 shrink-0" />
                  <span>{t.downloadingPdf || 'Generating PDF...'}</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
                  <span>{t.printPdf || 'Download PDF'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Split View / Mobile Tab View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full max-w-full">
          {/* Left Column: Form Editor */}
          <div
            className={`lg:col-span-6 xl:col-span-5 no-print w-full min-w-0 ${
              activeTab === 'editor' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  {t.tabEditor}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">
                  {saveToast ? t.saveSuccess || 'Saved locally' : ''}
                </span>
                <button
                  type="button"
                  onClick={handleResetSample}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {t.resetDefault}
                </button>
              </div>
            </div>

            <InvoiceEditor
              data={invoiceData}
              onChange={handleDataChange}
              lang={lang}
              onOpenAiModal={() => setIsAiModalOpen(true)}
            />
          </div>

          {/* Right Column: Live Printable Preview */}
          <div
            className={`lg:col-span-6 xl:col-span-7 min-w-0 w-full max-w-full ${
              activeTab === 'preview'
                ? 'block'
                : 'absolute -left-[9999px] top-0 opacity-0 pointer-events-none lg:static lg:opacity-100 lg:pointer-events-auto'
            }`}
          >
            <div className="flex items-center justify-between mb-4 no-print">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  {t.tabPreview} (A4 Print-Ready)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  Print
                </button>
                <button
                  onClick={() => handleInitiateDownload()}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{t.downloadingPdf || 'Generating...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>{t.printPdf || 'Download PDF'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Invoice Container with subtle card background */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-2 sm:p-6 lg:p-8 backdrop-blur-sm overflow-x-auto shadow-2xl w-full max-w-full">
              <InvoicePreview data={invoiceData} lang={lang} />
            </div>

            {/* Bottom Ad Placeholder on desktop (Hidden in Ad-Free mode) */}
            {!isAdFree && <AdPlaceholder format="horizontal" lang={lang} />}
          </div>
        </div>

        {/* Option 3: Global Cross-Border Money Transfers & Banking Hub */}
        <GlobalBusinessHub lang={lang} />
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 QuickInvoice Pro · High-Search Free Utility Tool · Zero Sign-up</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-white cursor-pointer" onClick={() => setIsAiModalOpen(true)}>
              AI Auto-Fill
            </span>
            <span>·</span>
            <span className="hover:text-emerald-400 cursor-pointer font-semibold text-emerald-400/90" onClick={() => setIsSupportModalOpen(true)}>
              {lang === 'si' ? '⭐ Pro Subscription (රු. 500 / $5)' : '⭐ Pro Upgrade ($5 / mo)'}
            </span>
            <span>·</span>
            <span className="hover:text-white cursor-pointer" onClick={handleResetSample}>
              Load Sample
            </span>
            <span>·</span>
            <span className="hover:text-white cursor-pointer" onClick={handlePrint}>
              Print / Save PDF
            </span>
          </div>
        </div>
      </footer>

      {/* Option 1: High-eCPM Download Interstitial Modal */}
      <DownloadInterstitialModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onProceedDownload={async () => {
          const success = await executeDirectPdfDownload(downloadTargetData || invoiceData);
          return success;
        }}
        fileName={`${invoiceData.documentType || 'invoice'}-${invoiceData.invoiceNumber || 'INV'}.pdf`}
        lang={lang}
      />

      {/* Option 4: Pro Subscription Modal (Rs. 500 / $5) */}
      <SubscriptionProModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        lang={lang}
        isAdFree={isAdFree}
        onToggleAdFree={handleToggleAdFree}
        onOpenOwnerSettings={() => setIsOwnerSettingsModalOpen(true)}
      />

      {/* Option 5: Owner / Admin Control Panel (PIN Protected) */}
      <OwnerSettingsModal
        isOpen={isOwnerSettingsModalOpen}
        onClose={() => setIsOwnerSettingsModalOpen(false)}
        lang={lang}
        onConfigUpdated={() => {
          // Re-trigger re-render if needed
        }}
      />

      {/* AI Smart Modal */}
      <AiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApply={handleDataChange}
        currentCurrency={invoiceData.currency}
        lang={lang}
      />

      {/* Business Reports & Sales Analytics Modal */}
      <BusinessReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        invoices={recentInvoices}
        lang={lang}
      />

      {/* Recent Invoices Sidebar (Stores saved invoices in localStorage + CSV export) */}
      <RecentInvoicesSidebar
        isOpen={isRecentSidebarOpen}
        onClose={() => setIsRecentSidebarOpen(false)}
        recentInvoices={recentInvoices}
        onLoadInvoice={handleLoadRecentInvoice}
        onDownloadInvoicePdf={handleDownloadSpecificPdf}
        onDuplicateInvoice={handleDuplicateRecentInvoice}
        onDeleteInvoice={handleDeleteRecentInvoice}
        onClearAll={handleClearAllRecent}
        onSaveCurrentInvoice={() => handleSaveCurrentToRecent(false)}
        onCreateNewInvoice={handleCreateNewInvoice}
        initialTab={recentSidebarTab}
        onSelectClient={(client) => {
          handleDataChange({
            clientName: client.name || invoiceData.clientName,
            clientEmail: client.email || invoiceData.clientEmail,
            clientPhone: client.phone || invoiceData.clientPhone,
            clientAddress: client.address || invoiceData.clientAddress,
          });
        }}
        activeInvoiceNumber={invoiceData.invoiceNumber}
        lang={lang}
      />

      {/* Global Product Catalog Modal accessible from Navbar Drawer */}
      <ProductCatalogModal
        isOpen={isGlobalProductCatalogOpen}
        onClose={() => setIsGlobalProductCatalogOpen(false)}
        lang={lang}
        currencySymbol={invoiceData.currencySymbol || '$'}
        onSelectProduct={(prod) => {
          const newItem: InvoiceItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            description: prod.description,
            quantity: prod.quantity,
            rate: prod.rate,
          };
          setInvoiceData((prev) => ({
            ...prev,
            items: [...prev.items, newItem],
          }));
          setIsGlobalProductCatalogOpen(false);
          setToastMessage(
            lang === 'si'
              ? `"${prod.description}" Invoice එකට එකතු විය!`
              : `Added "${prod.description}" to invoice!`
          );
          setDownloadSuccessToast(true);
          setTimeout(() => setDownloadSuccessToast(false), 2500);
        }}
      />
    </div>
  );
}
