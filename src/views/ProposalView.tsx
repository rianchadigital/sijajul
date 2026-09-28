import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lightbulb, Plus, Search, CheckCircle2, Clock, 
  AlertTriangle, XCircle, ShoppingCart, Printer, 
  FileText, Sparkles, Building2, User as UserIcon, Tag, 
  DollarSign, Check, X, ExternalLink, PackagePlus,
  Eye, Calendar, Download, Copy, RefreshCw, Layers,
  CheckSquare
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { User, ItemProposal, Category, ProposalStatus, ProposalPriority } from '../types';
import { PdfService } from '../services/pdfService';

interface ProposalViewProps {
  currentUser: User | null;
  onRefreshStats?: () => void;
}

export const ProposalView: React.FC<ProposalViewProps> = ({ currentUser, onRefreshStats }) => {
  const [proposals, setProposals] = useState<ItemProposal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'MY_PROPOSALS' | 'PENDING' | 'APPROVED' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [islandFilter, setIslandFilter] = useState<string>('ALL');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showRecapModal, setShowRecapModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ItemProposal | null>(null);

  // Form Fields for New Proposal
  const [namaBarang, setNamaBarang] = useState('');
  const [kategoriId, setKategoriId] = useState('');
  const [merkRekomendasi, setMerkRekomendasi] = useState('');
  const [spesifikasi, setSpesifikasi] = useState('');
  const [jumlahDiusulkan, setJumlahDiusulkan] = useState<number>(1);
  const [satuan, setSatuan] = useState('Pcs');
  const [estimasiHargaSatuan, setEstimasiHargaSatuan] = useState<number>(0);
  const [prioritas, setPrioritas] = useState<ProposalPriority>('SEDANG');
  const [alasanPengusulan, setAlasanPengusulan] = useState('');
  const [urgensi, setUrgensi] = useState('');
  const [linkReferensi, setLinkReferensi] = useState('');
  const [formError, setFormError] = useState('');

  // Approval Form Fields
  const [approvalCatatan, setApprovalCatatan] = useState('');
  const [nomorDpa, setNomorDpa] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Recap PDF Modal Filters
  const [recapTitle, setRecapTitle] = useState('Rekapitulasi Usulan Belanja Barang & Perencanaan Logistik');
  const [recapStatus, setRecapStatus] = useState<string>('ALL');
  const [recapPriority, setRecapPriority] = useState<string>('ALL');
  const [recapCategory, setRecapCategory] = useState<string>('ALL');
  const [recapLocation, setRecapLocation] = useState<string>('ALL');

  const isApprover = currentUser?.role === 'ADMIN' || currentUser?.role === 'PIC_GUDANG_BESAR';

  const loadData = () => {
    const p = storageService.getProposals();
    const c = storageService.getCategories();
    setProposals(p);
    setCategories(c);
    if (c.length > 0 && !kategoriId) {
      setKategoriId(c[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setNamaBarang('');
    setKategoriId(categories[0]?.id || 'CAT-007');
    setMerkRekomendasi('');
    setSpesifikasi('');
    setJumlahDiusulkan(1);
    setSatuan('Pcs');
    setEstimasiHargaSatuan(0);
    setPrioritas('SEDANG');
    setAlasanPengusulan('');
    setUrgensi('');
    setLinkReferensi('');
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!namaBarang.trim()) {
      setFormError('Nama barang yang diusulkan wajib diisi');
      return;
    }
    if (!alasanPengusulan.trim()) {
      setFormError('Alasan / justifikasi pengusulan wajib diisi');
      return;
    }
    if (jumlahDiusulkan <= 0) {
      setFormError('Jumlah usulan minimal 1');
      return;
    }
    if (!currentUser) {
      setFormError('Sesi pengguna tidak valid, silakan login ulang');
      return;
    }

    const cat = categories.find(c => c.id === kategoriId);

    const newProp = storageService.createProposal({
      namaBarang: namaBarang.trim(),
      kategoriId: kategoriId,
      kategoriNama: cat ? cat.nama : 'Barang Lainnya',
      merkRekomendasi: merkRekomendasi.trim(),
      spesifikasi: spesifikasi.trim(),
      jumlahDiusulkan: Number(jumlahDiusulkan),
      satuan: satuan.trim() || 'Pcs',
      estimasiHargaSatuan: Number(estimasiHargaSatuan),
      prioritas,
      alasanPengusulan: alasanPengusulan.trim(),
      urgensi: urgensi.trim(),
      linkReferensi: linkReferensi.trim()
    }, currentUser);

    loadData();
    if (onRefreshStats) onRefreshStats();
    setShowCreateModal(false);
    showToast(`Usulan barang "${newProp.namaBarang}" berhasil diajukan dengan nomor ${newProp.nomorUsulan}`);
  };

  const handleApprovalAction = (status: ProposalStatus) => {
    if (!selectedProposal || !currentUser) return;
    setIsProcessing(true);

    try {
      storageService.approveProposal(
        selectedProposal.id,
        currentUser,
        status,
        approvalCatatan,
        nomorDpa
      );

      loadData();
      if (onRefreshStats) onRefreshStats();
      
      const updated = storageService.getProposals().find(p => p.id === selectedProposal.id);
      if (updated) setSelectedProposal(updated);

      showToast(`Status usulan berhasil diperbarui menjadi ${status.replace(/_/g, ' ')}`);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertToMaster = () => {
    if (!selectedProposal || !currentUser) return;
    if (!confirm(`Konfirmasi: Tambahkan "${selectedProposal.namaBarang}" secara resmi ke Master Barang dan buat stok awal?`)) {
      return;
    }

    try {
      const newItem = storageService.convertProposalToMasterItem(selectedProposal.id, currentUser);
      loadData();
      if (onRefreshStats) onRefreshStats();
      
      const updated = storageService.getProposals().find(p => p.id === selectedProposal.id);
      if (updated) setSelectedProposal(updated);

      showToast(`Berhasil! "${newItem.namaBarang}" telah resmi masuk ke Master Barang dengan kode ${newItem.kodeBarang}`);
    } catch (e: any) {
      alert(`Gagal: ${e.message}`);
    }
  };

  const handleDownloadSinglePdf = (proposal: ItemProposal) => {
    try {
      const doc = PdfService.generateSingleProposalPdf(proposal);
      const filename = `Usulan_${proposal.nomorUsulan.replace(/[^a-zA-Z0-9]/g, '_')}_${proposal.namaBarang.slice(0, 15)}.pdf`;
      doc.save(filename);
      showToast(`Dokumen usulan ${proposal.nomorUsulan} berhasil diunduh dalam format PDF.`);
    } catch (err: any) {
      alert(`Gagal mengunduh PDF: ${err.message}`);
    }
  };

  const handleDownloadRecapPdf = () => {
    try {
      const filtered = getRecapFilteredProposals();
      if (filtered.length === 0) {
        alert('Tidak ada data usulan yang sesuai dengan kriteria filter rekapitulasi.');
        return;
      }

      const filterDescParts = [];
      if (recapStatus !== 'ALL') filterDescParts.push(`Status: ${recapStatus.replace(/_/g, ' ')}`);
      if (recapPriority !== 'ALL') filterDescParts.push(`Prioritas: ${recapPriority}`);
      if (recapCategory !== 'ALL') {
        const c = categories.find(cat => cat.id === recapCategory);
        if (c) filterDescParts.push(`Kategori: ${c.nama}`);
      }
      if (recapLocation !== 'ALL') filterDescParts.push(`Lokasi: ${recapLocation}`);
      const filterText = filterDescParts.length > 0 ? filterDescParts.join(', ') : 'Semua Data Usulan Belanja';

      const summaryStats = {
        totalCount: filtered.length,
        pendingCount: filtered.filter(p => p.status === 'DIAJUKAN').length,
        approvedCount: filtered.filter(p => p.status === 'DISETUJUI_PENGADAAN' || p.status === 'DIPROSES_BELANJA').length,
        completedCount: filtered.filter(p => p.status === 'TERBELANJA').length,
        totalAnggaran: filtered.reduce((sum, p) => sum + (p.estimasiTotalHarga || 0), 0)
      };

      const doc = PdfService.generateProposalRecapPdf(recapTitle, filterText, filtered, summaryStats);
      const filename = `Rekapitulasi_Usulan_Barang_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      setShowRecapModal(false);
      showToast(`Rekapitulasi usulan (${filtered.length} item) berhasil diunduh dalam format PDF.`);
    } catch (err: any) {
      alert(`Gagal mengunduh Rekapitulasi PDF: ${err.message}`);
    }
  };

  const copyProposalNumber = (nomor: string) => {
    navigator.clipboard.writeText(nomor);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  // Filter calculations for Main Table
  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      // Tab filter
      if (activeTab === 'MY_PROPOSALS' && currentUser && p.pemohonId !== currentUser.id) return false;
      if (activeTab === 'PENDING' && p.status !== 'DIAJUKAN') return false;
      if (activeTab === 'APPROVED' && p.status !== 'DISETUJUI_PENGADAAN' && p.status !== 'DIPROSES_BELANJA') return false;
      if (activeTab === 'COMPLETED' && p.status !== 'TERBELANJA') return false;

      // Status filter
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      // Priority filter
      if (priorityFilter !== 'ALL' && p.prioritas !== priorityFilter) return false;
      // Category filter
      if (categoryFilter !== 'ALL' && p.kategoriId !== categoryFilter) return false;
      // Island filter
      if (islandFilter !== 'ALL' && !p.tempatTugas?.toLowerCase().includes(islandFilter.toLowerCase())) return false;

      // Search query
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.namaBarang.toLowerCase().includes(q) ||
        p.nomorUsulan.toLowerCase().includes(q) ||
        p.pemohonNama.toLowerCase().includes(q) ||
        p.tempatTugas.toLowerCase().includes(q) ||
        (p.merkRekomendasi && p.merkRekomendasi.toLowerCase().includes(q)) ||
        (p.spesifikasi && p.spesifikasi.toLowerCase().includes(q))
      );
    });
  }, [proposals, activeTab, currentUser, statusFilter, priorityFilter, categoryFilter, islandFilter, searchQuery]);

  // Filter calculations for Recap Modal
  const getRecapFilteredProposals = () => {
    return proposals.filter(p => {
      if (recapStatus !== 'ALL' && p.status !== recapStatus) return false;
      if (recapPriority !== 'ALL' && p.prioritas !== recapPriority) return false;
      if (recapCategory !== 'ALL' && p.kategoriId !== recapCategory) return false;
      if (recapLocation !== 'ALL' && !p.tempatTugas?.toLowerCase().includes(recapLocation.toLowerCase())) return false;
      return true;
    });
  };

  const recapFilteredList = getRecapFilteredProposals();
  const recapTotalAnggaran = recapFilteredList.reduce((sum, p) => sum + (p.estimasiTotalHarga || 0), 0);

  // Statistics
  const totalCount = proposals.length;
  const pendingCount = proposals.filter(p => p.status === 'DIAJUKAN').length;
  const approvedCount = proposals.filter(p => p.status === 'DISETUJUI_PENGADAAN' || p.status === 'DIPROSES_BELANJA').length;
  const completedCount = proposals.filter(p => p.status === 'TERBELANJA').length;
  const totalEstimasiAnggaran = proposals
    .filter(p => p.status !== 'DITOLAK')
    .reduce((sum, p) => sum + (p.estimasiTotalHarga || 0), 0);

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'DIAJUKAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Menunggu Verifikasi
          </span>
        );
      case 'DISETUJUI_PENGADAAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Disetujui Pengadaan
          </span>
        );
      case 'DIPROSES_BELANJA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <ShoppingCart className="w-3.5 h-3.5 text-purple-600" />
            Sedang Dibelanjakan
          </span>
        );
      case 'TERBELANJA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <PackagePlus className="w-3.5 h-3.5 text-emerald-600" />
            Selesai / Masuk Master
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (p: ProposalPriority) => {
    switch (p) {
      case 'MENDESAK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            MENDESAK
          </span>
        );
      case 'TINGGI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            TINGGI
          </span>
        );
      case 'SEDANG':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-100">
            SEDANG
          </span>
        );
      case 'RUTIN':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
            RUTIN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md">
          <div className="bg-slate-900 text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-teal-500/50 flex items-start gap-3">
            <div className="p-1 bg-teal-600 rounded-lg text-white mt-0.5 flex-shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider">Berhasil</h4>
              <p className="text-xs text-slate-100 mt-0.5 leading-relaxed">{successToast}</p>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 rounded-3xl border border-slate-800 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-800/80 border border-teal-500/50 text-[11px] font-bold text-teal-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Perencanaan Pengadaan &amp; Belanja Baru
            </span>
            <span className="text-[10px] text-slate-400">SI JAJUL v2.5</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            Usulan Belanja Barang Baru
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Pegawai &amp; PIC Sub Gudang dapat mengusulkan kebutuhan barang/alat medis yang belum ada di master katalog untuk diverifikasi dan direkapitulasi secara resmi dalam format PDF oleh Tim Pengadaan Puskesmas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Tombol Rekapitulasi PDF untuk Superadmin / Admin / Pengadaan */}
          {isApprover && (
            <button
              id="btn-rekapitulasi-pdf"
              onClick={() => setShowRecapModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer hover:border-teal-500/50"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Rekapitulasi PDF</span>
            </button>
          )}

          <button
            id="btn-open-create-proposal"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Usulan Barang Baru</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Usulan</div>
            <div className="text-xl font-black text-slate-800">{totalCount} <span className="text-xs font-semibold text-slate-500">Item</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Menunggu Approval</div>
            <div className="text-xl font-black text-amber-800">{pendingCount} <span className="text-xs font-semibold text-slate-500">Usulan</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Disetujui / Belanja</div>
            <div className="text-xl font-black text-blue-800">{approvedCount} <span className="text-xs font-semibold text-slate-500">Item</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Masuk Master</div>
            <div className="text-xl font-black text-emerald-800">{completedCount} <span className="text-xs font-semibold text-slate-500">Barang</span></div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-800">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimasi Anggaran</div>
            <div className="text-base font-black text-purple-900 truncate">
              Rp {totalEstimasiAnggaran.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Navigation */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua Usulan ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('MY_PROPOSALS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'MY_PROPOSALS'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Usulan Saya
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Menunggu Approval ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'APPROVED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Disetujui ({approvedCount})
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Sudah Dibelanjakan ({completedCount})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <span>Menampilkan <strong>{filteredProposals.length}</strong> usulan</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-proposals"
              type="text"
              placeholder="Cari nama barang usulan, nomor usulan, nama pemohon, spesifikasi, atau pulau..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium text-slate-700"
            >
              <option value="ALL">Semua Status</option>
              <option value="DIAJUKAN">Menunggu Approval</option>
              <option value="DISETUJUI_PENGADAAN">Disetujui Pengadaan</option>
              <option value="DIPROSES_BELANJA">Diproses Belanja</option>
              <option value="TERBELANJA">Terbelanja / Masuk Master</option>
              <option value="DITOLAK">Ditolak</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium text-slate-700"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="MENDESAK">Mendesak</option>
              <option value="TINGGI">Tinggi</option>
              <option value="SEDANG">Sedang</option>
              <option value="RUTIN">Rutin</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium text-slate-700 max-w-[150px]"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nama}</option>
              ))}
            </select>

            <select
              value={islandFilter}
              onChange={(e) => setIslandFilter(e.target.value)}
              className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium text-slate-700 max-w-[150px]"
            >
              <option value="ALL">Semua Lokasi</option>
              <option value="Tidung">P. Tidung</option>
              <option value="Pari">P. Pari</option>
              <option value="Untung Jawa">P. Untung Jawa</option>
              <option value="Lancang">P. Lancang</option>
              <option value="Gudang Besar">Gudang Besar KSS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Proposals List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredProposals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Lightbulb className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Tidak Ada Usulan Barang</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Belum ada usulan barang baru yang sesuai dengan filter atau kata kunci pencarian.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-500 inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              Buat Usulan Baru Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">No. Usulan &amp; Tanggal</th>
                  <th className="py-3 px-4">Nama Barang Usulan</th>
                  <th className="py-3 px-4">Kategori &amp; Merk</th>
                  <th className="py-3 px-4">Jumlah &amp; Estimasi Biaya</th>
                  <th className="py-3 px-4">Pemohon &amp; Lokasi</th>
                  <th className="py-3 px-4">Prioritas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi &amp; Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProposals.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-teal-900">{p.nomorUsulan}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {p.tanggalUsulan}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 text-sm">{p.namaBarang}</div>
                      {p.spesifikasi && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                          {p.spesifikasi}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {p.kategoriNama}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Merk: <strong>{p.merkRekomendasi || '-'}</strong>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">
                        {p.jumlahDiusulkan} {p.satuan}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {p.estimasiTotalHarga ? `Rp ${p.estimasiTotalHarga.toLocaleString('id-ID')}` : 'Rp -'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        {p.pemohonNama}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {p.tempatTugas}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getPriorityBadge(p.prioritas)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedProposal(p);
                            setApprovalCatatan(p.catatanApproval || '');
                            setNomorDpa(p.nomorDpaRekening || '');
                            setShowDetailModal(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs flex items-center gap-1 border border-teal-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                        
                        <button
                          onClick={() => handleDownloadSinglePdf(p)}
                          title="Unduh PDF Resmi"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedProposal(p);
                            setShowPrintModal(true);
                          }}
                          title="Cetak Formulir Resmi"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FORMULIR USULAN BELANJA BARANG BARU (PERFECT SCROLLABLE DIALOG)  */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col overflow-hidden">
            
            {/* PINNED HEADER - Always Visible at Top */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 flex-shrink-0 bg-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shadow-inner flex-shrink-0">
                  <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800">
                    Formulir Usulan Belanja Barang Baru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ajukan item persediaan / alat kesehatan non-katalog untuk dikaji oleh Tim Pengadaan
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE BODY - Smooth Top-to-Bottom Scrollable Content */}
            <form onSubmit={handleSubmitProposal} id="form-create-proposal" className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              {/* Section 1: Identitas Barang */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex items-center gap-2 font-bold text-slate-700 text-xs border-b border-slate-200/80 pb-2">
                  <Tag className="w-4 h-4 text-teal-700" />
                  <span>1. Identitas &amp; Klasifikasi Barang</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap Barang yang Diusulkan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Lampu Periksa Tindakan Medis LED Mobile Stand"
                      value={namaBarang}
                      onChange={(e) => setNamaBarang(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 text-xs font-semibold text-slate-800 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kategori Barang <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={kategoriId}
                      onChange={(e) => setKategoriId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 text-xs font-medium text-slate-700 shadow-2xs"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Merk / Pabrikan Rekomendasi
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: GEA Medical / OneMed / Philips"
                      value={merkRekomendasi}
                      onChange={(e) => setMerkRekomendasi(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 text-xs font-medium text-slate-700 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Volume & Estimasi Biaya */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex items-center gap-2 font-bold text-slate-700 text-xs border-b border-slate-200/80 pb-2">
                  <DollarSign className="w-4 h-4 text-teal-700" />
                  <span>2. Volume &amp; Perkiraan Anggaran</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jumlah Unit <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={jumlahDiusulkan}
                      onChange={(e) => setJumlahDiusulkan(parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 text-xs font-bold text-slate-800 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Satuan Unit <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Pcs / Unit / Box / Set"
                      value={satuan}
                      onChange={(e) => setSatuan(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 text-xs font-medium text-slate-700 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Estimasi Harga Satuan (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="0"
                      value={estimasiHargaSatuan}
                      onChange={(e) => setEstimasiHargaSatuan(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 text-xs font-mono font-bold text-slate-800 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Total Estimation Highlight */}
                <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200 flex items-center justify-between">
                  <div className="text-[11px] text-teal-800 font-bold">
                    Perhitungan Total Estimasi Anggaran:
                  </div>
                  <div className="text-sm font-black font-mono text-teal-950">
                    Rp {((jumlahDiusulkan || 1) * (estimasiHargaSatuan || 0)).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Section 3: Justifikasi & Spesifikasi */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex items-center gap-2 font-bold text-slate-700 text-xs border-b border-slate-200/80 pb-2">
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  <span>3. Spesifikasi Teknis &amp; Justifikasi Pelayanan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Spesifikasi Teknis / Dimensi / Fitur Utama
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: Tiang stainless steel adjustable 150-200cm, 5 roda putar dengan rem, LED 30 Watt 5500K, input daya AC 220V."
                      value={spesifikasi}
                      onChange={(e) => setSpesifikasi(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 text-xs font-medium text-slate-700 shadow-2xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alasan / Justifikasi Kebutuhan Pelayanan <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Jelaskan kebutuhan operasional atau pelayanan pasien di puskesmas yang memerlukan barang ini..."
                      value={alasanPengusulan}
                      onChange={(e) => setAlasanPengusulan(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 text-xs font-medium text-slate-700 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Skala Prioritas Kebutuhan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={prioritas}
                      onChange={(e) => setPrioritas(e.target.value as ProposalPriority)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 text-xs font-bold text-slate-800 shadow-2xs"
                    >
                      <option value="MENDESAK">🚨 MENDESAK (Kebutuhan Kritis Pelayanan)</option>
                      <option value="TINGGI">⚡ TINGGI (Segera Diadakan)</option>
                      <option value="SEDANG">📅 SEDANG (Rencana Belanja Triwulan)</option>
                      <option value="RUTIN">🔄 RUTIN (Belanja Berkala)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Unit / Ruang / Poli Pemakai
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Ruang UGD / Poli Gigi Pulau Tidung"
                      value={urgensi}
                      onChange={(e) => setUrgensi(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 text-xs font-medium text-slate-700 shadow-2xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Link Referensi / E-Katalog LKPP / Brosur (Opsional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://e-katalog.lkpp.go.id/..."
                      value={linkReferensi}
                      onChange={(e) => setLinkReferensi(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 text-xs font-medium text-slate-700 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Requester Info Tag */}
              <div className="bg-slate-100 p-3 rounded-2xl flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{currentUser?.nama} ({currentUser?.jabatan})</div>
                    <div className="text-[11px] text-slate-500">Penugasan: {currentUser?.tempatTugas || currentUser?.unitKerja}</div>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  Pemohon
                </span>
              </div>
            </form>

            {/* PINNED FOOTER - Always Visible at Bottom */}
            <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                form="form-create-proposal"
                className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-500 flex items-center gap-2 shadow-lg shadow-teal-900/20 transition-all cursor-pointer text-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Kirim Usulan Belanja</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DETAIL & APPROVAL MODAL (PERFECT SCROLLABLE DIALOG)              */}
      {/* ========================================================================= */}
      {showDetailModal && selectedProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col overflow-hidden">
            
            {/* PINNED HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 flex-shrink-0 bg-white rounded-t-3xl">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {selectedProposal.nomorUsulan}
                  </span>
                  <button 
                    onClick={() => copyProposalNumber(selectedProposal.nomorUsulan)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title="Salin Nomor"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copiedId && <span className="text-[10px] text-emerald-600 font-bold">Disalin!</span>}
                  {getStatusBadge(selectedProposal.status)}
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 mt-1.5">
                  {selectedProposal.namaBarang}
                </h3>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Proposal Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Kategori</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedProposal.kategoriNama}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Merk Rekomendasi</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedProposal.merkRekomendasi || '-'}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Jumlah &amp; Satuan</span>
                  <div className="font-bold text-teal-900 mt-0.5">{selectedProposal.jumlahDiusulkan} {selectedProposal.satuan}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Prioritas</span>
                  <div className="mt-0.5">{getPriorityBadge(selectedProposal.prioritas)}</div>
                </div>
              </div>

              {/* Price & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-teal-50/70 p-4 rounded-2xl border border-teal-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-800">Estimasi Satuan</span>
                  <div className="font-bold font-mono text-teal-950 mt-0.5 text-sm">
                    Rp {(selectedProposal.estimasiHargaSatuan || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-800">Total Estimasi Anggaran</span>
                  <div className="font-black font-mono text-lg text-teal-950 mt-0.5">
                    Rp {(selectedProposal.estimasiTotalHarga || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Spesifikasi & Justifikasi */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-slate-700">Spesifikasi Teknis:</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-1 leading-relaxed">
                    {selectedProposal.spesifikasi || 'Tidak ada catatan spesifikasi teknis khusus.'}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700">Alasan &amp; Justifikasi Kebutuhan:</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-1 leading-relaxed">
                    {selectedProposal.alasanPengusulan}
                  </p>
                </div>
              </div>

              {/* Pemohon Info */}
              <div className="p-3.5 bg-slate-100 rounded-2xl flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Diusulkan Oleh:</span>
                  <div className="font-bold text-slate-800">{selectedProposal.pemohonNama} ({selectedProposal.pemohonJabatan})</div>
                  <div className="text-slate-500 text-[11px]">{selectedProposal.tempatTugas} | Tanggal: {selectedProposal.tanggalUsulan}</div>
                </div>
                {selectedProposal.linkReferensi && (
                  <a
                    href={selectedProposal.linkReferensi}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-teal-700 font-bold text-[11px] flex items-center gap-1 hover:bg-slate-50 shadow-2xs"
                  >
                    <span>Link Katalog LKPP</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Verification Details if already verified */}
              {selectedProposal.approverNama && (
                <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl text-blue-900 space-y-1">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-blue-700">Verifikasi &amp; Approval:</div>
                  <div>Diverifikasi oleh: <strong>{selectedProposal.approverNama}</strong> pada {selectedProposal.tanggalApproval}</div>
                  {selectedProposal.nomorDpaRekening && (
                    <div>No. DPA / Rekening Belanja: <strong>{selectedProposal.nomorDpaRekening}</strong></div>
                  )}
                  {selectedProposal.catatanApproval && (
                    <div className="mt-1 text-slate-700 italic bg-white/70 p-2 rounded-lg">"{selectedProposal.catatanApproval}"</div>
                  )}
                </div>
              )}

              {/* Approver Action Panel */}
              {isApprover && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Panel Keputusan Pejabat Pengadaan &amp; Admin
                    </span>
                    <span className="text-[10px] text-slate-400">Tindakan Langsung</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Nomor DPA / Kode Rekening Belanja:
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: DPA/A.1/1.02.0.00.0.00.01.0000"
                        value={nomorDpa}
                        onChange={(e) => setNomorDpa(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-teal-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Catatan Keputusan / Verifikasi:
                      </label>
                      <input
                        type="text"
                        placeholder="Catatan persetujuan atau alasan..."
                        value={approvalCatatan}
                        onChange={(e) => setApprovalCatatan(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-teal-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-2">
                    {selectedProposal.status === 'DIAJUKAN' && (
                      <>
                        <button
                          onClick={() => handleApprovalAction('DISETUJUI_PENGADAAN')}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Setujui Pengadaan
                        </button>
                        <button
                          onClick={() => handleApprovalAction('DITOLAK')}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <XCircle className="w-4 h-4" />
                          Tolak Usulan
                        </button>
                      </>
                    )}

                    {selectedProposal.status === 'DISETUJUI_PENGADAAN' && (
                      <button
                        onClick={() => handleApprovalAction('DIPROSES_BELANJA')}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Tandai Sedang Dibelanjakan
                      </button>
                    )}

                    {(selectedProposal.status === 'DISETUJUI_PENGADAAN' || selectedProposal.status === 'DIPROSES_BELANJA') && !selectedProposal.sudahMasukMasterBarang && (
                      <button
                        onClick={handleConvertToMaster}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950 cursor-pointer"
                      >
                        <PackagePlus className="w-4 h-4" />
                        Masukkan ke Master Barang &amp; Buat Stok
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PINNED FOOTER */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadSinglePdf(selectedProposal)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-teal-800 font-bold flex items-center gap-1.5 cursor-pointer text-xs shadow-2xs"
                >
                  <Download className="w-4 h-4 text-teal-600" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowPrintModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer text-xs shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Cetak Form</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer text-xs"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REKAPITULASI PDF MODAL (SUPERADMIN & PENGADAAN)                   */}
      {/* ========================================================================= */}
      {showRecapModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col overflow-hidden">
            
            {/* PINNED HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 flex-shrink-0 bg-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-inner flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Rekapitulasi Usulan Belanja Barang (PDF)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cetak dan unduh rekapitulasi data usulan perencanaan logistik berformat resmi
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowRecapModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Judul Dokumen */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Dokumen Rekapitulasi:
                </label>
                <input
                  type="text"
                  value={recapTitle}
                  onChange={(e) => setRecapTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              {/* Filter Parameters */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-700 text-xs border-b border-slate-200 pb-2">
                  Parameter &amp; Kriteria Filter Rekapitulasi:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Status Usulan:
                    </label>
                    <select
                      value={recapStatus}
                      onChange={(e) => setRecapStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    >
                      <option value="ALL">Semua Status (Seluruh Usulan)</option>
                      <option value="DIAJUKAN">Menunggu Verifikasi Saja</option>
                      <option value="DISETUJUI_PENGADAAN">Disetujui Pengadaan Saja</option>
                      <option value="DIPROSES_BELANJA">Sedang Dibelanjakan Saja</option>
                      <option value="TERBELANJA">Selesai / Masuk Master Saja</option>
                      <option value="DITOLAK">Ditolak Saja</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Skala Prioritas:
                    </label>
                    <select
                      value={recapPriority}
                      onChange={(e) => setRecapPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    >
                      <option value="ALL">Semua Prioritas</option>
                      <option value="MENDESAK">🚨 MENDESAK Saja</option>
                      <option value="TINGGI">⚡ TINGGI Saja</option>
                      <option value="SEDANG">📅 SEDANG Saja</option>
                      <option value="RUTIN">🔄 RUTIN Saja</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Kategori Barang:
                    </label>
                    <select
                      value={recapCategory}
                      onChange={(e) => setRecapCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    >
                      <option value="ALL">Semua Kategori</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Lokasi / Unit Tugas:
                    </label>
                    <select
                      value={recapLocation}
                      onChange={(e) => setRecapLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    >
                      <option value="ALL">Semua Lokasi / Unit</option>
                      <option value="Tidung">Puskesmas Kel. Pulau Tidung</option>
                      <option value="Pari">Puskesmas Kel. Pulau Pari</option>
                      <option value="Untung Jawa">Puskesmas Kel. Pulau Untung Jawa</option>
                      <option value="Lancang">Puskesmas Kel. Pulau Lancang</option>
                      <option value="Gudang Besar">Gudang Besar KSS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview Hasil Rekap */}
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-teal-700" />
                    Hasil Filter Rekapitulasi:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-200/80 text-teal-950 font-black text-[11px]">
                    {recapFilteredList.length} Item Terpilih
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-500">Total Item:</span>
                    <strong className="text-slate-800 ml-1">{recapFilteredList.length} Usulan</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Akumulasi Anggaran:</span>
                    <strong className="text-teal-950 font-mono ml-1">Rp {recapTotalAnggaran.toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 italic">
                * Dokumen PDF dicetak dalam orientasi Landscape A4 lengkap dengan Kop Resmi Pemprov DKI Jakarta &amp; lembar tanda tangan Pejabat Pengadaan dan Kepala Puskesmas.
              </div>
            </div>

            {/* PINNED FOOTER */}
            <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowRecapModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDownloadRecapPdf}
                disabled={recapFilteredList.length === 0}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-bold flex items-center gap-2 shadow-lg shadow-teal-950 cursor-pointer text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Rekapitulasi PDF ({recapFilteredList.length})</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PRINT FORMULIR RESMI MODAL (PERFECT SCROLLABLE DIALOG)           */}
      {/* ========================================================================= */}
      {showPrintModal && selectedProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col overflow-hidden">
            
            {/* PINNED HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-5 flex-shrink-0 bg-white rounded-t-3xl print:hidden">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Printer className="w-5 h-5 text-teal-700" />
                <span>Pratinjau Cetak Lembar Usulan Belanja Barang</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowPrintModal(false)} 
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-white">
              <div className="p-6 border-2 border-slate-300 rounded-2xl bg-white text-slate-900 font-sans text-xs space-y-6">
                {/* Kop Surat */}
                <div className="text-center border-b-2 border-slate-800 pb-4">
                  <div className="text-xs font-bold tracking-wider text-slate-600 uppercase">Pemerintah Provinsi Daerah Khusus Ibukota Jakarta</div>
                  <div className="text-sm font-black text-slate-900 uppercase tracking-tight">Dinas Kesehatan Provinsi DKI Jakarta</div>
                  <div className="text-base font-black text-teal-900 uppercase">Puskesmas Kecamatan Kepulauan Seribu Selatan</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Jl. Pantai Selatan No. 1, Pulau Tidung, Kepulauan Seribu Selatan, DKI Jakarta 14520 | Telp: (021) 6411234
                  </div>
                </div>

                {/* Judul Dokumen */}
                <div className="text-center">
                  <h2 className="text-sm font-black underline uppercase">FORMULIR USULAN PENGADAAN BARANG / PERSEDIAAN BARU</h2>
                  <div className="font-mono text-xs font-bold text-slate-700 mt-0.5">Nomor: {selectedProposal.nomorUsulan}</div>
                </div>

                {/* Data Pemohon */}
                <table className="w-full text-xs">
                  <tbody>
                    <tr>
                      <td className="w-44 py-1 text-slate-600 font-semibold">Nama Pemohon</td>
                      <td className="py-1">: <strong>{selectedProposal.pemohonNama}</strong></td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-600 font-semibold">NIP / NIK</td>
                      <td className="py-1">: {selectedProposal.pemohonNip || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-600 font-semibold">Jabatan</td>
                      <td className="py-1">: {selectedProposal.pemohonJabatan}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-600 font-semibold">Unit Kerja / Lokasi Tugas</td>
                      <td className="py-1">: {selectedProposal.tempatTugas}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-600 font-semibold">Tanggal Pengusulan</td>
                      <td className="py-1">: {selectedProposal.tanggalUsulan}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Tabel Rincian Barang Usulan */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2.5 border-r border-slate-300 text-center w-10">No</th>
                        <th className="p-2.5 border-r border-slate-300 text-left">Nama &amp; Spesifikasi Barang</th>
                        <th className="p-2.5 border-r border-slate-300 text-center w-24">Jumlah</th>
                        <th className="p-2.5 border-r border-slate-300 text-right w-32">Estimasi Satuan</th>
                        <th className="p-2.5 text-right w-36">Total Estimasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="p-2.5 border-r border-slate-300 text-center font-bold">1</td>
                        <td className="p-2.5 border-r border-slate-300">
                          <div className="font-bold text-slate-900">{selectedProposal.namaBarang}</div>
                          <div className="text-[11px] text-slate-600 mt-0.5">Kategori: {selectedProposal.kategoriNama} | Merk: {selectedProposal.merkRekomendasi || '-'}</div>
                          <div className="text-[11px] text-slate-500 italic mt-0.5">{selectedProposal.spesifikasi}</div>
                        </td>
                        <td className="p-2.5 border-r border-slate-300 text-center font-bold">
                          {selectedProposal.jumlahDiusulkan} {selectedProposal.satuan}
                        </td>
                        <td className="p-2.5 border-r border-slate-300 text-right font-mono">
                          Rp {(selectedProposal.estimasiHargaSatuan || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          Rp {(selectedProposal.estimasiTotalHarga || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold">
                      <tr>
                        <td colSpan={4} className="p-2.5 border-r border-slate-300 text-right uppercase">Total Estimasi Anggaran Pengadaan:</td>
                        <td className="p-2.5 text-right font-mono text-teal-900">
                          Rp {(selectedProposal.estimasiTotalHarga || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Justifikasi */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-700 block mb-1">Justifikasi &amp; Urgensi Kebutuhan:</span>
                  <p className="text-slate-600 leading-relaxed">{selectedProposal.alasanPengusulan}</p>
                </div>

                {/* Tanda Tangan */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                  <div>
                    <div className="text-slate-500 mb-1">Mengetahui / Mengajukan,</div>
                    <div className="font-bold text-slate-800">Pemohon / Penanggung Jawab Unit</div>
                    <div className="h-16"></div>
                    <div className="font-bold underline">{selectedProposal.pemohonNama}</div>
                    <div className="text-slate-500">NIP: {selectedProposal.pemohonNip || '-'}</div>
                  </div>

                  <div>
                    <div className="text-slate-500 mb-1">Kepulauan Seribu Selatan, {selectedProposal.tanggalApproval || selectedProposal.tanggalUsulan}</div>
                    <div className="font-bold text-slate-800">Pengurus Barang / Pejabat Pengadaan</div>
                    <div className="h-16"></div>
                    <div className="font-bold underline">{selectedProposal.approverNama || 'Hendra Setiawan, S.Farm'}</div>
                    <div className="text-slate-500">NIP: 198807212011011008</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PINNED FOOTER */}
            <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex-shrink-0 print:hidden">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer text-xs"
              >
                Tutup Pratinjau Cetak
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
