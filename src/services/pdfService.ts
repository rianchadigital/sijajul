import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BastDocument, SbbkDocument, StockTransaction, WarehouseStock, Item, ItemProposal } from '../types';
import { storageService } from './storageService';

export class PdfService {
  /**
   * Helper to draw the Official Government Letterhead (KOP SURAT DKI JAKARTA)
   */
  private static drawKopSurat(doc: jsPDF, pageWidth: number): number {
    const logoConfig = storageService.getLogoConfig();

    // Try embedding images if base64 bitmap (PNG/JPEG), otherwise draw crisp vector emblems
    let hasLeftImg = false;
    let hasRightImg = false;

    if (logoConfig.logoJayaRaya && (logoConfig.logoJayaRaya.startsWith('data:image/png') || logoConfig.logoJayaRaya.startsWith('data:image/jpeg') || logoConfig.logoJayaRaya.startsWith('data:image/webp'))) {
      try {
        doc.addImage(logoConfig.logoJayaRaya, 'PNG', 14, 12, 20, 20);
        hasLeftImg = true;
      } catch (e) {
        hasLeftImg = false;
      }
    }

    if (!hasLeftImg) {
      // Left Shield Emblem (Jaya Raya style)
      doc.setFillColor(15, 118, 110);
      doc.roundedRect(14, 12, 18, 18, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text('JAYA RAYA', 23, 22, { align: 'center' });
    }

    if (logoConfig.logoKesehatan && (logoConfig.logoKesehatan.startsWith('data:image/png') || logoConfig.logoKesehatan.startsWith('data:image/jpeg') || logoConfig.logoKesehatan.startsWith('data:image/webp'))) {
      try {
        doc.addImage(logoConfig.logoKesehatan, 'PNG', pageWidth - 34, 12, 20, 20);
        hasRightImg = true;
      } catch (e) {
        hasRightImg = false;
      }
    }

    if (!hasRightImg) {
      // Right Health Cross Emblem (Bakti Husada style)
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(16, 185, 129);
      doc.roundedRect(pageWidth - 32, 12, 18, 18, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(4, 120, 87);
      doc.text('KESEHATAN', pageWidth - 23, 22, { align: 'center' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    doc.text(logoConfig.namaPemprov || 'PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.text(logoConfig.namaDinas || 'DINAS KESEHATAN', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 94, 84); // Teal Primary
    doc.text(logoConfig.namaPuskesmas || 'PUSKESMAS KECAMATAN KEPULAUAN SERIBU SELATAN', pageWidth / 2, 25.5, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(logoConfig.alamatPuskesmas || 'Jl. Pantai Selatan No. 1, Pulau Tidung, Kepulauan Seribu Selatan, DKI Jakarta 14520', pageWidth / 2, 31, { align: 'center' });
    doc.text(logoConfig.kontakPuskesmas || 'Telepon: (021) 6411234 | Email: puskesmas.kepseribuselatan@jakarta.go.id', pageWidth / 2, 35, { align: 'center' });

    // Double rule lines
    doc.setDrawColor(0, 94, 84);
    doc.setLineWidth(0.8);
    doc.line(14, 39, pageWidth - 14, 39);
    doc.setLineWidth(0.2);
    doc.line(14, 40.5, pageWidth - 14, 40.5);

    return 46; // Return bottom Y
  }

  /**
   * Generate Official BAST (Berita Acara Serah Terima) PDF
   */
  static generateBastPdf(bast: BastDocument): jsPDF {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.drawKopSurat(doc, pageWidth);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('BERITA ACARA SERAH TERIMA BARANG (BAST)', pageWidth / 2, currentY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Nomor: ${bast.nomorBast}`, pageWidth / 2, currentY + 9, { align: 'center' });

    currentY += 16;

    // Narrative clause
    const tanggalIndo = new Date(bast.tanggal).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const introText = `Pada hari ini, ${tanggalIndo}, yang bertanda tangan di bawah ini masing-masing:`;
    doc.text(introText, 14, currentY);
    currentY += 6;

    // Pihak Pertama (Yang Menyerahkan)
    doc.setFont('helvetica', 'bold');
    doc.text('1. PIHAK PERTAMA (Yang Menyerahkan):', 14, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 4.5;
    doc.text(`   Nama               : ${bast.pihakPertamaNama}`, 14, currentY);
    currentY += 4;
    doc.text(`   NIP                  : ${bast.pihakPertamaNip || '-'}`, 14, currentY);
    currentY += 4;
    doc.text(`   Jabatan            : ${bast.pihakPertamaJabatan}`, 14, currentY);
    currentY += 4;
    doc.text(`   Unit / Gudang : ${bast.gudangAsalNama}`, 14, currentY);

    currentY += 6;

    // Pihak Kedua (Yang Menerima)
    doc.setFont('helvetica', 'bold');
    doc.text('2. PIHAK KEDUA (Yang Menerima):', 14, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 4.5;
    doc.text(`   Nama               : ${bast.pihakKeduaNama}`, 14, currentY);
    currentY += 4;
    doc.text(`   NIP                  : ${bast.pihakKeduaNip || '-'}`, 14, currentY);
    currentY += 4;
    doc.text(`   Jabatan            : ${bast.pihakKeduaJabatan}`, 14, currentY);
    currentY += 4;
    doc.text(`   Unit / Gudang : ${bast.gudangTujuanNama}`, 14, currentY);

    currentY += 6;
    doc.text('PIHAK PERTAMA telah menyerahkan kepada PIHAK KEDUA, dan PIHAK KEDUA telah menerima barang persediaan/distribusi dropping dengan rincian sebagai berikut:', 14, currentY, { maxWidth: pageWidth - 28 });

    currentY += 8;

    // Items Table
    const tableRows = bast.items.map((itm, idx) => [
      (idx + 1).toString(),
      itm.kodeBarang,
      itm.namaBarang,
      itm.jumlahDikirim.toString(),
      itm.satuan,
      itm.kondisiBarang || 'Baik & Utuh',
      itm.keterangan || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Kode Barang', 'Nama Barang / Spesifikasi', 'Jumlah', 'Satuan', 'Kondisi', 'Keterangan']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 94, 84],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 24 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 24, halign: 'center' },
        6: { cellWidth: 28 }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // Closing statement
    doc.setFontSize(8.5);
    doc.text('Demikian Berita Acara Serah Terima Barang ini dibuat dengan sebenarnya dalam rangkap 2 (dua) untuk dipergunakan sebagaimana mestinya.', 14, finalY, { maxWidth: pageWidth - 28 });

    // Signatures
    const sigY = finalY + 12;
    const colLeft = 20;
    const colRight = pageWidth - 75;

    doc.text('Yang Menerima,', colRight, sigY);
    doc.text('PIHAK KEDUA', colRight, sigY + 4);

    doc.text('Yang Menyerahkan,', colLeft, sigY);
    doc.text('PIHAK PERTAMA', colLeft, sigY + 4);

    // Signature Space (20mm)
    const signNameY = sigY + 24;

    doc.setFont('helvetica', 'bold');
    doc.text(bast.pihakPertamaNama, colLeft, signNameY);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${bast.pihakPertamaNip || '................................'}`, colLeft, signNameY + 4);

    doc.setFont('helvetica', 'bold');
    doc.text(bast.pihakKeduaNama, colRight, signNameY);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${bast.pihakKeduaNip || '................................'}`, colRight, signNameY + 4);

    return doc;
  }

  /**
   * Generate Official SBBK (Surat Bukti Barang Keluar) PDF
   */
  static generateSbbkPdf(sbbk: SbbkDocument): jsPDF {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.drawKopSurat(doc, pageWidth);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('SURAT BUKTI BARANG KELUAR (SBBK)', pageWidth / 2, currentY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Nomor Dokumen: ${sbbk.nomorSbbk}`, pageWidth / 2, currentY + 9, { align: 'center' });

    currentY += 16;

    // Header metadata box
    doc.setFontSize(8.5);
    doc.text(`Tanggal Pengeluaran : ${sbbk.tanggal}`, 14, currentY);
    doc.text(`Referensi Dropping  : ${sbbk.nomorDropping}`, pageWidth - 80, currentY);
    currentY += 4.5;
    doc.text(`Gudang Pengeluaran  : ${sbbk.gudangAsalNama}`, 14, currentY);
    doc.text(`Gudang Penerima     : ${sbbk.gudangTujuanNama}`, pageWidth - 80, currentY);
    currentY += 4.5;
    doc.text(`Petugas Gudang      : ${sbbk.petugasGudangNama}`, 14, currentY);
    doc.text(`Penerima / Pemohon  : ${sbbk.penerimaNama}`, pageWidth - 80, currentY);

    currentY += 6;

    const tableRows = sbbk.items.map((itm, idx) => [
      (idx + 1).toString(),
      itm.kodeBarang,
      itm.namaBarang,
      itm.jumlahDikirim.toString(),
      itm.satuan,
      itm.keterangan || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Kode Barang', 'Nama Barang Persediaan', 'Jumlah Keluar', 'Satuan', 'Keterangan']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 118, 110],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 26 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 24, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 35 }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Signatures
    const sigY = finalY;
    const colLeft = 20;
    const colRight = pageWidth - 75;

    doc.setFontSize(8.5);
    doc.text('Petugas Pengeluaran Barang,', colLeft, sigY);
    doc.text('Penerima Barang,', colRight, sigY);

    const signNameY = sigY + 24;

    doc.setFont('helvetica', 'bold');
    doc.text(sbbk.petugasGudangNama, colLeft, signNameY);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. 198807212011011008`, colLeft, signNameY + 4);

    doc.setFont('helvetica', 'bold');
    doc.text(sbbk.penerimaNama, colRight, signNameY);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${sbbk.penerimaNip || '................................'}`, colRight, signNameY + 4);

    return doc;
  }

  /**
   * Generate Stock Card PDF
   */
  static generateStockCardPdf(item: Item, warehouseName: string, transactions: StockTransaction[]): jsPDF {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.drawKopSurat(doc, pageWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('KARTU STOK PERSEDIAAN BARANG', pageWidth / 2, currentY + 4, { align: 'center' });

    currentY += 12;

    // Metadata header
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Kode Barang : ${item.kodeBarang}`, 14, currentY);
    doc.text(`Nama Barang : ${item.namaBarang}`, 70, currentY);
    doc.text(`Satuan : ${item.satuan}`, pageWidth - 45, currentY);
    currentY += 4.5;
    doc.text(`Kategori    : ${item.kategoriNama}`, 14, currentY);
    doc.text(`Gudang      : ${warehouseName}`, 70, currentY);
    doc.text(`Stok Min : ${item.stokMinimum}`, pageWidth - 45, currentY);

    currentY += 6;

    const tableRows = transactions.map((t) => [
      t.tanggal,
      t.nomorTransaksi,
      t.jenisTransaksi.replace('_', ' '),
      t.keterangan,
      t.masuk > 0 ? t.masuk.toString() : '-',
      t.keluar > 0 ? t.keluar.toString() : '-',
      t.saldoAkhir.toString()
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Tanggal', 'No Transaksi', 'Jenis', 'Keterangan', 'Masuk', 'Keluar', 'Saldo']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8
      },
      bodyStyles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 32 },
        2: { cellWidth: 26 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 16, halign: 'center' },
        6: { cellWidth: 16, halign: 'center' }
      },
      margin: { left: 14, right: 14 }
    });

    return doc;
  }

  /**
   * Generate Inventory Stock Report PDF
   */
  static generateInventoryReportPdf(title: string, periodText: string, stocks: { kode: string; nama: string; kategori: string; gudang: string; saldo: number; satuan: string; min: number; status: string }[]): jsPDF {
    const doc = new jsPDF({ format: 'a4', orientation: 'landscape', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.drawKopSurat(doc, pageWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title.toUpperCase(), pageWidth / 2, currentY + 3, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Periode: ${periodText} | Dicetak pada: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, currentY + 8, { align: 'center' });

    currentY += 14;

    const tableRows = stocks.map((s, idx) => [
      (idx + 1).toString(),
      s.kode,
      s.nama,
      s.kategori,
      s.gudang,
      s.saldo.toString(),
      s.satuan,
      s.min.toString(),
      s.status
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Kode Barang', 'Nama Barang Persediaan', 'Kategori', 'Gudang', 'Stok Saldo', 'Satuan', 'Stok Min', 'Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 94, 84],
        textColor: [255, 255, 255],
        fontSize: 8.5
      },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 35 },
        4: { cellWidth: 50 },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 20, halign: 'center' },
        8: { cellWidth: 25, halign: 'center' }
      },
      margin: { left: 14, right: 14 }
    });

    return doc;
  }

  /**
   * Generate Single Proposal PDF Document
   */
  static generateSingleProposalPdf(proposal: ItemProposal): jsPDF {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.drawKopSurat(doc, pageWidth);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('FORMULIR USULAN PENGADAAN BARANG / PERSEDIAAN BARU', pageWidth / 2, currentY + 3, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Nomor: ${proposal.nomorUsulan}`, pageWidth / 2, currentY + 8, { align: 'center' });

    currentY += 14;

    // Requester Info Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DATA PEMOHON / PENANGGUNG JAWAB UNIT:', 14, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 4.5;
    doc.text(`Nama Pemohon       : ${proposal.pemohonNama}`, 14, currentY);
    currentY += 4;
    doc.text(`NIP / NIK                 : ${proposal.pemohonNip || '-'}`, 14, currentY);
    currentY += 4;
    doc.text(`Jabatan                   : ${proposal.pemohonJabatan}`, 14, currentY);
    currentY += 4;
    doc.text(`Unit / Lokasi Tugas : ${proposal.tempatTugas || proposal.unitKerja}`, 14, currentY);
    currentY += 4;
    doc.text(`Tanggal Usulan       : ${proposal.tanggalUsulan}`, 14, currentY);
    currentY += 4;
    doc.text(`Status Workflow     : ${proposal.status.replace(/_/g, ' ')}`, 14, currentY);

    currentY += 7;

    // Item Detail Table
    const tableRows = [
      [
        '1',
        `${proposal.namaBarang}\nKategori: ${proposal.kategoriNama}\nMerk: ${proposal.merkRekomendasi || '-'}\nSpesifikasi: ${proposal.spesifikasi || '-'}`,
        `${proposal.jumlahDiusulkan} ${proposal.satuan}`,
        `Rp ${(proposal.estimasiHargaSatuan || 0).toLocaleString('id-ID')}`,
        `Rp ${(proposal.estimasiTotalHarga || 0).toLocaleString('id-ID')}`
      ]
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Nama & Spesifikasi Barang', 'Jumlah', 'Estimasi Satuan', 'Total Estimasi']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 94, 84],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 26, halign: 'center' },
        3: { cellWidth: 32, halign: 'right' },
        4: { cellWidth: 36, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 6;

    // Justification box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Justifikasi & Alasan Kebutuhan Pelayanan:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    finalY += 4;
    doc.text(proposal.alasanPengusulan || '-', 14, finalY, { maxWidth: pageWidth - 28 });
    finalY += 12;

    if (proposal.approverNama) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Catatan Keputusan Pejabat Pengadaan (${proposal.approverNama}):`, 14, finalY);
      doc.setFont('helvetica', 'normal');
      finalY += 4;
      doc.text(proposal.catatanApproval || 'Telah disetujui untuk proses pengadaan/belanja.', 14, finalY, { maxWidth: pageWidth - 28 });
      if (proposal.nomorDpaRekening) {
        finalY += 4;
        doc.text(`No. DPA / Rekening Belanja: ${proposal.nomorDpaRekening}`, 14, finalY);
      }
      finalY += 8;
    }

    // Signatures
    const sigY = Math.max(finalY + 4, 230);
    const colLeft = 20;
    const colRight = pageWidth - 75;

    doc.text('Mengetahui / Mengajukan,', colLeft, sigY);
    doc.text('Pemohon / Penanggung Jawab', colLeft, sigY + 4);
    doc.text(`Kepulauan Seribu, ${proposal.tanggalApproval || proposal.tanggalUsulan}`, colRight, sigY);
    doc.text('Pejabat Pengadaan / Pengurus Barang', colRight, sigY + 4);

    doc.setFont('helvetica', 'bold');
    doc.text(proposal.pemohonNama, colLeft, sigY + 28);
    doc.text(proposal.approverNama || 'Hendra Setiawan, S.Farm', colRight, sigY + 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`NIP: ${proposal.pemohonNip || '-'}`, colLeft, sigY + 32);
    doc.text(`NIP: 198807212011011008`, colRight, sigY + 32);

    return doc;
  }

  /**
   * Generate Proposal Recap PDF (Landscape A4)
   */
  static generateProposalRecapPdf(
    title: string,
    filterText: string,
    proposals: ItemProposal[],
    summary: { totalCount: number; pendingCount: number; approvedCount: number; completedCount: number; totalAnggaran: number }
  ): jsPDF {
    const doc = new jsPDF({ format: 'a4', orientation: 'landscape', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = this.drawKopSurat(doc, pageWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), pageWidth / 2, currentY + 3, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Kriteria: ${filterText} | Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Total: ${summary.totalCount} Usulan (Rp ${summary.totalAnggaran.toLocaleString('id-ID')})`, pageWidth / 2, currentY + 8, { align: 'center' });

    currentY += 14;

    const tableRows = proposals.map((p, idx) => [
      (idx + 1).toString(),
      p.nomorUsulan,
      p.namaBarang + (p.merkRekomendasi ? ` (${p.merkRekomendasi})` : ''),
      p.kategoriNama,
      `${p.jumlahDiusulkan} ${p.satuan}`,
      `Rp ${(p.estimasiHargaSatuan || 0).toLocaleString('id-ID')}`,
      `Rp ${(p.estimasiTotalHarga || 0).toLocaleString('id-ID')}`,
      p.prioritas,
      p.pemohonNama + `\n(${p.tempatTugas})`,
      p.status.replace(/_/g, ' ')
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'No. Usulan', 'Nama Barang & Merk', 'Kategori', 'Volume', 'Est. Satuan', 'Total Anggaran', 'Prioritas', 'Pengusul & Unit', 'Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 94, 84],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 26 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 28 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 28, halign: 'right' },
        7: { cellWidth: 20, halign: 'center' },
        8: { cellWidth: 34 },
        9: { cellWidth: 26, halign: 'center' }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // Summary box
    if (finalY < 165) {
      const sigY = Math.max(finalY + 4, 155);
      const colLeft = 25;
      const colRight = pageWidth - 80;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text('Mengetahui,', colLeft, sigY);
      doc.text('Kepala Puskesmas Kec. Kepulauan Seribu Selatan', colLeft, sigY + 4);

      doc.text(`Kepulauan Seribu, ${new Date().toLocaleDateString('id-ID')}`, colRight, sigY);
      doc.text('Pejabat Pengadaan Barang / Jasa', colRight, sigY + 4);

      doc.setFont('helvetica', 'bold');
      doc.text('dr. Ilham Pratama, M.K.M', colLeft, sigY + 24);
      doc.text('Hendra Setiawan, S.Farm', colRight, sigY + 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('NIP: 198205142008011012', colLeft, sigY + 28);
      doc.text('NIP: 198807212011011008', colRight, sigY + 28);
    }

    return doc;
  }
}
