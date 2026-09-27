import React, { useRef, useState, useEffect } from 'react';
import {
  Upload,
  Trash2,
  Plus,
  Building,
  User,
  Calendar,
  FileCheck,
  CreditCard,
  FileText,
  Percent,
  X,
  Sparkles,
  Camera,
  PenTool,
  Loader2,
  Sliders,
  Check,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import {
  InvoiceData,
  InvoiceItem,
  DocumentType,
  TemplateStyle,
  QrCodeType,
} from '../types/invoice';
import { translations, Language } from '../utils/i18n';
import {
  removeSignatureBackground,
  processAndDetectSignature,
} from '../utils/signatureProcessor';
import { ProductCatalogModal } from './ProductCatalogModal';
import { ClientDirectoryModal } from './ClientDirectoryModal';
import {
  getClientDirectory,
  addClientContact,
  ClientContact,
} from '../utils/commerceStorage';

interface InvoiceEditorProps {
  data: InvoiceData;
  onChange: (updated: Partial<InvoiceData>) => void;
  lang: Language;
  onOpenAiModal: () => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  data,
  onChange,
  lang,
  onOpenAiModal,
}) => {
  const [isProductCatalogOpen, setIsProductCatalogOpen] = useState(false);
  const [isClientDirectoryOpen, setIsClientDirectoryOpen] = useState(false);
  const [savedClients, setSavedClients] = useState<ClientContact[]>(() => getClientDirectory());

  // Listen to window focus or storage changes to keep dropdown fresh
  useEffect(() => {
    const refreshClients = () => {
      setSavedClients(getClientDirectory());
    };
    window.addEventListener('focus', refreshClients);
    window.addEventListener('storage', refreshClients);
    return () => {
      window.removeEventListener('focus', refreshClients);
      window.removeEventListener('storage', refreshClients);
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingSignature, setIsProcessingSignature] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [signatureRawSrc, setSignatureRawSrc] = useState<string | null>(null);
  const [signatureThreshold, setSignatureThreshold] = useState<number>(205);
  const [signatureInkColor, setSignatureInkColor] = useState<'original' | 'black' | 'blue'>('original');

  const t = translations[lang];

  // Handle logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ senderLogo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle signature photo upload, verification & auto background removal
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setSignatureError(
        lang === 'si'
          ? 'අත්සනේ ඡායාරූපය 8MB ට වඩා අඩු විය යුතුය'
          : 'Signature photo must be under 8MB'
      );
      return;
    }

    setIsProcessingSignature(true);
    setSignatureError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawData = event.target?.result as string;
      setSignatureRawSrc(rawData);

      const result = await processAndDetectSignature(
        rawData,
        signatureThreshold,
        signatureInkColor
      );

      if (result.detected && result.dataUrl) {
        onChange({ signatureImage: result.dataUrl });
        setSignatureError(null);
      } else {
        onChange({ signatureImage: '' });
        const errorKey = result.errorMessageKey || 'noSignatureDetected';
        const msg =
          (t as any)[errorKey] ||
          (t as any).noSignatureDetected ||
          (lang === 'si'
            ? 'කිසිදු අත්සනක් හඳුනාගත නොහැකි විය! කරුණාකර කොළයක තැබූ පැහැදිලි අත්සනක ඡායාරූපයක් එක් කරන්න.'
            : 'No signature detected in this photo!');
        setSignatureError(msg);
      }
      setIsProcessingSignature(false);
    };

    reader.onerror = () => {
      setSignatureError(
        (t as any).noSignatureDetected ||
          (lang === 'si'
            ? 'ඡායාරූපය කියවීමට නොහැකි විය'
            : 'Failed to read image')
      );
      setIsProcessingSignature(false);
    };

    reader.readAsDataURL(file);
  };

  // Re-process signature when threshold or ink color changes
  const reprocessSignature = async (
    threshold: number,
    color: 'original' | 'black' | 'blue'
  ) => {
    if (!signatureRawSrc) return;
    setIsProcessingSignature(true);
    try {
      const result = await processAndDetectSignature(signatureRawSrc, threshold, color);
      if (result.detected && result.dataUrl) {
        onChange({ signatureImage: result.dataUrl });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingSignature(false);
    }
  };

  const handleClearSignature = () => {
    setSignatureRawSrc(null);
    setSignatureError(null);
    onChange({ signatureImage: '' });
    if (signatureInputRef.current) {
      signatureInputRef.current.value = '';
    }
  };

  // Line item manipulation
  const handleItemChange = (
    id: string,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updated = data.items.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange({ items: updated });
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      rate: 0,
    };
    onChange({ items: [...data.items, newItem] });
  };

  const handleRemoveItem = (id: string) => {
    if (data.items.length <= 1) {
      // Clear description if only one item remains
      onChange({
        items: [{ id: 'item-1', description: '', quantity: 1, rate: 0 }],
      });
      return;
    }
    onChange({ items: data.items.filter((item) => item.id !== id) });
  };

  const docTypes: { id: DocumentType; label: string }[] = [
    { id: 'invoice', label: t.invoice },
    { id: 'estimate', label: t.estimate },
    { id: 'proforma', label: t.proforma },
    { id: 'receipt', label: t.receipt },
    {
      id: 'delivery_note',
      label: lang === 'si' ? 'භාණ්ඩ බෙදාහැරීම (Delivery)' : 'Delivery Note',
    },
    {
      id: 'purchase_order',
      label: lang === 'si' ? 'ඇණවුම් පත්‍රය (Purchase Order)' : 'Purchase Order',
    },
  ];

  const templates: { id: TemplateStyle; label: string }[] = [
    { id: 'modern', label: t.templateModern },
    { id: 'executive', label: t.templateExecutive },
    { id: 'minimal', label: t.templateMinimal },
    { id: 'receipt', label: t.templateReceipt },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* AI Invoice / Receipt Photo Scan Quick Banner */}
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-slate-900 to-slate-900 p-4 shadow-lg shadow-violet-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 shrink-0">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>
                {lang === 'si'
                  ? 'Invoice / Bill ඡායාරූපයකින් Auto-Fill කරන්න'
                  : 'Scan & Auto-Fill from Invoice Photo'}
              </span>
              <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold text-violet-300">
                Gemini OCR
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'si'
                ? 'බිලක හෝ රිසිට්පතක ඡායාරූපයක් දමා තත්පර 5න් සියල්ල ස්වයංක්‍රීයව පුරවන්න'
                : 'Upload or snap a photo of any receipt, bill, or invoice to fill items instantly'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAiModal}
          className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/20 transition-all cursor-pointer shrink-0"
        >
          <Camera className="h-3.5 w-3.5" />
          <span>{lang === 'si' ? 'ඡායාරූපය එක් කරන්න' : 'Upload / Snap Bill'}</span>
        </button>
      </div>

      {/* Top Controls: Document Type & Template Style */}
      <div id="section-type" className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm scroll-mt-24">
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.docType}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {docTypes.map((dt) => (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => onChange({ documentType: dt.id })}
                  className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    data.documentType === dt.id
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950/70 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {dt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.template}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onChange({ template: tpl.id })}
                  className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    data.template === tpl.id
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                      : 'bg-slate-950/70 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Meta: Number, Date, Due Date */}
      <div id="section-details" className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm scroll-mt-24">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-bold">{t.invoiceDetails}</span>
          </div>

          <button
            type="button"
            onClick={onOpenAiModal}
            className="sm:hidden flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-600/10 px-2.5 py-1 text-xs font-medium text-violet-300"
          >
            <Sparkles className="h-3 w-3 text-violet-400" />
            <span>AI Fill</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              {t.invoiceNumber}
            </label>
            <input
              type="text"
              value={data.invoiceNumber}
              onChange={(e) => onChange({ invoiceNumber: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              {t.issueDate}
            </label>
            <input
              type="date"
              value={data.issueDate}
              onChange={(e) => onChange({ issueDate: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              {t.dueDate}
            </label>
            <input
              type="date"
              value={data.dueDate}
              onChange={(e) => onChange({ dueDate: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Two Column Section: From (Your Business) & To (Client) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Your Business */}
        <div id="section-business" className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm scroll-mt-24">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200">
              <Building className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold">{t.yourBusiness}</span>
            </div>

            {data.senderLogo ? (
              <button
                type="button"
                onClick={() => onChange({ senderLogo: '' })}
                className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="h-3 w-3" />
                <span>{t.removeLogo}</span>
              </button>
            ) : null}
          </div>

          {/* Logo upload bar */}
          <div className="mb-4">
            {data.senderLogo ? (
              <div className="relative inline-block rounded-xl border border-slate-700 bg-slate-950 p-2">
                <img
                  src={data.senderLogo}
                  alt="Company Logo"
                  className="h-12 max-w-[160px] object-contain"
                />
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 py-2.5 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{t.uploadLogo}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                {t.businessName}
              </label>
              <input
                type="text"
                value={data.senderName}
                onChange={(e) => onChange({ senderName: e.target.value })}
                placeholder="e.g. Apex Creative Studio"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  {t.email}
                </label>
                <input
                  type="email"
                  value={data.senderEmail}
                  onChange={(e) => onChange({ senderEmail: e.target.value })}
                  placeholder="billing@company.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  {t.phone}
                </label>
                <input
                  type="text"
                  value={data.senderPhone}
                  onChange={(e) => onChange({ senderPhone: e.target.value })}
                  placeholder="+1 (555) 019-2834"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">
                {t.address}
              </label>
              <textarea
                rows={2}
                value={data.senderAddress}
                onChange={(e) => onChange({ senderAddress: e.target.value })}
                placeholder="Street address, City, Country"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">
                {t.taxId}
              </label>
              <input
                type="text"
                value={data.senderTaxId}
                onChange={(e) => onChange({ senderTaxId: e.target.value })}
                placeholder="e.g. VAT-892401 or TIN"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bill To (Client Details) */}
        <div id="section-client" className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm scroll-mt-24">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200">
              <User className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold">{t.clientDetails}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsClientDirectoryOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-pointer"
            >
              <span>{lang === 'si' ? '👥 පාරිභෝගිකයින් (Clients)' : '👥 Saved Clients'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Quick Select Client Dropdown */}
            {savedClients.length > 0 && (
              <div className="rounded-xl bg-blue-950/30 border border-blue-500/20 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-blue-300 flex items-center gap-1.5 shrink-0">
                  <User className="h-3 w-3 text-blue-400" />
                  <span>{lang === 'si' ? 'සුරකින ලද Client කෙනෙක් තෝරන්න:' : 'Select Saved Client:'}</span>
                </span>
                <select
                  value=""
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const found = savedClients.find((c) => c.id === selectedId);
                    if (found) {
                      onChange({
                        clientName: found.name || data.clientName,
                        clientEmail: found.email || data.clientEmail,
                        clientPhone: found.phone || data.clientPhone,
                        clientAddress: found.address || data.clientAddress,
                      });
                    }
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-400 focus:outline-none cursor-pointer flex-1 max-w-full sm:max-w-xs"
                >
                  <option value="" disabled>
                    {lang === 'si' ? '-- පාරිභෝගිකයෙකු තෝරන්න (Select Client) --' : '-- Choose a client from dropdown --'}
                  </option>
                  {savedClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.phone ? `(${client.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs text-slate-400">
                  {t.businessName}
                </label>
                {data.clientName && (
                  <button
                    type="button"
                    onClick={() => {
                      addClientContact({
                        name: data.clientName.trim(),
                        email: data.clientEmail?.trim() || undefined,
                        phone: data.clientPhone?.trim() || undefined,
                        address: data.clientAddress?.trim() || undefined,
                      });
                      setSavedClients(getClientDirectory());
                      alert(lang === 'si' ? `"${data.clientName}" Client Directory එකට සුරැකිණි!` : `Saved "${data.clientName}" to Clients Directory!`);
                    }}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    {lang === 'si' ? '+ මෙම Client Directory එකට Save කරන්න' : '+ Save this Client'}
                  </button>
                )}
              </div>
              <input
                type="text"
                value={data.clientName}
                onChange={(e) => onChange({ clientName: e.target.value })}
                placeholder="Client Name or Company"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  {t.email}
                </label>
                <input
                  type="email"
                  value={data.clientEmail}
                  onChange={(e) => onChange({ clientEmail: e.target.value })}
                  placeholder="client@clientcorp.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  {t.phone}
                </label>
                <input
                  type="text"
                  value={data.clientPhone}
                  onChange={(e) => onChange({ clientPhone: e.target.value })}
                  placeholder="+1 (555) 789-0123"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">
                {t.address}
              </label>
              <textarea
                rows={3}
                value={data.clientAddress}
                onChange={(e) => onChange({ clientAddress: e.target.value })}
                placeholder="Client Street, City, Country"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div id="section-items" className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm scroll-mt-24">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200">
            <FileText className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-bold">{t.lineItems}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsProductCatalogOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              <span>{lang === 'si' ? '📦 භාණ්ඩ ලැයිස්තුව (Catalog)' : '📦 Item Catalog'}</span>
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>{t.addItem}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {data.items.map((item, index) => {
            const itemTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950 p-3"
              >
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(item.id, 'description', e.target.value)
                    }
                    placeholder={t.description}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                  {/* Horizontally scrollable container with touch drag / swipe support */}
                  <div className="flex-1 min-w-0 overflow-x-auto pb-1 touch-pan-x scrollbar-thin scrollbar-thumb-slate-700">
                    <div className="flex items-center gap-2 min-w-max">
                      <div className="w-20 shrink-0">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'quantity',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder={t.qty}
                          className="w-full text-center rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="w-28 shrink-0">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'rate',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder={t.rate}
                          className="w-full text-right rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-right font-mono text-xs font-semibold text-emerald-400 whitespace-nowrap shadow-inner">
                        {data.currencySymbol}
                        {itemTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="shrink-0 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded-lg cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financials & Adjustments */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-200">
          <Percent className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-bold">{t.financials}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              {t.taxRate}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="any"
              value={data.taxRate}
              onChange={(e) =>
                onChange({ taxRate: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              {t.discountRate}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="any"
              value={data.discountRate}
              onChange={(e) =>
                onChange({ discountRate: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              {t.shipping}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={data.shippingFee}
              onChange={(e) =>
                onChange({ shippingFee: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              {t.amountPaid}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={data.amountPaid}
              onChange={(e) =>
                onChange({ amountPaid: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Multi-Currency Live Conversion Helper */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">
            {lang === 'si' ? '🌍 ජාත්‍යන්තර මුදල් ඒකක දළ අගයන්:' : '🌍 Global Currency Indicative Rates:'}
          </span>
          <div className="flex items-center gap-2 flex-wrap font-mono text-[10px] text-teal-300">
            <span>1 USD ≈ 306 LKR</span>
            <span>·</span>
            <span>1 EUR ≈ 1.09 USD</span>
            <span>·</span>
            <span>1 GBP ≈ 1.28 USD</span>
            <span>·</span>
            <span>1 USD ≈ 83.5 INR</span>
          </div>
        </div>
      </div>

      {/* Payment & Notes */}
      <div id="section-payment" className="grid grid-cols-1 gap-6 lg:grid-cols-2 scroll-mt-24">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-slate-200">
            <CreditCard className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-bold">{t.paymentDetails}</span>
          </div>
          <textarea
            rows={4}
            value={data.paymentInfo}
            onChange={(e) => onChange({ paymentInfo: e.target.value })}
            placeholder={t.paymentPlaceholder}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-slate-200">
            <FileCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-bold">{t.notes} & {t.terms}</span>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                {t.notes}
              </label>
              <textarea
                rows={2}
                value={data.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                placeholder={t.notesPlaceholder}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                {t.terms}
              </label>
              <textarea
                rows={2}
                value={data.terms}
                onChange={(e) => onChange({ terms: e.target.value })}
                placeholder={t.termsPlaceholder}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            {/* Handwritten Signature Photo Upload & Background Removal */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <PenTool className="h-3.5 w-3.5 text-emerald-400" />
                  <span>
                    {lang === 'si'
                      ? 'අත්සනේ ඡායාරූපය (Background Removal)'
                      : 'Handwritten Signature Photo'}
                  </span>
                </label>
                {data.signatureImage && (
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="text-[11px] text-red-400 hover:text-red-300 transition-colors"
                  >
                    {lang === 'si' ? 'ඉවත් කරන්න' : 'Remove'}
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={signatureInputRef}
                onChange={handleSignatureUpload}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />

              {/* Error when no signature detected */}
              {signatureError && (
                <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-red-200">{signatureError}</p>
                    <p className="text-[11px] text-red-300/80 mt-1">
                      {lang === 'si'
                        ? 'කරුණාකර සුදු කොළයක පෑනෙන් ලියූ පැහැදිලි අත්සනක ඡායාරූපයක් පමණක් එක් කරන්න.'
                        : 'Make sure your photo contains a real pen signature on white paper.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-red-900/60 hover:bg-red-800/80 border border-red-700/60 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors cursor-pointer"
                    >
                      <Upload className="h-3 w-3" />
                      <span>
                        {lang === 'si'
                          ? 'නැවත ඡායාරූපයක් තෝරන්න'
                          : 'Try Another Photo'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {isProcessingSignature ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-6 text-xs text-emerald-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {(t as any).detectingSignature ||
                      (lang === 'si'
                        ? 'අත්සන හඳුනාගනිමින් පසුබිම ඉවත් කරමින් පවතී...'
                        : 'Detecting signature & isolating ink...')}
                  </span>
                </div>
              ) : data.signatureImage ? (
                <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                  {/* Transparent Checkerboard Signature Preview */}
                  <div
                    className="relative flex items-center justify-center rounded-lg border border-slate-800 p-3 min-h-[70px] overflow-hidden"
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                      backgroundColor: '#0f172a',
                    }}
                  >
                    <img
                      src={data.signatureImage}
                      alt="Processed Signature"
                      className="max-h-16 max-w-full object-contain filter drop-shadow-md"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {(t as any).signatureDetectedSuccess ||
                        (lang === 'si'
                          ? 'අත්සන සාර්ථකව හඳුනාගෙන පසුබිම ඉවත් කරන ලදී!'
                          : 'Signature detected & isolated cleanly!')}
                    </span>
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer underline text-[10px]"
                    >
                      {lang === 'si' ? 'වෙනත් එකක් දමන්න' : 'Change photo'}
                    </button>
                  </div>

                  {/* Ink Color Selector */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400">
                      {lang === 'si' ? 'තීන්ත වර්ණය:' : 'Ink color:'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSignatureInkColor('original');
                          reprocessSignature(signatureThreshold, 'original');
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          signatureInkColor === 'original'
                            ? 'bg-slate-700 text-white font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Original
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSignatureInkColor('black');
                          reprocessSignature(signatureThreshold, 'black');
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          signatureInkColor === 'black'
                            ? 'bg-slate-700 text-white font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Deep Black
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSignatureInkColor('blue');
                          reprocessSignature(signatureThreshold, 'blue');
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          signatureInkColor === 'blue'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Royal Blue
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => signatureInputRef.current?.click()}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-300 hover:border-emerald-500 hover:bg-emerald-950/10 transition-colors cursor-pointer"
                >
                  <PenTool className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>
                    {lang === 'si'
                      ? 'අත්සනේ Photo එකක් දමන්න (Background එක නිකම්ම අයින් වේ)'
                      : 'Upload Signature Photo (Auto Background Removal)'}
                  </span>
                </button>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">
                {t.signature}
              </label>
              <input
                type="text"
                value={data.signatureText || ''}
                onChange={(e) => onChange({ signatureText: e.target.value })}
                placeholder={t.signaturePlaceholder}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment QR Code Generator Card */}
      <div id="section-qr" className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm scroll-mt-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>
                  {lang === 'si'
                    ? 'ගෙවීම් සඳහා QR Code එකක් එක් කරන්න'
                    : 'Payment QR Code (LankaQR / PayPal / UPI)'}
                </span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                  Instant Pay
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                {lang === 'si'
                  ? 'පාරිභෝගිකයාට ඕනෑම බැංකු App එකකින් හෝ Camera එකෙන් Scan කර ගෙවීමට'
                  : 'Prints a scannable QR code directly on the PDF for fast mobile payments'}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={!!data.enableQrCode}
              onChange={(e) => onChange({ enableQrCode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {data.enableQrCode && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* QR Type pills */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                {lang === 'si' ? 'QR Code ප්‍රමිතිය තෝරන්න' : 'Select Payment Standard'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'lanka_qr', label: '🇱🇰 LankaQR (Banks)', desc: 'Comm, BOC, Sampath' },
                  { id: 'paypal', label: 'PayPal.me', desc: 'Instant USD / Global' },
                  { id: 'upi', label: '🇮🇳 UPI Payment', desc: 'GPay, PhonePe, Paytm' },
                  { id: 'custom_url', label: 'Custom Pay Link / Wise', desc: 'Any web payment URL' },
                ].map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onChange({ qrCodeType: q.id as any })}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      (data.qrCodeType || 'lanka_qr') === q.id
                        ? 'border-emerald-500 bg-emerald-950/20 text-white font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs leading-tight">{q.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{q.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Account / URL & Beneficiary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  {data.qrCodeType === 'paypal'
                    ? 'PayPal.me Username'
                    : data.qrCodeType === 'upi'
                    ? 'UPI VPA Address (e.g. name@okhdfcbank)'
                    : data.qrCodeType === 'lanka_qr'
                    ? 'Bank Account No. / LankaQR Payload'
                    : 'Payment Link / URL'}
                </label>
                <input
                  type="text"
                  value={data.qrAccountOrUrl || ''}
                  onChange={(e) => onChange({ qrAccountOrUrl: e.target.value })}
                  placeholder={
                    data.qrCodeType === 'paypal'
                      ? 'yourusername (e.g. paypal.me/yourusername)'
                      : data.qrCodeType === 'upi'
                      ? 'e.g. merchant@okaxis'
                      : data.qrCodeType === 'lanka_qr'
                      ? 'e.g. 8120019234 or LankaQR Code'
                      : 'https://wise.com/pay/me or payment URL'
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  {lang === 'si' ? 'ගිණුමේ හිමිකරුගේ නම (Beneficiary Name)' : 'Beneficiary / Account Name'}
                </label>
                <input
                  type="text"
                  value={data.qrBeneficiaryName || ''}
                  onChange={(e) => onChange({ qrBeneficiaryName: e.target.value })}
                  placeholder={data.senderName || 'Your Business Name'}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Catalog Modal */}
      <ProductCatalogModal
        isOpen={isProductCatalogOpen}
        onClose={() => setIsProductCatalogOpen(false)}
        lang={lang}
        currencySymbol={data.currencySymbol || '$'}
        onSelectProduct={(prod) => {
          const newItem: InvoiceItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            description: prod.description,
            quantity: prod.quantity,
            rate: prod.rate,
          };
          onChange({
            items: [...data.items, newItem],
          });
        }}
      />

      {/* Client Directory Modal */}
      <ClientDirectoryModal
        isOpen={isClientDirectoryOpen}
        onClose={() => setIsClientDirectoryOpen(false)}
        lang={lang}
        onSelectClient={(client) => {
          onChange({
            clientName: client.name || data.clientName,
            clientPhone: client.phone || data.clientPhone,
            clientEmail: client.email || data.clientEmail,
            clientAddress: client.address || data.clientAddress,
          });
        }}
      />
    </div>
  );
};
