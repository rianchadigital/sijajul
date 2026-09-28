import { storageService } from './storageService';

export const generateGoogleAppsScriptCode = (spreadsheetId: string = 'SPREADSHEET_ID_ANDA'): string => {
  return `/**
 * =========================================================================================
 * 📦 SI JAJUL - PUSKESMAS KECAMATAN KEPULAUAN SERIBU SELATAN
 * Sistem Informasi Jaga Stok dan Jalur Logistik
 * BACKEND GOOGLE APPS SCRIPT (GAS) & SETUP DATABASE SPREADSHEET
 * =========================================================================================
 * Versi       : 2.5.0 (Produksi)
 * Lisensi     : Puskesmas Kepulauan Seribu Selatan - Dinkes DKI Jakarta
 * Fitur       : Multi-Island Warehouse, Automatic Database Setup, Web App JSON API,
 *               Sinkronisasi 2 Arah (Pull/Push), dan Bot Cek Saldo Real-Time.
 * =========================================================================================
 * 
 * 🚀 PETUNJUK CARA PEMASANGAN & SETUP DATABASE:
 * -----------------------------------------------------------------------------------------
 * 1. Buka Google Spreadsheet baru di browser: https://sheets.new/
 *    Beri judul spreadsheet: "DB_SIJAJUL_PUSKESMAS_KEP_SERIBU_SELATAN"
 * 
 * 2. Buka menu spreadsheet: 'Ekstensi' (Extensions) > 'Apps Script'.
 * 
 * 3. Hapus semua teks bawaan di dalam editor Code.gs, lalu SALIN & TEMPEL (PASTE)
 *    seluruh kode ini ke dalam Code.gs.
 * 
 * 4. SETUP DATABASE OTOMATIS:
 *    - Pada dropdown fungsi di toolbar Apps Script, pilih fungsi "setupDatabase"
 *    - Klik tombol "Jalankan" (Run) ▶️.
 *    - Berikan izin otorisasi Google (Klik Review Permissions > Pilih Akun > Advanced > Go to Untitled (unsafe) > Allow).
 *    - Spreadsheet Anda otomatis akan dibuatkan 12 Sheet database lengkap dengan header, warna, format kolom, dan data awal Puskesmas KSS!
 *    - ATAU: Buka tab Spreadsheet Anda, refresh (F5), lalu klik Menu Baru di atas: "📦 SI JAJUL KSS" > "⚡ 1. Setup & Inisialisasi Database Lengkap".
 * 
 * 5. DEPLOY SEBAGAI WEB APP (API):
 *    - Klik tombol biru "Terapkan" (Deploy) di pojok kanan atas > "Penerapan Baru" (New Deployment).
 *    - Klik ikon gerigi (Select type) > Pilih "Aplikasi Web" (Web App).
 *    - Deskripsi: "API Backend SI JAJUL v2.5"
 *    - Jalankan sebagai (Execute as): "Saya" (Me - email akun Anda)
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone) -> WAJIB!
 *    - Klik "Terapkan" (Deploy).
 *    - Salin "URL Aplikasi Web" (Web App URL) yang berakhiran "/exec".
 * 
 * 6. Masukkan URL tersebut ke menu "Pengaturan" > "Google Apps Script & Spreadsheet"
 *    di aplikasi SI JAJUL web Anda. Selesai!
 * =========================================================================================
 */

// ==========================================
// KONFIGURASI SISTEM
// ==========================================
var CONFIG = {
  APP_NAME: "SI JAJUL - Sistem Informasi Jaga Stok dan Jalur Logistik Puskesmas Kepulauan Seribu Selatan",
  APP_SHORT_NAME: "SI JAJUL",
  APP_VERSION: "2.5.0",
  INSTANSI: "Puskesmas Kecamatan Kepulauan Seribu Selatan",
  TIMEZONE: "Asia/Jakarta",
  HEADER_BG_COLOR: "#005e54", // Hijau Puskesmas / Teal Tua Resmi
  HEADER_FONT_COLOR: "#ffffff",
  ACCENT_BG_COLOR: "#e6f4f1"
};

/**
 * Mendapatkan referensi Spreadsheet aktif
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Menu Kustom yang muncul di toolbar Google Sheets saat file dibuka
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📦 SI JAJUL KSS')
    .addItem('⚡ 1. Setup & Inisialisasi Database Lengkap', 'setupDatabase')
    .addItem('🌱 2. Isi / Reset Data Awal Standar (Puskesmas KSS)', 'seedInitialData')
    .addSeparator()
    .addItem('📊 3. Hitung Ulang & Validasi Saldo Stok', 'recalculateStockSummary')
    .addItem('🧹 4. Bersihkan Seluruh Transaksi (Reset Transaksi)', 'clearTransactionData')
    .addSeparator()
    .addItem('🌐 5. Cek Status Koneksi & Info API Web App', 'showSpreadsheetInfo')
    .addToUi();
}

// ==============================================================================
// 1. FUNGSI SETUP DATABASE UTAMA (MEMBUAT 12 SHEET & STRUKTUR TABEL LENGKAP)
// ==============================================================================
function setupDatabase() {
  var ss = getSpreadsheet();
  
  // Definisi struktur 12 tabel database SI-GUDANG
  var databaseSchema = {
    "MASTER_BARANG": {
      headers: [
        "ID Barang", "Kode Barang", "Nama Barang", "Kategori", "Satuan", 
        "Merk / Pabrikan", "Spesifikasi", "Stok Minimum", "Status", "Keterangan"
      ],
      widths: [120, 110, 240, 140, 90, 140, 180, 100, 90, 180]
    },
    "GUDANG_PULAU": {
      headers: [
        "ID Gudang", "Kode Gudang", "Nama Gudang", "Tipe Gudang", "Lokasi Pulau", 
        "Alamat", "PIC / Penanggung Jawab", "Kontak PIC", "Status", "Keterangan"
      ],
      widths: [110, 100, 260, 130, 160, 240, 180, 120, 90, 200]
    },
    "STOK_GUDANG": {
      headers: [
        "ID Stok", "ID Gudang", "Nama Gudang", "ID Barang", "Kode Barang", 
        "Nama Barang", "Kategori", "Saldo Stok", "Satuan", "Stok Minimum", 
        "Status Stok", "Lokasi Rak", "Terakhir Diperbarui"
      ],
      widths: [110, 100, 220, 110, 110, 240, 130, 100, 90, 100, 110, 110, 150]
    },
    "PERMINTAAN_BARANG": {
      headers: [
        "ID Permintaan", "Nomor Permintaan", "Tanggal", "ID Gudang Pemohon", "Nama Gudang Pemohon", 
        "Nama Pemohon", "NIP Pemohon", "Prioritas", "Keperluan", "Status Approval", 
        "Tanggal Approval", "Catatan Verifikasi", "Total Item", "Detail Items (JSON)"
      ],
      widths: [130, 160, 110, 110, 220, 160, 130, 100, 200, 120, 130, 180, 90, 250]
    },
    "DROPPING_LOGISTIK": {
      headers: [
        "ID Dropping", "Nomor Dropping", "Nomor Permintaan", "Nomor BAST", "Tanggal Kirim", 
        "Gudang Asal", "Gudang Tujuan", "Kurir / Moda Kapal", "Status Pengiriman", 
        "Petugas Pengirim", "Petugas Penerima", "Tanggal Diterima", "Catatan", "Detail Items (JSON)"
      ],
      widths: [130, 160, 160, 160, 110, 200, 200, 140, 120, 150, 150, 120, 180, 250]
    },
    "TRANSAKSI_MUTASI": {
      headers: [
        "ID Transaksi", "Tanggal & Waktu", "Nomor Transaksi", "Tipe Transaksi", "Gudang Terkait", 
        "Kode Barang", "Nama Barang", "Jumlah Masuk", "Jumlah Keluar", "Saldo Akhir", 
        "Referensi Dokumen", "Petugas Operator", "Keterangan / Catatan"
      ],
      widths: [120, 150, 160, 120, 200, 110, 220, 100, 100, 100, 160, 150, 200]
    },
    "DOKUMEN_BAST": {
      headers: [
        "Nomor BAST", "Nomor Dropping / SBBK", "Tanggal Dokumen", "Pihak Pertama (Penyerah)", 
        "NIP Penyerah", "Jabatan Penyerah", "Pihak Kedua (Penerima)", "NIP Penerima", 
        "Jabatan Penerima", "Gudang Asal", "Gudang Tujuan", "Total Barang", "Status Dokumen"
      ],
      widths: [180, 180, 120, 170, 130, 160, 170, 130, 160, 200, 200, 100, 120]
    },
    "DOKUMEN_SBBK": {
      headers: [
        "Nomor SBBK", "Nomor Permintaan", "Tanggal Dokumen", "Gudang Pengirim", "Gudang Penerima", 
        "Kepala Puskesmas", "NIP Kepala", "Pengelola Barang", "NIP Pengelola", "Status Dokumen"
      ],
      widths: [180, 180, 120, 200, 200, 180, 130, 180, 130, 120]
    },
    "STOCK_OPNAME": {
      headers: [
        "ID Opname", "Nomor Opname", "Tanggal Pelaksanaan", "ID Gudang", "Nama Gudang", 
        "Total Item Dihitung", "Item Sesuai", "Item Selisih", "Petugas Pemeriksa", "Status", "Catatan Hasil"
      ],
      widths: [120, 160, 130, 110, 220, 120, 100, 100, 160, 110, 220]
    },
    "PENGGUNA_SISTEM": {
      headers: [
        "ID User", "NIP", "Nama Lengkap", "Jabatan", "Unit Kerja", 
        "Gudang Penugasan", "Hak Akses (Role)", "Username", "Status Akun", "No WhatsApp"
      ],
      widths: [100, 130, 180, 160, 180, 200, 140, 110, 100, 120]
    },
    "LOG_AKTIVITAS": {
      headers: [
        "ID Log", "Waktu Aktivitas", "Nama Pengguna", "Role", "Jenis Aktivitas", 
        "Modul Sistem", "Nomor Dokumen Terkait", "Deskripsi Rincian"
      ],
      widths: [110, 150, 160, 120, 140, 130, 160, 280]
    },
    "CONFIG_SISTEM": {
      headers: [
        "Kunci Pengaturan (Key)", "Nilai Pengaturan (Value)", "Kategori", "Keterangan Deskripsi", "Terakhir Diperbarui"
      ],
      widths: [180, 260, 130, 260, 150]
    }
  };

  // Buat dan format setiap sheet
  for (var sheetName in databaseSchema) {
    var sheetInfo = databaseSchema[sheetName];
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    var headers = sheetInfo.headers;
    var widths = sheetInfo.widths;

    // Set Header Values
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format Header Style
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold")
               .setFontFamily("Segoe UI")
               .setFontSize(10)
               .setBackground(CONFIG.HEADER_BG_COLOR)
               .setFontColor(CONFIG.HEADER_FONT_COLOR)
               .setHorizontalAlignment("center")
               .setVerticalAlignment("middle")
               .setWrap(true);

    sheet.setRowHeight(1, 32);
    sheet.setFrozenRows(1);

    // Set Lebar Kolom
    for (var colIdx = 0; colIdx < widths.length; colIdx++) {
      sheet.setColumnWidth(colIdx + 1, widths[colIdx]);
    }
  }

  // Hapus 'Sheet1' bawaan Google Spreadsheet jika ada
  var defaultSheet1 = ss.getSheetByName("Sheet1");
  if (defaultSheet1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet1); } catch(e) {}
  }

  // Isi data awal standar jika masih kosong
  seedInitialData();

  Logger.log("✅ Database SI-GUDANG Puskesmas Kepulauan Seribu Selatan Berhasil Dibuat!");
  return "Database SI-GUDANG Puskesmas Kepulauan Seribu Selatan Berhasil Dibuat!";
}

// ==============================================================================
// 2. FUNGSI ISI DATA AWAL (SEED MASTER DATA PUSKESMAS KEP. SERIBU SELATAN)
// ==============================================================================
function seedInitialData() {
  var ss = getSpreadsheet();

  // 1. GUDANG PULAU
  var sheetGudang = ss.getSheetByName("GUDANG_PULAU");
  if (sheetGudang && sheetGudang.getLastRow() <= 1) {
    var dataGudang = [
      ["GUD-001", "GB-KSS", "Gudang Puskesmas Kepulauan Seribu Selatan", "GUDANG_BESAR", "Pulau Tidung", "Puskesmas Kec. Kepulauan Seribu Selatan, Pulau Tidung", "Hendra Setiawan, S.Farm", "081234567890", "Aktif", "Gudang Induk & Pusat Logistik KSS"],
      ["GUD-002", "SG-TDG", "Gudang Puskesmas Tidung", "SUB_GUDANG", "Pulau Tidung", "Puskesmas Kelurahan Pulau Tidung", "Siti Rahmawati, A.Md.Keb", "081234567891", "Aktif", "Sub Gudang Layanan Pulau Tidung"],
      ["GUD-003", "SG-PRI", "Gudang Pustu Pari", "SUB_GUDANG", "Pulau Pari", "Puskesmas Pembantu (Pustu) Pulau Pari", "Ahmad Fauzi, A.Md.Kep", "081234567892", "Aktif", "Sub Gudang Layanan Pulau Pari"],
      ["GUD-004", "SG-LCG", "Gudang Pustu Lancang", "SUB_GUDANG", "Pulau Lancang", "Puskesmas Pembantu (Pustu) Pulau Lancang", "Dewi Lestari, A.Md.Farm", "081234567893", "Aktif", "Sub Gudang Layanan Pulau Lancang"],
      ["GUD-005", "SG-PYG", "Gudang Pusling Payung", "SUB_GUDANG", "Pulau Payung", "Pos Puskesmas Keliling (Pusling) Pulau Payung", "Bambang Supriyanto, S.Kep", "081234567894", "Aktif", "Sub Gudang Layanan Pulau Payung"]
    ];
    sheetGudang.getRange(2, 1, dataGudang.length, dataGudang[0].length).setValues(dataGudang);
  }

  // 2. MASTER BARANG
  var sheetBarang = ss.getSheetByName("MASTER_BARANG");
  if (sheetBarang && sheetBarang.getLastRow() <= 1) {
    var dataBarang = [
      ["ITM-001", "MED-PCT-500", "Paracetamol 500 mg Tablet", "Obat-obatan", "Tablet", "Kimia Farma", "Strip isi 10 tablet", 100, "Aktif", "Analgesik & Antipiretik Utama"],
      ["ITM-002", "MED-AMX-500", "Amoxicillin 500 mg Kapsul", "Obat-obatan", "Kapsul", "Indofarma", "Strip isi 10 kapsul", 80, "Aktif", "Antibiotik Spektrum Luas"],
      ["ITM-003", "MED-CPT-025", "Captopril 25 mg Tablet", "Obat-obatan", "Tablet", "Phapros", "Strip isi 10 tablet", 50, "Aktif", "Antihipertensi ACE Inhibitor"],
      ["ITM-004", "MED-ANT-001", "Antasida Doen Tablet Kunyah", "Obat-obatan", "Tablet", "Generic", "Botol / Strip", 80, "Aktif", "Antasida Lambung"],
      ["ITM-005", "BHP-MSK-003", "Masker Medis 3-Ply Earloop", "BHP Medis", "Box", "Sensi / Onemed", "Box isi 50 pcs", 20, "Aktif", "APD Perlindungan Pernapasan"],
      ["ITM-006", "BHP-SPT-003", "Spuit / Syringe 3 cc / 3 ml", "BHP Medis", "Pcs", "Terumo / Onemed", "Jarum steril disposable", 50, "Aktif", "Spuit Injeksi Medis"],
      ["ITM-007", "BHP-HNS-500", "Hand Sanitizer Gel 500 ml", "BHP Medis", "Botol", "Antis / Care", "Pump 500 ml", 15, "Aktif", "Desinfeksi Tangan Higienis"],
      ["ITM-008", "ATK-HVS-080", "Kertas HVS A4 80 Gram", "ATK & Kantor", "Rim", "PaperOne / Sinar Dunia", "500 Lembar / Rim", 10, "Aktif", "Kebutuhan Administrasi & Cetak"],
      ["ITM-009", "ATK-BLP-001", "Ballpoint Hitam 0.5mm", "ATK & Kantor", "Lusin", "Standard / Faster", "Pack 12 pcs", 5, "Aktif", "Alat Tulis Petugas"],
      ["ITM-010", "ALK-TNS-001", "Tensimeter Digital Tensimeter", "Alat Kesehatan", "Unit", "Omron", "Lengan otomatis", 2, "Aktif", "Pemeriksaan Tekanan Darah"]
    ];
    sheetBarang.getRange(2, 1, dataBarang.length, dataBarang[0].length).setValues(dataBarang);
  }

  // 3. STOK GUDANG
  var sheetStok = ss.getSheetByName("STOK_GUDANG");
  if (sheetStok && sheetStok.getLastRow() <= 1) {
    var tglSekarang = new Date().toLocaleString("id-ID", { timeZone: CONFIG.TIMEZONE });
    var dataStok = [
      ["STK-001", "GUD-001", "Gudang Puskesmas Kepulauan Seribu Selatan", "ITM-001", "MED-PCT-500", "Paracetamol 500 mg Tablet", "Obat-obatan", 1500, "Tablet", 100, "Aman", "Rak A1", tglSekarang],
      ["STK-002", "GUD-002", "Gudang Puskesmas Tidung", "ITM-001", "MED-PCT-500", "Paracetamol 500 mg Tablet", "Obat-obatan", 450, "Tablet", 100, "Aman", "Lemari 1", tglSekarang],
      ["STK-003", "GUD-003", "Gudang Pustu Pari", "ITM-001", "MED-PCT-500", "Paracetamol 500 mg Tablet", "Obat-obatan", 80, "Tablet", 100, "Kritis", "Rak Obat 2", tglSekarang],
      ["STK-004", "GUD-004", "Gudang Pustu Lancang", "ITM-001", "MED-PCT-500", "Paracetamol 500 mg Tablet", "Obat-obatan", 210, "Tablet", 100, "Aman", "Rak Obat 1", tglSekarang],
      ["STK-005", "GUD-005", "Gudang Pusling Payung", "ITM-001", "MED-PCT-500", "Paracetamol 500 mg Tablet", "Obat-obatan", 65, "Tablet", 100, "Kritis", "Kotak Obat", tglSekarang],
      
      ["STK-006", "GUD-001", "Gudang Puskesmas Kepulauan Seribu Selatan", "ITM-005", "BHP-MSK-003", "Masker Medis 3-Ply Earloop", "BHP Medis", 85, "Box", 20, "Aman", "Gudang APD", tglSekarang],
      ["STK-007", "GUD-002", "Gudang Puskesmas Tidung", "ITM-005", "BHP-MSK-003", "Masker Medis 3-Ply Earloop", "BHP Medis", 25, "Box", 20, "Aman", "Ruang Logistik", tglSekarang],
      ["STK-008", "GUD-003", "Gudang Pustu Pari", "ITM-005", "BHP-MSK-003", "Masker Medis 3-Ply Earloop", "BHP Medis", 12, "Box", 20, "Kritis", "Lemari APD", tglSekarang],

      ["STK-009", "GUD-001", "Gudang Puskesmas Kepulauan Seribu Selatan", "ITM-008", "ATK-HVS-080", "Kertas HVS A4 80 Gram", "ATK & Kantor", 45, "Rim", 10, "Aman", "Rak ATK Induk", tglSekarang],
      ["STK-010", "GUD-002", "Gudang Puskesmas Tidung", "ITM-008", "ATK-HVS-080", "Kertas HVS A4 80 Gram", "ATK & Kantor", 14, "Rim", 10, "Aman", "Ruang TU", tglSekarang]
    ];
    sheetStok.getRange(2, 1, dataStok.length, dataStok[0].length).setValues(dataStok);
  }

  // 4. PENGGUNA SISTEM
  var sheetUser = ss.getSheetByName("PENGGUNA_SISTEM");
  if (sheetUser && sheetUser.getLastRow() <= 1) {
    var dataUser = [
      ["USR-001", "197805122005011003", "dr. Ahmad Zulkarnain, M.KM", "Kepala Puskesmas", "Pimpinan", "Semua Gudang", "KEPALA_PUSKESMAS", "kapus", "Aktif", "081122334455"],
      ["USR-002", "198402152009021004", "Hendra Setiawan, S.Farm", "Pengelola Barang", "Logistik & Farmasi", "Gudang Besar KSS", "PENGELOLA_BARANG", "pengelola", "Aktif", "081234567890"],
      ["USR-003", "198907202014032002", "Siti Rahmawati, A.Md.Keb", "Petugas Sub Gudang Tidung", "Pelayanan Tidung", "Sub Gudang Tidung", "PETUGAS_GUDANG", "tidung", "Aktif", "081234567891"],
      ["USR-004", "199103112015021005", "Ahmad Fauzi, A.Md.Kep", "Petugas Pustu Pari", "Pelayanan Pari", "Pustu Pari", "PETUGAS_GUDANG", "pari", "Aktif", "081234567892"],
      ["USR-005", "199308192018012003", "Dewi Lestari, A.Md.Farm", "Petugas Pustu Lancang", "Pelayanan Lancang", "Pustu Lancang", "PETUGAS_GUDANG", "lancang", "Aktif", "081234567893"],
      ["USR-006", "199011052016021006", "Bambang Supriyanto, S.Kep", "Petugas Pusling Payung", "Pelayanan Payung", "Pusling Payung", "PETUGAS_GUDANG", "payung", "Aktif", "081234567894"],
      ["USR-007", "198209142006041008", "Rina Marlina, S.Sos", "Kasubag Tata Usaha", "Tata Usaha (TU)", "Semua Gudang", "KASUBAG_TU", "kasubagtu", "Aktif", "081399887766"]
    ];
    sheetUser.getRange(2, 1, dataUser.length, dataUser[0].length).setValues(dataUser);
  }

  // 5. CONFIG SISTEM
  var sheetCfg = ss.getSheetByName("CONFIG_SISTEM");
  if (sheetCfg && sheetCfg.getLastRow() <= 1) {
    var dataCfg = [
      ["NAMA_INSTANSI", "Puskesmas Kecamatan Kepulauan Seribu Selatan", "INSTANSI", "Nama Resmi Instansi Faskes", new Date().toISOString()],
      ["ALAMAT_INSTANSI", "Jl. Dermaga Pulau Tidung, Kepulauan Seribu Selatan, DKI Jakarta", "INSTANSI", "Alamat Kantor Induk", new Date().toISOString()],
      ["WHATSAPP_BOT_NAME", "SiGudang Bot Puskesmas KSS", "WHATSAPP", "Nama Robot Cek Stok WA", new Date().toISOString()],
      ["AUTO_SYNC_INTERVAL_MINUTES", "5", "SINKRONISASI", "Interval Sinkronisasi Otomatis", new Date().toISOString()],
      ["VERSION", CONFIG.APP_VERSION, "SISTEM", "Versi Skrip Database", new Date().toISOString()]
    ];
    sheetCfg.getRange(2, 1, dataCfg.length, dataCfg[0].length).setValues(dataCfg);
  }

  Logger.log("🌱 Data Awal Puskesmas Kepulauan Seribu Selatan Berhasil Diisi!");
}

// ==============================================================================
// 3. FUNGSI SINKRONISASI PUSH (MENYIMPAN DARI FRONTEND KE SPREADSHEET)
// ==============================================================================
function pushAllDataToSheets(data) {
  if (!data) return "Data tidak valid atau kosong";
  var ss = getSpreadsheet();

  function syncTable(sheetName, rows) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
    if (rows && rows.length > 0) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
  }

  // 1. Users
  if (data.users && Array.isArray(data.users)) {
    var uRows = data.users.map(function(u) {
      return [
        u.id || "", u.nip || "", u.nama || "", u.jabatan || "", u.unitKerja || "", 
        u.tempatTugas || u.gudangId || "", u.role || "", u.username || "", 
        u.statusAktif ? "Aktif" : "Nonaktif", u.noHp || ""
      ];
    });
    syncTable("PENGGUNA_SISTEM", uRows);
  }

  // 2. Gudang
  if (data.warehouses && Array.isArray(data.warehouses)) {
    var gRows = data.warehouses.map(function(g) {
      return [
        g.id || "", g.kodeGudang || "", g.namaGudang || "", g.tipeGudang || "", 
        g.lokasi || "", g.lokasi || "", g.picNama || "", "", 
        g.statusAktif ? "Aktif" : "Nonaktif", g.keterangan || ""
      ];
    });
    syncTable("GUDANG_PULAU", gRows);
  }

  // 3. Items
  if (data.items && Array.isArray(data.items)) {
    var iRows = data.items.map(function(i) {
      return [
        i.id || "", i.kodeBarang || "", i.namaBarang || "", i.kategoriNama || "", 
        i.satuan || "", i.merk || "", i.spesifikasi || "", i.stokMinimum || 0, 
        i.statusAktif ? "Aktif" : "Nonaktif", i.keterangan || ""
      ];
    });
    syncTable("MASTER_BARANG", iRows);
  }

  // 4. Stocks
  if (data.stocks && Array.isArray(data.stocks)) {
    var sRows = data.stocks.map(function(s) {
      var statusKritis = (s.saldo <= (s.stokMinimum || 10)) ? "Kritis" : "Aman";
      return [
        s.id || "", s.gudangId || "", s.gudangNama || "", s.barangId || "", 
        s.kodeBarang || "", s.barangNama || "", s.kategoriNama || "", s.saldo || 0, 
        s.satuan || "", s.stokMinimum || 0, statusKritis, s.lokasiRak || "", 
        s.updateTerakhir || new Date().toISOString()
      ];
    });
    syncTable("STOK_GUDANG", sRows);
  }

  // 5. Permintaan
  if (data.requests && Array.isArray(data.requests)) {
    var rRows = data.requests.map(function(r) {
      return [
        r.id || "", r.nomorPermintaan || "", r.tanggal || "", r.gudangPemohonId || "", 
        r.gudangPemohonNama || "", r.pemohonNama || "", r.pemohonNip || "", r.prioritas || "SEDANG", 
        r.keperluan || "", r.status || "DRAFT", r.tanggalApproval || "", r.catatan || "", 
        (r.items ? r.items.length : 0), JSON.stringify(r.items || [])
      ];
    });
    syncTable("PERMINTAAN_BARANG", rRows);
  }

  // 6. Dropping
  if (data.droppings && Array.isArray(data.droppings)) {
    var dRows = data.droppings.map(function(d) {
      return [
        d.id || "", d.nomorDropping || "", d.nomorPermintaan || "", d.nomorBast || "", 
        d.tanggalKirim || "", d.gudangAsalNama || "", d.gudangTujuanNama || "", 
        d.kurir || d.kapal || "Kapal Dinas Kesehatan", d.status || "MENUNGGU_PENGIRIMAN", 
        d.petugasPengirim || "", d.petugasPenerima || "", d.tanggalTerima || "", 
        d.catatan || "", JSON.stringify(d.items || [])
      ];
    });
    syncTable("DROPPING_LOGISTIK", dRows);
  }

  // 7. Transaksi Mutasi
  if (data.transactions && Array.isArray(data.transactions)) {
    var tRows = data.transactions.map(function(t) {
      return [
        t.id || "", t.tanggal || "", t.nomorTransaksi || "", t.jenisTransaksi || "", 
        t.gudangNama || "", t.kodeBarang || "", t.barangNama || "", t.masuk || 0, 
        t.keluar || 0, t.saldoAkhir || 0, t.referensiDokumen || "", t.userNama || "", 
        t.keterangan || ""
      ];
    });
    syncTable("TRANSAKSI_MUTASI", tRows);
  }

  // 8. Log Aktivitas
  if (data.activityLogs && Array.isArray(data.activityLogs)) {
    var lRows = data.activityLogs.map(function(l) {
      return [
        l.id || "", l.waktu || "", l.userNama || "", l.role || "", 
        l.aktivitas || "", l.modul || "", l.nomorTransaksi || "", l.keterangan || ""
      ];
    });
    syncTable("LOG_AKTIVITAS", lRows);
  }

  return "✅ Sinkronisasi Berhasil! Seluruh data lokal telah tersimpan rapi ke Google Spreadsheet pada " + 
         new Date().toLocaleString("id-ID", { timeZone: CONFIG.TIMEZONE });
}

// ==============================================================================
// 4. FUNGSI SINKRONISASI PULL (MEMBACA DARI SPREADSHEET KE FRONTEND)
// ==============================================================================
function pullAllDataFromSheets() {
  var ss = getSpreadsheet();
  var result = {};

  function readTable(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow <= 1 || lastCol < 1) return [];

    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    return data.map(function(row) {
      var item = {};
      headers.forEach(function(h, idx) {
        item[h] = row[idx];
      });
      return item;
    });
  }

  result.users = readTable("PENGGUNA_SISTEM");
  result.warehouses = readTable("GUDANG_PULAU");
  result.items = readTable("MASTER_BARANG");
  result.stocks = readTable("STOK_GUDANG");
  result.requests = readTable("PERMINTAAN_BARANG");
  result.droppings = readTable("DROPPING_LOGISTIK");
  result.transactions = readTable("TRANSAKSI_MUTASI");
  result.bast = readTable("DOKUMEN_BAST");
  result.sbbk = readTable("DOKUMEN_SBBK");
  result.logs = readTable("LOG_AKTIVITAS");
  result.config = readTable("CONFIG_SISTEM");

  return result;
}

// ==============================================================================
// 5. WEB APP JSON API ENDPOINTS (doGet & doPost)
// ==============================================================================
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
  var result = {};

  try {
    if (action === "ping" || action === "test") {
      result = {
        status: "success",
        message: "API Google Apps Script SI-GUDANG Aktif!",
        instansi: CONFIG.INSTANSI,
        version: CONFIG.APP_VERSION,
        timestamp: new Date().toISOString()
      };
    } 
    else if (action === "setupDatabase" || action === "init") {
      var msg = setupDatabase();
      result = { status: "success", message: msg };
    }
    else if (action === "pullAll" || action === "getAllData") {
      result = {
        status: "success",
        data: pullAllDataFromSheets(),
        timestamp: new Date().toISOString()
      };
    }
    else if (action === "checkStock") {
      var query = (e && e.parameter && e.parameter.query) ? e.parameter.query.toLowerCase() : "";
      var stocks = pullAllDataFromSheets().stocks || [];
      var filtered = stocks.filter(function(s) {
        var nama = (s["Nama Barang"] || "").toString().toLowerCase();
        var kode = (s["Kode Barang"] || "").toString().toLowerCase();
        var gudang = (s["Nama Gudang"] || "").toString().toLowerCase();
        return nama.indexOf(query) !== -1 || kode.indexOf(query) !== -1 || gudang.indexOf(query) !== -1;
      });
      result = { status: "success", query: query, count: filtered.length, results: filtered };
    }
    else {
      result = { status: "error", message: "Aksi GET tidak dikenali: " + action };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result = {};
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Payload request POST kosong");
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;

    if (action === "syncPush" || action === "syncAll") {
      var syncRes = pushAllDataToSheets(payload.data);
      result = { status: "success", result: syncRes };
    }
    else if (action === "setupDatabase") {
      var setupMsg = setupDatabase();
      result = { status: "success", message: setupMsg };
    }
    else if (action === "appendTransaction") {
      appendRowToTable("TRANSAKSI_MUTASI", payload.transaction);
      result = { status: "success", message: "Transaksi berhasil dicatat ke Spreadsheet" };
    }
    else if (action === "createRequest") {
      appendRowToTable("PERMINTAAN_BARANG", payload.request);
      result = { status: "success", message: "Permintaan logistik berhasil disimpan ke Spreadsheet" };
    }
    else {
      result = { status: "error", message: "Aksi POST tidak dikenali: " + action };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function appendRowToTable(sheetName, item) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(sheetName);
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = [];
  headers.forEach(function(h) {
    var val = item[h] !== undefined ? item[h] : "";
    if (typeof val === 'object') val = JSON.stringify(val);
    row.push(val);
  });
  sheet.appendRow(row);
}

// ==============================================================================
// 6. FUNGSI UTILITAS MENU SPREADSHEET
// ==============================================================================
function recalculateStockSummary() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("STOK_GUDANG");
  if (!sheet || sheet.getLastRow() <= 1) {
    SpreadsheetApp.getUi().alert("Sheet STOK_GUDANG kosong.");
    return;
  }
  var lastRow = sheet.getLastRow();
  var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  var kritisCount = 0;
  for (var i = 0; i < values.length; i++) {
    var saldo = Number(values[i][7]) || 0;
    var min = Number(values[i][9]) || 0;
    var status = (saldo <= min) ? "Kritis" : "Aman";
    values[i][10] = status;
    if (status === "Kritis") kritisCount++;
  }
  sheet.getRange(2, 1, values.length, values[0].length).setValues(values);

  SpreadsheetApp.getUi().alert(
    "📊 Rekapitulasi Selesai!\\n\\n" +
    "Total Baris Stok: " + values.length + "\\n" +
    "Stok Status Kritis: " + kritisCount + " item\\n" +
    "Status Aman: " + (values.length - kritisCount) + " item"
  );
}

function clearTransactionData() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    "⚠️ PERINGATAN RESET TRANSAKSI",
    "Apakah Anda yakin ingin mengosongkan riwayat mutasi transaksi, permintaan, dan dropping?\\n(Master barang & gudang akan tetap aman).",
    ui.ButtonSet.YES_NO
  );

  if (confirm === ui.Button.YES) {
    var ss = getSpreadsheet();
    var sheetsToClear = ["PERMINTAAN_BARANG", "DROPPING_LOGISTIK", "TRANSAKSI_MUTASI", "DOKUMEN_BAST", "DOKUMEN_SBBK", "LOG_AKTIVITAS"];
    sheetsToClear.forEach(function(name) {
      var sheet = ss.getSheetByName(name);
      if (sheet && sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
      }
    });
    ui.alert("Riwayat transaksi telah dibersihkan.");
  }
}

function showSpreadsheetInfo() {
  SpreadsheetApp.getUi().alert(
    "📦 " + CONFIG.APP_NAME + "\\n" +
    "Versi Database: " + CONFIG.APP_VERSION + "\\n" +
    "Instansi: " + CONFIG.INSTANSI + "\\n\\n" +
    "Status: Siap terhubung ke Web App SI-GUDANG Puskesmas Kepulauan Seribu Selatan."
  );
}
`;
};

