export interface ProductCatalogItem {
  id: string;
  name: string;
  price: number;
  costPrice?: number; // Cost for profit calculation
  unit?: string; // pcs, kg, box, hrs
  barcode?: string;
  stock?: number;
  minStockAlert?: number; // Alert threshold (e.g. 5)
}

export interface ClientContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
}

export interface BusinessExpense {
  id: string;
  date: string; // YYYY-MM-DD
  category: 'Rent' | 'Electricity' | 'Transport' | 'Salary' | 'Food' | 'Stock Purchase' | 'Other';
  description: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank' | 'Online';
}

export interface CreditPaymentRecord {
  id: string;
  date: string;
  clientName: string;
  amount: number;
  note?: string;
}

const PRODUCTS_KEY = 'quickinvoice_products_catalog_v1';
const CLIENTS_KEY = 'quickinvoice_clients_directory_v1';
const EXPENSES_KEY = 'quickinvoice_expenses_v1';
const CREDIT_PAYMENTS_KEY = 'quickinvoice_credit_payments_v1';

// Initial default items for easy start
const DEFAULT_PRODUCTS: ProductCatalogItem[] = [
  { id: 'p1', name: 'සබන් (Soap)', price: 150, costPrice: 110, unit: 'pcs', stock: 45, minStockAlert: 10 },
  { id: 'p2', name: 'බිස්කට් (Biscuits)', price: 200, costPrice: 150, unit: 'pkt', stock: 38, minStockAlert: 8 },
  { id: 'p3', name: 'තේ කොළ (Tea Leaves)', price: 450, costPrice: 360, unit: 'pkt', stock: 18, minStockAlert: 5 },
  { id: 'p4', name: 'සීනි (Sugar 1kg)', price: 280, costPrice: 240, unit: 'kg', stock: 24, minStockAlert: 10 },
  { id: 'p5', name: 'කිරිපිටි (Milk Powder 400g)', price: 1100, costPrice: 950, unit: 'pkt', stock: 12, minStockAlert: 5 },
];

export function getProductCatalog(): ProductCatalogItem[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to get product catalog:', e);
  }
  return DEFAULT_PRODUCTS;
}

export function saveProductCatalog(items: ProductCatalogItem[]): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save product catalog:', e);
  }
}

export function addProductItem(item: Omit<ProductCatalogItem, 'id'>): ProductCatalogItem[] {
  const current = getProductCatalog();
  const newItem: ProductCatalogItem = {
    ...item,
    id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  const updated = [newItem, ...current];
  saveProductCatalog(updated);
  return updated;
}

export function updateProductStock(name: string, deductedQty: number): void {
  const current = getProductCatalog();
  const updated = current.map((p) => {
    if (p.name.trim().toLowerCase() === name.trim().toLowerCase()) {
      const currentStock = p.stock !== undefined ? p.stock : 50;
      return {
        ...p,
        stock: Math.max(0, currentStock - deductedQty),
      };
    }
    return p;
  });
  saveProductCatalog(updated);
}

export function deleteProductItem(id: string): ProductCatalogItem[] {
  const current = getProductCatalog();
  const updated = current.filter((p) => p.id !== id);
  saveProductCatalog(updated);
  return updated;
}

// Client Directory
export function getClientDirectory(): ClientContact[] {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to get client directory:', e);
  }
  return [
    {
      id: 'c1',
      name: 'Sunil Perera (Customer)',
      phone: '0771234567',
      email: 'sunil@example.com',
      address: 'Main Street, Colombo 03',
    },
  ];
}

export function saveClientDirectory(clients: ClientContact[]): void {
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  } catch (e) {
    console.error('Failed to save client directory:', e);
  }
}

export function addClientContact(client: Omit<ClientContact, 'id'>): ClientContact[] {
  const current = getClientDirectory();
  const newClient: ClientContact = {
    ...client,
    id: `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  const updated = [newClient, ...current.filter((c) => c.name.toLowerCase() !== client.name.toLowerCase())];
  saveClientDirectory(updated);
  return updated;
}

// Business Expenses (Daily Expense Tracker)
export function getExpenses(): BusinessExpense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to get expenses:', e);
  }
  return [
    {
      id: 'exp-1',
      date: new Date().toISOString().split('T')[0],
      category: 'Transport',
      description: 'Stock delivery three-wheeler fare',
      amount: 450,
      paymentMethod: 'Cash',
    },
  ];
}

export function saveExpenses(expenses: BusinessExpense[]): void {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('Failed to save expenses:', e);
  }
}

export function addExpense(expense: Omit<BusinessExpense, 'id'>): BusinessExpense[] {
  const current = getExpenses();
  const newExp: BusinessExpense = {
    ...expense,
    id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  const updated = [newExp, ...current];
  saveExpenses(updated);
  return updated;
}

export function deleteExpense(id: string): BusinessExpense[] {
  const current = getExpenses();
  const updated = current.filter((e) => e.id !== id);
  saveExpenses(updated);
  return updated;
}

// Credit Repayments (ණය ගෙවීම් වාර්තා)
export function getCreditPayments(): CreditPaymentRecord[] {
  try {
    const raw = localStorage.getItem(CREDIT_PAYMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to get credit payments:', e);
  }
  return [];
}

export function addCreditPayment(rec: Omit<CreditPaymentRecord, 'id'>): CreditPaymentRecord[] {
  const current = getCreditPayments();
  const newRec: CreditPaymentRecord = {
    ...rec,
    id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  const updated = [newRec, ...current];
  try {
    localStorage.setItem(CREDIT_PAYMENTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save credit payments:', e);
  }
  return updated;
}

// Complete Backup & Restore Data
export function exportFullBusinessBackup(): string {
  const backup = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    products: getProductCatalog(),
    clients: getClientDirectory(),
    expenses: getExpenses(),
    creditPayments: getCreditPayments(),
    invoices: (() => {
      try {
        const item1 = localStorage.getItem('quickinvoice_recent_invoices_v1');
        const item2 = localStorage.getItem('quickinvoice_recent_history_v1');
        return JSON.parse(item1 || item2 || '[]');
      } catch {
        return [];
      }
    })(),
  };
  return JSON.stringify(backup, null, 2);
}

export function importFullBusinessBackup(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.products && Array.isArray(data.products)) {
      saveProductCatalog(data.products);
    }
    if (data.clients && Array.isArray(data.clients)) {
      saveClientDirectory(data.clients);
    }
    if (data.expenses && Array.isArray(data.expenses)) {
      saveExpenses(data.expenses);
    }
    if (data.creditPayments && Array.isArray(data.creditPayments)) {
      localStorage.setItem(CREDIT_PAYMENTS_KEY, JSON.stringify(data.creditPayments));
    }
    if (data.invoices && Array.isArray(data.invoices)) {
      localStorage.setItem('quickinvoice_recent_invoices_v1', JSON.stringify(data.invoices));
    }
    return true;
  } catch (e) {
    console.error('Backup restore failed:', e);
    return false;
  }
}
