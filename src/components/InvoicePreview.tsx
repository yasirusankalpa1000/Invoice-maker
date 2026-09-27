import React from 'react';
import { InvoiceData } from '../types/invoice';
import { translations, Language } from '../utils/i18n';
import { PaymentQrDisplay } from './PaymentQrDisplay';
import { ShareInvoiceToolbar } from './ShareInvoiceToolbar';

interface InvoicePreviewProps {
  data: InvoiceData;
  lang: Language;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ data, lang }) => {
  const t = translations[lang];

  // Mathematical calculations
  const subtotal = (data.items || []).reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    return acc + qty * rate;
  }, 0);

  const discountAmount = subtotal * ((Number(data.discountRate) || 0) / 100);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * ((Number(data.taxRate) || 0) / 100);
  const shipping = Number(data.shippingFee) || 0;
  const grandTotal = taxableAmount + taxAmount + shipping;
  const balanceDue = grandTotal - (Number(data.amountPaid) || 0);

  const formatPrice = (val: number) => {
    const symbol = data.currencySymbol || '$';
    const formattedNum = val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${symbol} ${formattedNum}`;
  };

  const getDocTitle = () => {
    switch (data.documentType) {
      case 'receipt':
        return 'PAYMENT RECEIPT';
      case 'estimate':
        return 'ESTIMATE / QUOTE';
      case 'proforma':
        return 'PROFORMA INVOICE';
      case 'delivery_note':
        return 'DELIVERY NOTE';
      case 'purchase_order':
        return 'PURCHASE ORDER';
      case 'invoice':
      default:
        return 'TAX INVOICE';
    }
  };

  // Render template variants
  if (data.template === 'receipt') {
    return (
      <div className="flex flex-col gap-3">
        <ShareInvoiceToolbar data={data} lang={lang} />
        <div
          id="invoice-printable-container"
          className="mx-auto w-full max-w-[580px] rounded-2xl bg-white p-6 sm:p-10 text-slate-900 shadow-2xl transition-all"
        >
          <div className="flex flex-col items-center text-center">
            {data.senderLogo && (
              <img
                src={data.senderLogo}
                alt="Logo"
                className="h-16 max-w-[200px] object-contain mb-3"
              />
            )}
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              {data.senderName || 'Business Name'}
            </h2>
            {data.senderAddress && (
              <p className="mt-1 whitespace-pre-line text-xs text-slate-500">
                {data.senderAddress}
              </p>
            )}
            <div className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-500">
              {data.senderEmail && <span>{data.senderEmail}</span>}
              {data.senderPhone && <span>· {data.senderPhone}</span>}
            </div>
            {data.senderTaxId && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tax ID: {data.senderTaxId}
              </p>
            )}

            <div className="my-4 w-full border-b-2 border-dashed border-slate-300" />

            <div className="text-sm font-extrabold uppercase tracking-widest text-slate-900">
              {getDocTitle()}
            </div>
            <p className="font-mono text-xs text-slate-600 mt-0.5">
              Ref: {data.invoiceNumber || 'INV'}
            </p>
            <p className="text-xs text-slate-400">Date: {data.issueDate}</p>

            <div className="my-4 w-full border-b-2 border-dashed border-slate-300" />
          </div>

          {/* Customer */}
          {data.clientName && (
            <div className="mb-6 text-xs text-slate-700">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">
                Customer / Recipient:
              </span>
              <p className="font-semibold">{data.clientName}</p>
              {data.clientAddress && (
                <p className="whitespace-pre-line text-slate-500 text-[11px]">
                  {data.clientAddress}
                </p>
              )}
              {data.clientPhone && (
                <p className="text-slate-500 text-[11px]">Phone: {data.clientPhone}</p>
              )}
            </div>
          )}

          {/* Items */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-900 text-slate-900 text-[11px] uppercase tracking-wider">
                <th className="py-2 text-left font-bold">Item</th>
                <th className="py-2 text-center font-bold">Qty</th>
                <th className="py-2 text-right font-bold">Rate</th>
                <th className="py-2 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-slate-200">
              {(data.items || []).map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 pr-2 font-medium text-slate-800">
                    {item.description || 'Item description'}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-600">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-600 font-mono">
                    {formatPrice(Number(item.rate) || 0)}
                  </td>
                  <td className="py-2.5 text-right font-bold text-slate-900 font-mono">
                    {formatPrice((Number(item.quantity) || 0) * (Number(item.rate) || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculations */}
          <div className="mt-6 flex flex-col gap-2 border-t-2 border-slate-900 pt-3 text-xs">
            <div className="flex justify-between items-baseline gap-2 text-slate-600">
              <span className="shrink-0 font-medium">Subtotal</span>
              <span className="font-mono text-right break-all">{formatPrice(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-baseline gap-2 text-emerald-700">
                <span className="shrink-0 font-medium">Discount ({data.discountRate}%)</span>
                <span className="font-mono text-right break-all">- {formatPrice(discountAmount)}</span>
              </div>
            )}

            {data.taxRate > 0 && (
              <div className="flex justify-between items-baseline gap-2 text-slate-600">
                <span className="shrink-0 font-medium">Tax ({data.taxRate}%)</span>
                <span className="font-mono text-right break-all">{formatPrice(taxAmount)}</span>
              </div>
            )}

            {shipping > 0 && (
              <div className="flex justify-between items-baseline gap-2 text-slate-600">
                <span className="shrink-0 font-medium">Shipping</span>
                <span className="font-mono text-right break-all">{formatPrice(shipping)}</span>
              </div>
            )}

            <div className="mt-1 flex justify-between items-baseline gap-2 border-t-2 border-slate-900 pt-2 text-sm sm:text-base font-extrabold text-slate-950">
              <span className="shrink-0">Total</span>
              <span className="font-mono text-right break-all leading-tight">{formatPrice(grandTotal)}</span>
            </div>

            {data.amountPaid > 0 && (
              <div className="flex justify-between items-baseline gap-2 text-slate-600 pt-1">
                <span className="shrink-0">Amount Paid</span>
                <span className="font-mono text-right break-all">{formatPrice(data.amountPaid)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline gap-2 border-t border-slate-200 pt-1.5 text-xs sm:text-sm font-bold text-slate-900">
              <span className="shrink-0">Balance Due</span>
              <span className="font-mono text-right break-all leading-tight">{formatPrice(balanceDue)}</span>
            </div>
          </div>

          {/* Payment QR Code */}
          <div className="flex justify-center">
            <PaymentQrDisplay data={data} grandTotal={grandTotal} />
          </div>

          {/* Footer Notes */}
          {(data.notes || data.paymentInfo) && (
            <div className="mt-8 border-t border-dashed border-slate-300 pt-4 text-center text-[11px] text-slate-500">
              {data.notes && <p className="italic mb-2">{data.notes}</p>}
              {data.paymentInfo && (
                <p className="whitespace-pre-line text-slate-600 font-mono text-[10px]">
                  {data.paymentInfo}
                </p>
              )}
              <p className="mt-4 font-semibold text-slate-400 uppercase tracking-widest text-[9px]">
                *** THANK YOU FOR YOUR BUSINESS ***
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (data.template === 'executive') {
    return (
      <div className="flex flex-col gap-3">
        <ShareInvoiceToolbar data={data} lang={lang} />
        <div
          id="invoice-printable-container"
          className="mx-auto w-full max-w-[820px] rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden transition-all"
        >
          {/* Navy Header Accent */}
          <div className="bg-slate-900 px-8 py-8 sm:px-12 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {data.senderLogo ? (
                  <div className="bg-white p-2 rounded-lg">
                    <img
                      src={data.senderLogo}
                      alt="Logo"
                      className="h-12 max-w-[160px] object-contain"
                    />
                  </div>
                ) : null}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {data.senderName || 'Corporate Entity'}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {data.senderTaxId ? `Tax Registration: ${data.senderTaxId}` : ''}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  {getDocTitle()}
                </span>
                <p className="text-lg font-mono font-bold text-white mt-0.5">
                  {data.invoiceNumber || 'INV'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-12">
            {/* Meta Information Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 rounded-xl bg-slate-50 p-6 border border-slate-200 text-xs mb-8">
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[10px] block mb-1">
                  Issued By
                </span>
                <p className="font-bold text-slate-900">{data.senderName}</p>
                <p className="whitespace-pre-line text-slate-600 mt-0.5">{data.senderAddress}</p>
                <p className="text-slate-500 mt-1">{data.senderEmail}</p>
                <p className="text-slate-500">{data.senderPhone}</p>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-semibold text-[10px] block mb-1">
                  Bill To
                </span>
                <p className="font-bold text-slate-900">{data.clientName || 'Valued Client'}</p>
                <p className="whitespace-pre-line text-slate-600 mt-0.5">{data.clientAddress}</p>
                <p className="text-slate-500 mt-1">{data.clientEmail}</p>
                <p className="text-slate-500">{data.clientPhone}</p>
              </div>

              <div className="flex flex-col justify-between sm:text-right">
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block mb-1">
                    Document Dates
                  </span>
                  <p className="text-slate-700">
                    <span className="font-medium text-slate-500">Date: </span>
                    <span className="font-semibold">{data.issueDate}</span>
                  </p>
                  <p className="text-slate-700 mt-0.5">
                    <span className="font-medium text-slate-500">Due: </span>
                    <span className="font-semibold">{data.dueDate}</span>
                  </p>
                </div>
                <div className="mt-3 sm:mt-0">
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                    Total Amount
                  </span>
                  <p className="text-xl font-bold font-mono text-slate-900">
                    {formatPrice(grandTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Line items table */}
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 text-left font-bold">Item Description</th>
                  <th className="py-3 px-3 text-center font-bold w-16">Qty</th>
                  <th className="py-3 px-3 text-right font-bold w-28">Rate</th>
                  <th className="py-3 px-4 text-right font-bold w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(data.items || []).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {item.description || 'Service line item'}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-3.5 px-3 text-right text-slate-600">
                      {formatPrice(Number(item.rate) || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatPrice((Number(item.quantity) || 0) * (Number(item.rate) || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial summary */}
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-start gap-8">
              <div className="flex-1 text-xs">
                {data.paymentInfo && (
                  <div className="mb-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Payment Instructions:
                    </span>
                    <p className="whitespace-pre-line text-slate-600 leading-relaxed font-mono text-[11px]">
                      {data.paymentInfo}
                    </p>
                  </div>
                )}
                {/* QR Code */}
                <PaymentQrDisplay data={data} grandTotal={grandTotal} />

                {data.terms && (
                  <p className="text-[11px] text-slate-500 italic mt-3">
                    <strong>Terms:</strong> {data.terms}
                  </p>
                )}
              </div>

              <div className="w-full sm:w-80 rounded-xl bg-slate-50 p-4 sm:p-5 border border-slate-200 text-xs">
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-baseline gap-2 text-slate-600">
                    <span className="shrink-0 font-medium">Subtotal</span>
                    <span className="font-mono font-medium text-right break-all">{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-baseline gap-2 text-emerald-700">
                      <span className="shrink-0 font-medium">Discount ({data.discountRate}%)</span>
                      <span className="font-mono text-right break-all">- {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  {data.taxRate > 0 && (
                    <div className="flex justify-between items-baseline gap-2 text-slate-600">
                      <span className="shrink-0 font-medium">Tax ({data.taxRate}%)</span>
                      <span className="font-mono text-right break-all">{formatPrice(taxAmount)}</span>
                    </div>
                  )}
                  {shipping > 0 && (
                    <div className="flex justify-between items-baseline gap-2 text-slate-600">
                      <span className="shrink-0 font-medium">Shipping</span>
                      <span className="font-mono text-right break-all">{formatPrice(shipping)}</span>
                    </div>
                  )}
                  <div className="mt-1 border-t border-slate-300 pt-2 flex justify-between items-baseline gap-2 text-sm sm:text-base font-bold text-slate-900">
                    <span className="shrink-0">Grand Total</span>
                    <span className="font-mono text-right break-all leading-tight">{formatPrice(grandTotal)}</span>
                  </div>
                  {data.amountPaid > 0 && (
                    <div className="flex justify-between items-baseline gap-2 text-slate-600 pt-1">
                      <span className="shrink-0">Amount Paid</span>
                      <span className="font-mono text-right break-all">{formatPrice(data.amountPaid)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between items-baseline gap-2 text-xs sm:text-sm font-extrabold text-emerald-600">
                    <span className="shrink-0">Balance Due</span>
                    <span className="font-mono text-right break-all leading-tight">{formatPrice(balanceDue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature */}
            {(data.signatureImage || data.signatureText) && (
              <div className="mt-10 flex justify-end">
                <div className="text-right border-t border-slate-300 pt-2 inline-flex flex-col items-end min-w-[200px]">
                  {data.signatureImage && (
                    <img
                      src={data.signatureImage}
                      alt="Authorized Signature"
                      className="h-14 max-w-[200px] object-contain mb-1"
                    />
                  )}
                  {data.signatureText && (
                    <p className="text-xs font-semibold text-slate-800">{data.signatureText}</p>
                  )}
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Authorized Signature</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (data.template === 'minimal') {
    return (
      <div className="flex flex-col gap-3">
        <ShareInvoiceToolbar data={data} lang={lang} />
        <div
          id="invoice-printable-container"
          className="mx-auto w-full max-w-[820px] rounded-2xl bg-white text-slate-900 shadow-2xl border-t-8 border-slate-800 overflow-hidden transition-all"
        >
          {/* Clean Slate Header */}
          <div className="p-8 sm:p-12 pb-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
              <div>
                {data.senderLogo ? (
                  <img
                    src={data.senderLogo}
                    alt="Logo"
                    className="h-14 max-w-[220px] object-contain mb-3"
                  />
                ) : null}
                <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  {data.senderName || 'Your Business'}
                </h2>
                <p className="mt-1 whitespace-pre-line text-xs text-slate-500 leading-relaxed max-w-sm font-sans">
                  {data.senderAddress}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  {data.senderEmail && <span>{data.senderEmail}</span>}
                  {data.senderPhone && <span>· {data.senderPhone}</span>}
                  {data.senderTaxId && <span>· Tax ID / TIN: {data.senderTaxId}</span>}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block text-xs font-mono font-bold uppercase tracking-widest bg-slate-900 text-white px-3 py-1 rounded">
                  {getDocTitle()}
                </span>
                <p className="mt-2 font-mono text-xl font-bold tracking-tight text-slate-900">
                  #{data.invoiceNumber || 'INV'}
                </p>
                <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500 font-mono">
                  <div>
                    <span className="text-slate-400">Date: </span>
                    <span className="font-semibold text-slate-800">{data.issueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Due: </span>
                    <span className="font-semibold text-slate-800">{data.dueDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To Slate Card */}
            <div className="mt-8 rounded-lg bg-slate-50 border-l-4 border-slate-800 p-5 flex flex-col sm:flex-row justify-between gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Invoiced To
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {data.clientName || 'Client Name'}
                </h3>
                <p className="mt-1 whitespace-pre-line text-slate-600 leading-relaxed max-w-sm">
                  {data.clientAddress}
                </p>
              </div>

              <div className="flex flex-col sm:items-end justify-center text-slate-600 font-mono">
                {data.clientEmail && <p>{data.clientEmail}</p>}
                {data.clientPhone && <p className="mt-0.5">{data.clientPhone}</p>}
              </div>
            </div>
          </div>

          {/* Clean Slate Items Table */}
          <div className="p-8 sm:p-12 pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 uppercase tracking-wider text-[11px] border-y border-slate-300">
                    <th className="py-3 px-3 text-left font-bold">Item Description</th>
                    <th className="py-3 px-3 text-center font-bold w-16">Qty</th>
                    <th className="py-3 px-3 text-right font-bold w-28">Price</th>
                    <th className="py-3 px-3 text-right font-bold w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(data.items || []).map((item, index) => (
                    <tr key={item.id} className={index % 2 === 1 ? 'bg-slate-50/60' : ''}>
                      <td className="py-3.5 px-3 font-medium text-slate-800 leading-snug">
                        {item.description || 'Service or product description'}
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-600 font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-600 font-mono">
                        {formatPrice(Number(item.rate) || 0)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatPrice((Number(item.quantity) || 0) * (Number(item.rate) || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Instructions */}
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-start gap-8 pt-6 border-t-2 border-slate-200">
              <div className="flex-1 text-xs">
                {data.paymentInfo && (
                  <div className="mb-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
                      Bank & Payment Instructions
                    </span>
                    <p className="whitespace-pre-line text-slate-800 font-mono text-[11px] leading-relaxed">
                      {data.paymentInfo}
                    </p>
                  </div>
                )}

                {/* Scannable Payment QR Code */}
                <PaymentQrDisplay data={data} grandTotal={grandTotal} />

                {data.notes && (
                  <div className="mb-3 mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      Special Notes
                    </span>
                    <p className="text-slate-600 italic text-[11px] leading-relaxed">
                      {data.notes}
                    </p>
                  </div>
                )}

                {data.terms && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      Terms of Service
                    </span>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      {data.terms}
                    </p>
                  </div>
                )}
              </div>

              {/* Totals Box in Slate style */}
              <div className="w-full sm:w-80 rounded-xl bg-slate-50 p-4 border border-slate-200 flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between items-baseline gap-2 text-slate-600">
                  <span className="shrink-0 font-medium">Subtotal</span>
                  <span className="font-mono font-medium text-right break-all">{formatPrice(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-baseline gap-2 text-slate-700">
                    <span className="shrink-0 font-medium">Discount ({data.discountRate}%)</span>
                    <span className="font-mono text-right break-all">- {formatPrice(discountAmount)}</span>
                  </div>
                )}

                {data.taxRate > 0 && (
                  <div className="flex justify-between items-baseline gap-2 text-slate-600">
                    <span className="shrink-0 font-medium">Tax ({data.taxRate}%)</span>
                    <span className="font-mono text-right break-all">{formatPrice(taxAmount)}</span>
                  </div>
                )}

                {shipping > 0 && (
                  <div className="flex justify-between items-baseline gap-2 text-slate-600">
                    <span className="shrink-0 font-medium">Shipping</span>
                    <span className="font-mono text-right break-all">{formatPrice(shipping)}</span>
                  </div>
                )}

                <div className="mt-1 border-t-2 border-slate-800 pt-2 flex justify-between items-baseline gap-2 text-sm sm:text-base font-black text-slate-900">
                  <span className="shrink-0">Total Amount</span>
                  <span className="font-mono text-right break-all leading-tight">{formatPrice(grandTotal)}</span>
                </div>

                {data.amountPaid > 0 && (
                  <div className="flex justify-between items-baseline gap-2 text-slate-600 pt-1">
                    <span className="shrink-0">Amount Paid</span>
                    <span className="font-mono text-right break-all">{formatPrice(data.amountPaid)}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline gap-2 border-t border-slate-200 pt-1.5 text-xs sm:text-sm font-bold text-slate-900">
                  <span className="shrink-0">Balance Due</span>
                  <span className="font-mono text-right break-all leading-tight">{formatPrice(balanceDue)}</span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            {(data.signatureImage || data.signatureText) && (
              <div className="mt-10 flex justify-end">
                <div className="text-right border-t border-slate-400 pt-1.5 inline-flex flex-col items-end min-w-[200px]">
                  {data.signatureImage && (
                    <img
                      src={data.signatureImage}
                      alt="Authorized Signature"
                      className="h-14 max-w-[200px] object-contain mb-1"
                    />
                  )}
                  {data.signatureText && (
                    <p className="text-xs font-semibold text-slate-900">{data.signatureText}</p>
                  )}
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">Authorized Signature</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Modern Minimal Template (Default)
  return (
    <div className="flex flex-col gap-3">
      <ShareInvoiceToolbar data={data} lang={lang} />
      <div
        id="invoice-printable-container"
        className="mx-auto w-full max-w-[820px] rounded-2xl bg-white p-8 sm:p-12 text-slate-900 shadow-2xl transition-all"
      >
        {/* Header: Company & Document Title */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-b border-slate-200 pb-8">
          <div>
            {data.senderLogo ? (
              <img
                src={data.senderLogo}
                alt="Logo"
                className="h-14 max-w-[220px] object-contain mb-3"
              />
            ) : null}
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              {data.senderName || 'Your Business'}
            </h2>
            <p className="mt-1 whitespace-pre-line text-xs text-slate-500 leading-relaxed max-w-sm">
              {data.senderAddress}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              {data.senderEmail && <span>{data.senderEmail}</span>}
              {data.senderPhone && <span>· {data.senderPhone}</span>}
              {data.senderTaxId && <span>· Tax ID: {data.senderTaxId}</span>}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
              {getDocTitle()}
            </span>
            <p className="mt-2 font-mono text-xl font-bold tracking-tight text-slate-900">
              {data.invoiceNumber || 'INV'}
            </p>
            <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500">
              <div>
                <span className="font-medium text-slate-400">Issue Date: </span>
                <span className="font-semibold text-slate-700">{data.issueDate}</span>
              </div>
              <div>
                <span className="font-medium text-slate-400">Due Date: </span>
                <span className="font-semibold text-slate-700">{data.dueDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="my-8 rounded-xl bg-slate-50 p-6 border border-slate-100 flex flex-col sm:flex-row justify-between gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
              Bill To / Client
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {data.clientName || 'Client Name'}
            </h3>
            <p className="mt-1 whitespace-pre-line text-slate-600 leading-relaxed max-w-sm">
              {data.clientAddress}
            </p>
          </div>

          <div className="flex flex-col sm:items-end justify-center text-slate-600">
            {data.clientEmail && <p>{data.clientEmail}</p>}
            {data.clientPhone && <p className="mt-0.5">{data.clientPhone}</p>}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 uppercase tracking-wider text-[11px]">
                <th className="py-3 text-left font-black">Description</th>
                <th className="py-3 px-3 text-center font-black w-16">Qty</th>
                <th className="py-3 px-3 text-right font-black w-28">Rate</th>
                <th className="py-3 text-right font-black w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.items || []).map((item) => (
                <tr key={item.id}>
                  <td className="py-3.5 pr-4 font-medium text-slate-800 leading-snug">
                    {item.description || 'Description of service or product'}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-600 font-mono">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 px-3 text-right text-slate-600 font-mono">
                    {formatPrice(Number(item.rate) || 0)}
                  </td>
                  <td className="py-3.5 text-right font-bold text-slate-950 font-mono">
                    {formatPrice((Number(item.quantity) || 0) * (Number(item.rate) || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations & Notes */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-start gap-8 pt-6 border-t border-slate-100">
          <div className="flex-1 text-xs">
            {data.paymentInfo && (
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Payment Instructions
                </span>
                <p className="whitespace-pre-line text-slate-700 font-mono text-[11px] leading-relaxed">
                  {data.paymentInfo}
                </p>
              </div>
            )}

            {/* QR Code */}
            <PaymentQrDisplay data={data} grandTotal={grandTotal} />

            {data.notes && (
              <div className="mb-3 mt-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Notes
                </span>
                <p className="text-slate-600 italic text-[11px] leading-relaxed">
                  {data.notes}
                </p>
              </div>
            )}

            {data.terms && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Terms
                </span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  {data.terms}
                </p>
              </div>
            )}
          </div>

          {/* Totals Box */}
          <div className="w-full sm:w-80 flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between items-baseline gap-2 text-slate-600">
              <span className="shrink-0 font-medium">Subtotal</span>
              <span className="font-mono font-medium text-right break-all">{formatPrice(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-baseline gap-2 text-emerald-600">
                <span className="shrink-0 font-medium">Discount ({data.discountRate}%)</span>
                <span className="font-mono text-right break-all">- {formatPrice(discountAmount)}</span>
              </div>
            )}

            {data.taxRate > 0 && (
              <div className="flex justify-between items-baseline gap-2 text-slate-600">
                <span className="shrink-0 font-medium">Tax ({data.taxRate}%)</span>
                <span className="font-mono text-right break-all">{formatPrice(taxAmount)}</span>
              </div>
            )}

            {shipping > 0 && (
              <div className="flex justify-between items-baseline gap-2 text-slate-600">
                <span className="shrink-0 font-medium">Shipping</span>
                <span className="font-mono text-right break-all">{formatPrice(shipping)}</span>
              </div>
            )}

            <div className="mt-1 border-t-2 border-slate-900 pt-2 flex justify-between items-baseline gap-2 text-sm sm:text-base font-extrabold text-slate-950">
              <span className="shrink-0">Total</span>
              <span className="font-mono text-right break-all leading-tight">{formatPrice(grandTotal)}</span>
            </div>

            {data.amountPaid > 0 && (
              <div className="flex justify-between items-baseline gap-2 text-slate-600 pt-1">
                <span className="shrink-0">Amount Paid</span>
                <span className="font-mono text-right break-all">{formatPrice(data.amountPaid)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline gap-2 border-t border-slate-100 pt-1.5 text-xs sm:text-sm font-bold text-emerald-600">
              <span className="shrink-0">Balance Due</span>
              <span className="font-mono text-right break-all leading-tight">{formatPrice(balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Signature Area */}
        {(data.signatureImage || data.signatureText) && (
          <div className="mt-10 flex justify-end">
            <div className="text-right border-t border-slate-400 pt-1.5 inline-flex flex-col items-end min-w-[200px]">
              {data.signatureImage && (
                <img
                  src={data.signatureImage}
                  alt="Authorized Signature"
                  className="h-14 max-w-[200px] object-contain mb-1"
                />
              )}
              {data.signatureText && (
                <p className="text-xs font-semibold text-slate-900">{data.signatureText}</p>
              )}
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Authorized Signature</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
