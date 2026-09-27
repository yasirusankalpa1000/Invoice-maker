import React, { useState } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Check,
  Search,
  Tag,
  Boxes,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import {
  ProductCatalogItem,
  getProductCatalog,
  addProductItem,
  deleteProductItem,
} from '../utils/commerceStorage';
import { InvoiceItem } from '../types/invoice';
import { Language } from '../utils/i18n';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: { description: string; rate: number; quantity: number }) => void;
  lang: Language;
  currencySymbol: string;
}

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  lang,
  currencySymbol,
}) => {
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => getProductCatalog());
  const [search, setSearch] = useState('');

  // New item form
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('pcs');
  const [newStock, setNewStock] = useState('50');

  if (!isOpen) return null;

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;

    const updated = addProductItem({
      name: newName.trim(),
      price: parseFloat(newPrice) || 0,
      unit: newUnit.trim() || 'pcs',
      stock: parseInt(newStock, 10) || 0,
    });
    setProducts(updated);
    setNewName('');
    setNewPrice('');
    setIsAdding(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(lang === 'si' ? 'මෙම භාණ්ඩය ඉවත් කරන්නද?' : 'Delete this catalog item?')) {
      const updated = deleteProductItem(id);
      setProducts(updated);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                {lang === 'si' ? 'භාණ්ඩ නාමාවලිය (Product Inventory)' : 'Saved Product Inventory'}
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                  {products.length} Items
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'si'
                  ? 'ක්ලික් කර කෙළින්ම Invoice එකට එකතු කරන්න'
                  : 'Click any item to instantly insert into current invoice'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{isAdding ? 'Cancel' : (lang === 'si' ? '+ අලුත් භාණ්ඩයක්' : '+ New Item')}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Add Item Panel */}
          {isAdding && (
            <form onSubmit={handleAddNew} className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
              <div className="text-xs font-bold text-emerald-400">
                {lang === 'si' ? 'අලුත් භාණ්ඩයක් ඇතුළත් කරන්න:' : 'Add New Catalog Item:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder={lang === 'si' ? 'භාණ්ඩයේ නම (උදා: සබන් / Soap)' : 'Item name (e.g. Soap 100g)'}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder={lang === 'si' ? 'මිල (Price)' : 'Unit Price'}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Unit (pcs/kg)"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                >
                  {lang === 'si' ? 'සුරකින්න (Save)' : 'Save Item'}
                </button>
              </div>
            </form>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder={lang === 'si' ? 'භාණ්ඩ සොයන්න (Search by name)...' : 'Search catalog products...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Product List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectProduct({
                    description: item.name,
                    rate: item.price,
                    quantity: 1,
                  });
                  onClose();
                }}
                className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-emerald-500/50 hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-emerald-400 font-semibold">
                      {currencySymbol} {item.price.toFixed(2)}
                    </span>
                    <span>• {item.unit || 'pcs'}</span>
                    {item.stock !== undefined && (
                      <span className="text-[10px] text-slate-500">
                        ({item.stock} in stock)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex h-7 items-center gap-1 rounded-lg bg-emerald-500/10 px-2 text-[11px] font-bold text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                    + Add <ArrowRight className="h-3 w-3" />
                  </span>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                    title="Delete product"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
