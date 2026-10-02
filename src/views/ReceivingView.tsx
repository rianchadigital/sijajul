import React, { useState, useEffect } from 'react';
import { 
  Inbox, CheckCircle2, Search, Eye, 
  Download, FileCheck2, AlertCircle, MapPin 
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Dropping, User, Warehouse } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { PdfService } from '../services/pdfService';

interface ReceivingViewProps {
  onNavigate: (viewId: string) => void;
  currentUser: User | null;
  onRefreshStats: () => void;
}

export const ReceivingView: React.FC<ReceivingViewProps> = ({ onNavigate, currentUser, onRefreshStats }) => {
  const [droppings, setDroppings] = useState<Dropping[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'INCOMING' | 'HISTORY'>('INCOMING');

  // Modal Confirm Receiving
  const [confirmingDropping, setConfirmingDropping] = useState<Dropping | null>(null);
  const [itemConditions, setItemConditions] = useState<{ [barangId: string]: { condition: string; notes: string } }>({});
  const [receiverNotes, setReceiverNotes] = useState('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = () => {
    setDroppings(storageService.getDroppings());
    setWarehouses(storageService.getWarehouses());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenConfirm = (drp: Dropping) => {
    setConfirmingDropping(drp);
    const initialCond: { [barangId: string]: { condition: string; notes: string } } = {};
    (drp.items || []).forEach(itm => {
      initialCond[itm.barangId] = { condition: 'Baik & Utuh', notes: '' };
    });
    setItemConditions(initialCond);
    setReceiverNotes('Barang telah diterima dalam kondisi baik dan lengkap sesuai dokumen BAST.');
  };

  const handleSubmitReceiving = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingDropping) return;

    try {
      const itemsPayload = (confirmingDropping.items || []).map(itm => ({
        barangId: itm.barangId,
        kondisiBarang: itemConditions[itm.barangId]?.condition || 'Baik & Utuh',
        keterangan: itemConditions[itm.barangId]?.notes || ''
      }));

      storageService.confirmReceiving(confirmingDropping.id, receiverNotes, itemsPayload);
      setConfirmingDropping(null);
      loadData();
      onRefreshStats();
      showToast('Penerimaan barang berhasil dikonfirmasi! Stok Sub Gudang telah bertambah secara otomatis.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengonfirmasi penerimaan barang', 'error');
    }
  };

  const handlePrintBast = (bastId?: string) => {
    if (!bastId) return;
    const bast = storageService.getBastDocs().find(b => b.id === bastId || b.nomorBast === bastId);
    if (!bast) {
      showToast('Dokumen BAST tidak ditemukan', 'error');
      return;
    }
    const doc = PdfService.generateBastPdf(bast);
    doc.save(`BAST_${bast.nomorBast.replace(/\//g, '_')}.pdf`);
  };

  // Filter based on user's warehouse if PIC Sub Gudang
  const userWh = currentUser ? storageService.resolveWarehouseForUser(currentUser) : null;
  const userWhId = userWh?.id || currentUser?.gudangId;

  const incomingList = droppings.filter(d => {
    if (d.status === 'SELESAI' || d.status === 'DITERIMA') return false;
    if (currentUser?.role === 'PIC_SUB_GUDANG' && userWhId && d.gudangTujuanId !== userWhId) return false;
    return true;
  });

  const historyList = droppings.filter(d => {
    if (d.status !== 'SELESAI' && d.status !== 'DITERIMA') return false;
    if (currentUser?.role === 'PIC_SUB_GUDANG' && userWhId && d.gudangTujuanId !== userWhId) return false;
    return true;
  });

  const currentList = activeTab === 'INCOMING' ? incomingList : historyList;

  const filteredList = currentList.filter(drp => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      drp.nomorDropping.toLowerCase().includes(q) ||
      drp.gudangTujuanNama.toLowerCase().includes(q) ||
      (drp.nomorBast && drp.nomorBast.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-md animate-in fade-in-50 duration-200 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Penerimaan Barang Dropping
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verifikasi fisik barang tiba di Sub Gudang Pulau dan penandatanganan Berita Acara Serah Terima (BAST).
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('INCOMING')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'INCOMING'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 text-teal-700" />
            <span>Menunggu Diterima ({incomingList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Riwayat Penerimaan ({historyList.length})</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor dropping, BAST, gudang penerima..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>
      </div>

      {/* List */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
          <Inbox className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-semibold">Tidak ada paket pengiriman dropping pada daftar ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredList.map((drp) => (
            <div
              key={drp.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-teal-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-teal-950 font-mono">
                    {drp.nomorDropping}
                  </span>
                  <StatusBadge status={drp.status} />
                  <span className="text-xs text-slate-400">• Tanggal: {drp.tanggalDropping}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Tujuan Sub Gudang: </span>
                    <strong className="text-slate-800">{drp.gudangTujuanNama}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Pengirim (Gudang Besar): </span>
                    <strong className="text-slate-800">{drp.petugasPengirimNama}</strong>
                  </div>
                </div>

                {/* Items preview pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {drp.items.map((itm, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded font-medium">
                      {itm.namaBarang} (<strong>{itm.jumlahDikirim}</strong> {itm.satuan})
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {activeTab === 'INCOMING' ? (
                  <button
                    onClick={() => handleOpenConfirm(drp)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-teal-200" /> Terima Barang Fisik
                  </button>
                ) : (
                  <button
                    onClick={() => handlePrintBast(drp.nomorBast)}
                    className="w-full sm:w-auto px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" /> Unduh BAST Selesai
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONFIRM RECEIVING MODAL */}
      {confirmingDropping && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Konfirmasi Penerimaan Barang di Sub Gudang
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {confirmingDropping.nomorDropping} &rarr; {confirmingDropping.gudangTujuanNama}
                </p>
              </div>
              <button onClick={() => setConfirmingDropping(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmitReceiving} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-200 text-xs text-teal-900">
                Setelah konfirmasi disimpan, saldo stok di <strong>{confirmingDropping.gudangTujuanNama}</strong> akan otomatis bertambah sesuai jumlah yang diterima.
              </div>

              {/* Items Verification Table */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Cek Fisik & Kondisi Barang
                </label>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-700">
                      <tr>
                        <th className="p-3">Nama Barang</th>
                        <th className="p-3 text-center">Jumlah Dikirim</th>
                        <th className="p-3">Kondisi Barang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {confirmingDropping.items.map((itm) => (
                        <tr key={itm.barangId}>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{itm.namaBarang}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{itm.kodeBarang}</div>
                          </td>
                          <td className="p-3 text-center font-bold text-teal-900">
                            {itm.jumlahDikirim} {itm.satuan}
                          </td>
                          <td className="p-3">
                            <select
                              value={itemConditions[itm.barangId]?.condition || 'Baik & Utuh'}
                              onChange={(e) => setItemConditions({
                                ...itemConditions,
                                [itm.barangId]: {
                                  ...itemConditions[itm.barangId],
                                  condition: e.target.value
                                }
                              })}
                              className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
                            >
                              <option value="Baik & Utuh">Baik & Utuh (Sesuai)</option>
                              <option value="Kemasan Rusak">Kemasan Rusak</option>
                              <option value="Kurang Qty">Kurang Qty</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Receiver General Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Penerima Barang (Masuk ke BAST)
                </label>
                <textarea
                  rows={2}
                  value={receiverNotes}
                  onChange={(e) => setReceiverNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmingDropping(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white rounded-xl shadow"
                >
                  Konfirmasi Selesai & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
