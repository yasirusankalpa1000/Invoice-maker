export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export type DocumentType =
  | 'invoice'
  | 'receipt'
  | 'estimate'
  | 'proforma'
  | 'delivery_note'
  | 'purchase_order';

export type TemplateStyle = 'modern' | 'executive' | 'minimal' | 'receipt';

export type QrCodeType = 'lanka_qr' | 'paypal' | 'upi' | 'custom_url';

export interface InvoiceData {
  documentType: DocumentType;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  template: TemplateStyle;
  currency: string;
  currencySymbol: string;
  
  // From (Sender)
  senderLogo?: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderAddress: string;
  senderTaxId: string;

  // To (Client)
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;

  // Items
  items: InvoiceItem[];

  // Financials
  taxRate: number; // percentage
  discountRate: number; // percentage
  shippingFee: number;
  amountPaid: number;

  // Notes & Payment Info
  paymentInfo: string;
  notes: string;
  terms: string;
  signatureText?: string;
  signatureImage?: string;

  // Payment QR Code integration
  enableQrCode?: boolean;
  qrCodeType?: QrCodeType;
  qrAccountOrUrl?: string; // Merchant ID, account number, paypal.me link, upi vpa, or custom URL
  qrBeneficiaryName?: string;
  qrInstructions?: string;
}

export interface SavedInvoiceRecord {
  id: string;
  savedAt: string;
  data: InvoiceData;
  total: number;
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee (Rs.)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AU$)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar (SG$)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
];

export const DEFAULT_INVOICE: InvoiceData = {
  documentType: 'invoice',
  invoiceNumber: 'INV-2026-001',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  template: 'modern',
  currency: 'USD',
  currencySymbol: '$',

  senderLogo: '',
  senderName: 'Apex Creative Studio',
  senderEmail: 'hello@apexstudio.design',
  senderPhone: '+1 (555) 389-2041',
  senderAddress: '742 Evergreen Terrace, Suite 400\nSan Francisco, CA 94107',
  senderTaxId: 'TAX-8924-US',

  clientName: 'Nexus Global Technologies',
  clientEmail: 'billing@nexusglobal.io',
  clientPhone: '+1 (555) 782-9901',
  clientAddress: '100 Innovation Parkway, Floor 12\nAustin, TX 78701',

  items: [
    {
      id: 'item-1',
      description: 'Brand Identity & Design System (Tokens, Typography, Components)',
      quantity: 1,
      rate: 1850,
    },
    {
      id: 'item-2',
      description: 'Responsive Web Application Frontend Engineering (React + Tailwind)',
      quantity: 35,
      rate: 75,
    },
    {
      id: 'item-3',
      description: 'SEO Optimization, Core Web Vitals & Analytics Integration',
      quantity: 1,
      rate: 450,
    },
  ],

  taxRate: 8,
  discountRate: 5,
  shippingFee: 0,
  amountPaid: 0,

  paymentInfo: 'Bank: Silicon Valley Bank\nAccount: 9876 5432 1098\nRouting: 121000358\nSWIFT: SVBUS6S\nPayPal: pay@apexstudio.design',
  notes: 'Thank you for your business! We appreciate the partnership.',
  terms: 'Payment is due within 14 days of invoice date. 1.5% monthly late fee applies to overdue balances.',
  signatureText: 'Apex Studio Authorized Signature',
};
