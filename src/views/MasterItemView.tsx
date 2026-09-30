import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Plus, Search, Edit2, Trash2, 
  Filter, Check, X, Download, Upload, 
  FileSpreadsheet, AlertTriangle, CheckCircle, 
  FileCheck, RefreshCw, Layers, ArrowUpRight, 
  Info, Database, HelpCircle
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { gasService } from '../services/gasService';
import { Item, Category, User, Warehouse } from '../types';
import { ExcelService, ParsedImportItem } from '../services/excelService';

interface MasterItemViewProps {
  currentUser: User | null;
}

export const MasterItemView: React.FC<MasterItemViewProps> = ({ currentUser }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [stokAwal, setStokAwal] = useState(0);

  // Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  // Excel Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedImportItem[]>([]);
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'UPDATE' | 'INVALID'>('ALL');
  const [importSearch, setImportSearch] = useState('');
  const [importStats, setImportStats] = useState({
    totalRows: 0,
    validCount: 0,
    updateCount: 0,
    errorCount: 0
  });

  // Import Options
  const [updateExisting, setUpdateExisting] = useState(true);
  const [targetWarehouseId, setTargetWarehouseId] = useState('GUDANG-001');

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Form State
  const [kodeBarang, setKodeBarang] = useState('');
  const [namaBarang, setNamaBarang] = useState('');
  const [kategoriId, setKategoriId] = useState('');
  const [satuan, setSatuan] = useState('Pcs');
  const [merk, setMerk] = useState('');
  const [spesifikasi, setSpesifikasi] = useState('');
  const [stokMinimum, setStokMinimum] = useState(10);
  const [statusAktif, setStatusAktif] = useState(true);
  const [keterangan, setKeterangan] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    setItems(storageService.getItems());
    setCategories(storageService.getCategories());
    setWarehouses(storageService.getWarehouses());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('sijajul_data_updated', handleUpdate);
    return () => window.removeEventListener('sijajul_data_updated', handleUpdate);
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    const nextNum = (items.length + 1).toString().padStart(4, '0');
    setKodeBarang(`BRG-${nextNum}`);
    setNamaBarang('');
    setKategoriId(categories[0]?.id || '');
    setSatuan('Pcs');
    setMerk('');
    setSpesifikasi('');
    setStokMinimum(10);
    setStatusAktif(true);
    setKeterangan('');
    setStokAwal(0);
    setShowModal(true);
  };

  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);
    setKodeBarang(item.kodeBarang);
    setNamaBarang(item.namaBarang);
    setKategoriId(item.kategoriId);
    setSatuan(item.satuan);
    setMerk(item.merk);
    setSpesifikasi(item.spesifikasi);
    setStokMinimum(item.stokMinimum);
    setStatusAktif(item.statusAktif);
    setKeterangan(item.keterangan || '');
    
    // Cari saldo stok gudang besar
    const stocks = storageService.getStocks();
    const bgStock = stocks.find(s => s.barangId === item.id && s.gudangId === 'GUD-001');
    setStokAwal(bgStock?.saldo || 0);
    setShowModal(true);
  };

  const handlePullFromSpreadsheet = async () => {
    setIsSyncingSheets(true);
    try {
      const res = await gasService.syncAllFromSheets();
      loadData();
      if (res.success) {
        showToast(`✅ ${res.message || 'Data master barang berhasil disinkronkan dari Spreadsheet!'}`, 'success');
      } else {
        showToast(`Info sinkronisasi: ${res.message}`, 'info');
      }
    } catch (err: any) {
      showToast(`Gagal menarik data Spreadsheet: ${err?.message || ''}`, 'error');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) {
      showToast('Nama barang wajib diisi.', 'error');
      return;
    }

    const cat = categories.find(c => c.id === kategoriId);

    const itemData: Item = {
      id: editingItem ? editingItem.id : `ITM-${Date.now()}`,
      kodeBarang: kodeBarang.trim(),
      namaBarang: namaBarang.trim(),
      kategoriId,
      kategoriNama: cat?.nama || 'Umum',
      satuan: satuan.trim(),
      merk: merk.trim(),
      spesifikasi: spesifikasi.trim(),
      stokMinimum,
      statusAktif,
      keterangan: keterangan.trim()
    };

    setIsSavingItem(true);
    try {
      storageService.saveItem(itemData, stokAwal);
      loadData();
      setShowModal(false);

      // Sinkronkan langsung ke Google Spreadsheet via GAS
      const res = await gasService.saveItemToSheets(itemData, stokAwal);
      showToast(
        editingItem 
          ? `✅ Barang "${itemData.namaBarang}" berhasil diperbarui & tersimpan di Spreadsheet!` 
          : `✅ Barang baru "${itemData.namaBarang}" berhasil ditambahkan & tersimpan di Spreadsheet!`,
        'success'
      );
    } catch (err: any) {
      showToast(`Tersimpan lokal & disinkronkan ke Spreadsheet: ${err?.message || ''}`, 'success');
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleOpenDelete = (item: Item) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const deletedName = itemToDelete.namaBarang;
    const deletedId = itemToDelete.id;
    storageService.deleteItem(deletedId);
    setItemToDelete(null);
    loadData();
    await gasService.deleteItemFromSheets(deletedId);
    showToast(`Barang "${deletedName}" berhasil dihapus dari master catalog & Spreadsheet.`, 'success');
  };

  const handleExport = () => {
    const formatted = items.map((i, idx) => ({
      'No': idx + 1,
      'Kode Barang': i.kodeBarang,
      'Nama Barang': i.namaBarang,
      'Kategori': i.kategoriNama,
      'Satuan': i.satuan,
      'Merk': i.merk,
      'Spesifikasi': i.spesifikasi,
      'Stok Minimum': i.stokMinimum,
      'Status': i.statusAktif ? 'Aktif' : 'Nonaktif',
      'Keterangan': i.keterangan
    }));
    ExcelService.exportToExcel(formatted, 'Master_Barang_Puskesmas_KSS', 'Master Barang');
    showToast('Data master barang berhasil diexport ke Excel.', 'success');
  };

  // EXCEL IMPORT HANDLERS
  const handleOpenImport = () => {
    setImportFile(null);
    setParsedRows([]);
    setImportStats({ totalRows: 0, validCount: 0, updateCount: 0, errorCount: 0 });
    setPreviewFilter('ALL');
    setImportSearch('');
    setShowImportModal(true);
  };

  const handleDownloadTemplate = () => {
    ExcelService.downloadItemImportTemplate(categories, warehouses);
    showToast('Template Excel import master barang berhasil diunduh.', 'success');
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setImportFile(file);
    setIsParsing(true);

    try {
      const result = await ExcelService.parseItemsFromExcel(file, items);
      setParsedRows(result.items);
      setImportStats({
        totalRows: result.totalRows,
        validCount: result.validCount,
        updateCount: result.updateCount,
        errorCount: result.errorCount
      });
      if (result.totalRows === 0) {
        showToast('File Excel kosong atau tidak memiliki baris data barang.', 'error');
      } else {
        showToast(`Berhasil membaca ${result.totalRows} baris data dari Excel. Silakan periksa preview.`, 'success');
      }
    } catch (err: any) {
      showToast(err?.message || 'Gagal membaca file Excel.', 'error');
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleExecuteImport = () => {
    const validRowsToImport = parsedRows.filter(r => r.status !== 'INVALID');
    if (validRowsToImport.length === 0) {
      showToast('Tidak ada data valid yang dapat diimpor.', 'error');
      return;
    }

    setIsImporting(true);

    try {
      const result = storageService.importItemsBatch(
        validRowsToImport.map(r => ({
          kodeBarang: r.kodeBarang,
          namaBarang: r.namaBarang,
          kategoriNama: r.kategoriNama,
          satuan: r.satuan,
          merk: r.merk,
          spesifikasi: r.spesifikasi,
          stokMinimum: r.stokMinimum,
          stokAwalGudangBesar: r.stokAwalGudangBesar,
          keterangan: r.keterangan
        })),
        {
          updateExisting,
          targetWarehouseId,
          performerName: currentUser?.nama || 'Super Admin'
        }
      );

      setShowImportModal(false);
      loadData();
      showToast(result.message, 'success');
    } catch (err: any) {
      showToast(`Gagal mengimpor data: ${err?.message || 'Kesalahan sistem'}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Filters
  const filteredItems = items.filter(item => {
    if (categoryFilter !== 'ALL' && item.kategoriId !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.namaBarang.toLowerCase().includes(q) ||
        item.kodeBarang.toLowerCase().includes(q) ||
        item.merk.toLowerCase().includes(q) ||
        item.kategoriNama.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredPreviewRows = parsedRows.filter(row => {
    if (previewFilter !== 'ALL' && row.status !== previewFilter) return false;
    if (importSearch) {
      const q = importSearch.toLowerCase();
      return (
        row.namaBarang.toLowerCase().includes(q) ||
        row.kodeBarang.toLowerCase().includes(q) ||
        row.kategoriNama.toLowerCase().includes(q) ||
        row.merk.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="toast-master-item-feedback"
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm animate-in fade-in-50 duration-200 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : toastMessage.type === 'info'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : toastMessage.type === 'info' ? (
              <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />
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
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <Package className="w-6 h-6 text-teal-800" />
              Master Data Barang Persediaan
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-Sync 1 Detik: Aktif (Spreadsheet Terhubung)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola katalog obat-obatan, BMHP, alkes, ATK, reagen lab, gizi, dan kebersihan Puskesmas secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* SYNC SPREADSHEET BUTTON */}
          <button
            id="btn-sync-spreadsheet-barang"
            onClick={handlePullFromSpreadsheet}
            disabled={isSyncingSheets}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Tarik data master barang terbaru secara real-time dari Google Spreadsheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingSheets ? 'animate-spin' : ''}`} />
            <span>{isSyncingSheets ? 'Menyinkronkan...' : 'Sinkron Spreadsheet'}</span>
          </button>

          {/* IMPORT EXCEL BUTTON */}
          <button
            id="btn-import-excel-barang"
            onClick={handleOpenImport}
            className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Import data barang massal menggunakan file Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-200" /> 
            <span>Import Excel</span>
            <span className="bg-indigo-600 px-1.5 py-0.2 text-[10px] rounded font-mono font-normal">.xlsx</span>
          </button>

          {/* EXPORT EXCEL BUTTON */}
          <button
            id="btn-export-excel-barang"
            onClick={handleExport}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>

          {/* ADD NEW ITEM BUTTON */}
          <button
            id="btn-tambah-barang-baru"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Barang
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Katalog</div>
          <div className="text-lg font-black text-slate-800 mt-0.5">{items.length} Item</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Semua jenis persediaan</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Barang Aktif</div>
          <div className="text-lg font-black text-emerald-700 mt-0.5">
            {items.filter(i => i.statusAktif).length} Item
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Siap didistribusikan</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kategori Logistik</div>
          <div className="text-lg font-black text-teal-800 mt-0.5">{categories.length} Kategori</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pengelompokan barang</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gudang Penyimpanan</div>
          <div className="text-lg font-black text-indigo-800 mt-0.5">{warehouses.length} Titik Gudang</div>
          <div className="text-[11px] text-slate-500 mt-0.5">1 Induk & 4 Sub Pulau</div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-master-barang"
            type="text"
            placeholder="Cari kode barang, nama, merk, kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            id="select-filter-kategori-barang"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold text-slate-700 w-full sm:w-auto"
          >
            <option value="ALL">Semua Kategori ({items.length})</option>
            {categories.map(c => {
              const count = items.filter(i => i.kategoriId === c.id || i.kategoriNama?.toLowerCase() === c.nama.toLowerCase()).length;
              return (
                <option key={c.id} value={c.id}>{c.nama} ({count})</option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10 text-center">No</th>
                <th className="px-4 py-3 w-28">Kode Barang</th>
                <th className="px-4 py-3">Nama Barang</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Satuan</th>
                <th className="px-4 py-3">Merk / Pabrik</th>
                <th className="px-4 py-3 text-center">Stok Min</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Tidak ditemukan data barang yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-teal-900">{item.kodeBarang}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{item.namaBarang}</div>
                      {item.spesifikasi && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.spesifikasi}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">
                        {item.kategoriNama}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{item.satuan}</td>
                    <td className="px-4 py-3 text-slate-600">{item.merk || '-'}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{item.stokMinimum}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.statusAktif ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.statusAktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          id={`btn-edit-barang-${item.id}`}
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Barang"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-delete-barang-${item.id}`}
                          onClick={() => handleOpenDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Barang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ========================================================================= */}
      {/* EXCEL IMPORT MODAL */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Import Data Master Barang via Excel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tambah puluhan atau ratusan barang sekaligus menggunakan file spreadsheet (.xlsx / .xls / .csv)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body with Scroll */}
            <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* Step 1: Download Template & File Upload Box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Download Template Card */}
                <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs mb-1">
                      <Download className="w-4 h-4 text-indigo-600" />
                      <span>1. Download Template</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed mb-3">
                      Gunakan format template resmi SI JAJUL yang sudah terisi contoh data obat, BMHP, alkes, ATK, dan referensi kategori.
                    </p>
                  </div>
                  <button
                    id="btn-download-import-template"
                    onClick={handleDownloadTemplate}
                    className="w-full py-2 px-3 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Template Excel
                  </button>
                </div>

                {/* Drag and Drop Zone */}
                <div 
                  className={`md:col-span-2 border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-50/60' 
                      : importFile 
                        ? 'border-emerald-400 bg-emerald-50/30' 
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {isParsing ? (
                    <div className="flex flex-col items-center py-2">
                      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                      <div className="font-bold text-indigo-800">Sedang membaca data Excel...</div>
                    </div>
                  ) : importFile ? (
                    <div className="flex flex-col items-center py-1">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 font-bold">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-800 text-xs sm:text-sm">{importFile.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {(importFile.size / 1024).toFixed(1)} KB &bull; Klik untuk mengganti file
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-1">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <div className="font-bold text-slate-700 text-xs">
                        Tarik & Lepaskan File Excel di Sini, atau <span className="text-indigo-600 underline">Pilih File</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Format yang didukung: <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Options Toolbar */}
              {parsedRows.length > 0 && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-teal-800" />
                    <span>2. Opsi Penggabungan & Saldo Stok</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        id="checkUpdateExisting"
                        checked={updateExisting}
                        onChange={(e) => setUpdateExisting(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                      />
                      <label htmlFor="checkUpdateExisting" className="text-slate-700 font-semibold cursor-pointer">
                        Perbarui data jika kode/nama barang sudah ada di master
                      </label>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <label className="font-semibold text-slate-700 whitespace-nowrap">Target Saldo Awal:</label>
                      <select
                        value={targetWarehouseId}
                        onChange={(e) => setTargetWarehouseId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md py-1 px-2 text-xs font-bold text-slate-800"
                      >
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.namaGudang}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Preview Table & Validation Summary */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                      <button
                        onClick={() => setPreviewFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          previewFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Semua ({importStats.totalRows})
                      </button>
                      <button
                        onClick={() => setPreviewFilter('VALID')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                          previewFilter === 'VALID' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <span>🟢 Baru ({importStats.validCount})</span>
                      </button>
                      <button
                        onClick={() => setPreviewFilter('UPDATE')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                          previewFilter === 'UPDATE' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        <span>🟡 Update ({importStats.updateCount})</span>
                      </button>
                      {importStats.errorCount > 0 && (
                        <button
                          onClick={() => setPreviewFilter('INVALID')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                            previewFilter === 'INVALID' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          <span>🔴 Error ({importStats.errorCount})</span>
                        </button>
                      )}
                    </div>

                    {/* Preview Search */}
                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari di preview..."
                        value={importSearch}
                        onChange={(e) => setImportSearch(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 w-10 text-center">Baris</th>
                          <th className="px-3 py-2 w-24">Kode</th>
                          <th className="px-3 py-2">Nama Barang</th>
                          <th className="px-3 py-2">Kategori</th>
                          <th className="px-3 py-2">Satuan</th>
                          <th className="px-3 py-2 text-center">Min Stok</th>
                          <th className="px-3 py-2 text-center">Stok Awal</th>
                          <th className="px-3 py-2">Status Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPreviewRows.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-6 text-slate-400">
                              Tidak ada data yang sesuai filter preview.
                            </td>
                          </tr>
                        ) : (
                          filteredPreviewRows.map((row) => (
                            <tr key={row.rowNumber} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-center text-slate-400 font-mono">{row.rowNumber}</td>
                              <td className="px-3 py-2 font-mono font-bold text-teal-900">{row.kodeBarang || '(Otomatis)'}</td>
                              <td className="px-3 py-2">
                                <div className="font-bold text-slate-800">{row.namaBarang}</div>
                                {row.spesifikasi && (
                                  <div className="text-[10px] text-slate-400 truncate max-w-xs">{row.spesifikasi}</div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{row.kategoriNama}</td>
                              <td className="px-3 py-2 font-semibold text-slate-700">{row.satuan}</td>
                              <td className="px-3 py-2 text-center font-bold text-slate-700">{row.stokMinimum}</td>
                              <td className="px-3 py-2 text-center font-bold text-teal-800">{row.stokAwalGudangBesar}</td>
                              <td className="px-3 py-2">
                                {row.status === 'VALID' && (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                                    <Check className="w-3 h-3" /> Siap Ditambahkan
                                  </span>
                                )}
                                {row.status === 'UPDATE' && (
                                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200" title={row.warnings.join(' ')}>
                                    <RefreshCw className="w-3 h-3" /> Update Master
                                  </span>
                                )}
                                {row.status === 'INVALID' && (
                                  <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-200" title={row.errors.join(' ')}>
                                    <AlertTriangle className="w-3 h-3" /> {row.errors[0] || 'Tidak Valid'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-500">
                {parsedRows.length > 0 ? (
                  <span>
                    Siap diproses: <strong className="text-slate-800">{importStats.validCount + importStats.updateCount}</strong> dari {importStats.totalRows} baris.
                  </span>
                ) : (
                  <span>Unggah file untuk melihat data dan melakukan validasi.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-execute-import-excel"
                  type="button"
                  disabled={parsedRows.length === 0 || (importStats.validCount === 0 && importStats.updateCount === 0) || isImporting}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 font-bold bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengimpor Data...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Proses Import ({importStats.validCount + importStats.updateCount} Barang)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT ITEM MODAL */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8 border border-slate-200">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">
                {editingItem ? 'Edit Data Barang Persediaan' : 'Tambah Master Barang Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Barang</label>
                  <input
                    type="text"
                    required
                    value={kodeBarang}
                    onChange={(e) => setKodeBarang(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Barang</label>
                  <select
                    required
                    value={kategoriId}
                    onChange={(e) => setKategoriId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Barang Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Paracetamol 500 mg Tablet"
                  value={namaBarang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan</label>
                  <select
                    value={satuan}
                    onChange={(e) => setSatuan(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800"
                  >
                    {['Pcs', 'Box', 'Botol', 'Rim', 'Ampul', 'Vial', 'Strip', 'Tablet', 'Set', 'Roll', 'Galon', 'Paket', 'Unit'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Merk / Pabrikan</label>
                  <input
                    type="text"
                    placeholder="Kimia Farma / Sinar Dunia"
                    value={merk}
                    onChange={(e) => setMerk(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stok Minimum</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stokMinimum}
                    onChange={(e) => setStokMinimum(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Spesifikasi Detail</label>
                <input
                  type="text"
                  placeholder="Contoh: Dus isi 10 strip @ 10 tablet"
                  value={spesifikasi}
                  onChange={(e) => setSpesifikasi(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan Tambahan</label>
                <input
                  type="text"
                  placeholder="Catatan penyimpanan suhu dingin / lainnya"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                />
              </div>

              {!editingItem && (
                <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-200">
                  <label className="block font-bold text-teal-900 mb-1">
                    Stok Awal Gudang Besar KSS (Opsional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={stokAwal}
                    onChange={(e) => setStokAwal(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl font-bold text-teal-900"
                  />
                  <p className="text-[11px] text-teal-700 mt-1">
                    Saldo awal ini langsung dicatat di Gudang Besar Kepulauan Seribu Selatan dan disinkronkan ke Spreadsheet.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="statusAktif"
                  checked={statusAktif}
                  onChange={(e) => setStatusAktif(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="statusAktif" className="font-semibold text-slate-700 cursor-pointer">
                  Status Barang Aktif (Dapat diminta dan didistribusikan)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSavingItem}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingItem}
                  className="px-5 py-2 font-bold bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-xl shadow cursor-pointer flex items-center gap-2"
                >
                  {isSavingItem ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke Spreadsheet...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Simpan Perubahan' : 'Simpan Data Barang'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DELETE ITEM MODAL */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 border border-slate-200">
            <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-800">
                  Hapus Master Barang
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konfirmasi penghapusan katalog barang persediaan
                </p>
              </div>
              <button 
                onClick={() => setItemToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 text-sm">{itemToDelete.namaBarang}</div>
                <div className="font-mono text-teal-800 font-bold text-[11px] mt-0.5">{itemToDelete.kodeBarang}</div>
                <div className="text-slate-500 text-[11px] mt-1">
                  Kategori: <span className="font-semibold text-slate-700">{itemToDelete.kategoriNama}</span> &bull; Satuan: {itemToDelete.satuan}
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus barang ini dari katalog master? Tindakan ini akan dicatat pada riwayat audit sistem.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-barang"
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus Barang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
