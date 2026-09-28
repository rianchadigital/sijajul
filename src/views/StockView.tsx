import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Plus, 
  CreditCard, RefreshCw, AlertTriangle
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Warehouse, Category, Item, WarehouseStock, User } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { ExcelService } from '../services/excelService';
import { PdfService } from '../services/pdfService';

interface StockViewProps {
  onNavigate: (viewId: string) => void;
  currentUser: User | null;
}

export const StockView: React.FC<StockViewProps> = ({ onNavigate, currentUser }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AMAN' | 'MENIPIS' | 'KOSONG'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Adjustment State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustItem, setAdjustItem] = useState<{ itemId: string; warehouseId: string; currentBalance: number; itemName: string; warehouseName: string; satuan: string } | null>(null);
  const [adjustType, setAdjustType] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  const loadData = () => {
    setWarehouses(storageService.getWarehouses());
    setCategories(storageService.getCategories());
    setItems(storageService.getItems());
    setStocks(storageService.getStocks());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('sijajul_data_updated', handleUpdate);
    return () => window.removeEventListener('sijajul_data_updated', handleUpdate);
  }, []);

  // Filter items and prepare display records
  const filteredRecords = items.flatMap(item => {
    // If specific category selected
    if (selectedCategoryId !== 'ALL' && item.kategoriId !== selectedCategoryId) {
      return [];
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = item.namaBarang.toLowerCase().includes(q) || 
                    item.kodeBarang.toLowerCase().includes(q) || 
                    item.merk.toLowerCase().includes(q);
      if (!match) return [];
    }

    // Determine which warehouses to list
    const targetWarehouses = selectedWarehouseId === 'ALL' 
      ? warehouses 
      : warehouses.filter(w => w.id === selectedWarehouseId);

    return targetWarehouses.map(wh => {
      const stock = stocks.find(s => s.gudangId === wh.id && s.barangId === item.id) || {
        id: `STK-${wh.id}-${item.id}`,
        gudangId: wh.id,
        barangId: item.id,
        stokAwal: 0,
        stokMasuk: 0,
        stokKeluar: 0,
        saldo: 0,
        updateTerakhir: '-'
      };

      let status = 'AMAN';
      if (stock.saldo === 0) status = 'KOSONG';
      else if (stock.saldo <= item.stokMinimum) status = 'MENIPIS';

      return {
        item,
        warehouse: wh,
        stock,
        status
      };
    });
  }).filter(record => {
    if (statusFilter !== 'ALL' && record.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleOpenAdjust = (rec: any) => {
    setAdjustItem({
      itemId: rec.item.id,
      warehouseId: rec.warehouse.id,
      currentBalance: rec.stock.saldo,
      itemName: rec.item.namaBarang,
      warehouseName: rec.warehouse.namaGudang,
      satuan: rec.item.satuan
    });
    setAdjustQty(1);
    setAdjustNotes('');
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;

    try {
      if (adjustType === 'MASUK') {
        storageService.recordTransaction(
          adjustItem.warehouseId,
          adjustItem.itemId,
          'PENGELUARAN_LANGSUNG', // or penyesuaian
          adjustQty,
          0,
          `Penyesuaian stok masuk manual: ${adjustNotes || 'Penyesuaian fisik'}`
        );
      } else {
        storageService.recordTransaction(
          adjustItem.warehouseId,
          adjustItem.itemId,
          'PENGELUARAN_LANGSUNG',
          0,
          adjustQty,
          `Penyesuaian stok keluar manual: ${adjustNotes || 'Pengeluaran/kerusakan'}`
        );
      }

      setShowAdjustModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan penyesuaian');
    }
  };

  const handleExportExcel = () => {
    const formatted = filteredRecords.map(r => ({
      kodeBarang: r.item.kodeBarang,
      namaBarang: r.item.namaBarang,
      kategoriNama: r.item.kategoriNama,
      namaGudang: r.warehouse.namaGudang,
      saldo: r.stock.saldo,
      satuan: r.item.satuan,
      stokMinimum: r.item.stokMinimum,
      statusStok: r.status,
      updateTerakhir: r.stock.updateTerakhir
    }));
    ExcelService.exportStockReport(formatted);
  };

  const handleExportPdf = () => {
    const formatted = filteredRecords.map(r => ({
      kode: r.item.kodeBarang,
      nama: r.item.namaBarang,
      kategori: r.item.kategoriNama,
      gudang: r.warehouse.namaGudang,
      saldo: r.stock.saldo,
      satuan: r.item.satuan,
      min: r.item.stokMinimum,
      status: r.status
    }));
    const doc = PdfService.generateInventoryReportPdf('Laporan Stok Persediaan Multi Gudang', 'Agustus 2026', formatted);
    doc.save(`Laporan_Stok_Puskesmas_KSS_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const canAdjust = currentUser?.role === 'ADMIN' || currentUser?.role === 'PIC_GUDANG_BESAR';

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Stok Persediaan Multi Gudang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoring posisi saldo stok fisik di Gudang Besar dan seluruh Sub Gudang Pulau.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, kode, merk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
            />
          </div>

          {/* Gudang Filter */}
          <div>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white font-medium text-slate-700"
            >
              <option value="ALL">Semua Gudang (Multi Gudang)</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.namaGudang}</option>
              ))}
            </select>
          </div>

          {/* Kategori Filter */}
          <div>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white font-medium text-slate-700"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nama}</option>
              ))}
            </select>
          </div>

          {/* Status Stok Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white font-medium text-slate-700"
            >
              <option value="ALL">Semua Status Stok</option>
              <option value="AMAN">🟢 Stok Aman</option>
              <option value="MENIPIS">🟡 Stok Menipis</option>
              <option value="KOSONG">🔴 Stok Habis (0)</option>
            </select>
          </div>
        </div>

        {/* Filter Badges & Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Menampilkan <strong>{filteredRecords.length}</strong> catatan stok barang</span>
          <button 
            onClick={loadData} 
            className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3">Kode & Nama Barang</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Gudang</th>
                <th className="px-4 py-3 text-center">Stok Minimum</th>
                <th className="px-4 py-3 text-right">Saldo Tersedia</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Tidak ditemukan data stok yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <tr key={`${record.warehouse.id}-${record.item.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{record.item.namaBarang}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span className="text-teal-700 font-semibold">{record.item.kodeBarang}</span>
                        {record.item.merk && <span>• Merk: {record.item.merk}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                        {record.item.kategoriNama}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{record.warehouse.namaGudang}</div>
                      <div className="text-[10px] text-slate-400">{record.warehouse.tipeGudang === 'GUDANG_BESAR' ? 'Gudang Pusat' : 'Sub Gudang'}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-600">
                      {record.item.stokMinimum} {record.item.satuan}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-sm">
                      <span className={record.stock.saldo === 0 ? 'text-rose-600' : (record.stock.saldo <= record.item.stokMinimum ? 'text-amber-600' : 'text-slate-900')}>
                        {record.stock.saldo.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-normal text-slate-500 ml-1">{record.item.satuan}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onNavigate('kartu-stok')}
                          title="Lihat Kartu Stok"
                          className="p-1.5 bg-slate-100 hover:bg-teal-100 hover:text-teal-800 text-slate-600 rounded-lg transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        {canAdjust && (
                          <button
                            onClick={() => handleOpenAdjust(record)}
                            title="Penyesuaian Stok Cepat"
                            className="p-1.5 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-700 rounded-lg transition-colors font-bold text-xs"
                          >
                            Adjust
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Quick Adjust */}
      {showAdjustModal && adjustItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Penyesuaian Saldo Stok Manual
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pencatatan langsung perubahan saldo pada buku transaksi stok.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 text-xs space-y-1">
              <div>Barang: <strong>{adjustItem.itemName}</strong></div>
              <div>Gudang: <strong>{adjustItem.warehouseName}</strong></div>
              <div>Saldo Saat Ini: <strong className="text-teal-800">{adjustItem.currentBalance} {adjustItem.satuan}</strong></div>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Penyesuaian</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('MASUK')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                      adjustType === 'MASUK' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    + Tambah Stok (Masuk)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('KELUAR')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                      adjustType === 'KELUAR' 
                        ? 'bg-rose-50 border-rose-500 text-rose-800' 
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    - Kurangi Stok (Keluar)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Penyesuaian ({adjustItem.satuan})
                </label>
                <input
                  type="number"
                  min="1"
                  max={adjustType === 'KELUAR' ? adjustItem.currentBalance : 9999}
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan / Keterangan Penyesuaian
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Koreksi selisih fisik / barang rusak"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white rounded-xl shadow"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
