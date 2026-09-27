import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Download,
  FolderOpen,
  Trash2,
  Copy,
  Clock,
  FileText,
  AlertCircle,
  Plus,
  CheckCircle2,
  FileSpreadsheet,
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  UserCheck,
  Upload,
  Database,
} from 'lucide-react';
import { InvoiceData, SavedInvoiceRecord } from '../types/invoice';
import { Language, translations } from '../utils/i18n';
import { exportInvoicesToCsv } from '../utils/csvExport';
import {
  ClientContact,
  getClientDirectory,
  addClientContact,
  saveClientDirectory,
  exportFullBusinessBackup,
  importFullBusinessBackup,
} from '../utils/commerceStorage';

interface RecentInvoicesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  recentInvoices: SavedInvoiceRecord[];
  onLoadInvoice: (data: InvoiceData) => void;
  onDownloadInvoicePdf: (data: InvoiceData) => void;
  onDuplicateInvoice: (data: InvoiceData) => void;
  onDeleteInvoice: (id: string) => void;
  onClearAll: () => void;
  onSaveCurrentInvoice: () => void;
  onCreateNewInvoice?: () => void;
  onSelectClient?: (client: { name: string; email?: string; phone?: string; address?: string }) => void;
  activeInvoiceNumber: string;
  lang: Language;
  initialTab?: 'invoices' | 'clients';
}

