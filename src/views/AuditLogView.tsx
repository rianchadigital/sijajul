import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Filter, Download, 
  Clock, User as UserIcon, Activity, Database 
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { AuditLog, User } from '../types';
import { ExcelService } from '../services/excelService';

interface AuditLogViewProps {
  currentUser: User | null;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    setLogs(storageService.getAuditLogs());
  }, []);

  const handleExportExcel = () => {
    const formatted = logs.map((l, idx) => ({
      'No': idx + 1,
      'Timestamp': l.timestamp,
      'Nama Petugas': l.userNama,
      'Role': l.role,
      'Aksi': l.action,
      'Modul': l.module,
      'Rincian Detail': l.details,
      'Device / Browser': l.deviceInfo || 'Chrome Web / Android PWA'
    }));
    ExcelService.exportToExcel(formatted, 'Audit_Log_SiGudang_KSS', 'Audit Log');
  };

  const filteredLogs = logs.filter(l => {
    if (moduleFilter !== 'ALL' && l.module !== moduleFilter) return false;
    if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.userNama.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Audit Log & Riwayat Aktivitas Sistem
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rekam jejak digital kepatuhan audit (governance & compliance) seluruh transaksi persediaan.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" /> Export Log Excel
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari user, rincian aktivitas, atau modul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-medium text-slate-700"
          >
            <option value="ALL">Semua Modul</option>
            <option value="AUTH">AUTH (Autentikasi & Login)</option>
            <option value="PERMINTAAN">PERMINTAAN (Permohonan Barang)</option>
            <option value="APPROVAL">APPROVAL (Persetujuan Pimpinan)</option>
            <option value="DROPPING">DROPPING (Distribusi & BAST)</option>
            <option value="PENERIMAAN">PENERIMAAN (Konfirmasi Sub Gudang)</option>
            <option value="STOK">STOK (Transaksi & Saldo)</option>
            <option value="OPNAME">OPNAME (Stock Opname)</option>
            <option value="MASTER_BARANG">MASTER DATA</option>
          </select>
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-medium text-slate-700"
          >
            <option value="ALL">Semua Jenis Aksi</option>
            <option value="CREATE">CREATE (Pembuatan Baru)</option>
            <option value="UPDATE">UPDATE (Perubahan Data)</option>
            <option value="DELETE">DELETE (Penghapusan)</option>
            <option value="APPROVE">APPROVE (Persetujuan)</option>
            <option value="REJECT">REJECT (Penolakan)</option>
            <option value="LOGIN">LOGIN</option>
            <option value="SYNC">SYNC (Sinkronisasi GAS)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-40">Waktu (WIB)</th>
                <th className="px-4 py-3">Petugas</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Modul</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Rincian Aktivitas Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-sans text-xs">
                    Tidak ada catatan audit log yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-sans">
                      {log.userNama}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                        {log.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-teal-800">
                      {log.module}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'APPROVE' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'REJECT' ? 'bg-rose-100 text-rose-800' :
                        log.action === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-sans">
                      {log.details}
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
