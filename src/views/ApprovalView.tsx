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

  const [selectedReq, setSelectedReq] = useState<ItemRequest | null>(null);
  const [approvedItems, setApprovedItems] = useState<{ [barangId: string]: number }>({});
  const [approvalNotes, setApprovalNotes] = useState('');
  const [actionType, setActionType] = useState<'SETUJU' | 'TOLAK'>('SETUJU');
  const [submitMode, setSubmitMode] = useState<'APPROVE_ONLY' | 'FULFILL_NOW' | 'APPROVE_AND_DROP'>('APPROVE_ONLY');

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string; reqNumber?: string } | null>(null);

  // In-app confirmation modal for Direct Fulfill or Dropping (Avoids iframe window.confirm issues)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'FULFILL' | 'DROP';
    req: ItemRequest;
    notes?: string;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

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
      const itemsPayload = (selectedReq.items || []).map(itm => {
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

      storageService.processApproval(
        selectedReq.id,
        actionType === 'SETUJU' ? 'DISETUJUI' : 'DITOLAK',
        itemsPayload,
        approvalNotes
      );

      const approvedReqNum = selectedReq.nomorPermintaan;
      const targetSubGudang = selectedReq.gudangTujuanNama;
      const isInternal = selectedReq.gudangAsalId === selectedReq.gudangTujuanId || selectedReq.gudangAsalId !== gudangBesar.id;

      if (actionType === 'SETUJU' && submitMode === 'FULFILL_NOW') {
        storageService.fulfillInternalRequest(selectedReq.id, approvalNotes || 'Diserahkan langsung kepada pegawai pemohon');
        setSelectedReq(null);
        loadData();
        onRefreshStats();
        showToast(
          `Permintaan ${approvedReqNum} untuk ${selectedReq.pemohonNama} BERHASIL DISETUJUI & DISERAHKAN! Saldo stok ${selectedReq.gudangAsalNama} telah dipotong.`, 
          'success', 
          approvedReqNum
        );
        return;
      }

      if (actionType === 'SETUJU' && submitMode === 'APPROVE_AND_DROP') {
        const newDrp = storageService.processDropping(selectedReq.id, approvalNotes || 'Disetujui untuk pengiriman dropping logistik antar pulau');
        setSelectedReq(null);
        loadData();
        onRefreshStats();
        showToast(`Permintaan ${approvedReqNum} disetujui & Dropping ${newDrp.nomorDropping} berhasil diterbitkan (BAST: ${newDrp.nomorBast})! Membuka menu Dropping.`, 'success', approvedReqNum);
        onNavigate('dropping');
        return;
      }

      setSelectedReq(null);
      loadData();
      onRefreshStats();

      if (actionType === 'SETUJU') {
        const msg = isInternal
          ? `Permintaan ${approvedReqNum} untuk ${selectedReq.pemohonNama} BERHASIL DISETUJUI! Siap diserahkan kepada pemohon.`
          : `Permintaan ${approvedReqNum} untuk ${targetSubGudang} BERHASIL DISETUJUI! Siap diproses pada menu Dropping.`;
        showToast(msg, 'success', approvedReqNum);
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

  const userWh = currentUser ? storageService.resolveWarehouseForUser(currentUser) : null;
  const userWhId = userWh?.id || currentUser?.gudangId;

  const handleFulfillDirect = (req: ItemRequest) => {
    setConfirmAction({
      type: 'FULFILL',
      req,
      notes: 'Diserahkan langsung oleh pengelola gudang tempat tugas'
    });
  };

  const handleDirectApproveAndFulfill = (req: ItemRequest) => {
    setConfirmAction({
      type: 'FULFILL',
      req,
      notes: 'Disetujui dan langsung diserahkan kepada pegawai'
    });
  };

  const handleDirectApproveAndDrop = (req: ItemRequest) => {
    setConfirmAction({
      type: 'DROP',
      req,
      notes: 'Pengiriman dropping logistik antar pulau via Kapal'
    });
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;
    setIsProcessingAction(true);
    const { type, req, notes } = confirmAction;

    try {
      if (type === 'FULFILL') {
        storageService.processApproval(
          req.id,
          'DISETUJUI',
          (req.items || []).map(i => ({ 
            barangId: i.barangId, 
            jumlahDisetujui: i.jumlahDisetujui > 0 ? i.jumlahDisetujui : i.jumlahDiminta 
          })),
          notes || 'Disetujui dan langsung diserahkan kepada pegawai'
        );
        storageService.fulfillInternalRequest(req.id, notes || 'Diserahkan langsung oleh pengelola gudang tempat tugas');
        setConfirmAction(null);
        loadData();
        onRefreshStats();
        showToast(`Barang permintaan ${req.nomorPermintaan} berhasil disetujui & diserahkan kepada ${req.pemohonNama}! Stok ${req.gudangAsalNama} telah terpotong.`, 'success');
      } else {
        storageService.processApproval(
          req.id,
          'DISETUJUI',
          (req.items || []).map(i => ({ 
            barangId: i.barangId, 
            jumlahDisetujui: i.jumlahDisetujui > 0 ? i.jumlahDisetujui : i.jumlahDiminta 
          })),
          notes || 'Disetujui untuk pengiriman dropping logistik'
        );
        const newDrp = storageService.processDropping(req.id, notes || 'Pengiriman dropping logistik antar pulau');
        setConfirmAction(null);
        loadData();
        onRefreshStats();
        showToast(`Permintaan ${req.nomorPermintaan} disetujui & Dropping ${newDrp.nomorDropping} berhasil diterbitkan (BAST: ${newDrp.nomorBast}, SBBK: ${newDrp.nomorSbbk})!`, 'success');
        onNavigate('dropping');
      }
    } catch (e: any) {
      showToast(e.message || 'Gagal memproses aksi permintaan', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Filter requests based on role
  const roleFilteredRequests = requests.filter(r => {
    if (currentUser?.role === 'ADMIN') return true;
    if (currentUser?.role === 'PIC_GUDANG_BESAR') {
      return r.gudangAsalId === gudangBesar.id || r.gudangTujuanId === gudangBesar.id;
    }
    if (currentUser?.role === 'PIC_SUB_GUDANG') {
      return r.gudangAsalId === userWhId || r.gudangTujuanId === userWhId;
    }
    return false;
  });

  const pendingList = roleFilteredRequests.filter(r => r.status === 'DIAJUKAN' || r.status === 'DIPERIKSA');
  const historyList = roleFilteredRequests.filter(r => r.status !== 'DIAJUKAN' && r.status !== 'DIPERIKSA');

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
            {toastMessage.type === 'success' && actionType === 'SETUJU' && toastMessage.text.includes('Dropping') && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PIC_GUDANG_BESAR') && (
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
                  {(req.items || []).map((itm, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded font-medium border border-slate-200">
                      {itm.namaBarang || itm.kodeBarang} (<strong>{itm.jumlahDisetujui ?? itm.jumlahDiminta}</strong> {itm.satuan})
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      id={`btn-review-req-${req.id}`}
                      onClick={() => handleOpenProcessModal(req)}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
                    >
                      <CheckSquare className="w-4 h-4" /> Review & Setujui
                    </button>

                    {(req.gudangAsalId === req.gudangTujuanId || req.gudangAsalId !== gudangBesar.id) ? (
                      <button
                        id={`btn-direct-fulfill-${req.id}`}
                        onClick={() => handleDirectApproveAndFulfill(req)}
                        className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
                        title="Setujui dan langsung serahkan barang kepada pegawai"
                      >
                        <Package className="w-4 h-4" /> Kirim / Serahkan Langsung
                      </button>
                    ) : (currentUser?.role === 'ADMIN' || currentUser?.role === 'PIC_GUDANG_BESAR') && (
                      <button
                        id={`btn-direct-drop-${req.id}`}
                        onClick={() => handleDirectApproveAndDrop(req)}
                        className="px-3.5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
                        title="Setujui dan lanjutkan ke pembuatan dokumen dropping logistik"
                      >
                        <Truck className="w-4 h-4" /> Setujui & Kirim Dropping
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {req.status === 'DISETUJUI' && req.gudangAsalId === gudangBesar.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PIC_GUDANG_BESAR') && (
                      <button
                        onClick={() => onNavigate('dropping')}
                        className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Lanjutkan ke proses pengiriman dropping logistik dari Gudang Besar"
                      >
                        <Truck className="w-3.5 h-3.5" /> Proses Dropping
                      </button>
                    )}
                    {req.status === 'DISETUJUI' && req.gudangAsalId !== gudangBesar.id && (
                      <button
                        onClick={() => handleFulfillDirect(req)}
                        className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Serahkan barang persediaan langsung ke pegawai pemohon"
                      >
                        <Package className="w-3.5 h-3.5" /> Serahkan Barang
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
                        {(selectedReq.items || []).map((itm) => {
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
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <span>Catatan / Instruksi Pengiriman</span>
                  {actionType === 'TOLAK' ? (
                    <span className="text-rose-600 font-bold">*Wajib Diisi Alasan Penolakan</span>
                  ) : (
                    <span className="text-slate-400 font-normal">(Opsional)</span>
                  )}
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
                {actionType === 'SETUJU' ? (
                  <>
                    {(selectedReq.gudangAsalId === selectedReq.gudangTujuanId || selectedReq.gudangAsalId !== gudangBesar.id) ? (
                      <button
                        id="btn-submit-approve-and-fulfill"
                        type="submit"
                        onClick={() => setSubmitMode('FULFILL_NOW')}
                        className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Package className="w-4 h-4" />
                        <span>Setujui & Langsung Kirim / Serahkan Barang</span>
                      </button>
                    ) : (currentUser?.role === 'ADMIN' || currentUser?.role === 'PIC_GUDANG_BESAR') && (
                      <button
                        id="btn-submit-approve-and-drop"
                        type="submit"
                        onClick={() => setSubmitMode('APPROVE_AND_DROP')}
                        className="px-4 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Setujui & Buka Dropping</span>
                      </button>
                    )}
                    <button
                      id="btn-submit-approve-only"
                      type="submit"
                      onClick={() => setSubmitMode('APPROVE_ONLY')}
                      className="px-4 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Setujui Saja</span>
                    </button>
                  </>
                ) : (
                  <button
                    id="btn-submit-reject"
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tolak Permintaan Ini</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CONFIRMATION ACTION MODAL (Direct Fulfill or Dropping) */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className={`p-2.5 rounded-xl ${confirmAction.type === 'FULFILL' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'}`}>
                {confirmAction.type === 'FULFILL' ? <Package className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {confirmAction.type === 'FULFILL' ? 'Konfirmasi Penyerahan Barang' : 'Konfirmasi Penerbitan & Kirim Dropping'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {confirmAction.req.nomorPermintaan}
                </p>
              </div>
            </div>

            <div className="space-y-3.5 my-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pemohon:</span>
                  <strong className="text-slate-800">{confirmAction.req.pemohonNama}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gudang Asal (Potong Stok):</span>
                  <strong className="text-slate-800">{confirmAction.req.gudangAsalNama}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gudang Tujuan:</span>
                  <strong className="text-teal-800 font-bold">{confirmAction.req.gudangTujuanNama}</strong>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1.5">Daftar Barang yang Akan Diserahkan / Dikirim:</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {(confirmAction.req.items || []).map((itm, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-800">{itm.namaBarang}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{itm.kodeBarang}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg font-bold">
                          {itm.jumlahDisetujui > 0 ? itm.jumlahDisetujui : itm.jumlahDiminta} {itm.satuan}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Pengiriman / Serah Terima:
                </label>
                <input
                  type="text"
                  value={confirmAction.notes || ''}
                  onChange={(e) => setConfirmAction({ ...confirmAction, notes: e.target.value })}
                  placeholder={confirmAction.type === 'FULFILL' ? 'Contoh: Diserahkan langsung ke pegawai pemohon' : 'Contoh: Dikirim via Kapal Dinas Kesehatan'}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-900 leading-relaxed">
                {confirmAction.type === 'FULFILL'
                  ? 'Sistem akan otomatis memotong saldo fisik pada gudang asal, menyetujui permohonan, dan mencatat transaksi pengeluaran langsung.'
                  : 'Sistem akan otomatis memotong saldo Gudang Besar, menyetujui permohonan, menerbitkan nomor Dropping, serta membuat dokumen resmi BAST dan SBBK.'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmAction}
                disabled={isProcessingAction}
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  confirmAction.type === 'FULFILL' 
                    ? 'bg-emerald-700 hover:bg-emerald-800' 
                    : 'bg-teal-700 hover:bg-teal-800'
                }`}
              >
                {confirmAction.type === 'FULFILL' ? (
                  <>
                    <Package className="w-4 h-4" />
                    <span>{isProcessingAction ? 'Memproses...' : 'Ya, Kirim & Serahkan Sekarang'}</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>{isProcessingAction ? 'Memproses...' : 'Ya, Terbitkan Dokumen & Kirim Dropping'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
