import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Package,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Trash2,
  Send,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  ShoppingBag,
  Database,
  Upload,
} from 'lucide-react';
import { SavedInvoiceRecord } from '../types/invoice';
import { exportInvoicesToCsv } from '../utils/csvExport';
import { Language } from '../utils/i18n';
import {
  getExpenses,
  addExpense,
  deleteExpense,
  getCreditPayments,
  addCreditPayment,
  getProductCatalog,
  exportFullBusinessBackup,
  importFullBusinessBackup,
  BusinessExpense,
} from '../utils/commerceStorage';

interface BusinessReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: SavedInvoiceRecord[];
  lang: Language;
}

export const BusinessReportsModal: React.FC<BusinessReportsModalProps> = ({
  isOpen,
  onClose,
  invoices,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'credit' | 'expenses' | 'backup'>('sales');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_30_days' | 'custom'>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Expenses State
  const [expenses, setExpenses] = useState<BusinessExpense[]>(() => getExpenses());
  const [newExpCategory, setNewExpCategory] = useState<BusinessExpense['category']>('Transport');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpMethod, setNewExpMethod] = useState<'Cash' | 'Bank'>('Cash');

  // Credit payments
  const [creditPayments, setCreditPayments] = useState(() => getCreditPayments());
  const [payingClient, setPayingClient] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState('');

  if (!isOpen) return null;

  // Filter invoices based on date range
  const filteredInvoices = invoices.filter((inv) => {
    if (dateFilter === 'all') return true;
    const invDateStr = inv.data.issueDate || inv.savedAt?.split('T')[0];
    if (!invDateStr) return true;

    // Normalize date string parsing to local date noon to prevent timezone shifts
    const parseDateToMs = (str: string) => {
      try {
        if (str.includes('-')) {
          const parts = str.split('-').map(Number);
          if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
            return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0).getTime();
          }
        }
        return new Date(str).getTime();
      } catch {
        return new Date(str).getTime();
      }
    };

    const invTime = parseDateToMs(invDateStr);
    const now = new Date();

    if (dateFilter === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).getTime();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
      return invTime >= startOfMonth && invTime <= endOfMonth;
    }
    if (dateFilter === 'last_30_days') {
      const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      return invTime >= thirtyDaysAgo;
    }
    if (dateFilter === 'custom') {
      if (customStart && invTime < parseDateToMs(customStart) - 12 * 3600 * 1000) return false;
      if (customEnd && invTime > parseDateToMs(customEnd) + 12 * 3600 * 1000) return false;
      return true;
    }
    return true;
  });

  // Calculate metrics
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const invoicePaid = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.data.amountPaid) || 0), 0);
  
  // Total extra credit repayments received
  const totalCreditPaidBack = creditPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalCollected = invoicePaid + totalCreditPaidBack;

  // Expenses total
  const totalExpenses = expenses.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // Client balances
  const clientBalances: Record<string, { name: string; due: number; phone?: string; invoiceCount: number }> = {};
  filteredInvoices.forEach((inv) => {
    const clientName = (inv.data.clientName || '').trim() || 'Unknown Client';
    const sub = (inv.data.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);
    const disc = (sub * (Number(inv.data.discountRate) || 0)) / 100;
    const tax = ((sub - disc) * (Number(inv.data.taxRate) || 0)) / 100;
    const total = inv.total || (sub - disc + tax + (Number(inv.data.shippingFee) || 0));
    const due = Math.max(0, total - (Number(inv.data.amountPaid) || 0));

    if (!clientBalances[clientName]) {
      clientBalances[clientName] = {
        name: clientName,
        phone: inv.data.clientPhone,
        due: 0,
        invoiceCount: 0,
      };
    }
    clientBalances[clientName].due += due;
    clientBalances[clientName].invoiceCount += 1;
  });

  // Subtract repayments made to client balances
  creditPayments.forEach((cp) => {
    if (clientBalances[cp.clientName]) {
      clientBalances[cp.clientName].due = Math.max(0, clientBalances[cp.clientName].due - cp.amount);
    }
  });

  const totalOutstandingDue = Object.values(clientBalances).reduce((sum, c) => sum + c.due, 0);

  const topDebtClients = Object.values(clientBalances)
    .filter((c) => c.due > 0)
    .sort((a, b) => b.due - a.due);

  // Products stock check
  const products = getProductCatalog();
  const lowStockProducts = products.filter(
    (p) => p.stock !== undefined && p.stock <= (p.minStockAlert || 5)
  );

  const defaultCurrency = filteredInvoices[0]?.data.currencySymbol || 'Rs.';

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpDesc.trim() || !newExpAmount) return;

    const updated = addExpense({
      date: new Date().toISOString().split('T')[0],
      category: newExpCategory,
      description: newExpDesc.trim(),
      amount: parseFloat(newExpAmount) || 0,
      paymentMethod: newExpMethod,
    });
    setExpenses(updated);
    setNewExpDesc('');
    setNewExpAmount('');
  };

  const handleRecordCreditRepay = (clientName: string) => {
    const amt = parseFloat(repayAmount);
    if (!amt || amt <= 0) return;

    const updated = addCreditPayment({
      date: new Date().toISOString().split('T')[0],
      clientName,
      amount: amt,
      note: 'Partial/full cash payment',
    });
    setCreditPayments(updated);
    setPayingClient(null);
    setRepayAmount('');
  };

  const handleSendWhatsAppReminder = (client: { name: string; phone?: string; due: number }) => {
    const phone = client.phone ? client.phone.replace(/[^0-9]/g, '') : '';
    const message = `ආයුබෝවන් ${client.name},\nඔබගේ පෙර මිලදී ගැනීම් සඳහා ගෙවීමට ඇති මුදල: ${defaultCurrency} ${client.due.toFixed(2)} කි. කරුණාකර හැකි ඉක්මනින් පියවීමට කටයුතු කරන්න. ස්තූතියි!`;
    const targetUrl = phone
      ? `https://wa.me/${phone.startsWith('0') ? '94' + phone.substring(1) : phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(targetUrl, '_blank');
  };

  // Full backup download
  const handleDownloadBackup = () => {
    const backupJson = exportFullBusinessBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Business_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Backup restore file upload
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importFullBusinessBackup(content)) {
        alert(lang === 'si' ? 'දත්ත සාර්ථකව ප්‍රතිස්ථාපනය කරන ලදී!' : 'Backup restored successfully!');
        window.location.reload();
      } else {
        alert('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                {lang === 'si' ? 'ව්‍යාපාරික මධ්‍යස්ථානය (Commerce Hub)' : 'Business Management Hub'}
                {lowStockProducts.length > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                    <AlertCircle className="h-3 w-3" />
                    {lowStockProducts.length} {lang === 'si' ? 'බඩු ඉවරයි' : 'Low Stock'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'si'
                  ? 'විකුණුම්, ණය පොත, වියදම් සහ ලාභ වාර්තා'
                  : 'Sales, credit ledger, daily expenses, and profit & loss.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportInvoicesToCsv(filteredInvoices)}
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>{lang === 'si' ? 'Excel බාගන්න' : 'Export Excel'}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>{lang === 'si' ? '📊 ආදායම් & විකුණුම් (Sales)' : 'Sales & Turnover'}</span>
          </button>

          <button
            onClick={() => setActiveTab('credit')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'credit'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>
              {lang === 'si' ? '📒 ණය පොත (Customer Khata)' : 'Customer Debt Ledger'}
              {topDebtClients.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-500/30 px-1.5 py-0.2 text-[10px]">
                  {topDebtClients.length}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span>{lang === 'si' ? '💸 දෛනික වියදම් (Expenses)' : 'Daily Expenses'}</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>{lang === 'si' ? '💾 Backup & Restore' : 'Backup & Restore'}</span>
          </button>
        </div>

        {/* Tab 1: Sales & Profit Overview */}
        {activeTab === 'sales' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  {lang === 'si' ? 'මුළු විකුණුම් (Revenue)' : 'Total Invoiced'}
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
                  {defaultCurrency} {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  {lang === 'si' ? 'අතට ලැබුණු (Collected)' : 'Total Collected'}
                </span>
                <div className="text-xl sm:text-2xl font-black text-blue-400 font-mono mt-1">
                  {defaultCurrency} {totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  {lang === 'si' ? 'කඩේ වියදම් (Expenses)' : 'Total Expenses'}
                </span>
                <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-1">
                  {defaultCurrency} {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-sm">
                <span className="text-[11px] font-semibold text-emerald-300 block">
                  {lang === 'si' ? 'ශුද්ධ ලාභය (Net Profit)' : 'Estimated Net Profit'}
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono mt-1">
                  {defaultCurrency} {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Low Stock Alerts */}
            {lowStockProducts.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-300">
                      {lang === 'si' ? 'තොග අවසන් වේගෙන එන භාණ්ඩ (Low Stock Alert):' : 'Re-order required items:'}
                    </div>
                    <div className="text-xs text-amber-200/80 mt-0.5">
                      {lowStockProducts.map((p) => `${p.name} (ඉතිරි: ${p.stock})`).join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Date filter & Invoices */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">
                  {lang === 'si' ? 'කාල පරාසය:' : 'Filter:'}
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'all', labelEn: 'All Time', labelSi: 'සියල්ල' },
                    { id: 'this_month', labelEn: 'This Month', labelSi: 'මේ මාසය' },
                    { id: 'last_30_days', labelEn: '30 Days', labelSi: 'දින 30' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setDateFilter(f.id as any)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer ${
                        dateFilter === f.id
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {lang === 'si' ? f.labelSi : f.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => exportInvoicesToCsv(filteredInvoices)}
                className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: ණය පොත (Customer Credit Ledger / Khata) */}
        {activeTab === 'credit' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-xs text-slate-400">
                  {lang === 'si' ? 'මුළු ලැබිය යුතු ණය මුදල:' : 'Total Pending Credit Debt:'}
                </span>
                <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                  {defaultCurrency} {totalOutstandingDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                {topDebtClients.length} {lang === 'si' ? 'පාරිභෝගිකයින් ණයට ගෙන ඇත' : 'borrowers pending'}
              </div>
            </div>

            {/* Repay form popup if selected */}
            {payingClient && (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-amber-300">
                    {lang === 'si' ? 'ණය ගෙවීමක් සටහන් කරන්න:' : 'Record debt settlement for:'} {payingClient}
                  </span>
                  <div className="text-[11px] text-slate-400">
                    පාරිභෝගිකයා ගෙනත් දුන් මුදල ඇතුළත් කරන්න.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Amount (රු.)"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white w-32 focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    onClick={() => handleRecordCreditRepay(payingClient)}
                    className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setPayingClient(null)}
                    className="rounded-xl bg-slate-800 px-2 py-1.5 text-xs text-slate-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Client debt cards */}
            <div className="space-y-3">
              {topDebtClients.length === 0 ? (
                <div className="p-8 text-center text-xs text-emerald-400 flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-8 w-8" />
                  <span>{lang === 'si' ? 'කිසිදු පාරිභෝගිකයෙකුගෙන් හිඟ ණය නැත. සියල්ල සම්පූර්ණයි!' : 'No outstanding client debts!'}</span>
                </div>
              ) : (
                topDebtClients.map((client, idx) => (
                  <div key={idx} className="flex flex-wrap items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 gap-3">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{client.name}</span>
                        {client.phone && <span className="text-[11px] text-slate-400">({client.phone})</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {client.invoiceCount} {client.invoiceCount === 1 ? 'Invoice' : 'Invoices'} pending
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block">Balance Due</span>
                        <span className="text-sm font-black font-mono text-amber-400">
                          {defaultCurrency} {client.due.toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleSendWhatsAppReminder(client)}
                        className="flex items-center gap-1 rounded-xl bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
                        title="Send WhatsApp payment reminder"
                      >
                        <Send className="h-3 w-3" />
                        <span>WhatsApp Reminder</span>
                      </button>

                      <button
                        onClick={() => {
                          setPayingClient(client.name);
                          setRepayAmount(client.due.toString());
                        }}
                        className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
                      >
                        + Pay / අඩු කරන්න
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Daily Expenses */}
        {activeTab === 'expenses' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Add Expense Form */}
            <form onSubmit={handleAddExpenseSubmit} className="p-4 rounded-2xl bg-slate-950 border border-rose-500/30 space-y-3">
              <div className="text-xs font-bold text-rose-400">
                {lang === 'si' ? '+ අලුත් වියදමක් ඇතුළත් කරන්න:' : '+ Add Daily Expense:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <select
                    value={newExpCategory}
                    onChange={(e) => setNewExpCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-2 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Transport">ට්‍රාන්ස්පෝට් (Transport)</option>
                    <option value="Electricity">ලයිට් බිල් (Electricity)</option>
                    <option value="Rent">කුලී (Rent)</option>
                    <option value="Salary">සේවක වැටුප් (Salary)</option>
                    <option value="Food">කෑම බීම / තේ (Food)</option>
                    <option value="Stock Purchase">බඩු මිලදී ගැනීම් (Stock)</option>
                    <option value="Other">වෙනත් (Other)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder={lang === 'si' ? 'වියදම් විස්තරය (Description)' : 'Expense description'}
                    value={newExpDesc}
                    onChange={(e) => setNewExpDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Amount (රු.)"
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-rose-400 cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>

            {/* Expenses List */}
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="rounded-lg bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-300 font-semibold">
                        {exp.category}
                      </span>
                      <span>{exp.description}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {exp.date} • {exp.paymentMethod}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-rose-400">
                      - {defaultCurrency} {exp.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => setExpenses(deleteExpense(exp.id))}
                      className="text-slate-500 hover:text-red-400 p-1 rounded cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Backup & Restore */}
        {activeTab === 'backup' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="h-4 w-4 text-emerald-400" />
                {lang === 'si' ? 'ව්‍යාපාරික දත්ත සම්පූර්ණයෙන්ම Backup කර තබාගන්න' : 'Export Full Business Backup'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === 'si'
                  ? 'ඔබේ සියලුම Invoices, Product Catalog, Clients, ණය පොත සහ වියදම් තොරතුරු සුරක්ෂිත JSON ගොනුවක් ලෙස පරිගණකයට හෝ දුරකථනයට බාගත කර තබාගන්න. දුරකථනය මාරු කළත් දත්ත නැති නොවේ.'
                  : 'Download complete database backup including invoices, customer ledger, product catalog, and expenses.'}
              </p>
              <button
                onClick={handleDownloadBackup}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Download className="h-4 w-4" />
                <span>{lang === 'si' ? 'Backup File එක බාගන්න (Download)' : 'Download Backup File'}</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-400" />
                {lang === 'si' ? 'පෙර Backup එකක් Restore කරන්න' : 'Restore Business Backup'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === 'si'
                  ? 'කලින් බාගත කරගත් Backup (.json) ගොනුව තෝරා එක ක්ලික් එකකින් සියලුම පැරණි තොරතුරු නැවත ලබාගන්න.'
                  : 'Select previously downloaded JSON backup file to restore all your commerce data.'}
              </p>
              <label className="inline-flex items-center gap-2 rounded-xl bg-blue-500/20 border border-blue-500/30 px-4 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/30 cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>{lang === 'si' ? 'Backup File එක තෝරන්න (Upload)' : 'Select Backup File'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
