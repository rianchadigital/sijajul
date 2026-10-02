import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, Filter, Download, 
  Building2, Package, ArrowDownRight, ArrowUpRight, Calendar 
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Warehouse, Item, StockTransaction, User } from '../types';
import { PdfService } from '../services/pdfService';
import { ExcelService } from '../services/excelService';

interface StockCardViewProps {
  currentUser: User | null;
}

export const StockCardView: React.FC<StockCardViewProps> = ({ currentUser }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);

  const isSuperAdmin = currentUser?.role === 'ADMIN';
  const userAssignedWarehouse = currentUser ? storageService.resolveWarehouseForUser(currentUser) : null;

  useEffect(() => {
    const whs = storageService.getWarehouses();
    const itms = storageService.getItems();
    setWarehouses(whs);
    setItems(itms);

    if (currentUser?.role === 'ADMIN') {
      if (whs.length > 0) setSelectedWarehouseId(whs[0].id);
    } else if (currentUser?.role === 'PIC_GUDANG_BESAR') {
      const gb = whs.find(w => w.tipeGudang === 'GUDANG_BESAR') || whs[0];
      setSelectedWarehouseId(gb.id);
    } else {
      const assigned = currentUser ? storageService.resolveWarehouseForUser(currentUser) : whs[0];
      setSelectedWarehouseId(assigned.id);
    }

    if (itms.length > 0) setSelectedItemId(itms[0].id);
  }, [currentUser]);

  useEffect(() => {
    if (selectedWarehouseId && selectedItemId) {
      const trxList = storageService.getItemStockTransactions(selectedWarehouseId, selectedItemId);
      setTransactions(trxList);
    }
  }, [selectedWarehouseId, selectedItemId]);

  const currentWarehouse = warehouses.find(w => w.id === selectedWarehouseId);
  const currentItem = items.find(i => i.id === selectedItemId);

  // Summaries
  const totalMasuk = transactions.reduce((acc, t) => acc + t.masuk, 0);
  const totalKeluar = transactions.reduce((acc, t) => acc + t.keluar, 0);
  const latestSaldo = transactions.length > 0 ? transactions[transactions.length - 1].saldoAkhir : 0;

  const handleExportPdf = () => {
    if (!currentItem || !currentWarehouse) return;
    const doc = PdfService.generateStockCardPdf(currentItem, currentWarehouse.namaGudang, transactions);
    doc.save(`Kartu_Stok_${currentItem.kodeBarang}_${currentWarehouse.kodeGudang}.pdf`);
  };

  const handleExportExcel = () => {
    ExcelService.exportTransactions(transactions);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Kartu Stok Persediaan Barang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Buku mutasi pergerakan barang kronologis per item dan per unit gudang.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Selectors Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-teal-700" /> Pilih Lokasi Gudang
          </label>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            disabled={!isSuperAdmin}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
          >
            {isSuperAdmin ? (
              warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.namaGudang} ({w.tipeGudang === 'GUDANG_BESAR' ? 'Gudang Pusat' : 'Sub Gudang'})
                </option>
              ))
            ) : currentUser?.role === 'PIC_GUDANG_BESAR' ? (
              warehouses.filter(w => w.tipeGudang === 'GUDANG_BESAR').map(w => (
                <option key={w.id} value={w.id}>
                  {w.namaGudang} (Gudang Pusat)
                </option>
              ))
            ) : (
              userAssignedWarehouse && (
                <option value={userAssignedWarehouse.id}>
                  {userAssignedWarehouse.namaGudang} (Sub Gudang Penugasan)
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-teal-700" /> Pilih Barang Persediaan
          </label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-semibold text-slate-800"
          >
            {items.map(i => (
              <option key={i.id} value={i.id}>
                [{i.kodeBarang}] {i.namaBarang} - {i.kategoriNama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Item Summary Header Card */}
      {currentItem && currentWarehouse && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm border border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-teal-800/80 text-teal-100 text-xs px-2 py-0.5 rounded font-bold">
                  {currentItem.kodeBarang}
                </span>
                <span className="text-slate-300 text-xs">{currentItem.kategoriNama}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-1">{currentItem.namaBarang}</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Gudang: <strong>{currentWarehouse.namaGudang}</strong> • Stok Min: {currentItem.stokMinimum} {currentItem.satuan}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-center min-w-[85px]">
                <span className="text-[10px] text-slate-400 block uppercase">Total Masuk</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {totalMasuk}
                </span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-center min-w-[85px]">
                <span className="text-[10px] text-slate-400 block uppercase">Total Keluar</span>
                <span className="text-sm font-bold text-rose-400 flex items-center justify-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> {totalKeluar}
                </span>
              </div>

              <div className="bg-teal-900/80 border border-teal-600 p-3 rounded-xl text-center min-w-[100px]">
                <span className="text-[10px] text-teal-200 block uppercase font-bold">Saldo Akhir</span>
                <span className="text-base font-black text-white">
                  {latestSaldo} <span className="text-xs font-normal text-teal-200">{currentItem.satuan}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">No. Transaksi</th>
                <th className="px-4 py-3">Jenis Mutasi</th>
                <th className="px-4 py-3">Keterangan / Referensi</th>
                <th className="px-4 py-3 text-center text-emerald-700">Masuk (+)</th>
                <th className="px-4 py-3 text-center text-rose-700">Keluar (-)</th>
                <th className="px-4 py-3 text-center text-teal-900 font-black">Saldo Akhir</th>
                <th className="px-4 py-3">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Belum ada riwayat mutasi transaksi untuk barang ini di gudang terpilih.
                  </td>
                </tr>
              ) : (
                transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                      {trx.tanggal}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {trx.nomorTransaksi}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {trx.jenisTransaksi.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{trx.keterangan}</div>
                      {trx.referensiDokumen && (
                        <div className="text-[10px] font-mono text-teal-700 mt-0.5">
                          Ref: {trx.referensiDokumen}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-700">
                      {trx.masuk > 0 ? `+${trx.masuk}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-rose-600">
                      {trx.keluar > 0 ? `-${trx.keluar}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-sm text-teal-950 bg-teal-50/30">
                      {trx.saldoAkhir} <span className="text-[10px] font-normal text-slate-500">{trx.satuan}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {trx.userNama}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
