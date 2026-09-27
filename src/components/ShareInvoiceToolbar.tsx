import React, { useState } from 'react';
import { InvoiceData } from '../types/invoice';
import { Language } from '../utils/i18n';
import { MessageSquare, Mail, Share2, Copy, Check } from 'lucide-react';

interface ShareInvoiceToolbarProps {
  data: InvoiceData;
  lang: Language;
}

export const ShareInvoiceToolbar: React.FC<ShareInvoiceToolbarProps> = ({ data, lang }) => {
  const [copied, setCopied] = useState(false);

  // Compute total
  const subtotal = (data.items || []).reduce(
    (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0
  );
  const discountVal = (subtotal * (Number(data.discountRate) || 0)) / 100;
  const taxable = subtotal - discountVal;
  const taxVal = (taxable * (Number(data.taxRate) || 0)) / 100;
  const grandTotal = subtotal - discountVal + taxVal + (Number(data.shippingFee) || 0);
  const formattedTotal = `${data.currencySymbol || '$'} ${grandTotal.toFixed(2)}`;

  const appShareUrl = 'https://ais-pre-s4vhdu63h34onb6pgvdkg2-892944145824.asia-east1.run.app';

  // Build items summary for message
  const itemsText = (data.items || [])
    .map((it) => `• ${it.description || 'Item'} (${it.quantity || 1} x ${data.currencySymbol || '$'}${Number(it.rate || 0).toFixed(2)})`)
    .join('\n');

  const shareText = `📄 *${(data.documentType || 'Invoice').toUpperCase()} - ${data.invoiceNumber || 'INV'}*
From: ${data.senderName || 'Merchant'}
To: ${data.clientName || 'Valued Client'}
Date: ${data.issueDate || 'Today'}
Due Date: ${data.dueDate || 'Upon receipt'}

🛒 *Items / භාණ්ඩ විස්තරය:*
${itemsText || '• Standard Service'}

💰 *Total Amount: ${formattedTotal}*
${data.amountPaid ? `Paid: ${data.currencySymbol || '$'}${Number(data.amountPaid).toFixed(2)} | Balance Due: ${data.currencySymbol || '$'}${(grandTotal - (Number(data.amountPaid) || 0)).toFixed(2)}` : ''}

${data.paymentInfo ? `💳 *Payment Details:*\n${data.paymentInfo}\n` : ''}
Thank you for your business!`;

  const handleWhatsAppShare = () => {
    // If client phone exists, try to direct to their number, else open picker
    const cleanPhone = (data.clientPhone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone.length >= 7
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareText)}`
      : `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${(data.documentType || 'Invoice').toUpperCase()} ${data.invoiceNumber || ''} from ${data.senderName || 'Your Business'}`);
    const body = encodeURIComponent(`Dear ${data.clientName || 'Customer'},\n\nPlease find the details for your ${data.documentType || 'invoice'} below:\n\nReference: ${data.invoiceNumber || 'INV'}\nTotal Due: ${formattedTotal}\nDue Date: ${data.dueDate}\n\nPayment Details:\n${data.paymentInfo || 'Please review attached invoice.'}\n\nThank you for your business!\n${data.senderName}\n\n---\nCreated with QuickInvoice Pro: ${appShareUrl}`);
    const emailTo = data.clientEmail ? encodeURIComponent(data.clientEmail) : '';
    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="no-print mt-3 flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 backdrop-blur-sm flex-wrap">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        <Share2 className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[11px] uppercase tracking-wider text-slate-400">
          {lang === 'si' ? 'Client ට යවන්න:' : 'Send to Client:'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {/* WhatsApp Button */}
        <button
          onClick={handleWhatsAppShare}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
          title="Share via WhatsApp"
        >
          <MessageSquare className="h-3.5 w-3.5 fill-white" />
          <span>WhatsApp</span>
        </button>

        {/* Email Button */}
        <button
          onClick={handleEmailShare}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
          title="Send via Email"
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Email</span>
        </button>

        {/* Copy Summary Button */}
        <button
          onClick={handleCopySummary}
          className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 px-2 py-1.5 text-xs font-medium transition-all cursor-pointer"
          title="Copy Invoice Summary"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 text-[11px]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span className="text-[11px]">Copy Text</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