export class GasService {
  static getConfig(): { webAppUrl: string; spreadsheetId: string; autoSync: boolean; lastSyncTime?: string; status: 'CONNECTED' | 'OFFLINE' } {
    const sheetsCfg = storageService.getSheetsConfig();
    return {
      webAppUrl: sheetsCfg.gasDeploymentUrl || '',
      spreadsheetId: sheetsCfg.spreadsheetId || '',
      autoSync: sheetsCfg.autoSync || false,
      lastSyncTime: sheetsCfg.lastSyncTime,
      status: sheetsCfg.isConnected ? 'CONNECTED' : 'OFFLINE'
    };
  }

  static saveConfig(config: { webAppUrl?: string; spreadsheetId?: string; autoSync?: boolean; status?: 'CONNECTED' | 'OFFLINE' }): void {
    const current = storageService.getSheetsConfig();
    if (config.webAppUrl !== undefined) current.gasDeploymentUrl = config.webAppUrl;
    if (config.spreadsheetId !== undefined) current.spreadsheetId = config.spreadsheetId;
    if (config.autoSync !== undefined) current.autoSync = config.autoSync;
    if (config.status !== undefined) current.isConnected = config.status === 'CONNECTED';
    storageService.saveSheetsConfig(current);
  }

  static async syncAllData(): Promise<{ success: boolean; message: string }> {
    const cfg = storageService.getSheetsConfig();
    return this.pushToSheets(cfg.gasDeploymentUrl);
  }

