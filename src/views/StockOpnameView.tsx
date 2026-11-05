import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Building2, Search, Download, 
  Save, AlertTriangle, CheckCircle2, RefreshCw, X, Filter, Database
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { gasService } from '../services/gasService';
import { Warehouse, Item, WarehouseStock, User, Category } from '../types';
import { ExcelService } from '../services/excelService';

interface StockOpnameViewProps {
  currentUser: User | null;
  onRefreshStats: () => void;
}

export const StockOpnameView: React.FC<StockOpnameViewProps> = ({ currentUser, onRefreshStats }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [varianceFilter, setVarianceFilter] = useState<'ALL' | 'SELISIH' | 'SESUAI'>('ALL');

  // Opname Input Map: { [barangId]: { fisik: number; notes: string } }
  const [opnameInputs, setOpnameInputs] = useState<{ [barangId: string]: { fisik: number; notes: string } }>({});
  const [petugasOpname, setPetugasOpname] = useState(currentUser?.nama || 'Petugas Gudang');
  const [isSavingOpname, setIsSavingOpname] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const isSuperAdmin = currentUser?.role === 'ADMIN';
  const isPicBesar = currentUser?.role === 'PIC_GUDANG_BESAR';
  const isPicSub = currentUser?.role === 'PIC_SUB_GUDANG';
  const canOpname = isSuperAdmin || isPicBesar || isPicSub;
  const userAssignedWarehouse = currentUser ? storageService.resolveWarehouseForUser(currentUser) : null;

  const loadData = () => {
    const whs = storageService.getWarehouses();
    const itms = storageService.getItems();
    const stks = storageService.getStocks();
    const cats = storageService.getCategories();
    setWarehouses(whs);
    setItems(itms);
    setStocks(stks);
    setCategories(cats);

    if (!isSuperAdmin) {
      if (isPicBesar) {
        const gb = whs.find(w => w.tipeGudang === 'GUDANG_BESAR') || whs[0];
        setSelectedWarehouseId(gb.id);
      } else if (userAssignedWarehouse) {
        setSelectedWarehouseId(userAssignedWarehouse.id);
      }
    } else if (whs.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(whs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // When warehouse changes, initialize physical counts with system stock
  useEffect(() => {
    if (!selectedWarehouseId) return;
    const initial: { [barangId: string]: { fisik: number; notes: string } } = {};
    items.forEach(itm => {
      const stock = stocks.find(s => s.gudangId === selectedWarehouseId && s.barangId === itm.id);
      const saldo = stock ? stock.saldo : 0;
      initial[itm.id] = { fisik: saldo, notes: '' };
    });
    setOpnameInputs(initial);
  }, [selectedWarehouseId, items, stocks]);

  const currentWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  const handleFisikChange = (barangId: string, fisikVal: number) => {
    setOpnameInputs(prev => ({
      ...prev,
      [barangId]: {
        ...prev[barangId],
        fisik: isNaN(fisikVal) ? 0 : fisikVal
      }
    }));
  };

  const handleNotesChange = (barangId: string, notesVal: string) => {
    setOpnameInputs(prev => ({
      ...prev,
      [barangId]: {
        ...prev[barangId],
        notes: notesVal
      }
    }));
  };

  const handleSaveOpname = async () => {
    if (!selectedWarehouseId) return;

    setIsSavingOpname(true);
    let adjustedCount = 0;
    const opnameRef = `OPNAME/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;

    try {
      items.forEach(itm => {
        const currentStock = storageService.getStockByWarehouseAndItem(selectedWarehouseId, itm.id).saldo;
        const physical = opnameInputs[itm.id]?.fisik ?? currentStock;
        const diff = physical - currentStock;

        if (diff !== 0) {
          adjustedCount++;
          const notes = opnameInputs[itm.id]?.notes || 'Rekonsiliasi hasil Stock Opname Fisik';
          if (diff > 0) {
            storageService.recordTransaction(
              selectedWarehouseId,
              itm.id,
              'PENYESUAIAN_OPNAME',
              diff,
              0,
              `Selisih Lebih (+${diff}) Opname Fisik: ${notes}`,
              opnameRef
            );
          } else {
            storageService.recordTransaction(
              selectedWarehouseId,
              itm.id,
              'PENYESUAIAN_OPNAME',
              0,
              Math.abs(diff),
              `Selisih Kurang (${diff}) Opname Fisik: ${notes}`,
              opnameRef
            );
          }
        }
      });

      loadData();
      onRefreshStats();

      // Unggah & sinkronkan hasil opname langsung ke Google Spreadsheet
      let pushSuccess = false;
      let pushNote = '';
      try {
        const pushRes = await gasService.pushToSheets();
        if (pushRes.success) {
          pushSuccess = true;
          pushNote = 'dan tersimpan ke database Spreadsheet!';
        } else {
          pushNote = '(sinkronisasi otomatis ke Spreadsheet terjadwal)';
        }
      } catch (err: any) {
        pushNote = '(tersimpan lokal, antrean sinkronisasi aktif)';
      }

      const msg = adjustedCount > 0
        ? `✅ Rekonsiliasi Stock Opname berhasil di-update ${pushNote} (${adjustedCount} item disesuaikan).`
        : `✅ Hasil Stock Opname tersimpan ${pushNote}: Saldo fisik 100% cocok dengan saldo sistem.`;

      setToastMessage({ type: 'success', text: msg });
      setTimeout(() => setToastMessage(null), 5000);

    } catch (err: any) {
      setToastMessage({ type: 'error', text: `Gagal menyimpan opname: ${err?.message || 'Kesalahan sistem'}` });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsSavingOpname(false);
    }
  };

  // Filter items based on search query, category, and variance
  const filteredItems = items.filter(itm => {
    if (categoryFilter !== 'ALL' && itm.kategoriId !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match = 
        itm.namaBarang.toLowerCase().includes(q) ||
        itm.kodeBarang.toLowerCase().includes(q) ||
        (itm.merk && itm.merk.toLowerCase().includes(q)) ||
        (itm.spesifikasi && itm.spesifikasi.toLowerCase().includes(q)) ||
        (itm.kategoriNama && itm.kategoriNama.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (varianceFilter !== 'ALL') {
      const stock = stocks.find(s => s.gudangId === selectedWarehouseId && s.barangId === itm.id);
      const saldoSistem = stock ? stock.saldo : 0;
      const saldoFisik = opnameInputs[itm.id]?.fisik ?? saldoSistem;
      const isSelisih = saldoFisik !== saldoSistem;
      if (varianceFilter === 'SELISIH' && !isSelisih) return false;
      if (varianceFilter === 'SESUAI' && isSelisih) return false;
    }
    return true;
  });

  const handleExportExcel = () => {
    const rows = items.map((itm, idx) => {
      const stock = stocks.find(s => s.gudangId === selectedWarehouseId && s.barangId === itm.id);
      const sistem = stock ? stock.saldo : 0;
      const fisik = opnameInputs[itm.id]?.fisik ?? sistem;
      const selisih = fisik - sistem;

      return {
        'No': idx + 1,
        'Kode Barang': itm.kodeBarang,
        'Nama Barang': itm.namaBarang,
        'Kategori': itm.kategoriNama,
        'Gudang': currentWarehouse?.namaGudang,
        'Stok Sistem': sistem,
        'Stok Fisik Nyata': fisik,
        'Selisih (Fisik - Sistem)': selisih,
        'Satuan': itm.satuan,
        'Keterangan': opnameInputs[itm.id]?.notes || '-'
      };
    });

    ExcelService.exportToExcel(rows, `Stock_Opname_${currentWarehouse?.kodeGudang}`, 'Hasil Opname');
  };

  // Count items with variances
  let totalSelisihItem = 0;
  items.forEach(itm => {
    const stock = stocks.find(s => s.gudangId === selectedWarehouseId && s.barangId === itm.id);
    const sistem = stock ? stock.saldo : 0;
    const fisik = opnameInputs[itm.id]?.fisik ?? sistem;
    if (fisik !== sistem) totalSelisihItem++;
  });

  return (
    <div className="space-y-6">
      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-800">Pembatasan Akses Opname:</span>
            <span>Gudang-gudang Pustu hanya dapat meng-opname unit gudang penugasan sendiri. Hanya Super Admin yang dapat meng-opname semua gudang.</span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 shrink-0">
            {userAssignedWarehouse?.namaGudang || 'Sub Gudang'}
          </span>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div 
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
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : toastMessage.type === 'info' ? (
              <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Stock Opname Fisik & Rekonsiliasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pencocokan saldo pembukuan sistem dengan perhitungan fisik barang nyata di gudang &amp; sinkronisasi ke Spreadsheet.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
          {canOpname && (
            <button
              onClick={handleSaveOpname}
              disabled={isSavingOpname}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              {isSavingOpname ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Spreadsheet...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan &amp; Rekonsiliasi Saldo</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Warehouse Selector & Control Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-teal-700" /> Lokasi Gudang yang Di-Opname
          </label>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            disabled={!isSuperAdmin}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
          >
            {isSuperAdmin ? (
              warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.namaGudang}</option>
              ))
            ) : isPicBesar ? (
              warehouses.filter(w => w.tipeGudang === 'GUDANG_BESAR').map(w => (
                <option key={w.id} value={w.id}>{w.namaGudang}</option>
              ))
            ) : (
              userAssignedWarehouse && <option value={userAssignedWarehouse.id}>{userAssignedWarehouse.namaGudang}</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Petugas Pelaksana Opname
          </label>
          <input
            type="text"
            value={petugasOpname}
            onChange={(e) => setPetugasOpname(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-semibold"
          />
        </div>

        <div className="flex flex-col justify-end">
          <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
            totalSelisihItem > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <span>Status Selisih Fisik:</span>
            <span>{totalSelisihItem > 0 ? `⚠️ ${totalSelisihItem} Item Berselisih` : '✅ 100% Cocok Sesuai'}</span>
          </div>
        </div>
      </div>

      {/* Kolom Pencarian Barang & Filter Kategori Opname */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-teal-600/30 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="input-search-opname-barang" className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-700" />
            <span>Kolom Pencarian Barang Stok Opname Fisik</span>
          </label>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Cari cepat nama barang, kode barang, merk, atau spesifikasi
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Input Pencarian Utama */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-opname-barang"
              type="text"
              placeholder="Ketik nama barang atau kode barang untuk opname fisik (contoh: Amoxicillin, Spuit, Kertas...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 border border-slate-300 focus:border-teal-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:bg-white text-slate-800 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-200 transition-colors"
                title="Hapus kata kunci pencarian"
              >
                ✕ Hapus
              </button>
            )}
          </div>

          {/* Filter Kategori Barang */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 w-full sm:w-48 text-slate-700"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nama}</option>
              ))}
            </select>

            {/* Filter Status Selisih */}
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setVarianceFilter('ALL')}
                className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  varianceFilter === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setVarianceFilter('SELISIH')}
                className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  varianceFilter === 'SELISIH' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Selisih ({totalSelisihItem})
              </button>
              <button
                type="button"
                onClick={() => setVarianceFilter('SESUAI')}
                className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  varianceFilter === 'SESUAI' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sesuai
              </button>
            </div>
          </div>
        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Menampilkan <strong className="text-teal-800 font-bold">{filteredItems.length}</strong> dari <strong className="text-slate-800 font-semibold">{items.length}</strong> item barang opname
            {searchQuery && (
              <span className="ml-2 text-teal-700 font-medium">
                (Hasil filter: "{searchQuery}")
              </span>
            )}
          </div>
          {(searchQuery || categoryFilter !== 'ALL' || varianceFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setCategoryFilter('ALL'); setVarianceFilter('ALL'); }}
              className="text-teal-700 hover:underline font-semibold cursor-pointer"
            >
              Reset Filter Pencarian
            </button>
          )}
        </div>
      </div>

      {/* Opname Calculation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3">Kode &amp; Nama Barang</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-center">Saldo Sistem</th>
                <th className="px-4 py-3 text-center w-36">Hitungan Fisik Nyata</th>
                <th className="px-4 py-3 text-center">Selisih</th>
                <th className="px-4 py-3">Catatan / Keterangan</th>
              </tr>
              {/* Kolom Pencarian Langsung di Header Tabel */}
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-normal">
                <th className="p-1.5 text-center text-slate-400 font-normal">#</th>
                <th className="p-1.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari di kolom barang..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-6 py-1 bg-white border border-slate-300 rounded-lg text-xs font-normal text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600 placeholder:text-slate-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </th>
                <th className="p-1.5">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-normal text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">Semua</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </th>
                <th className="p-1.5 text-center text-[10px] text-slate-500 font-normal">Sistem</th>
                <th className="p-1.5 text-center text-[10px] text-teal-800 font-semibold">Input Fisik</th>
                <th className="p-1.5 text-center">
                  <select
                    value={varianceFilter}
                    onChange={(e) => setVarianceFilter(e.target.value as any)}
                    className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-normal text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">Semua</option>
                    <option value="SELISIH">Selisih</option>
                    <option value="SESUAI">Sesuai</option>
                  </select>
                </th>
                <th className="p-1.5 text-[10px] text-slate-400 font-normal">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">Tidak ada barang yang cocok dengan pencarian.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Coba gunakan kata kunci lain atau reset filter kategori.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((itm, idx) => {
                  const stock = stocks.find(s => s.gudangId === selectedWarehouseId && s.barangId === itm.id);
                  const saldoSistem = stock ? stock.saldo : 0;
                  const saldoFisik = opnameInputs[itm.id]?.fisik ?? saldoSistem;
                  const selisih = saldoFisik - saldoSistem;

                  return (
                  <tr key={`${itm.id}-${idx}`} className={`hover:bg-slate-50/80 transition-colors ${selisih !== 0 ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{itm.namaBarang}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{itm.kodeBarang}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {itm.kategoriNama}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {saldoSistem} <span className="text-[10px] font-normal text-slate-500">{itm.satuan}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={saldoFisik}
                        onChange={(e) => handleFisikChange(itm.id, parseInt(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-center font-bold text-xs bg-white border border-teal-400 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {selisih === 0 ? (
                        <span className="text-emerald-600 font-bold">0 (Cocok)</span>
                      ) : selisih > 0 ? (
                        <span className="text-emerald-700 font-black">+{selisih} (Lebih)</span>
                      ) : (
                        <span className="text-rose-600 font-black">{selisih} (Kurang)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Catatan bila ada selisih..."
                        value={opnameInputs[itm.id]?.notes || ''}
                        onChange={(e) => handleNotesChange(itm.id, e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
