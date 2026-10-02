import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, FileText, Trash2, 
  AlertCircle, CheckCircle, Clock, Eye, AlertTriangle, ArrowRight, UserCheck, RefreshCw, Building2, MapPin, Send
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { ItemRequest, Item, Warehouse, User } from '../types';
import { StatusBadge } from '../components/common/Badge';

interface RequestViewProps {
  onNavigate?: (viewId: string) => void;
  currentUser: User | null;
  onRefreshStats?: () => void;
}

export const RequestView: React.FC<RequestViewProps> = ({ onNavigate, currentUser, onRefreshStats }) => {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Modal Create State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [catatanPemohon, setCatatanPemohon] = useState('');
  const [targetWarehouseId, setTargetWarehouseId] = useState<string>('');
  const [formItems, setFormItems] = useState<{ barangId: string; jumlahDiminta: number; keterangan: string }[]>([
    { barangId: '', jumlahDiminta: 1, keterangan: '' }
  ]);

  // Modal Detail State
  const [selectedRequest, setSelectedRequest] = useState<ItemRequest | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setRequests(storageService.getRequests());
    setItems(storageService.getItems().filter(i => i.statusAktif));
    const whs = storageService.getWarehouses();
    setWarehouses(whs);

    if (currentUser) {
      // Prosedur Default:
      // Pegawai -> Gudang tujuan otomatis default ke gudang tempat tugas pegawai yang bersangkutan
      // PIC Sub Gudang -> Default ke sub-gudangnya untuk meminta suplai dropping dari Gudang Besar
      const resolvedWh = storageService.resolveWarehouseForUser(currentUser);
      setTargetWarehouseId(resolvedWh ? resolvedWh.id : (currentUser.gudangId || whs[0]?.id || ''));
    } else if (whs.length > 0) {
      setTargetWarehouseId(whs[1]?.id || whs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    storageService.syncDatabase();
    loadData();
    if (onRefreshStats) onRefreshStats();
    setTimeout(() => {
      setIsRefreshing(false);
      setFeedbackMsg('Data permintaan berhasil disinkronkan');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }, 400);
  };

  const gudangBesar = warehouses.find(w => w.tipeGudang === 'GUDANG_BESAR') || warehouses[0];
  const userAssignedWarehouse = currentUser ? storageService.resolveWarehouseForUser(currentUser) : (warehouses[0] || null);
  
  // Origin warehouse:
  // For Pegawai: automatically their assigned workplace warehouse
  // For PIC Sub Gudang: Gudang Besar (as supplier of dropping)
  // For Admin: Gudang Besar or selectable
  const originWarehouse = currentUser?.role === 'PEGAWAI' ? (userAssignedWarehouse || gudangBesar) : gudangBesar;
  const activeTargetWarehouse = warehouses.find(w => w.id === targetWarehouseId) || userAssignedWarehouse || warehouses[0];

  // Helper to get stock of an item in origin warehouse
  const getOriginStock = (barangId: string) => {
    if (!originWarehouse || !barangId) return 0;
    return storageService.getStockByWarehouseAndItem(originWarehouse.id, barangId).saldo;
  };

  const handleAddItemRow = () => {
    setFormItems([...formItems, { barangId: '', jumlahDiminta: 1, keterangan: '' }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormItems(updated);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    // Validation
    const validItems = formItems.filter(i => i.barangId && Number(i.jumlahDiminta) > 0);
    if (validItems.length === 0) {
      setModalError('Pilih minimal satu barang dan masukkan jumlah permintaan yang valid!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (currentUser?.role === 'PEGAWAI') {
        const assignedWh = userAssignedWarehouse || warehouses[0];
        storageService.createRequest(validItems, catatanPemohon, assignedWh.id, assignedWh.id);
      } else if (currentUser?.role === 'PIC_SUB_GUDANG') {
        const subWh = userAssignedWarehouse || warehouses[0];
        storageService.createRequest(validItems, catatanPemohon, subWh.id, gudangBesar.id);
      } else {
        storageService.createRequest(validItems, catatanPemohon, targetWarehouseId, gudangBesar.id);
      }
      setShowCreateModal(false);
      setCatatanPemohon('');
      setFormItems([{ barangId: '', jumlahDiminta: 1, keterangan: '' }]);
      loadData();
      if (onRefreshStats) onRefreshStats();
      setFeedbackMsg('Permintaan berhasil diajukan!');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setModalError(err.message || 'Gagal membuat permintaan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter list
  const filteredRequests = requests.filter(req => {
    const userWhId = userAssignedWarehouse?.id || currentUser?.gudangId;

    if (currentUser?.role === 'PEGAWAI') {
      if (req.gudangTujuanId !== userWhId && req.gudangAsalId !== userWhId && req.pemohonId !== currentUser.id) {
        return false;
      }
    }
    if (currentUser?.role === 'PIC_SUB_GUDANG') {
      if (req.gudangTujuanId !== userWhId && req.gudangAsalId !== userWhId && req.pemohonId !== currentUser.id) {
        return false;
      }
    }
    if (currentUser?.role === 'PIC_GUDANG_BESAR') {
      if (req.gudangAsalId !== gudangBesar.id && req.gudangTujuanId !== gudangBesar.id) {
        return false;
      }
    }

    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        req.nomorPermintaan.toLowerCase().includes(q) ||
        req.pemohonNama.toLowerCase().includes(q) ||
        req.gudangTujuanNama.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStepActiveIndex = (status: string) => {
    switch (status) {
      case 'DRAFT': return 0;
      case 'DIAJUKAN': return 1;
      case 'DIPERIKSA': return 2;
      case 'DISETUJUI': return 3;
      case 'DROPPING': return 4;
      case 'DITERIMA':
      case 'SELESAI': return 5;
      case 'DITOLAK': return -1;
      default: return 1;
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Permintaan Barang (Requisition)
            </h1>
            {currentUser?.role === 'PEGAWAI' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                Tempat Tugas: {currentUser.tempatTugas || 'Puskesmas'}
              </span>
            )}
            {currentUser?.role === 'PIC_SUB_GUDANG' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                PIC: {currentUser.tempatTugas || userAssignedWarehouse?.namaGudang}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {currentUser?.role === 'PEGAWAI'
              ? `Pengajuan kebutuhan barang untuk tempat tugas (${currentUser.tempatTugas || userAssignedWarehouse?.namaGudang}) ke Gudang Penyedia.`
              : currentUser?.role === 'PIC_SUB_GUDANG'
              ? `Pengajuan dropping / pasokan logistik dari Gudang Besar ke Sub Gudang ${userAssignedWarehouse?.namaGudang || currentUser.tempatTugas}.`
              : 'Pengajuan logistik dan barang persediaan dari Sub Gudang ke Gudang Besar Puskesmas.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-refresh-permintaan"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition-all"
            title="Sinkronkan data dari database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-700' : ''}`} />
            <span className="hidden sm:inline">Sinkronkan</span>
          </button>

          <button
            id="btn-tambah-permintaan"
            onClick={() => {
              if (currentUser) {
                const resolvedWh = storageService.resolveWarehouseForUser(currentUser);
                setTargetWarehouseId(resolvedWh ? resolvedWh.id : (currentUser.gudangId || warehouses[0]?.id || ''));
              }
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Ajukan Permintaan Baru
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor permintaan, pemohon, gudang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium text-slate-700 w-full sm:w-auto"
          >
            <option value="ALL">Semua Status Workflow</option>
            <option value="DIAJUKAN">Diajukan</option>
            <option value="DISETUJUI">Disetujui</option>
            <option value="DROPPING">Dropping (Dikirim)</option>
            <option value="SELESAI">Selesai / Diterima</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">No. Permintaan</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Pemohon & Jabatan</th>
                <th className="px-4 py-3">Gudang Tujuan</th>
                <th className="px-4 py-3 text-center">Jumlah Item</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-semibold">Belum ada pengajuan permintaan barang</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Klik "Ajukan Permintaan Baru" untuk membuat pengajuan.</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-teal-800">
                      {req.nomorPermintaan}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {req.tanggalPermintaan}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{req.pemohonNama}</div>
                      <div className="text-[11px] text-slate-500">{req.pemohonJabatan} • {req.tempatTugas}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                        <span>{req.gudangTujuanNama}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      {req.items?.length || 0} item
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Lihat Rincian Permintaan"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE REQUEST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                Formulir Pengajuan Permintaan Barang Persediaan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser?.role === 'PEGAWAI'
                  ? 'Prosedur Pegawai: Permintaan otomatis ditujukan ke Gudang Tempat Tugas Anda.'
                  : currentUser?.role === 'PIC_SUB_GUDANG'
                  ? 'Prosedur PIC Sub Gudang: Permintaan dropping pasokan ditujukan ke Gudang Besar KSS.'
                  : 'Sistem memvalidasi ketersediaan saldo stok pada Gudang Besar Puskesmas.'}
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Modal Error Banner */}
              {modalError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
                  <span>{modalError}</span>
                  <button type="button" onClick={() => setModalError(null)} className="text-rose-500 hover:text-rose-800 font-bold ml-2">✕</button>
                </div>
              )}

              {/* Requester Profile Preview Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Pemohon:</span>
                  <strong className="text-slate-800">{currentUser?.nama}</strong>
                  <span className="text-[10px] text-slate-500 block">NIP: {currentUser?.nip || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Jabatan & Penugasan:</span>
                  <strong className="text-slate-800">{currentUser?.jabatan}</strong>
                  <span className="text-[10px] text-teal-800 font-semibold block flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-teal-700" /> {currentUser?.tempatTugas || 'Puskesmas KSS'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">
                    {currentUser?.role === 'PIC_SUB_GUDANG' ? 'Tujuan Pengajuan Permintaan:' : 'Gudang Tujuan Penerimaan:'}
                  </span>
                  {currentUser?.role === 'ADMIN' ? (
                    <select
                      value={targetWarehouseId}
                      onChange={(e) => setTargetWarehouseId(e.target.value)}
                      className="mt-1 w-full bg-white border border-slate-300 rounded p-1 text-xs font-semibold"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.namaGudang}</option>
                      ))}
                    </select>
                  ) : currentUser?.role === 'PIC_SUB_GUDANG' ? (
                    <div>
                      <strong className="text-teal-900 font-bold block mt-0.5">
                        {gudangBesar?.namaGudang || 'Gudang Besar KSS'}
                      </strong>
                      <span className="text-[10px] text-blue-700 font-medium block">
                        (Untuk dropping ke Sub Gudang: {activeTargetWarehouse?.namaGudang})
                      </span>
                    </div>
                  ) : (
                    <div>
                      <strong className="text-teal-900 font-bold block mt-0.5">
                        {activeTargetWarehouse?.namaGudang || currentUser?.tempatTugas}
                      </strong>
                      <span className="text-[10px] text-emerald-700 font-medium block">
                        ✓ Otomatis sesuai tempat tugas pegawai
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Item Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Daftar Barang yang Diminta
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-teal-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris Barang
                  </button>
                </div>

                <div className="space-y-3">
                  {formItems.map((itemRow, idx) => {
                    const selectedItem = items.find(i => i.id === itemRow.barangId);
                    const originStock = itemRow.barangId ? getOriginStock(itemRow.barangId) : 0;

                    return (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span>Barang #{idx + 1}</span>
                          {formItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="text-rose-500 hover:text-rose-700 flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          {/* Item Selector */}
                          <div className="sm:col-span-6">
                            <select
                              required
                              value={itemRow.barangId}
                              onChange={(e) => handleItemChange(idx, 'barangId', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                            >
                              <option value="">-- Pilih Barang Persediaan --</option>
                              {items.map(i => (
                                <option key={i.id} value={i.id}>
                                  [{i.kodeBarang}] {i.namaBarang} ({i.satuan})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Stock Origin Warehouse Preview */}
                          <div className="sm:col-span-3 flex items-center">
                            {itemRow.barangId ? (
                              <div className={`text-xs px-2.5 py-1 rounded-lg border w-full text-center ${
                                originStock === 0 
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold' 
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                              }`}>
                                {currentUser?.role === 'PEGAWAI'
                                  ? `Stok Tempat Tugas: ${originStock} ${selectedItem?.satuan || ''}`
                                  : `Stok Gudang Induk: ${originStock} ${selectedItem?.satuan || ''}`}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic">Pilih barang dahulu</div>
                            )}
                          </div>

                          {/* Requested Qty */}
                          <div className="sm:col-span-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                required
                                value={itemRow.jumlahDiminta}
                                onChange={(e) => handleItemChange(idx, 'jumlahDiminta', parseInt(e.target.value) || 1)}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 font-bold text-center"
                                placeholder="Jumlah"
                              />
                              <span className="text-xs text-slate-500 font-medium w-12 truncate">
                                {selectedItem?.satuan || 'Pcs'}
                              </span>
                            </div>
                          </div>

                          {/* Notes for this item */}
                          <div className="sm:col-span-12">
                            <input
                              type="text"
                              value={itemRow.keterangan}
                              onChange={(e) => handleItemChange(idx, 'keterangan', e.target.value)}
                              placeholder="Keterangan peruntukan kebutuhan barang ini (opsional)..."
                              className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 text-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* General Note */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Tambahan Pengajuan
                </label>
                <textarea
                  rows={2}
                  value={catatanPemohon}
                  onChange={(e) => setCatatanPemohon(e.target.value)}
                  placeholder="Contoh: Kebutuhan darurat pelayanan poli gigi dan rekam medis..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Mengirim...' : 'Kirim Permintaan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-teal-800 block">
                  {selectedRequest.nomorPermintaan}
                </span>
                <h3 className="text-base font-bold text-slate-800">
                  Rincian Permintaan Barang
                </h3>
              </div>
              <StatusBadge status={selectedRequest.status} />
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Tanggal Pengajuan:</span>
                  <strong className="text-slate-800">{selectedRequest.tanggalPermintaan}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Pemohon:</span>
                  <strong className="text-slate-800">{selectedRequest.pemohonNama}</strong>
                  <span className="text-[10px] text-slate-500 block">{selectedRequest.pemohonJabatan}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tempat Tugas:</span>
                  <strong className="text-slate-800">{selectedRequest.tempatTugas}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Gudang Sumber:</span>
                  <strong className="text-slate-800">{selectedRequest.gudangAsalNama}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Gudang Tujuan:</span>
                  <strong className="text-slate-800">{selectedRequest.gudangTujuanNama}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Status Workflow:</span>
                  <strong className="text-teal-800 font-bold">{selectedRequest.status}</strong>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wide text-xs mb-2">
                  Daftar Barang Diminta ({selectedRequest.items?.length || 0} Item)
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="px-3 py-2">Kode</th>
                        <th className="px-3 py-2">Nama Barang</th>
                        <th className="px-3 py-2 text-center">Jumlah Diminta</th>
                        <th className="px-3 py-2 text-center">Jumlah Disetujui</th>
                        <th className="px-3 py-2">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedRequest.items?.map((itm, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono font-semibold text-teal-800">{itm.kodeBarang}</td>
                          <td className="px-3 py-2 font-medium text-slate-800">{itm.namaBarang}</td>
                          <td className="px-3 py-2 text-center font-bold text-slate-800">
                            {itm.jumlahDiminta} {itm.satuan}
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-teal-800">
                            {itm.jumlahDisetujui !== undefined ? `${itm.jumlahDisetujui} ${itm.satuan}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-slate-500">{itm.keterangan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.catatanPemohon && (
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 block mb-0.5">Catatan Pemohon:</span>
                  <p className="text-amber-800">{selectedRequest.catatanPemohon}</p>
                </div>
              )}

              {selectedRequest.catatanApproval && (
                <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 text-xs">
                  <span className="font-bold text-teal-900 block mb-0.5">Catatan Verifikator / Approver:</span>
                  <p className="text-teal-800">{selectedRequest.catatanApproval}</p>
                  <span className="text-[10px] text-teal-600 block mt-1">Oleh: {selectedRequest.approverNama || 'PIC Gudang Besar'}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
