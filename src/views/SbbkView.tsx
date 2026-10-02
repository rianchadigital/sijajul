import React, { useState, useEffect } from 'react';
import { 
  FileOutput, Search, Download, Printer, 
  Copy, Eye, Check 
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { SbbkDocument, User } from '../types';
import { KopSurat } from '../components/common/KopSurat';
import { PdfService } from '../services/pdfService';

interface SbbkViewProps {
  currentUser: User | null;
}

export const SbbkView: React.FC<SbbkViewProps> = ({ currentUser }) => {
  const [sbbks, setSbbks] = useState<SbbkDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSbbk, setSelectedSbbk] = useState<SbbkDocument | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = () => {
    const list = storageService.getSbbkDocs();
    setSbbks(list);
    if (list.length > 0 && !selectedSbbk) {
      setSelectedSbbk(list[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadPdf = (sbbk: SbbkDocument) => {
    const doc = PdfService.generateSbbkPdf(sbbk);
    doc.save(`SBBK_${sbbk.nomorSbbk.replace(/\//g, '_')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const userWh = currentUser ? storageService.resolveWarehouseForUser(currentUser) : null;
  const userWhId = userWh?.id || currentUser?.gudangId;

  const filteredSbbks = sbbks.filter(s => {
    if (currentUser?.role === 'PIC_SUB_GUDANG' && userWhId && s.gudangTujuanId !== userWhId && s.gudangAsalId !== userWhId) {
      return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.nomorSbbk.toLowerCase().includes(q) ||
      s.gudangTujuanNama.toLowerCase().includes(q) ||
      s.penerimaNama.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Surat Bukti Barang Keluar (SBBK)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dokumen resmi pertanggungjawaban pengeluaran barang persediaan dari gudang penyimpanan.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: SBBK List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor SBBK, tujuan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {filteredSbbks.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                Tidak ada dokumen SBBK ditemukan.
              </div>
            ) : (
              filteredSbbks.map((sbbk) => {
                const isSelected = selectedSbbk?.id === sbbk.id;
                return (
                  <div
                    key={sbbk.id}
                    onClick={() => setSelectedSbbk(sbbk)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50 border-teal-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-teal-900">
                        {sbbk.nomorSbbk}
                      </span>
                      <span className="text-[10px] text-slate-400">{sbbk.tanggal}</span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 mt-1 truncate">
                      Pengeluaran ke: {sbbk.gudangTujuanNama}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                      <span>Penerima: {sbbk.penerimaNama}</span>
                      <span className="font-bold text-teal-800">{sbbk.items.length} item</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: SBBK Preview */}
        <div className="lg:col-span-8 space-y-3">
          {selectedSbbk ? (
            <>
              {/* Action Bar */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileOutput className="w-5 h-5 text-teal-800" />
                  <span className="text-xs font-bold text-slate-800">
                    Preview Dokumen SBBK Resmi
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(selectedSbbk)}
                    className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh PDF
                  </button>
                </div>
              </div>

              {/* Printable Document Paper Card */}
              <div id="printable-sbbk" className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-10 font-sans text-slate-900 text-xs sm:text-sm">
                <KopSurat />

                <div className="text-center my-6">
                  <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                    SURAT BUKTI BARANG KELUAR (SBBK)
                  </h2>
                  <p className="text-xs font-mono text-slate-700 mt-0.5">
                    Nomor: <strong>{selectedSbbk.nomorSbbk}</strong>
                  </p>
                </div>

                {/* Metadata Box */}
                <div className="bg-slate-50 border border-slate-300 p-4 rounded-xl mb-6 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Tanggal Pengeluaran:</span>
                    <strong className="text-slate-800">{selectedSbbk.tanggal}</strong>
                    <span className="text-slate-500 block mt-2">Gudang Pengeluaran:</span>
                    <strong className="text-slate-800">{selectedSbbk.gudangAsalNama}</strong>
                    <span className="text-slate-500 block mt-2">Petugas Gudang:</span>
                    <strong className="text-slate-800">{selectedSbbk.petugasGudangNama}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Referensi Dropping:</span>
                    <strong className="text-slate-800">{selectedSbbk.nomorDropping}</strong>
                    <span className="text-slate-500 block mt-2">Gudang Penerima:</span>
                    <strong className="text-teal-900">{selectedSbbk.gudangTujuanNama}</strong>
                    <span className="text-slate-500 block mt-2">Penerima:</span>
                    <strong className="text-slate-800">{selectedSbbk.penerimaNama}</strong>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-300 w-10 text-center">No</th>
                        <th className="p-2 border-r border-slate-300">Kode Barang</th>
                        <th className="p-2 border-r border-slate-300">Nama Barang Persediaan</th>
                        <th className="p-2 border-r border-slate-300 text-center">Jumlah Keluar</th>
                        <th className="p-2 border-r border-slate-300 text-center">Satuan</th>
                        <th className="p-2">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedSbbk.items.map((itm, idx) => (
                        <tr key={idx}>
                          <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-mono">{itm.kodeBarang}</td>
                          <td className="p-2 border-r border-slate-200 font-semibold">{itm.namaBarang}</td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">{itm.jumlahDikirim}</td>
                          <td className="p-2 border-r border-slate-200 text-center">{itm.satuan}</td>
                          <td className="p-2 text-slate-500">{itm.keterangan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signatures Area */}
                <div className="grid grid-cols-2 gap-8 text-center pt-8">
                  <div>
                    <div className="text-xs text-slate-600">Petugas Pengeluaran Barang,</div>
                    <div className="h-16"></div>
                    <div className="font-bold underline">{selectedSbbk.petugasGudangNama}</div>
                    <div className="text-xs text-slate-500">NIP. 198807212011011008</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-600">Penerima Barang,</div>
                    <div className="h-16"></div>
                    <div className="font-bold underline">{selectedSbbk.penerimaNama}</div>
                    <div className="text-xs text-slate-500">NIP. {selectedSbbk.penerimaNip || '................................'}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              Pilih salah satu dokumen SBBK untuk melihat pratinjau.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