export const RecentInvoicesSidebar: React.FC<RecentInvoicesSidebarProps> = ({
  isOpen,
  onClose,
  recentInvoices,
  onLoadInvoice,
  onDownloadInvoicePdf,
  onDuplicateInvoice,
  onDeleteInvoice,
  onClearAll,
  onSaveCurrentInvoice,
  onCreateNewInvoice,
  onSelectClient,
  activeInvoiceNumber,
  lang,
  initialTab = 'invoices',
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'clients'>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Client Directory State
  const [clients, setClients] = useState<ClientContact[]>(() => getClientDirectory());
  const [clientSearch, setClientSearch] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [backupStatusMessage, setBackupStatusMessage] = useState<string | null>(null);

  // Backup download handler
  const handleBackupToFile = () => {
    try {
      const backupJson = exportFullBusinessBackup();
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `Invoice_Database_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatusMessage(
        lang === 'si'
          ? 'දත්ත ගොනුව (JSON) සාර්ථකව බාගත විය!'
          : 'Database backup file exported successfully!'
      );
      setTimeout(() => setBackupStatusMessage(null), 3500);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export backup file');
    }
  };

  // Restore file input handler
  const handleRestoreFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !window.confirm(
        lang === 'si'
          ? 'මෙම Backup ගොනුවෙන් ඔබගේ සියලුම දත්ත නැවත ලබාගැනීමට (Restore) අවශ්‍යද? දැනට ඇති තොරතුරු යාවත්කාලීන වනු ඇත.'
          : 'Do you want to restore the entire invoice and client database from this backup file? Existing data will be updated.'
      )
    ) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importFullBusinessBackup(content)) {
        setBackupStatusMessage(
          lang === 'si'
            ? 'දත්ත සාර්ථකව Restore කරන ලදී! පිටුව Refresh වේ...'
            : 'Database restored successfully! Reloading...'
        );
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        alert(
          lang === 'si'
            ? 'වලංගු නොවන Backup ගොනුවකි. කරුණාකර නිවැරදි JSON ගොනුවක් තෝරන්න.'
            : 'Invalid backup file format. Please select a valid JSON backup file.'
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Re-sync client directory when opened or changed
  useEffect(() => {
    if (isOpen) {
      setClients(getClientDirectory());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const t = translations[lang];

  const formatSavedDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleSaveNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const updated = addClientContact({
      name: newName.trim(),
      email: newEmail.trim() || undefined,
      phone: newPhone.trim() || undefined,
      address: newAddress.trim() || undefined,
    });
    setClients(updated);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewAddress('');
    setIsAddingClient(false);
  };

  const handleDeleteClient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        lang === 'si'
          ? 'මෙම පාරිභෝගිකයා ඉවත් කරන්නද?'
          : 'Delete this client from saved directory?'
      )
    ) {
      const updated = clients.filter((c) => c.id !== id);
      saveClientDirectory(updated);
      setClients(updated);
    }
  };

  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 flex max-w-full">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {activeTab === 'invoices' ? (
                  <History className="h-4 w-4" />
                ) : (
                  <Users className="h-4 w-4 text-blue-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    {activeTab === 'invoices'
                      ? lang === 'si'
                        ? 'මෑතකදී සෑදූ Invoices'
                        : 'Saved Invoices'
                      : lang === 'si'
                      ? 'පාරිභෝගික නාමාවලිය'
                      : 'Clients Directory'}
                  </h2>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      activeTab === 'invoices'
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    }`}
                  >
                    {activeTab === 'invoices' ? `${recentInvoices.length}/50` : `${clients.length} Clients`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {activeTab === 'invoices'
                    ? lang === 'si'
                      ? 'Invoices 50ක් දක්වා සුරැකේ'
                      : 'Stores up to 50 invoices locally'
                    : lang === 'si'
                    ? 'පාරිභෝගිකයින් සුරැකීම & තේරීම'
                    : 'Saved to localStorage for quick invoice selection'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Tab Switcher: Invoices vs Clients */}
          <div className="flex border-b border-slate-800 bg-slate-950/70 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{lang === 'si' ? 'Invoices ඉතිහාසය' : 'Invoices'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clients')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>{lang === 'si' ? '👥 පාරිභෝගිකයින් (Clients)' : '👥 Clients'}</span>
              <span className="rounded-full bg-blue-500/20 px-1.5 py-0.2 text-[10px] font-bold">
                {clients.length}
              </span>
            </button>
          </div>

          {/* TAB 1: INVOICES LIST */}
          {activeTab === 'invoices' && (
            <>
              {/* Quick Actions Bar */}
              <div className="p-3 bg-slate-950/60 border-b border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {onCreateNewInvoice && (
                    <button
                      onClick={onCreateNewInvoice}
                      className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                      title={lang === 'si' ? 'අලුත් හිස් Invoice එකක් ආරම්භ කරන්න' : 'Start a new blank invoice'}
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[3]" />
                      <span>
                        {lang === 'si' ? '+ අලුත් Invoice එකක්' : '+ New Invoice'}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={onSaveCurrentInvoice}
                    className="flex items-center justify-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                    title={lang === 'si' ? 'දැනට ඇති Invoice එක Save කරන්න' : 'Save current invoice changes'}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Save</span>
                  </button>

                  {recentInvoices.length > 0 && (
                    <button
                      onClick={() => exportInvoicesToCsv(recentInvoices)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                      title="Export all to Excel / CSV"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{lang === 'si' ? 'CSV' : 'CSV'}</span>
                    </button>
                  )}

                  {recentInvoices.length > 0 && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            lang === 'si'
                              ? 'මෑතකදී සෑදූ සියලුම Invoices ඉවත් කරන්නද?'
                              : 'Clear all recent invoices from history?'
                          )
                        ) {
                          onClearAll();
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-xs"
                      title="Clear all recent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Database Backup & Restore to File Bar */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={handleBackupToFile}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer"
                    title={lang === 'si' ? 'සියලුම Invoices සහ Clients JSON ගොනුවක් ලෙස බාගත කරන්න' : 'Export complete database to JSON file'}
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{lang === 'si' ? 'Backup to File' : 'Backup to File'}</span>
                  </button>

                  <label className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:text-blue-400 hover:border-blue-500/40 transition-all cursor-pointer">
                    <Upload className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>{lang === 'si' ? 'Restore from File' : 'Restore from File'}</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleRestoreFromFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {backupStatusMessage && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] text-center font-medium animate-in fade-in">
                    {backupStatusMessage}
                  </div>
                )}
              </div>

              {/* Invoices List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {recentInvoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3 border border-slate-700/50">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                      {lang === 'si' ? 'තවම කිසිදු Invoice එකක් නැත' : 'No Recent Invoices Yet'}
                    </h3>
                    <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed mb-5">
                      {lang === 'si'
                        ? 'ඔබ Invoice එකක් Download කළ විට හෝ "Save Current" එබූ විට එය ස්වයංක්‍රීයව මෙහි සුරැකේ.'
                        : 'Whenever you download a PDF or click "Save Current", it will be saved here so you can re-open or re-download it anytime.'}
                    </p>
                    <button
                      onClick={onSaveCurrentInvoice}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-emerald-400 transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                      <span>
                        {lang === 'si'
                          ? 'වත්මන් Invoice එක Save කරන්න'
                          : 'Save Current Invoice'}
                      </span>
                    </button>
                  </div>
                ) : (
                  recentInvoices.map((item) => {
                    const isActive =
                      (item.data.invoiceNumber || '').trim().toLowerCase() ===
                      activeInvoiceNumber.trim().toLowerCase();

                    const itemCount = (item.data.items || []).length;
                    const currency = item.data.currencySymbol || '$';

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3.5 transition-all ${
                          isActive
                            ? 'border-emerald-500/50 bg-emerald-950/20 shadow-md shadow-emerald-950/30'
                            : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Top Row: Doc Type & Active Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                              {item.data.documentType || 'Invoice'}
                            </span>
                            <span className="font-mono text-xs font-bold text-white">
                              {item.data.invoiceNumber || 'INV-001'}
                            </span>
                          </div>

                          {isActive ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatSavedDate(item.savedAt)}</span>
                            </span>
                          )}
                        </div>

                        {/* Client Name & Total */}
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-2 mb-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-200 truncate">
                              {item.data.clientName || 'Unnamed Client'}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {item.data.senderName || 'Your Business'} · {itemCount}{' '}
                              {itemCount === 1 ? 'item' : 'items'}
                            </p>
                          </div>

                          <div className="text-left sm:text-right shrink-0 mt-0.5 sm:mt-0">
                            <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 break-all">
                              {currency}
                              {item.total.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Load / Open */}
                            <button
                              type="button"
                              onClick={() => onLoadInvoice(item.data)}
                              className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                              title="Load into editor"
                            >
                              <FolderOpen className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                              <span>Open</span>
                            </button>

                            {/* Quick Download PDF */}
                            <button
                              type="button"
                              onClick={() => onDownloadInvoicePdf(item.data)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400 transition-colors cursor-pointer"
                              title="Download PDF directly"
                            >
                              <Download className="h-3.5 w-3.5 shrink-0" />
                              <span>PDF</span>
                            </button>

                            {/* Duplicate */}
                            <button
                              type="button"
                              onClick={() => onDuplicateInvoice(item.data)}
                              className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                              title="Duplicate as new invoice"
                            >
                              <Copy className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            </button>
                          </div>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => onDeleteInvoice(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0 ml-auto"
                            title={lang === 'si' ? 'ඉවත් කරන්න' : 'Delete'}
                            aria-label="Delete invoice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* TAB 2: CLIENTS DIRECTORY */}
          {activeTab === 'clients' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top Search & Add Bar */}
              <div className="p-3 bg-slate-950/60 border-b border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder={lang === 'si' ? 'නම, දුරකථන අංකය සොයන්න...' : 'Search client name, phone...'}
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingClient(!isAddingClient)}
                    className="flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-md shadow-blue-600/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isAddingClient ? 'Cancel' : lang === 'si' ? '+ Client' : '+ Add Client'}</span>
                  </button>
                </div>

                {/* Inline Add Client Form */}
                {isAddingClient && (
                  <form
                    onSubmit={handleSaveNewClient}
                    className="p-3 rounded-2xl bg-slate-900 border border-blue-500/30 space-y-2.5 animate-in fade-in duration-150"
                  >
                    <div className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>{lang === 'si' ? 'නව පාරිභෝගිකයෙකු සුරකින්න:' : 'Save New Client to LocalStorage:'}</span>
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        placeholder={lang === 'si' ? 'පාරිභෝගිකයාගේ නම (Client / Company Name) *' : 'Client or Company Name *'}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Phone (e.g. 0771234567)"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <textarea
                        rows={2}
                        placeholder={lang === 'si' ? 'ලිපිනය (Address - optional)' : 'Billing Address (optional)'}
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs py-2 transition-all cursor-pointer shadow-md"
                    >
                      {lang === 'si' ? '💾 Client සුරකින්න (Save to Directory)' : '💾 Save Client to Directory'}
                    </button>
                  </form>
                )}
              </div>

              {/* Clients List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-12 px-4 text-slate-400 text-xs">
                    <Users className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">
                      {lang === 'si' ? 'පාරිභෝගිකයින් හමු නොවීය' : 'No clients found'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {lang === 'si'
                        ? 'ඉහත "+ Add Client" බොත්තමෙන් අලුත් පාරිභෝගිකයෙකු සුරකින්න.'
                        : 'Click "+ Add Client" above to save client details.'}
                    </p>
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 hover:border-blue-500/40 hover:bg-slate-800/40 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                            {client.name}
                          </h4>
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <Phone className="h-3 w-3 text-emerald-400" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <Mail className="h-3 w-3 text-blue-400" />
                              <span className="truncate max-w-[200px]">{client.email}</span>
                            </div>
                          )}
                          {client.address && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{client.address}</span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteClient(client.id, e)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Delete client"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Select / Use Client in Invoice Button */}
                      {onSelectClient && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectClient({
                              name: client.name,
                              email: client.email,
                              phone: client.phone,
                              address: client.address,
                            });
                            onClose();
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 py-1.5 text-xs font-semibold transition-all cursor-pointer w-full mt-1"
                        >
                          <ArrowRight className="h-3 w-3" />
                          <span>{lang === 'si' ? 'මෙම Client තෝරන්න (Select)' : 'Apply to Invoice (Select)'}</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3 text-emerald-400" />
                <span>{lang === 'si' ? 'දත්ත ආරක්ෂාව (Data Safety):' : 'Data Safety:'}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBackupToFile}
                  className="text-emerald-400 hover:underline cursor-pointer font-semibold flex items-center gap-0.5"
                >
                  <Download className="h-2.5 w-2.5" />
                  <span>Backup</span>
                </button>
                <span>•</span>
                <label className="text-blue-400 hover:underline cursor-pointer font-semibold flex items-center gap-0.5">
                  <Upload className="h-2.5 w-2.5" />
                  <span>Restore</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleRestoreFromFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-500">
              {lang === 'si'
                ? 'දත්ත 100% ඔබේ පරිගණකයේ (Local Storage) පමණක් සුරැකේ.'
                : 'Stored 100% in your local browser storage. No account needed.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
