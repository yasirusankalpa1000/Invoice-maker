import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Check,
  Search,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import {
  ClientContact,
  getClientDirectory,
  addClientContact,
  saveClientDirectory,
} from '../utils/commerceStorage';
import { Language } from '../utils/i18n';

interface ClientDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (client: { name: string; phone?: string; email?: string; address?: string }) => void;
  lang: Language;
}

export const ClientDirectoryModal: React.FC<ClientDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectClient,
  lang,
}) => {
  const [clients, setClients] = useState<ClientContact[]>(() => getClientDirectory());
  const [search, setSearch] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated = addClientContact({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
    });
    setClients(updated);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setIsAdding(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(lang === 'si' ? 'මෙම පාරිභෝගිකයා ඉවත් කරන්නද?' : 'Delete this customer?')) {
      const updated = clients.filter((c) => c.id !== id);
      saveClientDirectory(updated);
      setClients(updated);
    }
  };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                {lang === 'si' ? 'පාරිභෝගික නාමාවලිය (Customers / Clients)' : 'Saved Customer Directory'}
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                  {clients.length} Clients
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'si'
                  ? 'ක්ලික් කර ක්ෂණිකව Invoice එකට Client විස්තර ඇතුළත් කරන්න'
                  : 'Click customer to auto-fill Bill-To fields'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-blue-400 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{isAdding ? 'Cancel' : (lang === 'si' ? '+ අලුත් Client' : '+ New Client')}</span>
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
          
          {/* Add Client Panel */}
          {isAdding && (
            <form onSubmit={handleAddNew} className="p-4 rounded-2xl bg-slate-950 border border-blue-500/30 space-y-3">
              <div className="text-xs font-bold text-blue-400">
                {lang === 'si' ? 'අලුත් පාරිභෝගිකයෙකු ඇතුළත් කරන්න:' : 'Add New Client:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder={lang === 'si' ? 'පාරිභෝගික නම (Full Name / Company)' : 'Client / Company Name'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder={lang === 'si' ? 'දුරකථන අංකය (WhatsApp / Phone)' : 'Phone / WhatsApp'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder={lang === 'si' ? 'ලිපිනය (Address)' : 'Billing Address'}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-blue-400 cursor-pointer"
                >
                  {lang === 'si' ? 'සුරකින්න (Save Client)' : 'Save Client'}
                </button>
              </div>
            </form>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder={lang === 'si' ? 'නමින් හෝ දුරකථන අංකයෙන් සොයන්න...' : 'Search clients by name or phone...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Client List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((client) => (
              <div
                key={client.id}
                onClick={() => {
                  onSelectClient({
                    name: client.name,
                    phone: client.phone,
                    email: client.email,
                    address: client.address,
                  });
                  onClose();
                }}
                className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-blue-500/50 hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                    {client.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                    {client.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-500" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-500" />
                        <span className="truncate max-w-[170px]">{client.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex h-7 items-center gap-1 rounded-lg bg-blue-500/10 px-2 text-[11px] font-bold text-blue-400 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-slate-950 transition-all">
                    Select <ArrowRight className="h-3 w-3" />
                  </span>
                  <button
                    onClick={(e) => handleDelete(client.id, e)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                    title="Delete client"
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
