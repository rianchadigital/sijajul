import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, Search, Download, Printer, 
  Copy, Eye, Building2, User as UserIcon, Calendar, Check 
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { BastDocument, User } from '../types';
import { KopSurat } from '../components/common/KopSurat';
import { PdfService } from '../services/pdfService';

interface BastViewProps {
  currentUser: User | null;
}

export const BastView: React.FC<BastViewProps> = ({ currentUser }) => {
  const [basts, setBasts] = useState<BastDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBast, setSelectedBast] = useState<BastDocument | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = () => {
    const list = storageService.getBastDocs();
    setBasts(list);
    if (list.length > 0 && !selectedBast) {
      setSelectedBast(list[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadPdf = (bast: BastDocument) => {
    const doc = PdfService.generateBastPdf(bast);
    doc.save(`BAST_${bast.nomorBast.replace(/\//g, '_')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = (bast: BastDocument) => {
    const text = `BERITA ACARA SERAH TERIMA (BAST)\nNomor: ${bast.nomorBast}\nTanggal: ${bast.tanggal}\nPihak 1 (Penyerah): ${bast.pihakPertamaNama} (${bast.gudangAsalNama})\nPihak 2 (Penerima): ${bast.pihakKeduaNama} (${bast.gudangTujuanNama})\n\nItem:\n${bast.items.map((i, idx) => `${idx + 1}. [${i.kodeBarang}] ${i.namaBarang} - ${i.jumlahDikirim} ${i.satuan}`).join('\n')}\n\nPuskesmas Kepulauan Seribu Selatan`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredBasts = basts.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.nomorBast.toLowerCase().includes(q) ||
      b.gudangTujuanNama.toLowerCase().includes(q) ||
      b.pihakKeduaNama.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Dokumen Berita Acara Serah Terima (BAST)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Arsip dokumen bukti serah terima logistik barang persediaan antar satuan kerja kepulauan.
          </p>
        </div>
      </div>

      {/* Main Grid: Left List (1 col) & Right Document Preview (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: BAST List */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search Box */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor BAST, penerima..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>

          {/* BAST List Cards */}
          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {filteredBasts.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                Tidak ada dokumen BAST ditemukan.
              </div>
            ) : (
              filteredBasts.map((bast) => {
                const isSelected = selectedBast?.id === bast.id;
                return (
                  <div
                    key={bast.id}
                    onClick={() => setSelectedBast(bast)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50 border-teal-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-teal-900">
                        {bast.nomorBast}
                      </span>
                      <span className="text-[10px] text-slate-400">{bast.tanggal}</span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 mt-1 truncate">
                      {bast.gudangTujuanNama}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                      <span>Penerima: {bast.pihakKeduaNama}</span>
                      <span className="font-bold text-teal-800">{bast.items.length} item</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Document Preview with Printable Layout */}
        <div className="lg:col-span-8 space-y-3">
          {selectedBast ? (
            <>
              {/* Document Action Bar */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-teal-800" />
                  <span className="text-xs font-bold text-slate-800">
                    Preview Dokumen BAST Resmi
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyText(selectedBast)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(selectedBast)}
                    className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh PDF
                  </button>
                </div>
              </div>

              {/* Printable Document Paper Card */}
              <div id="printable-bast" className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-10 font-sans text-slate-900 text-xs sm:text-sm">
                {/* Official Letterhead */}
                <KopSurat />

                {/* Document Title */}
                <div className="text-center my-6">
                  <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                    BERITA ACARA SERAH TERIMA BARANG (BAST)
                  </h2>
                  <p className="text-xs font-mono text-slate-700 mt-0.5">
                    Nomor: <strong>{selectedBast.nomorBast}</strong>
                  </p>
                </div>

                {/* Narrative Intro */}
                <p className="leading-relaxed mb-4">
                  Pada hari ini, tanggal <strong>{selectedBast.tanggal}</strong>, bertempat di Puskesmas Kepulauan Seribu Selatan, kami yang bertanda tangan di bawah ini:
                </p>

                {/* Parties Details */}
                <div className="space-y-4 mb-6 pl-2">
                  <div>
                    <div className="font-bold text-slate-800">1. PIHAK PERTAMA (Yang Menyerahkan):</div>
                    <table className="mt-1 ml-4 text-xs">
                      <tbody>
                        <tr><td className="w-28 text-slate-600">Nama</td><td className="w-4">:</td><td className="font-semibold">{selectedBast.pihakPertamaNama}</td></tr>
                        <tr><td className="text-slate-600">NIP</td><td>:</td><td>{selectedBast.pihakPertamaNip || '-'}</td></tr>
                        <tr><td className="text-slate-600">Jabatan</td><td>:</td><td>{selectedBast.pihakPertamaJabatan}</td></tr>
                        <tr><td className="text-slate-600">Unit / Gudang</td><td>:</td><td>{selectedBast.gudangAsalNama}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <div className="font-bold text-slate-800">2. PIHAK KEDUA (Yang Menerima):</div>
                    <table className="mt-1 ml-4 text-xs">
                      <tbody>
                        <tr><td className="w-28 text-slate-600">Nama</td><td className="w-4">:</td><td className="font-semibold">{selectedBast.pihakKeduaNama}</td></tr>
                        <tr><td className="text-slate-600">NIP</td><td>:</td><td>{selectedBast.pihakKeduaNip || '-'}</td></tr>
                        <tr><td className="text-slate-600">Jabatan</td><td>:</td><td>{selectedBast.pihakKeduaJabatan}</td></tr>
                        <tr><td className="text-slate-600">Unit / Gudang</td><td>:</td><td>{selectedBast.gudangTujuanNama}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="leading-relaxed mb-4">
                  PIHAK PERTAMA telah menyerahkan kepada PIHAK KEDUA, dan PIHAK KEDUA telah menerima barang persediaan/distribusi dropping dengan rincian sebagai berikut:
                </p>

                {/* Items Table */}
                <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-300 w-10 text-center">No</th>
                        <th className="p-2 border-r border-slate-300">Kode Barang</th>
                        <th className="p-2 border-r border-slate-300">Nama Barang / Spesifikasi</th>
                        <th className="p-2 border-r border-slate-300 text-center">Jumlah</th>
                        <th className="p-2 border-r border-slate-300 text-center">Satuan</th>
                        <th className="p-2 border-r border-slate-300 text-center">Kondisi</th>
                        <th className="p-2">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedBast.items.map((itm, idx) => (
                        <tr key={idx}>
                          <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-mono">{itm.kodeBarang}</td>
                          <td className="p-2 border-r border-slate-200 font-semibold">{itm.namaBarang}</td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">{itm.jumlahDikirim}</td>
                          <td className="p-2 border-r border-slate-200 text-center">{itm.satuan}</td>
                          <td className="p-2 border-r border-slate-200 text-center">{itm.kondisiBarang || 'Baik & Utuh'}</td>
                          <td className="p-2 text-slate-500">{itm.keterangan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="leading-relaxed mb-8">
                  Demikian Berita Acara Serah Terima Barang ini dibuat dengan sebenarnya dalam rangkap 2 (dua) untuk dipergunakan sebagaimana mestinya.
                </p>

                {/* Signatures Area */}
                <div className="grid grid-cols-2 gap-8 text-center pt-4">
                  <div>
                    <div className="text-xs text-slate-600">Yang Menyerahkan,</div>
                    <div className="font-bold text-xs uppercase mb-16">PIHAK PERTAMA</div>
                    <div className="font-bold underline">{selectedBast.pihakPertamaNama}</div>
                    <div className="text-xs text-slate-500">NIP. {selectedBast.pihakPertamaNip || '................................'}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-600">Yang Menerima,</div>
                    <div className="font-bold text-xs uppercase mb-16">PIHAK KEDUA</div>
                    <div className="font-bold underline">{selectedBast.pihakKeduaNama}</div>
                    <div className="text-xs text-slate-500">NIP. {selectedBast.pihakKeduaNip || '................................'}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              Pilih salah satu dokumen BAST untuk melihat pratinjau.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
