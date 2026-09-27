import { InvoiceData } from '../types/invoice';
import { calculateInvoiceTotal } from './recentInvoices';

export function generateInvoiceWhatsAppText(invoice: InvoiceData): string {
  const total = calculateInvoiceTotal(invoice);
  const paid = Number(invoice.amountPaid) || 0;
  const due = Math.max(0, total - paid);
  const currency = invoice.currencySymbol || 'Rs.';

  const itemsSummary = invoice.items
    .map((item, idx) => `  ${idx + 1}. ${item.description || 'Item'} (${item.quantity} × ${currency}${Number(item.rate).toFixed(2)})`)
    .join('\n');

  return `🧾 *INVOICE ${invoice.invoiceNumber}*
━━━━━━━━━━━━━━━━━━━━
🏢 *From:* ${invoice.senderName || 'Business'}
👤 *Bill To:* ${invoice.clientName || 'Valued Client'}
📅 *Date:* ${invoice.issueDate || new Date().toISOString().split('T')[0]}
⏳ *Due Date:* ${invoice.dueDate || 'Upon Receipt'}

📦 *Items:*
${itemsSummary}

━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* ${currency}${invoice.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0).toFixed(2)}
${Number(invoice.discountRate) > 0 ? `🏷️ *Discount (${invoice.discountRate}%):* -${currency}${((invoice.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0) * Number(invoice.discountRate)) / 100).toFixed(2)}\n` : ''}${Number(invoice.taxRate) > 0 ? `🏛️ *Tax (${invoice.taxRate}%):* +${currency}${(((invoice.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0) * (100 - Number(invoice.discountRate))) / 100 * Number(invoice.taxRate)) / 100).toFixed(2)}\n` : ''}${Number(invoice.shippingFee) > 0 ? `🚚 *Shipping:* +${currency}${Number(invoice.shippingFee).toFixed(2)}\n` : ''}💵 *TOTAL AMOUNT:* ${currency}${total.toFixed(2)}
${paid > 0 ? `✅ *Paid:* ${currency}${paid.toFixed(2)}\n` : ''}⚠️ *BALANCE DUE:* ${currency}${due.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━
${invoice.paymentInfo ? `💳 *Payment Details:*\n${invoice.paymentInfo}\n` : ''}
🙏 *Thank you for your business!*
Generated privately via QuickInvoice Pro`;
}

export function openWhatsAppShare(invoice: InvoiceData): void {
  const text = generateInvoiceWhatsAppText(invoice);
  const cleanPhone = (invoice.clientPhone || '').replace(/[^0-9]/g, '');

  let url = '';
  if (cleanPhone && cleanPhone.length >= 9) {
    url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  } else {
    url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
