import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Printer, Filter, 
  Calendar, Building2, Layers, Search, Eye, FileText 
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Warehouse, Category, Item, WarehouseStock, StockTransaction, ItemRequest, Dropping, User } from '../types';
import { ExcelService } from '../services/excelService';
import { PdfService } from '../services/pdfService';
import { KopSurat } from '../components/common/KopSurat';

interface ReportsViewProps {
  currentUser: User | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ currentUser }) => {
  const [reportType, setReportType] = useState<string>('STOK_SEMUA');
  const [period, setPeriod] = useState<'HARI_INI' | 'MINGGU_INI' | 'BULAN_INI' | 'TAHUN_INI'>('BULAN_INI');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [droppings, setDroppings] = useState<Dropping[]>([]);

  useEffect(() => {
    setWarehouses(storageService.getWarehouses());
    setCategories(storageService.getCategories());
    setItems(storageService.getItems());
    setStocks(storageService.getStocks());
    setTransactions(storageService.getTransactions());
    setRequests(storageService.getRequests());
    setDroppings(storageService.getDroppings());
  }, []);

  const reportTitles: Record<string, string> = {
    'STOK_SEMUA': 'Laporan Stok Persediaan Semua Gudang',
    'STOK_GUDANG': 'Laporan Stok per Unit Gudang',
    'MASUK': 'Laporan Penerimaan Barang Masuk',
    'KELUAR': 'Laporan Pengeluaran & Distribusi Barang Keluar',
    'PERMINTAAN': 'Laporan Permintaan Barang & Realisasi Approval',
    'DROPPING': 'Laporan Rekapitulasi Dropping Logistik',
    'KRITIS': 'Laporan Stok Menipis & Kritis (Di Bawah Stok Minimum)',
    'KATEGORI': 'Laporan Rekapitulasi Nilai & Stok per Kategori'
  };

  // Generate dynamic report data based on selected type
  const getReportRows = () => {
    switch (reportType) {
      case 'STOK_SEMUA':
      case 'STOK_GUDANG': {
        const targetWhs = selectedWarehouseId === 'ALL' ? warehouses : warehouses.filter(w => w.id === selectedWarehouseId);
        return items.flatMap(item => {
          if (selectedCategoryId !== 'ALL' && item.kategoriId !== selectedCategoryId) return [];
          return targetWhs.map(wh => {
            const stock = stocks.find(s => s.gudangId === wh.id && s.barangId === item.id);
            const saldo = stock ? stock.saldo : 0;
            return {
              col1: item.kodeBarang,
              col2: item.namaBarang,
              col3: item.kategoriNama,
              col4: wh.namaGudang,
              col5: saldo,
              col6: item.satuan,
              col7: item.stokMinimum,
              col8: saldo === 0 ? 'Habis (0)' : (saldo <= item.stokMinimum ? 'Menipis' : 'Aman')
            };
          });
        });
      }
      case 'MASUK': {
        return transactions.filter(t => t.masuk > 0).map(t => ({
          col1: t.tanggal,
          col2: t.nomorTransaksi,
          col3: t.gudangNama,
          col4: t.barangNama,
          col5: t.masuk,
          col6: t.satuan,
          col7: t.userNama,
          col8: t.keterangan
        }));
      }
      case 'KELUAR': {
        return transactions.filter(t => t.keluar > 0).map(t => ({
          col1: t.tanggal,
          col2: t.nomorTransaksi,
          col3: t.gudangNama,
          col4: t.barangNama,
          col5: t.keluar,
          col6: t.satuan,
          col7: t.userNama,
          col8: t.keterangan
        }));
      }
      case 'PERMINTAAN': {
        return requests.map(r => ({
          col1: r.nomorPermintaan,
          col2: r.tanggalPermintaan,
          col3: r.pemohonNama,
          col4: r.gudangTujuanNama,
          col5: `${r.items.length} item`,
          col6: r.status,
          col7: r.approverNama || '-',
          col8: r.catatanPemohon || '-'
        }));
      }
      case 'DROPPING': {
        return droppings.map(d => ({
          col1: d.nomorDropping,
          col2: d.tanggalDropping,
          col3: d.gudangTujuanNama,
          col4: d.petugasPengirimNama,
          col5: `${d.items.length} item`,
          col6: d.status,
          col7: d.nomorBast || '-',
          col8: d.catatan || '-'
        }));
      }
      case 'KRITIS': {
        return items.flatMap(item => {
          return warehouses.map(wh => {
            const stock = stocks.find(s => s.gudangId === wh.id && s.barangId === item.id);
            const saldo = stock ? stock.saldo : 0;
            if (saldo > item.stokMinimum) return null;
            return {
              col1: item.kodeBarang,
              col2: item.namaBarang,
              col3: item.kategoriNama,
              col4: wh.namaGudang,
              col5: saldo,
              col6: item.satuan,
              col7: item.stokMinimum,
              col8: saldo === 0 ? 'KOSONG' : 'MENIPIS'
            };
          }).filter(Boolean);
        });
      }
      case 'KATEGORI': {
        return categories.map(cat => {
          const catItems = items.filter(i => i.kategoriId === cat.id);
          const catItemIds = catItems.map(i => i.id);
          const catTotalStock = stocks.filter(s => catItemIds.includes(s.barangId)).reduce((acc, s) => acc + s.saldo, 0);
          return {
            col1: cat.kode,
            col2: cat.nama,
            col3: `${catItems.length} jenis item`,
            col4: 'Semua Gudang',
            col5: catTotalStock,
            col6: 'Unit',
            col7: '-',
            col8: 'Aktif'
          };
        });
      }
      default:
        return [];
    }
  };

  const rows = getReportRows();

  const getTableHeaders = () => {
    switch (reportType) {
      case 'STOK_SEMUA':
      case 'STOK_GUDANG':
      case 'KRITIS':
        return ['Kode Barang', 'Nama Barang Persediaan', 'Kategori', 'Gudang', 'Saldo', 'Satuan', 'Stok Min', 'Status'];
      case 'MASUK':
      case 'KELUAR':
        return ['Tanggal', 'No Transaksi', 'Lokasi Gudang', 'Nama Barang', 'Jumlah', 'Satuan', 'Petugas', 'Keterangan'];
      case 'PERMINTAAN':
        return ['No Permintaan', 'Tanggal', 'Nama Pemohon', 'Gudang Tujuan', 'Jumlah Item', 'Status', 'Approver', 'Catatan'];
      case 'DROPPING':
        return ['No Dropping', 'Tanggal', 'Tujuan Sub Gudang', 'Pengirim', 'Jumlah Item', 'Status', 'No BAST', 'Keterangan'];
      case 'KATEGORI':
        return ['Kode Kategori', 'Nama Kategori Barang', 'Jumlah Jenis Item', 'Lingkup', 'Total Saldo', 'Satuan', '-', 'Status'];
      default:
        return ['Kolom 1', 'Kolom 2', 'Kolom 3', 'Kolom 4', 'Kolom 5', 'Kolom 6', 'Kolom 7', 'Kolom 8'];
    }
  };

  const headers = getTableHeaders();

  const handleExportExcel = () => {
    const formatted = rows.map((r: any, idx: number) => ({
      'No': idx + 1,
      [headers[0]]: r.col1,
      [headers[1]]: r.col2,
      [headers[2]]: r.col3,
      [headers[3]]: r.col4,
      [headers[4]]: r.col5,
      [headers[5]]: r.col6,
      [headers[6]]: r.col7,
      [headers[7]]: r.col8,
    }));
    ExcelService.exportToExcel(formatted, reportTitles[reportType].replace(/\s+/g, '_'), 'Laporan');
  };

  const handleExportPdf = () => {
    const pdfData = rows.map((r: any) => ({
      kode: String(r.col1),
      nama: String(r.col2),
      kategori: String(r.col3),
      gudang: String(r.col4),
      saldo: typeof r.col5 === 'number' ? r.col5 : 0,
      satuan: String(r.col6),
      min: typeof r.col7 === 'number' ? r.col7 : 0,
      status: String(r.col8)
    }));
    const doc = PdfService.generateInventoryReportPdf(reportTitles[reportType], 'Agustus 2026', pdfData);
    doc.save(`${reportTitles[reportType].replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Laporan Persediaan & Distribusi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ekspor laporan resmi Puskesmas Kepulauan Seribu Selatan format Excel dan PDF standar Dinas Kesehatan.
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
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak
          </button>
        </div>
      </div>

      {/* Report Controls Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Report Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
            Pilih Jenis Laporan
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'STOK_SEMUA', label: '1. Stok Semua Gudang' },
              { id: 'STOK_GUDANG', label: '2. Stok per Gudang' },
              { id: 'MASUK', label: '3. Barang Masuk' },
              { id: 'KELUAR', label: '4. Barang Keluar' },
              { id: 'PERMINTAAN', label: '5. Permintaan Barang' },
              { id: 'DROPPING', label: '6. Dropping / Distribusi' },
              { id: 'KRITIS', label: '7. Stok Menipis/Kritis' },
              { id: 'KATEGORI', label: '8. Rekap per Kategori' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setReportType(item.id)}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                  reportType === item.id
                    ? 'bg-teal-800 border-teal-800 text-white shadow-xs'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Periode</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="HARI_INI">Hari Ini (27 Agu 2026)</option>
              <option value="MINGGU_INI">Minggu Ini</option>
              <option value="BULAN_INI">Bulan Ini (Agustus 2026)</option>
              <option value="TAHUN_INI">Tahun Ini (2026)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Lokasi Gudang</label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">Semua Gudang</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.namaGudang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori Barang</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nama}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Paper Preview Container */}
      <div id="printable-report" className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
        <KopSurat />

        {/* Report Header Title */}
        <div className="text-center my-5">
          <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wide">
            {reportTitles[reportType]}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Periode: <strong>Agustus 2026</strong> | Dicetak pada: {new Date().toLocaleString('id-ID')}
          </p>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">No</th>
                <th className="p-3">{headers[0]}</th>
                <th className="p-3">{headers[1]}</th>
                <th className="p-3">{headers[2]}</th>
                <th className="p-3">{headers[3]}</th>
                <th className="p-3 text-center">{headers[4]}</th>
                <th className="p-3 text-center">{headers[5]}</th>
                <th className="p-3 text-center">{headers[6]}</th>
                <th className="p-3 text-center">{headers[7]}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Tidak ada data yang sesuai dengan kriteria laporan.
                  </td>
                </tr>
              ) : (
                rows.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-semibold text-slate-800">{row.col1}</td>
                    <td className="p-2.5 font-semibold text-slate-800">{row.col2}</td>
                    <td className="p-2.5 text-slate-600">{row.col3}</td>
                    <td className="p-2.5 text-slate-700">{row.col4}</td>
                    <td className="p-2.5 text-center font-bold text-teal-950">{row.col5}</td>
                    <td className="p-2.5 text-center text-slate-600">{row.col6}</td>
                    <td className="p-2.5 text-center text-slate-500">{row.col7}</td>
                    <td className="p-2.5 text-center font-semibold">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {row.col8}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Signature */}
        <div className="mt-8 pt-4 flex justify-end text-center text-xs">
          <div>
            <div className="text-slate-600">Kepulauan Seribu Selatan, 27 Agustus 2026</div>
            <div className="text-slate-800 font-bold uppercase mt-1">Pengelola Persediaan Barang</div>
            <div className="h-16"></div>
            <div className="font-bold underline text-slate-900">Dr. Hendra Wijaya, MKM</div>
            <div className="text-slate-500">NIP. 197904122005011004</div>
          </div>
        </div>
      </div>
    </div>
  );
};
