import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Search, AlertTriangle, CheckCircle, ArrowRight, Package } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Category, Item, User } from '../types';

interface MasterCategoryViewProps {
  currentUser: User | null;
}

export const MasterCategoryView: React.FC<MasterCategoryViewProps> = ({ currentUser }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Create / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Delete Modal
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');
  
  // Feedback toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');

  const loadData = () => {
    setCategories(storageService.getCategories());
    setItems(storageService.getItems());
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    const nextNum = (categories.length + 1).toString().padStart(3, '0');
    setKode(`KAT-${nextNum}`);
    setNama('');
    setDeskripsi('');
    setShowModal(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setKode(cat.kode);
    setNama(cat.nama);
    setDeskripsi(cat.deskripsi || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      showToast('Nama kategori wajib diisi.', 'error');
      return;
    }

    const catData: Category = {
      id: editingCategory ? editingCategory.id : `CAT-${Date.now()}`,
      kode: kode.trim(),
      nama: nama.trim(),
      deskripsi: deskripsi.trim()
    };

    storageService.saveCategory(catData);
    setShowModal(false);
    loadData();
    showToast(
      editingCategory 
        ? `Kategori "${catData.nama}" berhasil diperbarui.` 
        : `Kategori baru "${catData.nama}" berhasil ditambahkan.`
    );
  };

  const handleOpenDeleteModal = (cat: Category) => {
    setCategoryToDelete(cat);
    // Find first other available category as default reassign target
    const otherCats = categories.filter(c => c.id !== cat.id);
    setReassignTargetId(otherCats.length > 0 ? otherCats[0].id : '');
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    
    const res = storageService.deleteCategory(categoryToDelete.id, reassignTargetId);
    setCategoryToDelete(null);
    loadData();
    
    if (res.affectedItemsCount > 0) {
      const targetCat = categories.find(c => c.id === reassignTargetId);
      showToast(
        `Kategori "${res.deletedCategoryName}" berhasil dihapus. ${res.affectedItemsCount} barang dialihkan ke "${targetCat?.nama || 'Umum'}".`,
        'success'
      );
    } else {
      showToast(`Kategori "${res.deletedCategoryName}" berhasil dihapus.`, 'success');
    }
  };

  const getItemCountForCategory = (cat: Category) => {
    return items.filter(i => i.kategoriId === cat.id || i.kategoriNama?.toLowerCase() === cat.nama.toLowerCase()).length;
  };

  const filteredCategories = categories.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.nama.toLowerCase().includes(q) || c.kode.toLowerCase().includes(q) || (c.deskripsi && c.deskripsi.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="toast-category-feedback"
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm animate-in fade-in-50 duration-200 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-teal-800" />
            Master Kategori Barang Persediaan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pengelompokan jenis barang medis, obat-obatan, penunjang, ATK, gizi, dan operasional Puskesmas.
          </p>
        </div>

        <button
          id="btn-tambah-kategori"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Kategori Baru
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 font-black">
            {categories.length}
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Kategori</div>
            <div className="text-sm font-bold text-slate-800">{categories.length} Kelompok Logistik</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 font-black">
            {items.length}
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Barang Terdaftar</div>
            <div className="text-sm font-bold text-slate-800">{items.length} Master Barang</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rata-rata per Kategori</div>
            <div className="text-sm font-bold text-slate-800">
              {categories.length > 0 ? Math.round(items.length / categories.length) : 0} Barang / Kategori
            </div>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-kategori"
            type="text"
            placeholder="Cari kode atau nama kategori logistik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3 w-28">Kode</th>
                <th className="px-4 py-3">Nama Kategori</th>
                <th className="px-4 py-3">Deskripsi & Keterangan</th>
                <th className="px-4 py-3 text-center w-28">Jumlah Barang</th>
                <th className="px-4 py-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Tidak ada data kategori yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const itemCount = getItemCountForCategory(cat);
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono font-bold text-teal-900">{cat.kode}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {cat.nama}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{cat.deskripsi || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          itemCount > 0 
                            ? 'bg-teal-50 text-teal-800 border border-teal-200' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {itemCount} Barang
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`btn-edit-kategori-${cat.id}`}
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Kategori"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-delete-kategori-${cat.id}`}
                            onClick={() => handleOpenDeleteModal(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">
                {editingCategory ? 'Edit Data Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Kategori</label>
                <input
                  type="text"
                  required
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Obat-obatan (Farmasi)"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi / Ruang Lingkup</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Sediaan tablet, kapsul, sirup, injeksi, dan salep medis..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-teal-800 hover:bg-teal-900 text-white rounded-xl shadow cursor-pointer"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL (Fixed In-App Modal) */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 border border-slate-200">
            <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-800">
                  Hapus Kategori
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konfirmasi penghapusan kategori logistik
                </p>
              </div>
              <button 
                onClick={() => setCategoryToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 text-sm">{categoryToDelete.nama}</div>
                <div className="font-mono text-teal-800 font-bold text-[11px] mt-0.5">{categoryToDelete.kode}</div>
                {categoryToDelete.deskripsi && (
                  <div className="text-slate-500 text-[11px] mt-1">{categoryToDelete.deskripsi}</div>
                )}
              </div>

              {(() => {
                const affectedCount = getItemCountForCategory(categoryToDelete);
                const otherCategories = categories.filter(c => c.id !== categoryToDelete.id);

                if (affectedCount > 0) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Terdapat {affectedCount} barang persediaan pada kategori ini</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Agar data barang tidak hilang atau terputus, pilih kategori tujuan untuk mengalihkan {affectedCount} barang tersebut:
                      </p>

                      {otherCategories.length > 0 ? (
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Alihkan barang ke kategori:</label>
                          <select
                            id="select-reassign-category"
                            value={reassignTargetId}
                            onChange={(e) => setReassignTargetId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-slate-800"
                          >
                            {otherCategories.map(c => (
                              <option key={c.id} value={c.id}>{c.nama} ({c.kode})</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-700 italic">
                          Barang akan otomatis dialihkan ke kategori default "Umum".
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <p className="text-slate-600 leading-relaxed">
                    Apakah Anda yakin ingin menghapus kategori ini? Kategori yang tidak memiliki barang dapat dihapus secara aman.
                  </p>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-kategori"
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus Kategori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

