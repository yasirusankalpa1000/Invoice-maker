import { InvoiceData, SavedInvoiceRecord } from '../types/invoice';

const RECENT_INVOICES_KEY = 'quickinvoice_recent_invoices_v1';
export const MAX_RECENT_INVOICES = 200;

/**
 * Calculates the grand total for a given invoice data snapshot.
 */
export function calculateInvoiceTotal(data: InvoiceData): number {
  const subtotal = (data.items || []).reduce(
    (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0
  );
  const discount = (subtotal * (Number(data.discountRate) || 0)) / 100;
  const taxable = subtotal - discount;
  const tax = (taxable * (Number(data.taxRate) || 0)) / 100;
  const shipping = Number(data.shippingFee) || 0;
  return Math.max(0, subtotal - discount + tax + shipping);
}

/**
 * Retrieves the list of recent invoices from localStorage.
 */
export function getRecentInvoices(): SavedInvoiceRecord[] {
  try {
    const raw = localStorage.getItem(RECENT_INVOICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_RECENT_INVOICES);
    }
  } catch (e) {
    console.error('Failed to load recent invoices from localStorage:', e);
  }
  return [];
}

/**
 * Saves or updates an invoice into the recent list (stores up to 50 invoices).
 * If forceNew is false and the invoiceNumber already exists, it updates that invoice record.
 * If forceNew is true or invoiceNumber does not exist, it adds a new record to the top.
 */
export function saveRecentInvoice(data: InvoiceData, forceNew = false): SavedInvoiceRecord[] {
  try {
    if (!data) return getRecentInvoices();
    const current = getRecentInvoices();
    const total = calculateInvoiceTotal(data);
    const invoiceNum = String(data.invoiceNumber || 'INV').trim();

    // Check if an entry with the exact same invoice number already exists
    const existingIndex = current.findIndex(
      (item) => String(item?.data?.invoiceNumber || '').trim().toLowerCase() === invoiceNum.toLowerCase()
    );

    let updated: SavedInvoiceRecord[];

    if (!forceNew && existingIndex !== -1) {
      // Update existing invoice snapshot and move to top
      const updatedRecord: SavedInvoiceRecord = {
        ...current[existingIndex],
        savedAt: new Date().toISOString(),
        data: JSON.parse(JSON.stringify(data)),
        total,
      };
      const filtered = current.filter((_, idx) => idx !== existingIndex);
      updated = [updatedRecord, ...filtered].slice(0, MAX_RECENT_INVOICES);
    } else {
      // Add new record
      const newRecord: SavedInvoiceRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        savedAt: new Date().toISOString(),
        data: JSON.parse(JSON.stringify(data)),
        total,
      };
      // If forceNew, remove any entry that had identical number or keep both
      const filtered = current.filter(
        (item) => String(item?.data?.invoiceNumber || '').trim().toLowerCase() !== invoiceNum.toLowerCase()
      );
      updated = [newRecord, ...filtered].slice(0, MAX_RECENT_INVOICES);
    }

    localStorage.setItem(RECENT_INVOICES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save recent invoice:', e);
    return getRecentInvoices();
  }
}

/**
 * Deletes a specific invoice record from the recent list.
 */
export function deleteRecentInvoice(id: string): SavedInvoiceRecord[] {
  try {
    const current = getRecentInvoices();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(RECENT_INVOICES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete recent invoice:', e);
    return getRecentInvoices();
  }
}

/**
 * Clears all recent invoices from localStorage.
 */
export function clearAllRecentInvoices(): void {
  try {
    localStorage.removeItem(RECENT_INVOICES_KEY);
  } catch (e) {
    console.error('Failed to clear recent invoices:', e);
  }
}
