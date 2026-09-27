import QRCode from 'qrcode';
import { InvoiceData } from '../types/invoice';

/**
 * Generates a clean QR code Data URL (PNG) based on payment configuration.
 */
export async function generatePaymentQrDataUrl(
  data: InvoiceData,
  totalAmount: number
): Promise<string> {
  if (!data.enableQrCode) return '';

  const qrType = data.qrCodeType || 'lanka_qr';
  const accountOrUrl = (data.qrAccountOrUrl || '').trim();
  const beneficiary = (data.qrBeneficiaryName || data.senderName || '').trim();
  const amountStr = totalAmount.toFixed(2);

  let payload = '';

  if (qrType === 'paypal') {
    // PayPal.me format: https://paypal.me/username/amountUSD
    const cleanUsername = accountOrUrl.replace(/^https?:\/\/(www\.)?paypal\.me\//i, '').replace(/^\/+/, '');
    if (cleanUsername) {
      payload = `https://paypal.me/${cleanUsername}/${amountStr}${data.currency || 'USD'}`;
    } else {
      payload = accountOrUrl || 'https://paypal.me';
    }
  } else if (qrType === 'upi') {
    // UPI format for India: upi://pay?pa=...&pn=...&am=...&cu=INR
    const cleanPa = accountOrUrl.replace(/^upi:\/\/pay\?pa=/i, '');
    payload = `upi://pay?pa=${encodeURIComponent(cleanPa)}&pn=${encodeURIComponent(beneficiary || 'Merchant')}&am=${amountStr}&cu=${data.currency || 'INR'}&tn=${encodeURIComponent(data.invoiceNumber || 'Invoice')}`;
  } else if (qrType === 'lanka_qr') {
    // LankaQR standard or bank transfer payload
    // If user provided a raw URL or merchant code:
    if (accountOrUrl.startsWith('http://') || accountOrUrl.startsWith('https://')) {
      payload = accountOrUrl;
    } else {
      // Formatted LankaQR readable string for mobile banking apps (Commercial Flash, Sampath Vishwa, BOC, Frimi, iPay)
      payload = `LANKAQR|BEN:${beneficiary || data.senderName}|ACC:${accountOrUrl}|AMT:${amountStr}|CUR:${data.currency || 'LKR'}|REF:${data.invoiceNumber || 'INV'}`;
    }
  } else {
    // Custom URL or payment link
    payload = accountOrUrl.startsWith('http://') || accountOrUrl.startsWith('https://')
      ? accountOrUrl
      : `https://${accountOrUrl}`;
  }

  if (!payload || payload === 'https://') return '';

  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate payment QR code:', err);
    return '';
  }
}
