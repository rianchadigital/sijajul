import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Search, Eye, 
  Download, Printer, FileCheck2, FileOutput, 
  CheckCircle, ArrowRight, Building2, Calendar, MapPin
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Dropping, ItemRequest, User, Warehouse } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { PdfService } from '../services/pdfService';

interface DroppingViewProps {
  onNavigate: (viewId: string) => void;
  currentUser: User | null;
  onRefreshStats: () => void;
}

export const DroppingView: React.FC<DroppingViewProps> = ({ onNavigate, currentUser, onRefreshStats }) => {
  const [droppings, setDroppings] = useState<Dropping[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<ItemRequest[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('ALL');

  // Modal Create Dropping
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [droppingNotes, setDroppingNotes] = useState('');

  // Modal Detail Dropping
  const [selectedDropping, setSelectedDropping] = useState<Dropping | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = () => {
    const whs = storageService.getWarehouses();
    setDroppings(storageService.getDroppings());
    setApprovedRequests(storageService.getRequests().filter(r => r.status === 'DISETUJUI'));
    setWarehouses(whs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDropping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId) {
      showToast('Pilih permohonan yang telah disetujui untuk diproses dropping!', 'error');
      return;
    }

    try {
      const newDropping = storageService.processDropping(selectedRequestId, droppingNotes);
      setShowCreateModal(false);
      setSelectedRequestId('');
      setDroppingNotes('');
      loadData();
      onRefreshStats();
      showToast(`Dropping logistik berhasil diterbitkan! Nomor Dropping: ${newDropping.nomorDropping}, BAST: ${newDropping.nomorBast}, SBBK: ${newDropping.nomorSbbk}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses dropping', 'error');
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

  const handlePrintSbbk = (sbbkId?: string) => {
    if (!sbbkId) return;
    const sbbk = storageService.getSbbkDocs().find(s => s.id === sbbkId || s.nomorSbbk === sbbkId);
    if (!sbbk) {
      showToast('Dokumen SBBK tidak ditemukan', 'error');
      return;
    }
    const doc = PdfService.generateSbbkPdf(sbbk);
    doc.save(`SBBK_${sbbk.nomorSbbk.replace(/\//g, '_')}.pdf`);
  };

  const isSuperAdmin = currentUser?.role === 'ADMIN';
  const isPicBesar = currentUser?.role === 'PIC_GUDANG_BESAR';
  const canCreateDropping = isSuperAdmin || isPicBesar;
  const userAssignedWarehouse = currentUser ? storageService.resolveWarehouseForUser(currentUser) : null;
  const userWhId = userAssignedWarehouse?.id || currentUser?.gudangId;

  const filteredDroppings = droppings.filter(drp => {
    if (!isSuperAdmin && !isPicBesar && userWhId && drp.gudangTujuanId !== userWhId) {
      return false;
    }
    if (selectedWarehouseFilter !== 'ALL' && drp.gudangTujuanId !== selectedWarehouseFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        drp.nomorDropping.toLowerCase().includes(q) ||
        drp.gudangTujuanNama.toLowerCase().includes(q) ||
        (drp.nomorBast && drp.nomorBast.toLowerCase().includes(q))
      );
    }
    return true;
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
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700" />
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Dropping & Distribusi Barang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pengiriman logistik dari Gudang Besar ke Sub Gudang Pulau, otomatisasi BAST & SBBK.
          </p>
        </div>

        {canCreateDropping ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Proses Dropping Baru ({approvedRequests.length} Siap)
          </button>
        ) : (
          <button
            onClick={() => onNavigate('receiving')}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
          >
            <Truck className="w-4 h-4" /> Buka Menu Penerimaan Dropping
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor dropping, BAST, tujuan pulau..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedWarehouseFilter}
            onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium text-slate-700 w-full sm:w-auto"
          >
            <option value="ALL">Semua Sub Gudang Tujuan</option>
            {warehouses.filter(w => w.tipeGudang === 'SUB_GUDANG').map(w => (
              <option key={w.id} value={w.id}>{w.namaGudang}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Droppings List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">No. Dropping</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Gudang Tujuan</th>
                <th className="px-4 py-3">Dokumen Resmi</th>
                <th className="px-4 py-3 text-center">Jumlah Item</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center w-48">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDroppings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Belum ada catatan pengiriman dropping.
                  </td>
                </tr>
              ) : (
                filteredDroppings.map((drp) => (
                  <tr key={drp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold font-mono text-teal-900">
                      {drp.nomorDropping}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {drp.tanggalDropping}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        {drp.gudangTujuanNama}
                      </div>
                      <div className="text-[10px] text-slate-400">Pengirim: {drp.petugasPengirimNama}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] font-mono text-slate-700">
                        BAST: <span className="font-semibold text-teal-800">{drp.nomorBast}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        SBBK: <span>{drp.nomorSbbk}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      {drp.items.length} item
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={drp.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handlePrintBast(drp.nomorBast)}
                          title="Cetak / Unduh PDF BAST"
                          className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded font-semibold text-[11px] flex items-center gap-1 border border-teal-200"
                        >
                          <FileCheck2 className="w-3 h-3" /> BAST
                        </button>
                        <button
                          onClick={() => handlePrintSbbk(drp.nomorSbbk)}
                          title="Cetak / Unduh PDF SBBK"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] flex items-center gap-1 border border-slate-300"
                        >
                          <FileOutput className="w-3 h-3" /> SBBK
                        </button>
                        <button
                          onClick={() => setSelectedDropping(drp)}
                          title="Lihat Rincian"
                          className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE DROPPING MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-800">
                Proses Dropping & Penerbitan Dokumen Resmi
              </h3>
              <p className="text-xs text-slate-500">
                Sistem akan memotong saldo Gudang Besar dan menerbitkan nomor BAST & SBBK resmi.
              </p>
            </div>

            <form onSubmit={handleCreateDropping} className="space-y-4">
              {/* Select Approved Requisition */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Permintaan Barang yang Telah Disetujui
                </label>
                {approvedRequests.length === 0 ? (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                    Tidak ada permohonan berstatus <strong>DISETUJUI</strong> yang siap didistribusikan saat ini.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedRequestId}
                    onChange={(e) => setSelectedRequestId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="">-- Pilih Nomor Permintaan --</option>
                    {approvedRequests.map(req => (
                      <option key={req.id} value={req.id}>
                        {req.nomorPermintaan} - Tujuan: {req.gudangTujuanNama} ({(req.items || []).length} item)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selected Request Detail Preview */}
              {selectedRequestId && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-800">Rincian Barang yang Akan Didrop:</div>
                  <div className="space-y-1 divide-y divide-slate-200">
                    {approvedRequests.find(r => r.id === selectedRequestId)?.items?.map((itm, idx) => (
                      <div key={idx} className="pt-1 flex justify-between text-slate-700">
                        <span>{itm.namaBarang}</span>
                        <strong className="text-teal-900">{itm.jumlahDisetujui ?? itm.jumlahDiminta} {itm.satuan}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dropping Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pengiriman / Armada Kapal
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pengiriman via Kapal Logistik Dinkes - Nakhoda Bpk. Ahmad"
                  value={droppingNotes}
                  onChange={(e) => setDroppingNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={approvedRequests.length === 0 || !selectedRequestId}
                  className="px-5 py-2 text-xs font-bold bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 text-white rounded-xl shadow"
                >
                  Terbitkan Dropping & Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL DROPPING MODAL */}
      {selectedDropping && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800 font-mono">
                    {selectedDropping.nomorDropping}
                  </h3>
                  <StatusBadge status={selectedDropping.status} />
                </div>
                <p className="text-xs text-slate-500">Tanggal: {selectedDropping.tanggalDropping}</p>
              </div>
              <button onClick={() => setSelectedDropping(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Pengirim:</span>
                  <div className="font-bold text-slate-800">{selectedDropping.petugasPengirimNama}</div>
                  <div className="text-slate-500">{selectedDropping.gudangAsalNama}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tujuan:</span>
                  <div className="font-bold text-teal-800">{selectedDropping.gudangTujuanNama}</div>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Barang</th>
                      <th className="p-2.5 text-center">Jumlah Dikirim</th>
                      <th className="p-2.5">Satuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDropping.items.map((itm, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-800">{itm.namaBarang}</td>
                        <td className="p-2.5 text-center font-bold text-teal-900">{itm.jumlahDikirim}</td>
                        <td className="p-2.5 text-slate-600">{itm.satuan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quick Document Download Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintBast(selectedDropping.nomorBast)}
                  className="flex-1 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" /> Unduh Dokumen BAST Resmi (PDF)
                </button>
                <button
                  onClick={() => handlePrintSbbk(selectedDropping.nomorSbbk)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" /> Unduh Dokumen SBBK Resmi (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
