import { SavedInvoiceRecord } from '../types/invoice';

/**
 * Converts saved invoices into a standard CSV spreadsheet (Excel compatible).
 */
export function exportInvoicesToCsv(invoices: SavedInvoiceRecord[]): void {
  if (!invoices || invoices.length === 0) {
    alert('No saved invoices available to export yet!');
    return;
  }

  const headers = [
    'Invoice Number',
    'Document Type',
    'Date Issued',
    'Due Date',
    'Client Name',
    'Client Email',
    'Currency',
    'Subtotal',
    'Discount (%)',
    'Tax (%)',
    'Shipping',
    'Grand Total',
    'Amount Paid',
    'Balance Due',
    'Item Name',
    'Item Quantity',
  ];

  const escapeCsv = (str: string | number | undefined | null): string => {
    if (str === undefined || str === null) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = invoices.map((rec) => {
    const d = rec.data;
    const items = d.items || [];
    const subtotal = items.reduce(
      (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
      0
    );
    const discountVal = (subtotal * (Number(d.discountRate) || 0)) / 100;
    const taxable = subtotal - discountVal;
    const taxVal = (taxable * (Number(d.taxRate) || 0)) / 100;
    const grandTotal = rec.total || (subtotal - discountVal + taxVal + (Number(d.shippingFee) || 0));
    const balance = Math.max(0, grandTotal - (Number(d.amountPaid) || 0));

    // Items multiline inside single cell (Excel / CSV line breaks)
    const itemNames = items
      .map((it) => (it.description || '').trim())
      .filter((name) => name.length > 0)
      .join('\n');

    const itemQuantities = items
      .map((it) => (it.quantity !== undefined && it.quantity !== null ? String(it.quantity) : '0'))
      .join('\n');

    return [
      escapeCsv(d.invoiceNumber || 'INV'),
      escapeCsv((d.documentType || 'invoice').toUpperCase()),
      escapeCsv(d.issueDate),
      escapeCsv(d.dueDate),
      escapeCsv(d.clientName),
      escapeCsv(d.clientEmail),
      escapeCsv(d.currency || 'USD'),
      escapeCsv(subtotal.toFixed(2)),
      escapeCsv(d.discountRate || 0),
      escapeCsv(d.taxRate || 0),
      escapeCsv(d.shippingFee || 0),
      escapeCsv(grandTotal.toFixed(2)),
      escapeCsv((d.amountPaid || 0).toFixed(2)),
      escapeCsv(balance.toFixed(2)),
      escapeCsv(itemNames),
      escapeCsv(itemQuantities),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const now = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `QuickInvoice-Report-${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
