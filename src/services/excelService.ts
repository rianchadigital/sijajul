import * as XLSX from 'xlsx';
import { Category, Item, Warehouse } from '../types';

export interface ParsedImportItem {
  rowNumber: number;
  kodeBarang: string;
  namaBarang: string;
  kategoriNama: string;
  satuan: string;
  merk: string;
  spesifikasi: string;
  stokMinimum: number;
  stokAwalGudangBesar: number;
  keterangan: string;
  isExisting: boolean;
  status: 'VALID' | 'UPDATE' | 'INVALID';
  errors: string[];
  warnings: string[];
}

export class ExcelService {
  /**
   * Generic Export array of objects to Excel with custom filename and title
   */
  static exportToExcel(data: any[], fileName: string, sheetName: string = 'Data'): void {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)); // 31 chars max for sheet name
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  /**
   * Export Stocks per Warehouse to formatted Excel
   */
  static exportStockReport(stocks: any[]): void {
    const rows = stocks.map((s, idx) => ({
      'No': idx + 1,
      'Kode Barang': s.kodeBarang,
      'Nama Barang': s.namaBarang,
      'Kategori': s.kategoriNama,
      'Gudang': s.namaGudang,
      'Saldo Stok': s.saldo,
      'Satuan': s.satuan,
      'Stok Minimum': s.stokMinimum,
      'Status Stok': s.statusStok,
      'Update Terakhir': s.updateTerakhir
    }));
    this.exportToExcel(rows, 'Laporan_Stok_Puskesmas_KSS', 'Laporan Stok');
  }

  /**
   * Export Transaction Ledger to Excel
   */
  static exportTransactions(transactions: any[]): void {
    const rows = transactions.map((t, idx) => ({
      'No': idx + 1,
      'Tanggal': t.tanggal,
      'No Transaksi': t.nomorTransaksi,
      'Gudang': t.gudangNama,
      'Kode': t.kodeBarang,
      'Nama Barang': t.barangNama,
      'Jenis Transaksi': t.jenisTransaksi,
      'Masuk': t.masuk,
      'Keluar': t.keluar,
      'Saldo Akhir': t.saldoAkhir,
      'Satuan': t.satuan,
      'User Petugas': t.userNama,
      'Ref Dokumen': t.referensiDokumen || '-',
      'Keterangan': t.keterangan
    }));
    this.exportToExcel(rows, 'Buku_Transaksi_Stok_Puskesmas_KSS', 'Transaksi Stok');
  }

  /**
   * Generate and download Item Import Excel Template
   */
  static downloadItemImportTemplate(categories: Category[], warehouses: Warehouse[]): void {
    // Sample rows for user reference
    const sampleRows = [
      {
        'Kode Barang': 'BRG-OBT-001',
        'Nama Barang': 'Amoxicillin 500 mg Kapsul',
        'Kategori': 'Obat-obatan (Farmasi)',
        'Satuan': 'Box',
        'Merk / Pabrikan': 'Kimia Farma',
        'Spesifikasi': 'Dus isi 10 strip @ 10 kapsul',
        'Stok Minimum': 20,
        'Stok Awal Gudang Besar': 150,
        'Keterangan': 'Simpan pada suhu sejuk di bawah 25°C'
      },
      {
        'Kode Barang': 'BRG-MED-002',
        'Nama Barang': 'Spuit / Jarum Suntik 3 cc Disposable',
        'Kategori': 'BMHP Medis',
        'Satuan': 'Box',
        'Merk / Pabrikan': 'OneMed / Terumo',
        'Spesifikasi': 'Dus isi 100 pcs steril with needle',
        'Stok Minimum': 15,
        'Stok Awal Gudang Besar': 80,
        'Keterangan': 'Sekali pakai (single use)'
      },
      {
        'Kode Barang': 'BRG-ALK-003',
        'Nama Barang': 'Tensimeter Digital Lengan Atas',
        'Kategori': 'Alat Kesehatan',
        'Satuan': 'Unit',
        'Merk / Pabrikan': 'Omron',
        'Spesifikasi': 'Tipe HEM-7120 cuff standard',
        'Stok Minimum': 2,
        'Stok Awal Gudang Besar': 10,
        'Keterangan': 'Alat diagnostik Poli Umum'
      },
      {
        'Kode Barang': 'BRG-ATK-004',
        'Nama Barang': 'Kertas HVS A4 80 gram Putih',
        'Kategori': 'ATK & Kantor',
        'Satuan': 'Rim',
        'Merk / Pabrikan': 'PaperOne / Sinar Dunia',
        'Spesifikasi': 'Isi 500 lembar per rim',
        'Stok Minimum': 25,
        'Stok Awal Gudang Besar': 100,
        'Keterangan': 'Kebutuhan administrasi Puskesmas'
      },
      {
        'Kode Barang': 'BRG-LAB-005',
        'Nama Barang': 'Reagen Golongan Darah Anti-A, B, AB, D',
        'Kategori': 'Laboratorium',
        'Satuan': 'Set',
        'Merk / Pabrikan': 'Fortress Diagnostics',
        'Spesifikasi': 'Vial @ 10 ml per set',
        'Stok Minimum': 5,
        'Stok Awal Gudang Besar': 20,
        'Keterangan': 'Simpan dalam kulkas lab 2-8°C'
      },
      {
        'Kode Barang': '', // kosongkan untuk auto-generate
        'Nama Barang': 'Vitamin A 200.000 IU Kapsul Merah',
        'Kategori': 'Gizi & Nutrisi',
        'Satuan': 'Botol',
        'Merk / Pabrikan': 'Kimia Farma',
        'Spesifikasi': 'Botol isi 50 kapsul lunak',
        'Stok Minimum': 10,
        'Stok Awal Gudang Besar': 60,
        'Keterangan': 'Program pemberian vitamin A balita'
      }
    ];

    // Reference Sheet Data
    const categoryRef = categories.map(c => ({
      'Kode Kategori': c.kode,
      'Nama Kategori': c.nama,
      'Deskripsi': c.deskripsi || '-'
    }));

    const unitRef = [
      { 'Satuan': 'Pcs', 'Keterangan': 'Satuan bijian/potongan tunggal' },
      { 'Satuan': 'Box', 'Keterangan': 'Kotak/dus kemasan' },
      { 'Satuan': 'Botol', 'Keterangan': 'Kemasan cairan/sirup' },
      { 'Satuan': 'Tablet', 'Keterangan': 'Satuan butir obat tablet' },
      { 'Satuan': 'Kapsul', 'Keterangan': 'Satuan butir obat kapsul' },
      { 'Satuan': 'Strip', 'Keterangan': 'Satuan lembaran blister strip' },
      { 'Satuan': 'Ampul', 'Keterangan': 'Obat suntik vial/ampul kaca' },
      { 'Satuan': 'Vial', 'Keterangan': 'Vial serbuk/cairan injeksi' },
      { 'Satuan': 'Rim', 'Keterangan': '500 lembar kertas' },
      { 'Satuan': 'Set', 'Keterangan': 'Satu perangkat lengkap' },
      { 'Satuan': 'Roll', 'Keterangan': 'Gulungan plester/kassa/kabel' },
      { 'Satuan': 'Unit', 'Keterangan': 'Perangkat alat medis/elektronik' },
      { 'Satuan': 'Galon', 'Keterangan': 'Kemasan jerigen/galon' },
      { 'Satuan': 'Paket', 'Keterangan': 'Paket logistik terpadu' }
    ];

    const instructions = [
      { 'Kolom': 'Kode Barang', 'Wajib': 'Tidak (Opsional)', 'Penjelasan': 'Jika dikosongkan, sistem akan membuat kode otomatis (contoh: BRG-0123).' },
      { 'Kolom': 'Nama Barang', 'Wajib': 'YA (Wajib)', 'Penjelasan': 'Nama lengkap barang beserta sediaan atau ukuran.' },
      { 'Kolom': 'Kategori', 'Wajib': 'YA (Wajib)', 'Penjelasan': 'Nama kategori barang. Jika belum ada, sistem akan membuatkan kategori baru secara otomatis.' },
      { 'Kolom': 'Satuan', 'Wajib': 'YA (Wajib)', 'Penjelasan': 'Pilih salah satu satuan seperti Box, Botol, Pcs, Rim, Tablet, Strip, dll.' },
      { 'Kolom': 'Merk / Pabrikan', 'Wajib': 'Tidak', 'Penjelasan': 'Pabrikan obat atau brand produk (contoh: Kimia Farma, OneMed).' },
      { 'Kolom': 'Spesifikasi', 'Wajib': 'Tidak', 'Penjelasan': 'Keterangan kemasan atau detail teknis barang.' },
      { 'Kolom': 'Stok Minimum', 'Wajib': 'Tidak (Default 10)', 'Penjelasan': 'Batas ambang peringatan stok menipis (angka).' },
      { 'Kolom': 'Stok Awal Gudang Besar', 'Wajib': 'Tidak (Default 0)', 'Penjelasan': 'Jumlah stok awal untuk langsung dimasukkan ke saldo Gudang Induk KSS.' },
      { 'Kolom': 'Keterangan', 'Wajib': 'Tidak', 'Penjelasan': 'Catatan khusus cara penyimpanan atau program terkait.' }
    ];

    const wb = XLSX.utils.book_new();

    // Sheet 1: Template
    const wsTemplate = XLSX.utils.json_to_sheet(sampleRows);
    wsTemplate['!cols'] = [
      { wch: 18 }, // Kode Barang
      { wch: 40 }, // Nama Barang
      { wch: 25 }, // Kategori
      { wch: 12 }, // Satuan
      { wch: 22 }, // Merk
      { wch: 35 }, // Spesifikasi
      { wch: 14 }, // Stok Minimum
      { wch: 24 }, // Stok Awal Gudang Besar
      { wch: 35 }  // Keterangan
    ];
    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template Import Barang');

    // Sheet 2: Petunjuk
    const wsPetunjuk = XLSX.utils.json_to_sheet(instructions);
    wsPetunjuk['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk Pengisian');

    // Sheet 3: Referensi Kategori
    const wsCat = XLSX.utils.json_to_sheet(categoryRef);
    wsCat['!cols'] = [{ wch: 16 }, { wch: 30 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsCat, 'Referensi Kategori');

    // Sheet 4: Referensi Satuan
    const wsUnits = XLSX.utils.json_to_sheet(unitRef);
    wsUnits['!cols'] = [{ wch: 16 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsUnits, 'Referensi Satuan');

    XLSX.writeFile(wb, `Template_Import_Barang_Puskesmas_KSS.xlsx`);
  }

  /**
   * Parse uploaded Excel or CSV file to structured items for preview & import
   */
  static async parseItemsFromExcel(file: File, existingItems: Item[]): Promise<{
    items: ParsedImportItem[];
    totalRows: number;
    validCount: number;
    updateCount: number;
    errorCount: number;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Use first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Parse JSON with raw header row
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (!rawRows || rawRows.length === 0) {
            resolve({
              items: [],
              totalRows: 0,
              validCount: 0,
              updateCount: 0,
              errorCount: 0
            });
            return;
          }

          const existingCodeMap = new Map<string, Item>();
          const existingNameMap = new Map<string, Item>();
          existingItems.forEach(item => {
            if (item.kodeBarang) existingCodeMap.set(item.kodeBarang.trim().toLowerCase(), item);
            if (item.namaBarang) existingNameMap.set(item.namaBarang.trim().toLowerCase(), item);
          });

          const parsedItems: ParsedImportItem[] = [];
          let validCount = 0;
          let updateCount = 0;
          let errorCount = 0;

          rawRows.forEach((row, idx) => {
            const rowNumber = idx + 2; // header is row 1, data starts at row 2

            // Normalize keys (case insensitive & trimming)
            const normalizedRow: { [key: string]: any } = {};
            Object.keys(row).forEach(key => {
              const cleanKey = key.trim().toLowerCase();
              normalizedRow[cleanKey] = row[key];
            });

            // Extract values by flexible key aliases
            const getVal = (aliases: string[]): any => {
              for (const alias of aliases) {
                const clean = alias.toLowerCase();
                for (const rowKey of Object.keys(normalizedRow)) {
                  if (rowKey === clean || rowKey.replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, '')) {
                    return normalizedRow[rowKey];
                  }
                }
              }
              return '';
            };

            const rawKode = String(getVal(['Kode Barang', 'Kode', 'Code', 'Item Code', 'ID Barang']) || '').trim();
            const rawNama = String(getVal(['Nama Barang', 'Nama', 'Item Name', 'Name', 'Deskripsi Barang']) || '').trim();
            const rawKategori = String(getVal(['Kategori', 'Category', 'Kelompok', 'Jenis Barang', 'Kategori Barang']) || '').trim();
            const rawSatuan = String(getVal(['Satuan', 'Unit', 'UOM', 'Satuan Barang']) || 'Pcs').trim();
            const rawMerk = String(getVal(['Merk / Pabrikan', 'Merk', 'Pabrikan', 'Brand', 'Pabrik', 'Produsen']) || '').trim();
            const rawSpesifikasi = String(getVal(['Spesifikasi', 'Spesifikasi Detail', 'Spec', 'Kemasan', 'Ukuran']) || '').trim();
            const rawStokMin = getVal(['Stok Minimum', 'Stok Min', 'Min Stock', 'Minimal Stok', 'Batas Minimum']);
            const rawStokAwal = getVal(['Stok Awal Gudang Besar', 'Stok Awal', 'Saldo Awal', 'Initial Stock', 'Stok Gudang Induk', 'Stok']);
            const rawKeterangan = String(getVal(['Keterangan', 'Keterangan Tambahan', 'Note', 'Notes', 'Catatan']) || '').trim();

            // Skip empty rows
            if (!rawNama && !rawKode) {
              return;
            }

            const errors: string[] = [];
            const warnings: string[] = [];

            // Validation
            if (!rawNama) {
              errors.push('Nama barang tidak boleh kosong.');
            }

            const categoryName = rawKategori || 'Umum';
            const satuanClean = rawSatuan || 'Pcs';
            const stokMinNum = Math.max(0, parseInt(String(rawStokMin), 10) || 10);
            const stokAwalNum = Math.max(0, parseInt(String(rawStokAwal), 10) || 0);

            // Check if matches existing item by Code or Name
            const matchByCode = rawKode ? existingCodeMap.get(rawKode.toLowerCase()) : undefined;
            const matchByName = existingNameMap.get(rawNama.toLowerCase());
            const existingMatch = matchByCode || matchByName;

            let isExisting = false;
            let status: 'VALID' | 'UPDATE' | 'INVALID' = 'VALID';

            if (errors.length > 0) {
              status = 'INVALID';
              errorCount++;
            } else if (existingMatch) {
              isExisting = true;
              status = 'UPDATE';
              updateCount++;
              warnings.push(`Barang sudah ada di master (${existingMatch.kodeBarang} - ${existingMatch.namaBarang}). Data akan diperbarui.`);
            } else {
              status = 'VALID';
              validCount++;
            }

            parsedItems.push({
              rowNumber,
              kodeBarang: rawKode || '',
              namaBarang: rawNama,
              kategoriNama: categoryName,
              satuan: satuanClean,
              merk: rawMerk,
              spesifikasi: rawSpesifikasi,
              stokMinimum: stokMinNum,
              stokAwalGudangBesar: stokAwalNum,
              keterangan: rawKeterangan,
              isExisting,
              status,
              errors,
              warnings
            });
          });

          resolve({
            items: parsedItems,
            totalRows: parsedItems.length,
            validCount,
            updateCount,
            errorCount
          });
        } catch (err: any) {
          reject(new Error(`Gagal membaca file Excel: ${err?.message || 'Format tidak valid'}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Gagal membaca file dari komputer Anda.'));
      };

      reader.readAsArrayBuffer(file);
    });
  }
}