  static async triggerRemoteDatabaseSetup(webAppUrl: string): Promise<{ success: boolean; message: string }> {
    if (!webAppUrl || !webAppUrl.startsWith('http')) {
      return { success: false, message: 'URL Web App Google Apps Script belum valid.' };
    }
    try {
      const response = await fetch(`${webAppUrl}?action=setupDatabase`, { method: 'GET', mode: 'cors' });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return {
        success: data.status === 'success',
        message: data.message || 'Database Spreadsheet berhasil diinisialisasi secara otomatis!'
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Gagal remote setup database: ${e.message || 'Pastikan Web App memiliki akses Anyone.'}`
      };
    }
  }

  static async testConnection(webAppUrl: string): Promise<{ success: boolean; message: string }> {
    if (!webAppUrl || !webAppUrl.startsWith('http')) {
      return { success: false, message: 'URL Web App Google Apps Script belum valid.' };
    }
    try {
      const response = await fetch(`${webAppUrl}?action=ping`, { method: 'GET', mode: 'cors' });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return { 
        success: data.status === 'success', 
        message: data.message || 'Koneksi ke Google Apps Script berhasil!' 
      };
    } catch (e: any) {
      return { 
        success: false, 
        message: `Gagal terhubung ke GAS: ${e.message || 'Pastikan deployment Web App memiliki akses "Anyone" dan CORS diizinkan.'}` 
      };
    }
  }

  static async pushToSheets(webAppUrl: string): Promise<{ success: boolean; message: string }> {
    if (!webAppUrl || !webAppUrl.startsWith('http')) {
      return { success: false, message: 'URL Web App belum diatur di Pengaturan.' };
    }
    try {
      const payload = {
        action: 'syncPush',
        data: {
          users: storageService.getUsers(),
          warehouses: storageService.getWarehouses(),
          categories: storageService.getCategories(),
          items: storageService.getItems(),
          stocks: storageService.getStocks(),
          requests: storageService.getRequests(),
          droppings: storageService.getDroppings(),
          transactions: storageService.getTransactions(),
          activityLogs: storageService.getActivityLogs()
        }
      };

      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // Avoid preflight CORS issues in GAS
        body: JSON.stringify(payload)
      });

      const resJson = await response.json();
      if (resJson.status === 'success') {
        const cfg = storageService.getSheetsConfig();
        cfg.lastSyncTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
        cfg.isConnected = true;
        storageService.saveSheetsConfig(cfg);
        storageService.logActivity('Sinkronisasi Google Spreadsheet', 'PENGATURAN', 'Berhasil push data lokal ke Google Sheets');
        return { success: true, message: resJson.result || 'Data berhasil dikirim ke Google Spreadsheet!' };
      } else {
        return { success: false, message: resJson.message || 'Gagal sinkronisasi data.' };
      }
    } catch (e: any) {
      return { success: false, message: `Error sinkronisasi: ${e.message}` };
    }
  }

  static async pullFromSheets(webAppUrl: string): Promise<{ success: boolean; data?: any; message: string }> {
    if (!webAppUrl || !webAppUrl.startsWith('http')) {
      return { success: false, message: 'URL Web App belum diatur di Pengaturan.' };
    }
    try {
      const response = await fetch(`${webAppUrl}?action=pullAll`, { method: 'GET', mode: 'cors' });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      const resJson = await response.json();
      if (resJson.status === 'success' && resJson.data) {
        return {
          success: true,
          data: resJson.data,
          message: 'Data berhasil ditarik dari Google Spreadsheet!'
        };
      } else {
        return {
          success: false,
          message: resJson.message || 'Gagal mengambil data dari Google Spreadsheet.'
        };
      }
    } catch (e: any) {
      return {
        success: false,
        message: `Gagal tarik data dari Spreadsheet: ${e.message || 'Periksa koneksi dan izin deploy Web App.'}`
      };
    }
  }

  static async syncUsersFromSheets(): Promise<{ success: boolean; count?: number; message: string }> {
    const cfg = storageService.getSheetsConfig();
    if (!cfg.gasDeploymentUrl) {
      return {
        success: false,
        message: 'URL Web App Google Apps Script belum diisi di menu Pengaturan.'
      };
    }
    const pullResult = await this.pullFromSheets(cfg.gasDeploymentUrl);
    if (!pullResult.success || !pullResult.data) {
      return { success: false, message: pullResult.message };
    }
    const sheetUsers = pullResult.data.users || [];
    if (!Array.isArray(sheetUsers) || sheetUsers.length === 0) {
      return { success: false, message: 'Sheet PENGGUNA_SISTEM kosong atau tidak memiliki baris data.' };
    }
    const importRes = storageService.importUsersFromSpreadsheetRows(sheetUsers);
    return {
      success: true,
      count: importRes.importedCount + importRes.updatedCount,
      message: importRes.message
    };
  }
}

export const gasService = GasService;
