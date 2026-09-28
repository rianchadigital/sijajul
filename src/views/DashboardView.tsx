import React, { useState, useEffect } from 'react';
import { 
  Package, AlertTriangle, AlertCircle, 
  FileText, Truck, ArrowUpRight, ArrowDownRight, 
  TrendingUp, Building2, Layers, 
  ChevronRight, Calendar, ArrowRight
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Warehouse, Item, WarehouseStock, ItemRequest, Dropping, StockTransaction, User } from '../types';
import { StatusBadge } from '../components/common/Badge';

interface DashboardViewProps {
  onNavigate: (viewId: string) => void;
  currentUser: User | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, currentUser }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [droppings, setDroppings] = useState<Dropping[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'HARI_INI' | 'BULAN_INI' | 'TAHUN_INI'>('BULAN_INI');

  useEffect(() => {
    setWarehouses(storageService.getWarehouses());
    setItems(storageService.getItems());
    setStocks(storageService.getStocks());
    setRequests(storageService.getRequests());
    setDroppings(storageService.getDroppings());
    setTransactions(storageService.getTransactions());
  }, []);

  // Metrics Calculations
  const totalItemsCount = items.length;
  const totalStockSum = stocks.reduce((acc, s) => acc + s.saldo, 0);

  // Group stocks by item to check critical status in any warehouse
  let lowStockCount = 0;
  let emptyStockCount = 0;

  // Let's evaluate stock status per warehouse
  stocks.forEach(stock => {
    const item = items.find(i => i.id === stock.barangId);
    if (!item) return;
    if (stock.saldo === 0) {
      emptyStockCount++;
    } else if (stock.saldo <= item.stokMinimum) {
      lowStockCount++;
    }
  });

  const pendingRequestsCount = requests.filter(r => r.status === 'DIAJUKAN' || r.status === 'DIPERIKSA').length;
  const waitingDroppingCount = requests.filter(r => r.status === 'DISETUJUI').length;
  const monthlyTrxCount = transactions.length;

  // Warehouse stocks summary
  const gudangBesar = warehouses.find(w => w.tipeGudang === 'GUDANG_BESAR') || warehouses[0];
  const subWarehouses = warehouses.filter(w => w.tipeGudang === 'SUB_GUDANG');

  const getWarehouseItemCount = (whId: string) => {
    return stocks.filter(s => s.gudangId === whId && s.saldo > 0).length;
  };

  const getWarehouseTotalUnits = (whId: string) => {
    return stocks.filter(s => s.gudangId === whId).reduce((acc, s) => acc + s.saldo, 0);
  };

  // Category Distribution
  const categories = storageService.getCategories();
  const categoryStats = categories.map(cat => {
    const catItems = items.filter(i => i.kategoriId === cat.id);
    const catItemIds = catItems.map(i => i.id);
    const catStock = stocks.filter(s => catItemIds.includes(s.barangId)).reduce((acc, s) => acc + s.saldo, 0);
    return {
      id: cat.id,
      name: cat.nama,
      code: cat.kode,
      itemCount: catItems.length,
      totalUnits: catStock
    };
  });

  // Top 5 Most Active / Used Items
  const itemUsageMap: Record<string, { name: string; kode: string; keluar: number; satuan: string }> = {};
  transactions.forEach(t => {
    if (!itemUsageMap[t.barangId]) {
      itemUsageMap[t.barangId] = { name: t.barangNama, kode: t.kodeBarang, keluar: 0, satuan: t.satuan };
    }
    itemUsageMap[t.barangId].keluar += t.keluar;
  });
  const topActiveItems = Object.values(itemUsageMap).sort((a, b) => b.keluar - a.keluar).slice(0, 5);

  // In vs Out Sum
  const totalMasukUnits = transactions.reduce((acc, t) => acc + t.masuk, 0);
  const totalKeluarUnits = transactions.reduce((acc, t) => acc + t.keluar, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white rounded-2xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-teal-700/80 text-teal-100 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-teal-600/50">
                Puskesmas Kepulauan Seribu Selatan
              </span>
              <span className="text-teal-200 text-xs flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> 27 Agustus 2026
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              SI JAJUL
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Sistem Informasi Jaga Stok dan Jalur Logistik Puskesmas Kepulauan Seribu Selatan — Pengelolaan Persediaan, Dropping Antar Pulau, BAST &amp; SBBK.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigate('permintaan')}
              className="bg-white hover:bg-teal-50 text-teal-900 font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-teal-700" /> Buat Permintaan
            </button>
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PIC_GUDANG_BESAR') && (
              <button
                onClick={() => onNavigate('approval')}
                className="bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all border border-teal-500 flex items-center gap-1.5"
              >
                Approval Permintaan ({pendingRequestsCount})
              </button>
            )}
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-teal-600/20 blur-2xl pointer-events-none"></div>
      </div>

      {/* 7 Core KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        {/* Total Barang */}
        <div 
          onClick={() => onNavigate('master-barang')} 
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Barang</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-100">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{totalItemsCount}</div>
          <p className="text-[10px] text-slate-500 mt-1">Jenis item aktif</p>
        </div>

        {/* Total Stok Seluruh Gudang */}
        <div 
          onClick={() => onNavigate('stok')} 
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Unit Stok</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{totalStockSum.toLocaleString()}</div>
          <p className="text-[10px] text-emerald-600 font-medium mt-1">5 Gudang Terdata</p>
        </div>

        {/* Stok Menipis */}
        <div 
          onClick={() => onNavigate('stok')} 
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Stok Menipis</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{lowStockCount}</div>
          <p className="text-[10px] text-amber-700 mt-1">Di bawah stok minimum</p>
        </div>

        {/* Stok Kosong */}
        <div 
          onClick={() => onNavigate('stok')} 
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Stok Kosong</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{emptyStockCount}</div>
          <p className="text-[10px] text-rose-700 mt-1">Perlu pengadaan</p>
        </div>

        {/* Permintaan Baru */}
        <div 
          onClick={() => onNavigate('approval')} 
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Permintaan Baru</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700">{pendingRequestsCount}</div>
          <p className="text-[10px] text-blue-600 mt-1">Menunggu approval</p>
        </div>

        {/* Menunggu Dropping */}
        <div 
          onClick={() => onNavigate('dropping')} 
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Siap Dropping</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">{waitingDroppingCount}</div>
          <p className="text-[10px] text-purple-600 mt-1">Siap dikirim kapal</p>
        </div>

        {/* Transaksi Bulan Ini */}
        <div 
          onClick={() => onNavigate('kartu-stok')} 
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Transaksi Bulan Ini</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-800">{monthlyTrxCount}</div>
          <p className="text-[10px] text-teal-600 mt-1">Mutasi persediaan</p>
        </div>
      </div>

      {/* STRUCTURE & VISUAL DISTRIBUTION FLOW HIERARCHY (Section 29 Prompt) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-800" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Struktur Hierarki & Distribusi Gudang Puskesmas
              </h2>
              <p className="text-xs text-slate-500">Pusat persediaan Gudang Besar mendistribusikan logistik ke 4 Sub Gudang Pulau</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('master-gudang')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            Kelola Gudang <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Hierarchy Visual Diagram */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          {/* Gudang Besar Center Box */}
          <div className="max-w-md mx-auto bg-gradient-to-r from-teal-800 to-teal-900 text-white rounded-xl p-4 shadow-md text-center border-2 border-teal-600">
            <div className="inline-block bg-teal-600/80 text-teal-100 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full mb-1">
              GUDANG BESAR (PUSAT)
            </div>
            <h3 className="font-extrabold text-sm sm:text-base">
              {gudangBesar?.namaGudang}
            </h3>
            <p className="text-xs text-teal-200 mt-0.5">PIC: {gudangBesar?.picNama}</p>
            <div className="mt-2.5 flex justify-center gap-4 text-xs bg-teal-950/50 py-1.5 px-3 rounded-lg">
              <span><strong>{getWarehouseItemCount(gudangBesar?.id || '')}</strong> Item Tersedia</span>
              <span>•</span>
              <span><strong>{getWarehouseTotalUnits(gudangBesar?.id || '').toLocaleString()}</strong> Total Unit</span>
            </div>
          </div>

          {/* Flow Arrows */}
          <div className="flex justify-center my-2 text-teal-700 text-xs font-bold items-center gap-1">
            <div className="h-4 w-0.5 bg-teal-400"></div>
          </div>
          <div className="text-center text-xs font-bold text-teal-800 mb-2">
            ↓ Alur Dropping & Distribusi Kapal Laut / Ambulans Laut ↓
          </div>

          {/* Sub Gudangs 4 Columns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {subWarehouses.map((wh) => {
              const itemCnt = getWarehouseItemCount(wh.id);
              const totalUnits = getWarehouseTotalUnits(wh.id);
              return (
                <div
                  key={wh.id}
                  onClick={() => onNavigate('stok')}
                  className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-mono text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded">
                      {wh.kodeGudang}
                    </span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                      Sub Gudang
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                    {wh.namaGudang}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    PIC: {wh.picNama}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Stok Tersedia:</span>
                    <span className="font-bold text-teal-800">{totalUnits.toLocaleString()} unit ({itemCnt} item)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Analytics: 2 Columns Grid (Category Distribution & In/Out / Top Items) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Kategori Barang Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-800" />
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Stok Berdasarkan Master Kategori
              </h3>
            </div>
            <button
              onClick={() => onNavigate('master-kategori')}
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              Lihat Kategori
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {categoryStats.map((cat) => {
              const percentage = totalStockSum > 0 ? Math.round((cat.totalUnits / totalStockSum) * 100) : 0;
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{cat.name} ({cat.itemCount} jenis)</span>
                    <span className="font-bold text-slate-900">{cat.totalUnits.toLocaleString()} unit ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-700 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: In vs Out + Top Active Items */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-800" />
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  Distribusi Barang & Penggunaan Terbanyak
                </h3>
              </div>
              <button
                onClick={() => onNavigate('laporan')}
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                Laporan Lengkap
              </button>
            </div>

            {/* In vs Out mini stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold mb-1">
                  <ArrowDownRight className="w-4 h-4 text-emerald-600" /> Total Barang Masuk
                </div>
                <div className="text-xl font-bold text-emerald-950">
                  {totalMasukUnits.toLocaleString()} unit
                </div>
                <span className="text-[10px] text-emerald-700">Penerimaan & Saldo Awal</span>
              </div>

              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="flex items-center gap-1.5 text-xs text-blue-800 font-semibold mb-1">
                  <ArrowUpRight className="w-4 h-4 text-blue-600" /> Total Barang Keluar
                </div>
                <div className="text-xl font-bold text-blue-950">
                  {totalKeluarUnits.toLocaleString()} unit
                </div>
                <span className="text-[10px] text-blue-700">Dropping & Pengeluaran</span>
              </div>
            </div>

            {/* Top 5 Items List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Top 5 Barang Paling Sering Digunakan
              </div>
              {topActiveItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.kode}</div>
                    </div>
                  </div>
                  <div className="font-bold text-slate-800 text-right">
                    {item.keluar} <span className="text-[11px] font-normal text-slate-500">{item.satuan}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Table: Recent Requests & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permintaan Terbaru */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-800" /> Status Permintaan Barang Terbaru
            </h3>
            <button
              onClick={() => onNavigate('permintaan')}
              className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-0.5"
            >
              Semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {requests.slice(0, 4).map((req) => (
              <div
                key={req.id}
                onClick={() => onNavigate('permintaan')}
                className="p-3 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-teal-50/30 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{req.nomorPermintaan}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {req.pemohonNama} • <strong>{req.gudangTujuanNama}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {req.items.length} jenis item diminta • {req.tanggalPermintaan}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Dropping & Distribusi Terakhir */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-800" /> Riwayat Dropping Logistik
            </h3>
            <button
              onClick={() => onNavigate('dropping')}
              className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-0.5"
            >
              Semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {droppings.slice(0, 4).map((drp) => (
              <div
                key={drp.id}
                onClick={() => onNavigate('dropping')}
                className="p-3 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-teal-50/30 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{drp.nomorDropping}</span>
                    <StatusBadge status={drp.status} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Tujuan: <strong>{drp.gudangTujuanNama}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    BAST: {drp.nomorBast || '-'} • Pengirim: {drp.petugasPengirimNama}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
