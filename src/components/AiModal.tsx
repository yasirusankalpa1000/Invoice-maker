import React, { useState, useRef } from 'react';
import {
  Sparkles,
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
  Camera,
  Upload,
  FileImage,
  Trash2,
} from 'lucide-react';
import { InvoiceData } from '../types/invoice';
import { translations, Language } from '../utils/i18n';

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (extractedData: Partial<InvoiceData>) => void;
  currentCurrency: string;
  lang: Language;
}

export const AiModal: React.FC<AiModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentCurrency,
  lang,
}) => {
  const [promptText, setPromptText] = useState('');
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const t = translations[lang];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError(
        lang === 'si'
          ? 'ඡායාරූපයේ ප්‍රමාණය 8MB වලට වඩා අඩු විය යුතුය'
          : 'Image size must be under 8MB'
      );
      return;
    }

    setError(null);
    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setInvoiceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setInvoiceImage(null);
    setImageFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!promptText.trim() && !invoiceImage) {
      setError(
        lang === 'si'
          ? 'කරුණාකර විස්තරයක් ලියන්න හෝ Invoice ඡායාරූපයක් එක් කරන්න'
          : 'Please enter notes or upload an invoice/receipt photo'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/smart-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: promptText.trim(),
          imageBase64: invoiceImage,
          currency: currentCurrency,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Server error generating invoice');
      }

      if (resData.success && resData.data) {
        const d = resData.data;

        const partialData: Partial<InvoiceData> = {
          invoiceNumber: d.invoiceNumber || undefined,
          issueDate: d.issueDate || undefined,
          dueDate: d.dueDate || undefined,
          senderName: d.senderName || undefined,
          senderEmail: d.senderEmail || undefined,
          senderPhone: d.senderPhone || undefined,
          senderAddress: d.senderAddress || undefined,
          senderTaxId: d.senderTaxId || undefined,
          clientName: d.clientName || undefined,
          clientEmail: d.clientEmail || undefined,
          clientPhone: d.clientPhone || undefined,
          clientAddress: d.clientAddress || undefined,
          taxRate: typeof d.taxRate === 'number' ? d.taxRate : undefined,
          discountRate: typeof d.discountRate === 'number' ? d.discountRate : undefined,
          shippingFee: typeof d.shippingFee === 'number' ? d.shippingFee : undefined,
          amountPaid: typeof d.amountPaid === 'number' ? d.amountPaid : undefined,
          paymentInfo: d.paymentInfo || undefined,
          notes: d.notes || undefined,
          terms: d.paymentTerms || undefined,
        };

        if (Array.isArray(d.items) && d.items.length > 0) {
          partialData.items = d.items.map((item: any, idx: number) => ({
            id: `ai-item-${Date.now()}-${idx}`,
            description: item.description || 'Item description',
            quantity: Number(item.quantity) || 1,
            rate: Number(item.rate) || 0,
          }));
        }

        onApply(partialData);
        onClose();
      } else {
        throw new Error('Could not parse invoice data');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to extract invoice data with AI');
    } finally {
      setLoading(false);
    }
  };

  const getSamplePrompts = (language: Language): string[] => {
    switch (language) {
      case 'si':
        return [
          'වෙබ් අඩවි නිර්මාණය පැය 20ක් පැයකට $45 බැගින්, Logo පැකේජය $300, සේවාදායකයා: Acme Corp, California. 5% මුල් ගෙවීම් වට්ටමක්.',
          'ඡායාරූපකරණය සහ වීඩියෝ පැය 6ක් $600, Photo Retouching පැකේජය $150, 10% වට්ටමක් සහිතව.',
        ];
      case 'es':
        return [
          'Desarrollo web 25 horas a 50€/h y diseño de marca 400€ para cliente Soluciones Iberia SL, 5% de descuento por pronto pago.',
          'Sesión fotográfica comercial 450€ y edición digital 150€ con entrega en 10 días.',
        ];
      case 'fr':
        return [
          'Développement web 20 heures à 60€/h et création identité visuelle 450€ pour client Nova SAS, remise 5%.',
          'Audit SEO et optimisation performance 500€ avec conditions de paiement 14 jours.',
        ];
      case 'de':
        return [
          'Frontend-Entwicklung 25 Stunden zu je 80€/Std. und Design-System 600€ für Kunde DigitalWerk GmbH, 5% Skonto.',
          'Server-Wartung und SSL-Konfiguration 350€, fällig innerhalb von 14 Tagen.',
        ];
      case 'pt':
        return [
          'Desenvolvimento web 30 horas a R$120/h e identidade visual R$600 para cliente Alpha Tech, 5% de desconto.',
          'Consultoria de marketing digital 15 horas a R$90/h com prazo de pagamento de 14 dias.',
        ];
      case 'ar':
        return [
          'تصميم وتطوير موقع إلكتروني 20 ساعة بسعر 120 ريال للساعة وباقة هوية بصرية 800 ريال لشركة الرواد، خصم 5%.',
          'استشارات تقنية ودعم سحابي شهر كامل 1500 ريال مستحقة خلال 14 يوماً.',
        ];
      case 'hi':
        return [
          'वेब डेवलपमेंट 25 घंटे ₹1200 प्रति घंटा और लोगो पैकेज ₹3500, क्लाइंट TechCorp के लिए, 5% छूट के साथ।',
          'डिजिटल मार्केटिंग और एसईओ ऑडिट ₹15000, 14 दिनों के भीतर भुगतान योग्य।',
        ];
      case 'ja':
        return [
          'Webサイト設計・開発 30時間 (単価 6,000円) および ロゴデザイン 60,000円、株式会社テック様向け、5%早期割引。',
          'クラウド環境構築および保守運用パッケージ 120,000円、支払期日14日以内。',
        ];
      case 'zh':
        return [
          '全栈网站开发 25小时 (每小时 260元) 及 品牌设计包 2000元，客户为极客未来科技，提供5%折扣。',
          '云服务器部署及数据库性能调优 1800元，付款期14天。',
        ];
      case 'en':
      default:
        return [
          'Full-stack development 30 hours at $80/hr, UI/UX prototype $500, Client: Orbit Tech in London, 5% early discount, net 14 days.',
          '3 months cloud infrastructure maintenance at $450/month, SSL setup $99, for client GreenLeaf Inc.',
        ];
    }
  };

  const samplePrompts = getSamplePrompts(lang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t.magicAiTitle}</h3>
            <p className="text-xs text-slate-400">{t.magicAiSubtitle}</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-950/60 border border-red-800/60 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Invoice / Bill Photo */}
        <div className="mt-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/png, image/jpeg, image/webp, image/heic"
            className="hidden"
          />

          {invoiceImage ? (
            <div className="flex items-center justify-between rounded-xl border border-violet-500/40 bg-violet-950/20 p-2.5">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={invoiceImage}
                  alt="Invoice Photo"
                  className="h-12 w-12 rounded-lg object-cover border border-violet-500/30 shrink-0"
                />
                <div className="truncate">
                  <p className="text-xs font-semibold text-violet-200 truncate">
                    {imageFileName || 'invoice_photo.jpg'}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    ✓ {lang === 'si' ? 'ඡායාරූපය සූදානම් (Photo Attached)' : 'Photo ready for AI OCR'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Remove photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-4 hover:border-violet-500 hover:bg-violet-950/10 transition-all cursor-pointer"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400 group-hover:bg-violet-600/20 transition-colors">
                <Camera className="h-5 w-5" />
              </div>
              <span className="mt-2 text-xs font-semibold text-slate-200 group-hover:text-violet-300">
                {lang === 'si'
                  ? '📷 Invoice / Bill එකක ඡායාරූපයක් එක් කරන්න'
                  : '📷 Upload or Snap Invoice / Bill Photo'}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                {lang === 'si'
                  ? 'JPG, PNG, WEBP — Gemini AI මඟින් සියලු අයිතම සහ මුදල් කියවා පුරවනු ඇත'
                  : 'AI will automatically read items, rates, taxes & customer details'}
              </span>
            </button>
          )}
        </div>

        {/* Notes / prompt input */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-slate-400">
              {lang === 'si'
                ? 'හෝ අමතර විස්තර / සටහන් (Optional Notes):'
                : 'Or write prompt / extra instructions (Optional):'}
            </label>
            {invoiceImage && (
              <span className="text-[10px] text-violet-400 font-medium">
                Photo + Text combined OCR
              </span>
            )}
          </div>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={3}
            placeholder={
              invoiceImage
                ? lang === 'si'
                  ? 'උදා: බිලේ තියෙන 10% discount එකත් දාන්න, currency එක USD කරන්න...'
                  : 'Optional instructions: e.g. "Apply 5% early discount, set due date to next Friday"...'
                : t.magicAiPlaceholder
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {!invoiceImage && (
          <div className="mt-3">
            <span className="text-xs text-slate-500">Quick examples to try:</span>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromptText(p)}
                  className="text-left text-[11px] text-slate-400 hover:text-violet-300 transition-colors truncate p-1.5 rounded-lg bg-slate-950/50 border border-slate-800"
                >
                  👉 {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-lg hover:bg-violet-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t.magicAiGenerating}</span>
              </>
            ) : (
              <>
                <span>{t.magicAiGenerate}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
