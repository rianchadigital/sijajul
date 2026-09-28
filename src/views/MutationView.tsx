import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, Plus, Search, 
  Building2, Package, CheckCircle2, History 
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Warehouse, Item, User, StockTransaction } from '../types';

interface MutationViewProps {
  currentUser: User | null;
  onRefreshStats: () => void;
}

export const MutationView: React.FC<MutationViewProps> = ({ currentUser, onRefreshStats }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [mutationHistory, setMutationHistory] = useState<StockTransaction[]>([]);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [sourceWhId, setSourceWhId] = useState('');
  const [targetWhId, setTargetWhId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('');

  const loadData = () => {
    const whs = storageService.getWarehouses();
    const itms = storageService.getItems();
    setWarehouses(whs);
    setItems(itms);
    if (whs.length > 1) {
      setSourceWhId(whs[0].id);
      setTargetWhId(whs[1].id);
    }
    if (itms.length > 0) setSelectedItemId(itms[0].id);

    // Get mutation transactions
    const trxs = storageService.getTransactions().filter(t => t.jenisTransaksi === 'MUTASI_MASUK' || t.jenisTransaksi === 'MUTASI_KELUAR');
    setMutationHistory(trxs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const sourceStock = sourceWhId && selectedItemId 
    ? storageService.getStockByWarehouseAndItem(sourceWhId, selectedItemId).saldo 
    : 0;

  const currentItem = items.find(i => i.id === selectedItemId);

  const handleProcessMutation = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceWhId === targetWhId) {
      alert('Gudang asal dan gudang tujuan mutasi tidak boleh sama!');
      return;
    }
    if (qty > sourceStock) {
      alert(`Stok di gudang asal tidak mencukupi (${sourceStock} ${currentItem?.satuan})!`);
      return;
    }

    try {
      const sourceWh = warehouses.find(w => w.id === sourceWhId);
      const targetWh = warehouses.find(w => w.id === targetWhId);
      const docRef = `MUTASI/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;

      // 1. Record Out from source
      storageService.recordTransaction(
        sourceWhId,
        selectedItemId,
        'MUTASI_KELUAR',
        0,
        qty,
        `Mutasi transfer keluar ke ${targetWh?.namaGudang}. Alasan: ${reason}`,
        docRef
      );

      // 2. Record In to target
      storageService.recordTransaction(
        targetWhId,
        selectedItemId,
        'MUTASI_MASUK',
        qty,
        0,
        `Mutasi transfer masuk dari ${sourceWh?.namaGudang}. Alasan: ${reason}`,
        docRef
      );

      setShowModal(false);
      setReason('');
      setQty(1);
      loadData();
      onRefreshStats();
      alert('Mutasi persediaan antar gudang berhasil dibukukan!');
    } catch (err: any) {
      alert(err.message || 'Gagal memproses mutasi barang');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Mutasi Barang Antar Gudang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pemindahan stok persediaan antar Sub Gudang Pulau atau antara Gudang Besar dan Sub Gudang.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" /> Proses Mutasi Barang
        </button>
      </div>

      {/* Mutation History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wide flex items-center gap-2">
            <History className="w-4 h-4 text-teal-800" /> Riwayat Mutasi Persediaan
          </h3>
          <span className="text-xs text-slate-400">{mutationHistory.length} transaksi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">No. Transaksi</th>
                <th className="px-4 py-3">Gudang</th>
                <th className="px-4 py-3">Nama Barang</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3 text-center">Jumlah</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mutationHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Belum ada riwayat mutasi antar gudang.
                  </td>
                </tr>
              ) : (
                mutationHistory.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-slate-600">{trx.tanggal}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{trx.nomorTransaksi}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{trx.gudangNama}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{trx.barangNama}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        trx.jenisTransaksi === 'MUTASI_MASUK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {trx.jenisTransaksi}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-black">
                      {trx.masuk > 0 ? `+${trx.masuk}` : `-${trx.keluar}`} {trx.satuan}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{trx.keterangan}</td>
                    <td className="px-4 py-3 text-slate-500">{trx.userNama}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MUTATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-800">
                Formulir Mutasi Persediaan Antar Gudang
              </h3>
              <p className="text-xs text-slate-500">
                Pemindahan stok fisik barang secara langsung antar lokasi logistik.
              </p>
            </div>

            <form onSubmit={handleProcessMutation} className="space-y-4">
              {/* Gudang Asal & Tujuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gudang Asal (Sumber)</label>
                  <select
                    required
                    value={sourceWhId}
                    onChange={(e) => setSourceWhId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 font-semibold"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.namaGudang}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gudang Tujuan (Penerima)</label>
                  <select
                    required
                    value={targetWhId}
                    onChange={(e) => setTargetWhId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 font-semibold"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.namaGudang}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Barang Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Barang</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 font-semibold"
                >
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      [{i.kodeBarang}] {i.namaBarang} ({i.satuan})
                    </option>
                  ))}
                </select>
                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                  <span>Stok di Gudang Asal:</span>
                  <strong className="text-teal-800">{sourceStock} {currentItem?.satuan}</strong>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Mutasi ({currentItem?.satuan})
                </label>
                <input
                  type="number"
                  min="1"
                  max={sourceStock}
                  required
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 font-bold"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan / Keterangan Pemindahan Mutasi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Darurat kekurangan obat di Pustu Lancang"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sourceStock <= 0}
                  className="px-5 py-2 text-xs font-bold bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 text-white rounded-xl shadow"
                >
                  Proses & Bukukan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
