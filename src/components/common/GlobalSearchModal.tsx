import React, { useState, useEffect } from 'react';
import { Search, X, Package, FileText, Truck, ShieldCheck, User as UserIcon, ArrowRight } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Item, ItemRequest, Dropping, BastDocument, SbbkDocument, User } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [droppings, setDroppings] = useState<Dropping[]>([]);
  const [basts, setBasts] = useState<BastDocument[]>([]);
  const [sbbks, setSbbks] = useState<SbbkDocument[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      setItems(storageService.getItems());
      setRequests(storageService.getRequests());
      setDroppings(storageService.getDroppings());
      setBasts(storageService.getBastDocs());
      setSbbks(storageService.getSbbkDocs());
      setUsers(storageService.getUsers());
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredItems = q ? items.filter(i => i.namaBarang.toLowerCase().includes(q) || i.kodeBarang.toLowerCase().includes(q) || i.kategoriNama.toLowerCase().includes(q)).slice(0, 4) : [];
  const filteredRequests = q ? requests.filter(r => r.nomorPermintaan.toLowerCase().includes(q) || r.pemohonNama.toLowerCase().includes(q) || r.gudangTujuanNama.toLowerCase().includes(q)).slice(0, 3) : [];
  const filteredDroppings = q ? droppings.filter(d => d.nomorDropping.toLowerCase().includes(q) || d.gudangTujuanNama.toLowerCase().includes(q)).slice(0, 3) : [];
  const filteredBasts = q ? basts.filter(b => b.nomorBast.toLowerCase().includes(q) || b.pihakKeduaNama.toLowerCase().includes(q)).slice(0, 2) : [];
  const filteredSbbks = q ? sbbks.filter(s => s.nomorSbbk.toLowerCase().includes(q) || s.penerimaNama.toLowerCase().includes(q)).slice(0, 2) : [];
  const filteredUsers = q ? users.filter(u => u.nama.toLowerCase().includes(q) || u.nip.includes(q) || u.unitKerja.toLowerCase().includes(q)).slice(0, 3) : [];

  const hasResults = filteredItems.length > 0 || filteredRequests.length > 0 || filteredDroppings.length > 0 || filteredBasts.length > 0 || filteredSbbks.length > 0 || filteredUsers.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            id="global-search-input"
            type="text"
            className="w-full bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-sm sm:text-base font-medium"
            placeholder="Cari barang, kode, nomor permintaan, dropping, BAST, SBBK, pegawai..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="text-center py-8 text-slate-400 text-sm">
              <p>Ketik kata kunci untuk mencari di seluruh database SI-GUDANG</p>
              <div className="flex justify-center gap-2 mt-3 text-xs text-slate-500">
                <span className="px-2 py-1 bg-slate-100 rounded">Kertas A4</span>
                <span className="px-2 py-1 bg-slate-100 rounded">REQ/2026/08</span>
                <span className="px-2 py-1 bg-slate-100 rounded">Pari</span>
                <span className="px-2 py-1 bg-slate-100 rounded">Masker</span>
              </div>
            </div>
          )}

          {query && !hasResults && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Tidak ditemukan data yang sesuai dengan "<span className="font-semibold text-slate-600">{query}</span>"
            </div>
          )}

          {/* Items */}
          {filteredItems.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-teal-600" /> Barang Persediaan ({filteredItems.length})
              </div>
              <div className="space-y-1">
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate('stok'); onClose(); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-teal-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-teal-900">{item.namaBarang}</div>
                      <div className="text-xs text-slate-500">Kode: <span className="font-mono text-teal-700">{item.kodeBarang}</span> | Kategori: {item.kategoriNama} | Satuan: {item.satuan}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Requests */}
          {filteredRequests.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Permintaan Barang ({filteredRequests.length})
              </div>
              <div className="space-y-1">
                {filteredRequests.map(req => (
                  <button
                    key={req.id}
                    onClick={() => { onNavigate('permintaan'); onClose(); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-900">{req.nomorPermintaan}</div>
                      <div className="text-xs text-slate-500">Pemohon: {req.pemohonNama} ({req.gudangTujuanNama}) | Status: {req.status}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Droppings */}
          {filteredDroppings.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600" /> Dropping & Distribusi ({filteredDroppings.length})
              </div>
              <div className="space-y-1">
                {filteredDroppings.map(drp => (
                  <button
                    key={drp.id}
                    onClick={() => { onNavigate('dropping'); onClose(); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-amber-900">{drp.nomorDropping}</div>
                      <div className="text-xs text-slate-500">Tujuan: {drp.gudangTujuanNama} | Status: {drp.status}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BAST & SBBK */}
          {(filteredBasts.length > 0 || filteredSbbks.length > 0) && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Dokumen Resmi (BAST & SBBK)
              </div>
              <div className="space-y-1">
                {filteredBasts.map(b => (
                  <button
                    key={b.id}
                    onClick={() => { onNavigate('bast'); onClose(); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-purple-900">BAST: {b.nomorBast}</div>
                      <div className="text-xs text-slate-500">Tujuan: {b.gudangTujuanNama} | Penerima: {b.pihakKeduaNama}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
                {filteredSbbks.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { onNavigate('sbbk'); onClose(); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-purple-900">SBBK: {s.nomorSbbk}</div>
                      <div className="text-xs text-slate-500">Pengeluaran: {s.gudangAsalNama} &rarr; {s.gudangTujuanNama}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pegawai */}
          {filteredUsers.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-emerald-600" /> Data Pegawai ({filteredUsers.length})
              </div>
              <div className="space-y-1">
                {filteredUsers.map((u, idx) => (
                  <button
                    key={`${u.id}-${u.username || ''}-${idx}`}
                    onClick={() => { onNavigate('pegawai'); onClose(); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-emerald-900">{u.nama}</div>
                      <div className="text-xs text-slate-500">NIP: {u.nip} | {u.jabatan} ({u.tempatTugas})</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Gunakan <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Ctrl+K</kbd> untuk pencarian cepat</span>
          <span>SI-GUDANG Puskesmas Kepulauan Seribu Selatan</span>
        </div>
      </div>
    </div>
  );
};
