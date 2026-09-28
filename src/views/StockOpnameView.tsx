import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Building2, Search, Download, 
  Save, AlertTriangle, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Warehouse, Item, WarehouseStock, User } from '../types';
import { ExcelService } from '../services/excelService';

interface StockOpnameViewProps {
  currentUser: User | null;
  onRefreshStats: () => void;
}

export const StockOpnameView: React.FC<StockOpnameViewProps> = ({ currentUser, onRefreshStats }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

  // Opname Input Map: { [barangId]: { fisik: number; notes: string } }
  const [opnameInputs, setOpnameInputs] = useState<{ [barangId: string]: { fisik: number; notes: string } }>({});
  const [petugasOpname, setPetugasOpname] = useState(currentUser?.nama || 'Petugas Gudang');

  const loadData = () => {
    const whs = storageService.getWarehouses();
    const itms = storageService.getItems();
    const stks = storageService.getStocks();
    setWarehouses(whs);
    setItems(itms);
    setStocks(stks);

    if (whs.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(whs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleSaveOpname = () => {
    if (!selectedWarehouseId) return;

    let adjustedCount = 0;
    const opnameRef = `OPNAME/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;

    items.forEach(itm => {
      const currentStock = storageService.getStockByWarehouseAndItem(selectedWarehouseId, itm.id).saldo;
      const physical = opnameInputs[itm.id]?.fisik ?? currentStock;
      const diff = physical - currentStock;

      if (diff !== 0) {
        adjustedCount++;
        const notes = opnameInputs[itm.id]?.notes || 'Rekonsiliasi hasil Stock Opname Fisik';
        if (diff > 0) {
          // Fisik lebih banyak -> Masuk
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
          // Fisik lebih sedikit -> Keluar
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

    if (adjustedCount > 0) {
      alert(`Rekonsiliasi Stock Opname Berhasil!\nTelah dilakukan penyesuaian otomatis untuk ${adjustedCount} item yang memiliki selisih fisik.`);
    } else {
      alert('Stock Opname Tersimpan: Seluruh saldo fisik barang SESUAI 100% dengan saldo buku sistem.');
    }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Stock Opname Fisik & Rekonsiliasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pencocokan saldo pembukuan sistem dengan perhitungan fisik barang nyata di gudang.
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
            onClick={handleSaveOpname}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" /> Simpan & Rekonsiliasi Saldo
          </button>
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
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-semibold text-slate-800"
          >
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.namaGudang}</option>
            ))}
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

      {/* Opname Calculation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3">Kode & Nama Barang</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-center">Saldo Sistem</th>
                <th className="px-4 py-3 text-center w-36">Hitungan Fisik Nyata</th>
                <th className="px-4 py-3 text-center">Selisih</th>
                <th className="px-4 py-3">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((itm, idx) => {
                const stock = stocks.find(s => s.gudangId === selectedWarehouseId && s.barangId === itm.id);
                const saldoSistem = stock ? stock.saldo : 0;
                const saldoFisik = opnameInputs[itm.id]?.fisik ?? saldoSistem;
                const selisih = saldoFisik - saldoSistem;

                return (
                  <tr key={itm.id} className={`hover:bg-slate-50/80 transition-colors ${selisih !== 0 ? 'bg-amber-50/40' : ''}`}>
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
