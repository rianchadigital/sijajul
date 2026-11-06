import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowDownCircle, Plus, Search, Filter, Download, 
  Calendar, FileText, CheckCircle2, AlertCircle, Building2, 
  Package, DollarSign, Layers, RefreshCw, X, Check, ArrowRight, ExternalLink, ShieldAlert
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { gasService } from '../services/gasService';
import { ExcelService } from '../services/excelService';
import { Item, Warehouse, User, StockTransaction } from '../types';

interface IncomingItemViewProps {
  currentUser: User | null;
  onNavigate?: (viewId: string) => void;
  onRefreshStats?: () => void;
}

export const IncomingItemView: React.FC<IncomingItemViewProps> = ({
  currentUser,
  onNavigate,
  onRefreshStats
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('ALL');
  const [selectedSumberFilter, setSelectedSumberFilter] = useState('ALL');

  // Modal / Form States
  const [showModal, setShowModal] = useState(false);
  const [entryMode, setEntryMode] = useState<'EXISTING' | 'NEW'>('EXISTING');

  // Mode 1: Existing Item Form
  const [existingItemId, setExistingItemId] = useState('');
  const [existingWarehouseId, setExistingWarehouseId] = useState('');
  const [existingQty, setExistingQty] = useState<number | ''>(1);
  const [existingSumberAnggaran, setExistingSumberAnggaran] = useState<'APBD' | 'BLUD'>('APBD');
  const [existingHargaSatuan, setExistingHargaSatuan] = useState<number | ''>('');
  const [existingDocNo, setExistingDocNo] = useState('');
  const [existingDate, setExistingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [existingNotes, setExistingNotes] = useState('');

  // Mode 2: New Item Form
  const [newKodeBarang, setNewKodeBarang] = useState('');
  const [newNamaBarang, setNewNamaBarang] = useState('');
  const [newKategori, setNewKategori] = useState('Obat-obatan');
  const [newSatuan, setNewSatuan] = useState('Box');
  const [newSumberAnggaran, setNewSumberAnggaran] = useState<'APBD' | 'BLUD'>('APBD');
  const [newHargaSatuan, setNewHargaSatuan] = useState<number | ''>(0);
  const [newStokMinimum, setNewStokMinimum] = useState<number>(10);
  const [newSpesifikasi, setNewSpesifikasi] = useState('');
  const [newWarehouseId, setNewWarehouseId] = useState('');
  const [newQtyMasuk, setNewQtyMasuk] = useState<number | ''>(1);
  const [newDocNo, setNewDocNo] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Item Search in Combobox
  const [itemSearchText, setItemSearchText] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const categories = [
    'Obat-obatan',
    'Bahan Medis Habis Pakai (BMHP)',
    'Alat Tulis Kantor (ATK)',
    'Cetakan',
    'Reagen & Laboratorium',
    'Alat Kesehatan',
    'Bahan Kebersihan',
    'Linen & Logistik Lainnya'
  ];

  const unitOptions = [
    'Box', 'Botol', 'Pcs', 'Strip', 'Ampul', 'Vial', 'Tube', 'Rim', 'Roll', 'Lembar', 'Paket', 'Set', 'Tablet', 'Kapsul'
  ];

  const loadData = () => {
    const allItems = storageService.getItems();
    const allWhs = storageService.getWarehouses();
    const allTrx = storageService.getTransactions();

    setItems(allItems);
    setWarehouses(allWhs);

    // Filter incoming transactions (MUTASI_MASUK or transactions with positive incoming)
    const incomingTrx = allTrx.filter(t => t.jenisTransaksi === 'MUTASI_MASUK' || t.masuk > 0);
    // Sort descending by date/createdAt
    incomingTrx.sort((a, b) => new Date(b.createdAt || b.tanggal).getTime() - new Date(a.createdAt || a.tanggal).getTime());
    setTransactions(incomingTrx);

    // Set defaults if empty
    if (!existingWarehouseId && allWhs.length > 0) {
      const defaultWh = allWhs.find(w => w.tipeGudang === 'GUDANG_BESAR') || allWhs[0];
      setExistingWarehouseId(defaultWh.id);
      setNewWarehouseId(defaultWh.id);
    }
  };

  useEffect(() => {
    loadData();

    const handleDataUpdate = () => {
      loadData();
    };

    window.addEventListener('sijajul_data_updated', handleDataUpdate);
    return () => window.removeEventListener('sijajul_data_updated', handleDataUpdate);
  }, []);

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When selected existing item changes, sync default source & price
  const selectedExistingItem = useMemo(() => {
    return items.find(i => i.id === existingItemId) || null;
  }, [items, existingItemId]);

  useEffect(() => {
    if (selectedExistingItem) {
      setExistingSumberAnggaran((selectedExistingItem.sumberAnggaran as 'APBD' | 'BLUD') || 'APBD');
      setExistingHargaSatuan(selectedExistingItem.hargaSatuan || selectedExistingItem.hargaEstimasi || 0);
    }
  }, [selectedExistingItem]);

  // Current stock for selected existing item in selected warehouse
  const currentWarehouseStock = useMemo(() => {
    if (!existingWarehouseId || !existingItemId) return 0;
    return storageService.getStockByWarehouseAndItem(existingWarehouseId, existingItemId).saldo;
  }, [existingWarehouseId, existingItemId, transactions]);

  // Generate Document Number Helper
  const handleGenerateDocNo = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    const doc = `BAST-MASUK/${year}/${month}/${random}`;
    if (entryMode === 'EXISTING') {
      setExistingDocNo(doc);
    } else {
      setNewDocNo(doc);
    }
  };

  // Generate Item Code Helper
  const handleGenerateItemCode = () => {
    const prefix = newKategori.substring(0, 3).toUpperCase();
    const count = items.length + 1;
    const random = Math.floor(100 + Math.random() * 900);
    setNewKodeBarang(`BRG-${prefix}-${count}-${random}`);
  };

  // Open modal handler
  const handleOpenModal = (mode: 'EXISTING' | 'NEW' = 'EXISTING') => {
    setEntryMode(mode);
    setFeedback(null);
    if (mode === 'EXISTING') {
      if (!existingDocNo) handleGenerateDocNo();
    } else {
      if (!newDocNo) handleGenerateDocNo();
      if (!newKodeBarang) handleGenerateItemCode();
    }
    setShowModal(true);
  };

  // Filtered Items for Combobox
  const filteredComboboxItems = useMemo(() => {
    if (!itemSearchText.trim()) return items.filter(i => i.statusAktif);
    const q = itemSearchText.toLowerCase();
    return items.filter(i => 
      i.statusAktif && (
        i.namaBarang.toLowerCase().includes(q) ||
        i.kodeBarang.toLowerCase().includes(q) ||
        (i.kategori && i.kategori.toLowerCase().includes(q)) ||
        (i.sumberAnggaran && i.sumberAnggaran.toLowerCase().includes(q))
      )
    );
  }, [items, itemSearchText]);

  // Submit Handler - Menyimpan lokal dan langsung sinkronkan ke Google Spreadsheet
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      if (entryMode === 'EXISTING') {
        if (!existingItemId) {
          throw new Error('Silakan pilih barang persediaan terlebih dahulu.');
        }
        if (!existingWarehouseId) {
          throw new Error('Silakan pilih gudang tujuan penerimaan barang.');
        }
        const qty = Number(existingQty) || 0;
        if (qty <= 0) {
          throw new Error('Jumlah barang masuk harus lebih besar dari 0.');
        }

        const res = storageService.recordIncomingStock({
          gudangId: existingWarehouseId,
          barangId: existingItemId,
          jumlahMasuk: qty,
          sumberAnggaran: existingSumberAnggaran,
          hargaSatuan: typeof existingHargaSatuan === 'number' ? existingHargaSatuan : undefined,
          nomorDokumen: existingDocNo || undefined,
          keterangan: existingNotes || `Penerimaan Barang Masuk (${existingSumberAnggaran})`,
          performer: currentUser
        });

        // Langsung dorong ke Google Spreadsheet agar muncul secara global di semua browser & Hostinger
        try {
          await gasService.pushToSheets();
        } catch (pushErr) {
          console.warn('Push ke Spreadsheet dialihkan ke auto-sync:', pushErr);
        }

        // Trigger global custom event
        window.dispatchEvent(new CustomEvent('sijajul_data_updated'));

        setFeedback({
          type: 'success',
          message: `✅ Berhasil disimpan secara global! Stok ${selectedExistingItem?.namaBarang}: +${qty} ${selectedExistingItem?.satuan} (Saldo baru: ${res.stock.saldo} ${selectedExistingItem?.satuan}). Database Google Spreadsheet dan seluruh browser telah terupdate.`
        });

        // Reset form
        setExistingItemId('');
        setExistingQty(1);
        setExistingNotes('');
        setExistingDocNo('');
        setShowModal(false);
      } else {
        // Mode NEW: Register new item
        if (!newNamaBarang.trim()) {
          throw new Error('Nama barang wajib diisi.');
        }
        if (!newWarehouseId) {
          throw new Error('Silakan pilih gudang tujuan.');
        }
        const qtyAwal = Number(newQtyMasuk) || 0;
        if (qtyAwal <= 0) {
          throw new Error('Jumlah masuk awal harus lebih besar dari 0.');
        }

        const kode = newKodeBarang.trim() || `BRG-${Date.now().toString().slice(-6)}`;

        // Create new item
        const newItem: Item = {
          id: `ITEM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          kodeBarang: kode,
          namaBarang: newNamaBarang.trim(),
          kategoriId: 'KAT-' + newKategori.substring(0, 3).toUpperCase(),
          kategoriNama: newKategori,
          kategori: newKategori,
          satuan: newSatuan,
          merk: newSpesifikasi.trim() || '-',
          spesifikasi: newSpesifikasi.trim() || '-',
          keterangan: newNotes.trim() || `Pengadaan (${newSumberAnggaran})`,
          sumberAnggaran: newSumberAnggaran,
          hargaSatuan: Number(newHargaSatuan) || 0,
          hargaEstimasi: Number(newHargaSatuan) || 0,
          stokMinimum: Number(newStokMinimum) || 10,
          statusAktif: true,
          totalStok: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Save new item
        storageService.saveItem(newItem);

        // Record incoming stock
        const res = storageService.recordIncomingStock({
          gudangId: newWarehouseId,
          barangId: newItem.id,
          jumlahMasuk: qtyAwal,
          sumberAnggaran: newSumberAnggaran,
          hargaSatuan: Number(newHargaSatuan) || 0,
          nomorDokumen: newDocNo || undefined,
          keterangan: newNotes || `Penerimaan Perdana Barang Baru (${newSumberAnggaran})`,
          performer: currentUser
        });

        // Langsung dorong ke Google Spreadsheet
        try {
          await gasService.pushToSheets();
        } catch (pushErr) {
          console.warn('Push ke Spreadsheet dialihkan ke auto-sync:', pushErr);
        }

        window.dispatchEvent(new CustomEvent('sijajul_data_updated'));

        setFeedback({
          type: 'success',
          message: `✅ Berhasil disimpan secara global! Barang baru "${newItem.namaBarang}" didaftarkan dan stok perdana ${qtyAwal} ${newItem.satuan} telah tersimpan di database Google Spreadsheet.`
        });

        // Reset form
        setNewNamaBarang('');
        setNewKodeBarang('');
        setNewSpesifikasi('');
        setNewQtyMasuk(1);
        setNewNotes('');
        setShowModal(false);
      }

      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal menyimpan barang masuk.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered transactions for display
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Warehouse filter
      if (selectedWarehouseFilter !== 'ALL' && t.gudangId !== selectedWarehouseFilter) {
        return false;
      }
      // Sumber Anggaran filter
      if (selectedSumberFilter !== 'ALL') {
        const item = items.find(i => i.id === t.barangId);
        const itemSumber = t.sumberAnggaran || item?.sumberAnggaran || 'APBD';
        if (itemSumber !== selectedSumberFilter) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const doc = (t.referensiDokumen || t.nomorTransaksi || '').toLowerCase();
        const nama = (t.barangNama || '').toLowerCase();
        const kode = (t.kodeBarang || '').toLowerCase();
        const ket = (t.keterangan || '').toLowerCase();
        const gudang = (t.gudangNama || '').toLowerCase();
        return doc.includes(q) || nama.includes(q) || kode.includes(q) || ket.includes(q) || gudang.includes(q);
      }
      return true;
    });
  }, [transactions, selectedWarehouseFilter, selectedSumberFilter, searchQuery, items]);

  // Statistics KPIs
  const stats = useMemo(() => {
    const totalTrx = transactions.length;
    let totalQty = 0;
    let totalNilai = 0;
    let countAPBD = 0;
    let countBLUD = 0;

    transactions.forEach(t => {
      totalQty += t.masuk;
      const harga = t.hargaSatuan || 0;
      totalNilai += (t.masuk * harga);

      const sumber = t.sumberAnggaran || 'APBD';
      if (sumber === 'BLUD') countBLUD++;
      else countAPBD++;
    });

    return { totalTrx, totalQty, totalNilai, countAPBD, countBLUD };
  }, [transactions]);

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredTransactions.map((t, idx) => {
      const item = items.find(i => i.id === t.barangId);
      const sumber = t.sumberAnggaran || item?.sumberAnggaran || 'APBD';
      const harga = t.hargaSatuan || item?.hargaSatuan || 0;
      const totalNilai = t.masuk * harga;

      return {
        'No': idx + 1,
        'Tanggal': new Date(t.tanggal).toLocaleDateString('id-ID'),
        'No. Dokumen': t.referensiDokumen || t.nomorTransaksi,
        'Kode Barang': t.kodeBarang,
        'Nama Barang': t.barangNama,
        'Sumber Anggaran': sumber,
        'Gudang Tujuan': t.gudangNama,
        'Jumlah Masuk': t.masuk,
        'Satuan': t.satuan,
        'Harga Satuan (Rp)': harga,
        'Total Nilai (Rp)': totalNilai,
        'Saldo Akhir': t.saldoAkhir,
        'Petugas': t.userNama,
        'Keterangan': t.keterangan
      };
    });

    ExcelService.exportToExcel(
      exportData, 
      `Riwayat_Barang_Masuk_${new Date().toISOString().split('T')[0]}`, 
      'Barang Masuk'
    );
  };

  const isAuthorized = currentUser?.role === 'ADMIN' || currentUser?.role === 'PIC_GUDANG_BESAR';
  if (currentUser && !isAuthorized) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Akses Terbatas</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Menu <strong>Penerimaan Barang Masuk</strong> hanya dapat diakses oleh akun <strong>PIC Gudang Besar</strong> dan <strong>Admin</strong>.
          </p>
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner / Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 text-xs font-medium leading-relaxed">
            {feedback.message}
          </div>
          <button 
            onClick={() => setFeedback(null)} 
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-800 text-white rounded-xl shadow-md">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Penerimaan Barang Masuk
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan persediaan barang masuk pengadaan APBD &amp; BLUD, droping suplier, serta hibah
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenModal('EXISTING')}
            className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-900/10 flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Update Stok Masuk</span>
          </button>

          <button
            onClick={() => handleOpenModal('NEW')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-teal-800 border-2 border-teal-700 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Package className="w-4 h-4 text-teal-700" />
            <span>Daftar Barang Baru</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            title="Export Riwayat Barang Masuk ke Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl shadow-sm transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Transaksi</span>
            <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{stats.totalTrx}</div>
          <div className="text-[11px] text-slate-500 mt-1">Penerimaan tercatat</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Volume Masuk</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800">
            {stats.totalQty.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total unit barang masuk</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Sumber APBD</span>
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <span className="text-[10px] font-black">APBD</span>
            </div>
          </div>
          <div className="text-2xl font-black text-blue-800">{stats.countAPBD}</div>
          <div className="text-[11px] text-slate-500 mt-1">Transaksi pengadaan APBD</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Sumber BLUD</span>
            <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
              <span className="text-[10px] font-black">BLUD</span>
            </div>
          </div>
          <div className="text-2xl font-black text-purple-800">{stats.countBLUD}</div>
          <div className="text-[11px] text-slate-500 mt-1">Transaksi pengadaan BLUD</div>
        </div>
      </div>

      {/* Main Content: Filter Toolbar & Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box with white background */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no. dokumen, nama barang, kode, atau keterangan..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Warehouse Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedWarehouseFilter}
                onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Gudang</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.namaGudang}</option>
                ))}
              </select>
            </div>

            {/* Sumber Anggaran Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSumberFilter}
                onChange={(e) => setSelectedSumberFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Sumber</option>
                <option value="APBD">Sumber: APBD</option>
                <option value="BLUD">Sumber: BLUD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tanggal &amp; Dokumen</th>
                <th className="py-3 px-4">Barang Persediaan</th>
                <th className="py-3 px-4">Sumber Anggaran</th>
                <th className="py-3 px-4">Gudang Penerima</th>
                <th className="py-3 px-4 text-center">Jumlah Masuk</th>
                <th className="py-3 px-4 text-center">Saldo Akhir</th>
                <th className="py-3 px-4">Keterangan &amp; Petugas</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ArrowDownCircle className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Belum ada catatan barang masuk</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik tombol &quot;Update Stok Masuk&quot; atau &quot;Daftar Barang Baru&quot; di atas untuk mencatat penerimaan barang persediaan.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const item = items.find(i => i.id === trx.barangId);
                  const sumber = trx.sumberAnggaran || item?.sumberAnggaran || 'APBD';
                  const dateStr = new Date(trx.tanggal || trx.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr key={trx.id} className="hover:bg-teal-50/40 transition">
                      {/* Tanggal & Dokumen */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-bold text-slate-800">{dateStr}</div>
                        <div className="text-[10px] font-mono text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded mt-0.5 inline-block border border-teal-200 font-semibold">
                          {trx.referensiDokumen || trx.nomorTransaksi}
                        </div>
                      </td>

                      {/* Barang */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {trx.kodeBarang}
                          </span>
                          <span className="font-bold text-slate-800">{trx.barangNama}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item?.kategori || 'Persediaan'} • Satuan: {trx.satuan}
                        </div>
                      </td>

                      {/* Sumber Anggaran */}
                      <td className="py-3 px-4 align-top">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                          sumber === 'BLUD'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {sumber}
                        </span>
                      </td>

                      {/* Gudang */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-semibold text-slate-700 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{trx.gudangNama}</span>
                        </div>
                      </td>

                      {/* Jumlah Masuk */}
                      <td className="py-3 px-4 align-top text-center">
                        <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-xs">
                          +{trx.masuk.toLocaleString('id-ID')} {trx.satuan}
                        </span>
                      </td>

                      {/* Saldo Akhir */}
                      <td className="py-3 px-4 align-top text-center font-bold text-slate-800">
                        {trx.saldoAkhir.toLocaleString('id-ID')} {trx.satuan}
                      </td>

                      {/* Keterangan & Petugas */}
                      <td className="py-3 px-4 align-top">
                        <div className="text-slate-600 max-w-xs">{trx.keterangan || '-'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Petugas: {trx.userNama || 'Petugas Gudang'}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 align-top text-right">
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate('kartu_stok')}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition"
                            title="Buka Kartu Stok Barang ini"
                          >
                            <span>Kartu Stok</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Entry Barang Masuk */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-800 rounded-xl text-teal-200">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Pencatatan Penerimaan Barang Masuk
                  </h3>
                  <p className="text-[11px] text-teal-200">
                    Otomatis mengupdate saldo stok &amp; mencatat buku mutasi kartu stok
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-teal-300 hover:text-white hover:bg-teal-800/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
              <button
                type="button"
                onClick={() => setEntryMode('EXISTING')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  entryMode === 'EXISTING'
                    ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-teal-700" />
                <span>Barang Sudah Ada di Katalog (Update Stok)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntryMode('NEW');
                  if (!newKodeBarang) handleGenerateItemCode();
                  if (!newDocNo) handleGenerateDocNo();
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  entryMode === 'NEW'
                    ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-teal-700" />
                <span>Barang Tipe Baru (Daftarkan Baru)</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {entryMode === 'EXISTING' ? (
                /* MODE A: EXISTING ITEM */
                <div className="space-y-4">
                  {/* Searchable Item Selector with White Input Field */}
                  <div className="space-y-1" ref={pickerRef}>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                      <span>Pilih Barang Persediaan *</span>
                      <span className="text-[10px] text-teal-700 font-semibold">Ketik nama di kolom putih</span>
                    </label>

                    {selectedExistingItem && !isPickerOpen ? (
                      <div className="p-3 bg-teal-50/80 border-2 border-teal-500 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded">
                              {selectedExistingItem.kodeBarang}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {selectedExistingItem.namaBarang}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                              selectedExistingItem.sumberAnggaran === 'BLUD'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {selectedExistingItem.sumberAnggaran || 'APBD'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                            <span>Kategori: {selectedExistingItem.kategori}</span>
                            <span>•</span>
                            <span>Satuan: <strong className="text-slate-700">{selectedExistingItem.satuan}</strong></span>
                            <span>•</span>
                            <span>Harga: Rp {(selectedExistingItem.hargaSatuan || 0).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setItemSearchText('');
                            setIsPickerOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold bg-white text-teal-800 border border-teal-300 rounded-lg hover:bg-teal-100 shadow-2xs flex items-center gap-1"
                        >
                          <Search className="w-3 h-3" /> Ganti
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            autoFocus={isPickerOpen}
                            value={itemSearchText}
                            onChange={(e) => {
                              setItemSearchText(e.target.value);
                              setIsPickerOpen(true);
                            }}
                            onFocus={() => setIsPickerOpen(true)}
                            placeholder="🔍 Ketik nama, kode, atau kategori barang di sini..."
                            className="w-full pl-9 pr-8 py-2.5 text-xs bg-white border-2 border-teal-500 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-xs font-medium"
                          />
                          {(itemSearchText || selectedExistingItem) && (
                            <button
                              type="button"
                              onClick={() => {
                                setItemSearchText('');
                                if (!itemSearchText && selectedExistingItem) {
                                  setIsPickerOpen(false);
                                }
                              }}
                              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {isPickerOpen && (
                          <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                            <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                              <span>Daftar Barang Katalog ({filteredComboboxItems.length})</span>
                              <span className="text-teal-700">Pilih salah satu</span>
                            </div>
                            {filteredComboboxItems.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400">
                                Tidak ada barang dengan kata kunci &quot;{itemSearchText}&quot;
                              </div>
                            ) : (
                              filteredComboboxItems.map(item => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setExistingItemId(item.id);
                                    setIsPickerOpen(false);
                                    setItemSearchText('');
                                  }}
                                  className="w-full text-left p-2.5 hover:bg-teal-50/80 transition flex items-center justify-between gap-2"
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                        {item.kodeBarang}
                                      </span>
                                      <span className="text-xs font-bold text-slate-800">
                                        {item.namaBarang}
                                      </span>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                        item.sumberAnggaran === 'BLUD'
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'bg-blue-100 text-blue-700'
                                      }`}>
                                        {item.sumberAnggaran || 'APBD'}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                      {item.kategori} • Satuan: {item.satuan} • Rp {(item.hargaSatuan || 0).toLocaleString('id-ID')}
                                    </div>
                                  </div>
                                  {item.id === existingItemId && (
                                    <span className="text-xs font-bold text-teal-700 flex items-center gap-0.5">
                                      <Check className="w-3.5 h-3.5" /> Terpilih
                                    </span>
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Target Warehouse & Stock Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Gudang Penerima *
                      </label>
                      <select
                        required
                        value={existingWarehouseId}
                        onChange={(e) => setExistingWarehouseId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                      >
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.namaGudang} ({w.tipeGudang === 'GUDANG_BESAR' ? 'Gudang Induk' : 'Sub Gudang'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Status Stok Saat Ini
                      </label>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Saldo di Gudang Ini:</span>
                        <strong className="text-teal-800 text-sm font-black">
                          {currentWarehouseStock.toLocaleString('id-ID')} {selectedExistingItem?.satuan || 'Pcs'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Qty Masuk & Live Simulation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-teal-50/50 p-3 rounded-xl border border-teal-100">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-teal-900 uppercase tracking-wide">
                        Jumlah Barang Masuk *
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          required
                          value={existingQty}
                          onChange={(e) => setExistingQty(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 text-sm font-black text-center bg-white border-2 border-teal-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-teal-950"
                          placeholder="Jumlah"
                        />
                        <span className="text-xs font-bold text-teal-800 shrink-0 w-12">
                          {selectedExistingItem?.satuan || 'Pcs'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                        Simulasi Saldo Akhir
                      </span>
                      <div className="text-xs text-teal-900 font-medium">
                        {currentWarehouseStock} + <span className="font-bold text-emerald-700">+{Number(existingQty) || 0}</span> =
                        <strong className="text-teal-950 text-base font-black ml-1.5">
                          {(currentWarehouseStock + (Number(existingQty) || 0)).toLocaleString('id-ID')} {selectedExistingItem?.satuan || ''}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Sumber Anggaran & Harga Satuan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                        <span>Sumber Anggaran *</span>
                        <span className="text-[10px] text-teal-700 font-medium">Pilihan APBD / BLUD</span>
                      </label>
                      <select
                        required
                        value={existingSumberAnggaran}
                        onChange={(e) => setExistingSumberAnggaran(e.target.value as 'APBD' | 'BLUD')}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-bold text-slate-800"
                      >
                        <option value="APBD">APBD (Anggaran Pendapatan dan Belanja Daerah)</option>
                        <option value="BLUD">BLUD (Badan Layanan Umum Daerah)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Harga Satuan (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          type="number"
                          min="0"
                          value={existingHargaSatuan}
                          onChange={(e) => setExistingHargaSatuan(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dokumen & Tanggal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                        <span>No. Dokumen / BAST / Faktur</span>
                        <button
                          type="button"
                          onClick={handleGenerateDocNo}
                          className="text-[10px] text-teal-700 hover:text-teal-900 font-bold"
                        >
                          Auto Generate
                        </button>
                      </label>
                      <input
                        type="text"
                        value={existingDocNo}
                        onChange={(e) => setExistingDocNo(e.target.value)}
                        placeholder="Contoh: BAST-2026/05/01"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Tanggal Penerimaan *
                      </label>
                      <input
                        type="date"
                        required
                        value={existingDate}
                        onChange={(e) => setExistingDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                      />
                    </div>
                  </div>

                  {/* Keterangan */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Keterangan / Asal Penerimaan
                    </label>
                    <input
                      type="text"
                      value={existingNotes}
                      onChange={(e) => setExistingNotes(e.target.value)}
                      placeholder="Contoh: Pengadaan Obat Rutin Tahap II Sudinkes / Hibah Kemenkes..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>
              ) : (
                /* MODE B: NEW ITEM */
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Mendaftarkan Jenis Barang Baru ke Katalog:</strong>
                      <p className="text-[11px] mt-0.5 text-amber-800">
                        Barang ini akan otomatis ditambahkan ke Master Barang dan langsung dimasukkan stok awal penerimaannya ke gudang tujuan yang dipilih.
                      </p>
                    </div>
                  </div>

                  {/* Nama & Kode Barang */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Nama Barang Persediaan *
                      </label>
                      <input
                        type="text"
                        required
                        value={newNamaBarang}
                        onChange={(e) => setNewNamaBarang(e.target.value)}
                        placeholder="Contoh: Paracetamol 500mg Tablet / Spuit 3cc"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-bold text-slate-800"
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                        <span>Kode Barang</span>
                        <button
                          type="button"
                          onClick={handleGenerateItemCode}
                          className="text-[10px] text-teal-700 font-bold"
                        >
                          Auto
                        </button>
                      </label>
                      <input
                        type="text"
                        value={newKodeBarang}
                        onChange={(e) => setNewKodeBarang(e.target.value)}
                        placeholder="Auto generate..."
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Kategori, Satuan, Sumber Anggaran */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Kategori *
                      </label>
                      <select
                        required
                        value={newKategori}
                        onChange={(e) => setNewKategori(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                      >
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Satuan *
                      </label>
                      <select
                        required
                        value={newSatuan}
                        onChange={(e) => setNewSatuan(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                      >
                        {unitOptions.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sumber Anggaran Field */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                        <span>Sumber Anggaran *</span>
                        <span className="text-[10px] text-teal-700 font-bold">Wajib</span>
                      </label>
                      <select
                        required
                        value={newSumberAnggaran}
                        onChange={(e) => setNewSumberAnggaran(e.target.value as 'APBD' | 'BLUD')}
                        className="w-full px-3 py-2 text-xs bg-white border-2 border-teal-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-bold text-slate-800"
                      >
                        <option value="APBD">APBD</option>
                        <option value="BLUD">BLUD</option>
                      </select>
                    </div>
                  </div>

                  {/* Harga Satuan, Stok Minimum, Spesifikasi */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Harga Satuan (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          type="number"
                          min="0"
                          value={newHargaSatuan}
                          onChange={(e) => setNewHargaSatuan(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Stok Minimum
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newStokMinimum}
                        onChange={(e) => setNewStokMinimum(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Spesifikasi / Merk
                      </label>
                      <input
                        type="text"
                        value={newSpesifikasi}
                        onChange={(e) => setNewSpesifikasi(e.target.value)}
                        placeholder="Contoh: Kimia Farma / Generic"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  {/* Gudang Tujuan & Jumlah Masuk Awal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-teal-50/50 p-3 rounded-xl border border-teal-100">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                        Gudang Tujuan Masuk *
                      </label>
                      <select
                        required
                        value={newWarehouseId}
                        onChange={(e) => setNewWarehouseId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                      >
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.namaGudang}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-teal-900 uppercase tracking-wide">
                        Jumlah Masuk Awal *
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          required
                          value={newQtyMasuk}
                          onChange={(e) => setNewQtyMasuk(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 text-sm font-black text-center bg-white border-2 border-teal-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-teal-950"
                        />
                        <span className="text-xs font-bold text-teal-800 shrink-0 w-12">
                          {newSatuan}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dokumen & Keterangan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                        <span>No. Dokumen / BAST</span>
                        <button
                          type="button"
                          onClick={handleGenerateDocNo}
                          className="text-[10px] text-teal-700 font-bold"
                        >
                          Auto
                        </button>
                      </label>
                      <input
                        type="text"
                        value={newDocNo}
                        onChange={(e) => setNewDocNo(e.target.value)}
                        placeholder="Contoh: BAST-2026/05/01"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Keterangan Penerimaan
                      </label>
                      <input
                        type="text"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="Contoh: Pengadaan Baru Puskesmas 2026..."
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 text-xs font-black text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Penerimaan Masuk</span>
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
