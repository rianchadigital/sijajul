import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, XCircle, CheckCircle, Clock, 
  AlertTriangle, Search, Eye, ArrowRight, ShieldCheck, UserCheck,
  Package, Truck, Check, AlertCircle, RefreshCw, Send
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { ItemRequest, Item, Warehouse, User } from '../types';
import { StatusBadge } from '../components/common/Badge';

interface ApprovalViewProps {
  onNavigate: (viewId: string) => void;
  currentUser: User | null;
  onRefreshStats: () => void;
}

export const ApprovalView: React.FC<ApprovalViewProps> = ({ onNavigate, currentUser, onRefreshStats }) => {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Process Approval
  const [selectedReq, setSelectedReq] = useState<ItemRequest | null>(null);
  const [approvedItems, setApprovedItems] = useState<{ [barangId: string]: number }>({});
  const [approvalNotes, setApprovalNotes] = useState('');
  const [actionType, setActionType] = useState<'SETUJU' | 'TOLAK'>('SETUJU');

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string; reqNumber?: string } | null>(null);

  const loadData = () => {
    setRequests(storageService.getRequests());
    setItems(storageService.getItems());
    setWarehouses(storageService.getWarehouses());
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success', reqNumber?: string) => {
    setToastMessage({ text, type, reqNumber });
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const gudangBesar = warehouses.find(w => w.tipeGudang === 'GUDANG_BESAR') || warehouses[0];

  const getGudangBesarStock = (barangId: string, asalGudangId?: string) => {
    const targetGudangId = asalGudangId || gudangBesar?.id;
    if (!targetGudangId || !barangId) return 0;
    return storageService.getStockByWarehouseAndItem(targetGudangId, barangId).saldo;
  };

  const handleOpenProcessModal = (req: ItemRequest) => {
    setSelectedReq(req);
    // Initialize approved quantities with requested quantities (or stock availability)
    const initialApproved: { [barangId: string]: number } = {};
    req.items.forEach(itm => {
      const stock = getGudangBesarStock(itm.barangId, req.gudangAsalId);
      // Auto suggest requested amount, or stock if stock is available
      initialApproved[itm.barangId] = stock >= itm.jumlahDiminta ? itm.jumlahDiminta : (stock > 0 ? stock : itm.jumlahDiminta);
    });
    setApprovedItems(initialApproved);
    setApprovalNotes('');
    setActionType('SETUJU');
  };

  // Helper button to set all approved to requested amounts
  const handleSetAllToRequested = () => {
    if (!selectedReq) return;
    const updated: { [barangId: string]: number } = {};
    selectedReq.items.forEach(itm => {
      updated[itm.barangId] = itm.jumlahDiminta;
    });
    setApprovedItems(updated);
  };

  // Helper button to set all approved to available stock
  const handleSetAllToAvailableStock = () => {
    if (!selectedReq) return;
    const updated: { [barangId: string]: number } = {};
    selectedReq.items.forEach(itm => {
      const stock = getGudangBesarStock(itm.barangId, selectedReq.gudangAsalId);
      updated[itm.barangId] = Math.min(itm.jumlahDiminta, stock);
    });
    setApprovedItems(updated);
  };

  const handleSubmitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    if (actionType === 'TOLAK' && !approvalNotes.trim()) {
      showToast('Wajib mengisi alasan/catatan penolakan permintaan!', 'error');
      return;
    }

    try {
      const itemsPayload = selectedReq.items.map(itm => {
        const userApprovedVal = approvedItems[itm.barangId];
        const finalVal = actionType === 'SETUJU' 
          ? (userApprovedVal !== undefined ? Number(userApprovedVal) : itm.jumlahDiminta) 
          : 0;
        return {
          barangId: itm.barangId,
          jumlahDisetujui: Math.max(0, finalVal),
          keterangan: itm.keterangan || ''
        };
      });

      const processed = storageService.processApproval(
        selectedReq.id,
        actionType === 'SETUJU' ? 'DISETUJUI' : 'DITOLAK',
        itemsPayload,
        approvalNotes
      );

      const approvedReqNum = selectedReq.nomorPermintaan;
      const targetSubGudang = selectedReq.gudangTujuanNama;
      setSelectedReq(null);
      loadData();
      onRefreshStats();

      if (actionType === 'SETUJU') {
        showToast(
          `Permintaan ${approvedReqNum} untuk ${targetSubGudang} BERHASIL DISETUJUI! Siap diproses pada menu Dropping.`, 
          'success', 
          approvedReqNum
        );
      } else {
        showToast(
          `Permintaan ${approvedReqNum} telah ditolak. Notifikasi telah dikirimkan ke pemohon.`, 
          'success'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses approval permintaan.', 'error');
    }
  };

  // Filter requests
  const pendingList = requests.filter(r => r.status === 'DIAJUKAN' || r.status === 'DIPERIKSA');
  const historyList = requests.filter(r => r.status !== 'DIAJUKAN' && r.status !== 'DIPERIKSA');

  const currentList = activeTab === 'PENDING' ? pendingList : historyList;

  const filteredList = currentList.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.nomorPermintaan.toLowerCase().includes(q) ||
      r.pemohonNama.toLowerCase().includes(q) ||
      r.gudangTujuanNama.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="toast-approval-feedback"
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-md animate-in fade-in-50 duration-200 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' ? (
              <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                <CheckCircle className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="font-bold text-sm">{toastMessage.type === 'success' ? 'Approval Berhasil Diproses' : 'Peringatan Approval'}</div>
              <div className="text-slate-600 mt-0.5">{toastMessage.text}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' && actionType === 'SETUJU' && (
              <button
                id="btn-toast-ke-dropping"
                onClick={() => onNavigate('dropping')}
                className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" /> Buka Menu Dropping <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button 
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-1 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-teal-800" />
            Approval Permintaan Logistik
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verifikasi ketersediaan stok Gudang Induk dan persetujuan kuota dropping untuk Sub Gudang Pulau.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            id="tab-approval-pending"
            onClick={() => setActiveTab('PENDING')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Menunggu Approval</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              pendingList.length > 0 ? 'bg-amber-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'
            }`}>
              {pendingList.length}
            </span>
          </button>

          <button
            id="tab-approval-history"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-teal-700" />
            <span>Riwayat Approval ({historyList.length})</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-approval"
            type="text"
            placeholder="Cari nomor permintaan, nama pemohon, atau sub gudang tujuan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Requests Cards / Table */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
          <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-semibold">
            {activeTab === 'PENDING' 
              ? 'Tidak ada permohonan yang menunggu persetujuan saat ini.' 
              : 'Belum ada riwayat approval yang tersimpan.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredList.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-teal-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-teal-950 font-mono">
                    {req.nomorPermintaan}
                  </span>
                  <StatusBadge status={req.status} />
                  <span className="text-xs text-slate-400">• Diajukan: {req.tanggalPermintaan}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Pemohon: </span>
                    <strong className="text-slate-800">{req.pemohonNama}</strong> ({req.pemohonJabatan || 'Petugas Sub Gudang'})
                  </div>
                  <div>
                    <span className="text-slate-500">Tujuan Dropping: </span>
                    <strong className="text-teal-800 font-bold">{req.gudangTujuanNama}</strong>
                  </div>
                </div>

                {/* Items preview pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {req.items.map((itm, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded font-medium border border-slate-200">
                      {itm.namaBarang} (<strong>{itm.jumlahDisetujui ?? itm.jumlahDiminta}</strong> {itm.satuan})
                    </span>
                  ))}
                </div>

                {req.catatanPemohon && (
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                    "{req.catatanPemohon}"
                  </p>
                )}

                {req.catatanApproval && req.status !== 'DIAJUKAN' && (
                  <div className="text-xs text-slate-600 bg-teal-50/60 p-2 rounded-lg border border-teal-100 flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-teal-900">Catatan Approval ({req.approverNama || 'Kepala Puskesmas'}):</span> {req.catatanApproval}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {activeTab === 'PENDING' ? (
                  <button
                    id={`btn-review-req-${req.id}`}
                    onClick={() => handleOpenProcessModal(req)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" /> Review & Setujui
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {req.status === 'DISETUJUI' && (
                      <button
                        onClick={() => onNavigate('dropping')}
                        className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Lanjutkan ke proses pengiriman dropping logistik"
                      >
                        <Truck className="w-3.5 h-3.5" /> Proses Dropping
                      </button>
                    )}
                    <button
                      onClick={() => onNavigate(req.status === 'DROPPING' || req.status === 'DITERIMA' ? 'dropping' : 'request')}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Detail
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* APPROVAL REVIEW MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] flex flex-col border border-slate-200">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-800">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Pemeriksaan Permintaan & Keputusan Approval
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedReq.nomorPermintaan} &bull; Tujuan: <strong className="text-teal-900 font-sans">{selectedReq.gudangTujuanNama}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedReq(null)} className="text-slate-400 hover:text-slate-600 p-1 font-bold text-base cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmitDecision} className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Decision Type Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  1. Pilih Keputusan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="btn-decision-setuju"
                    type="button"
                    onClick={() => setActionType('SETUJU')}
                    className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      actionType === 'SETUJU'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200'
                        : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" /> Setujui Permintaan (Approve)
                  </button>

                  <button
                    id="btn-decision-tolak"
                    type="button"
                    onClick={() => setActionType('TOLAK')}
                    className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      actionType === 'TOLAK'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-200'
                        : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-rose-50 hover:text-rose-800'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Tolak Permintaan (Reject)
                  </button>
                </div>
              </div>

              {/* Items Review Table */}
              {actionType === 'SETUJU' && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      2. Alokasi Jumlah Barang Disetujui
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSetAllToRequested}
                        className="px-2.5 py-1 text-[11px] font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                      >
                        Penuhi Sesuai Diminta
                      </button>
                      <button
                        type="button"
                        onClick={handleSetAllToAvailableStock}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                      >
                        Sesuaikan Stok Tersedia
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                        <tr>
                          <th className="p-3">Nama Barang</th>
                          <th className="p-3 text-center">Stok Gudang Induk</th>
                          <th className="p-3 text-center">Diminta</th>
                          <th className="p-3 text-center w-36">Disetujui (Qty)</th>
                          <th className="p-3">Satuan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedReq.items.map((itm) => {
                          const stock = getGudangBesarStock(itm.barangId, selectedReq.gudangAsalId);
                          const isInsufficient = stock < itm.jumlahDiminta;
                          const currentApprovedVal = approvedItems[itm.barangId] ?? itm.jumlahDiminta;

                          return (
                            <tr key={itm.barangId} className={isInsufficient ? 'bg-amber-50/40' : ''}>
                              <td className="p-3">
                                <div className="font-bold text-slate-800">{itm.namaBarang}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{itm.kodeBarang}</div>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`font-bold inline-flex items-center gap-1 ${
                                  stock === 0 ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded' : (stock < itm.jumlahDiminta ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded' : 'text-slate-800')
                                }`}>
                                  {stock === 0 && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                                  {stock}
                                </span>
                              </td>
                              <td className="p-3 text-center font-bold text-slate-600">
                                {itm.jumlahDiminta}
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={currentApprovedVal}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setApprovedItems({
                                      ...approvedItems,
                                      [itm.barangId]: isNaN(val) ? 0 : Math.max(0, val)
                                    });
                                  }}
                                  className={`w-24 px-2.5 py-1.5 text-center font-bold text-xs bg-white border rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none ${
                                    currentApprovedVal > stock && stock > 0 ? 'border-amber-400 text-amber-800 bg-amber-50/30' : 'border-teal-500 text-teal-950'
                                  }`}
                                />
                              </td>
                              <td className="p-3 text-slate-600 font-medium">{itm.satuan}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Approval / Rejection Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Instruksi Pengiriman {actionType === 'TOLAK' ? '<span className="text-rose-600 font-bold">*Wajib Diisi Alasan Penolakan</span>' : '(Opsional)'}
                </label>
                <textarea
                  rows={2}
                  required={actionType === 'TOLAK'}
                  placeholder={actionType === 'SETUJU' ? 'Contoh: Disetujui sesuai kuota, jadwal pengiriman via Kapal Logistik hari Kamis.' : 'Tuliskan alasan penolakan permohonan logistik...'}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-submit-keputusan-approval"
                  type="submit"
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    actionType === 'SETUJU' ? 'bg-teal-800 hover:bg-teal-900' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionType === 'SETUJU' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Simpan & Setujui Permintaan</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Tolak Permintaan Ini</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
