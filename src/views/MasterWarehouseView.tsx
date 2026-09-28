import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Search, MapPin, User as UserIcon } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Warehouse, User } from '../types';

interface MasterWarehouseViewProps {
  currentUser: User | null;
}

export const MasterWarehouseView: React.FC<MasterWarehouseViewProps> = ({ currentUser }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const [kodeGudang, setKodeGudang] = useState('');
  const [namaGudang, setNamaGudang] = useState('');
  const [tipeGudang, setTipeGudang] = useState<'GUDANG_BESAR' | 'SUB_GUDANG'>('SUB_GUDANG');
  const [lokasiPulau, setLokasiPulau] = useState('');
  const [picNama, setPicNama] = useState('');
  const [picNip, setPicNip] = useState('');
  const [picKontak, setPicKontak] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const loadData = () => {
    setWarehouses(storageService.getWarehouses());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingWarehouse(null);
    setKodeGudang(`GDG-${Date.now().toString().slice(-3)}`);
    setNamaGudang('');
    setTipeGudang('SUB_GUDANG');
    setLokasiPulau('');
    setPicNama('');
    setPicNip('');
    setPicKontak('');
    setKeterangan('');
    setShowModal(true);
  };

  const handleOpenEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setKodeGudang(w.kodeGudang);
    setNamaGudang(w.namaGudang);
    setTipeGudang(w.tipeGudang);
    setLokasiPulau(w.lokasiPulau);
    setPicNama(w.picNama);
    setPicNip(w.picNip || '');
    setPicKontak(w.picKontak || '');
    setKeterangan(w.keterangan || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const whData: Warehouse = {
      id: editingWarehouse ? editingWarehouse.id : `WH-${Date.now()}`,
      kodeGudang,
      namaGudang,
      tipeGudang,
      lokasiPulau,
      picNama,
      picNip,
      picKontak,
      keterangan
    };
    storageService.saveWarehouse(whData);
    setShowModal(false);
    loadData();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus gudang "${name}"?`)) {
      storageService.deleteWarehouse(id);
      loadData();
    }
  };

  const filtered = warehouses.filter(w => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return w.namaGudang.toLowerCase().includes(q) || w.lokasiPulau.toLowerCase().includes(q) || w.picNama.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Master Data Lokasi Gudang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Struktur hierarki Gudang Besar Puskesmas Kecamatan dan Sub Gudang Satelit Pulau.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" /> Tambah Sub Gudang
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama gudang, pulau, atau nama PIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((w) => (
          <div key={w.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-teal-400 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  w.tipeGudang === 'GUDANG_BESAR' ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {w.tipeGudang === 'GUDANG_BESAR' ? 'GUDANG BESAR PUSAT' : 'SUB GUDANG SATELIT'}
                </span>
                <span className="font-mono text-xs text-slate-400 font-bold">{w.kodeGudang}</span>
              </div>

              <h3 className="font-bold text-sm text-slate-800">{w.namaGudang}</h3>
              
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-700" />
                  <span>Pulau: <strong>{w.lokasiPulau}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>PIC: <strong>{w.picNama}</strong></span>
                </div>
                {w.picKontak && (
                  <div className="text-[11px] text-slate-500 pl-5">
                    WhatsApp: {w.picKontak}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 truncate max-w-[150px]">{w.keterangan || 'Siap operasional'}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(w)}
                  className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-lg"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {w.tipeGudang !== 'GUDANG_BESAR' && (
                  <button
                    onClick={() => handleDelete(w.id, w.namaGudang)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">
                {editingWarehouse ? 'Edit Data Gudang' : 'Tambah Sub Gudang Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Gudang</label>
                  <input
                    type="text"
                    required
                    value={kodeGudang}
                    onChange={(e) => setKodeGudang(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Gudang</label>
                  <select
                    value={tipeGudang}
                    onChange={(e) => setTipeGudang(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="SUB_GUDANG">Sub Gudang Satelit</option>
                    <option value="GUDANG_BESAR">Gudang Besar Pusat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Gudang Unit</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gudang Pusling Payung"
                  value={namaGudang}
                  onChange={(e) => setNamaGudang(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi Pulau</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pulau Payung / Pulau Pari / Pulau Tidung"
                  value={lokasiPulau}
                  onChange={(e) => setLokasiPulau(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Penanggung Jawab (PIC)</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama PIC Unit..."
                    value={picNama}
                    onChange={(e) => setPicNama(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP PIC</label>
                  <input
                    type="text"
                    placeholder="NIP jika PNS/PPPK..."
                    value={picNip}
                    onChange={(e) => setPicNip(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp PIC</label>
                <input
                  type="text"
                  placeholder="628123456789"
                  value={picKontak}
                  onChange={(e) => setPicKontak(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-teal-800 hover:bg-teal-900 text-white rounded-xl shadow"
                >
                  Simpan Gudang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
