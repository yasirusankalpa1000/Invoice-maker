import React, { useState, useEffect } from 'react';
import { InvoiceData } from '../types/invoice';
import { generatePaymentQrDataUrl } from '../utils/qrGenerator';
import { QrCode, Smartphone } from 'lucide-react';

interface PaymentQrDisplayProps {
  data: InvoiceData;
  grandTotal: number;
}

export const PaymentQrDisplay: React.FC<PaymentQrDisplayProps> = ({ data, grandTotal }) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (data.enableQrCode && data.qrAccountOrUrl) {
      generatePaymentQrDataUrl(data, grandTotal).then((url) => {
        if (isMounted) setQrUrl(url);
      });
    } else {
      setQrUrl('');
    }
    return () => {
      isMounted = false;
    };
  }, [
    data.enableQrCode,
    data.qrCodeType,
    data.qrAccountOrUrl,
    data.qrBeneficiaryName,
    data.currency,
    data.invoiceNumber,
    grandTotal,
  ]);

  if (!data.enableQrCode || !qrUrl) return null;

  const getBadgeTitle = () => {
    switch (data.qrCodeType) {
      case 'lanka_qr':
        return 'LankaQR · Scan to Pay';
      case 'paypal':
        return 'PayPal.me Instant Pay';
      case 'upi':
        return 'UPI Payment · GPay / PhonePe';
      case 'custom_url':
      default:
        return 'Scan to Pay';
    }
  };

  return (
    <div className="mt-3 inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm">
      <div className="rounded-lg bg-white p-1 border border-slate-200 shadow-xs shrink-0">
        <img
          src={qrUrl}
          alt="Payment QR Code"
          className="h-20 w-20 object-contain"
        />
      </div>
      <div className="text-left space-y-0.5 max-w-[200px]">
        <div className="inline-flex items-center gap-1 rounded bg-slate-900 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400">
          <QrCode className="h-2.5 w-2.5" />
          <span>{getBadgeTitle()}</span>
        </div>
        <p className="text-[10px] font-bold text-slate-800 leading-tight">
          {data.qrBeneficiaryName || data.senderName}
        </p>
        <p className="text-[9px] text-slate-500 font-mono truncate">
          {data.qrAccountOrUrl}
        </p>
        <p className="text-[8px] text-slate-400 flex items-center gap-1">
          <Smartphone className="h-2.5 w-2.5 text-slate-500" />
          <span>Scan with banking app or camera</span>
        </p>
      </div>
    </div>
  );
};
