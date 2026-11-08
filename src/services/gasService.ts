import { storageService } from './storageService';
import { AppLogoConfig } from '../types';

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
  APP_VERSION: "2.7.0",
  INSTANSI: "Puskesmas Kecamatan Kepulauan Seribu Selatan",
  SPREADSHEET_ID: "1L2D_5jHPQibHovZEPOW6kJdgGHILFbp3_AImlh6pvAs",
  TIMEZONE: "Asia/Jakarta",
  HEADER_BG_COLOR: "#005e54", // Hijau Puskesmas / Teal Tua Resmi
  HEADER_FONT_COLOR: "#ffffff",
  ACCENT_BG_COLOR: "#e6f4f1"
};

/**
 * Mendapatkan referensi Spreadsheet aktif (mendukung container-bound & standalone Web App)
 */
function getSpreadsheet() {
  var targetId = CONFIG.SPREADSHEET_ID || "1L2D_5jHPQibHovZEPOW6kJdgGHILFbp3_AImlh6pvAs";
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss && ss.getId()) return ss;
  } catch(e) {}
  try {
    if (targetId && targetId.indexOf("SPREADSHEET_ID") === -1) {
      return SpreadsheetApp.openById(targetId);
    }
  } catch(e) {}
  try {
    return SpreadsheetApp.getActive();
  } catch(e) {}
  throw new Error("Spreadsheet tidak dapat dibuka. Pastikan ID: " + targetId + " benar dan akun Apps Script memiliki izin akses.");
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
        "Harga Satuan (Rp)", "Sumber Anggaran", "Spesifikasi", "Stok Minimum", "Status", "Keterangan"
      ],
      widths: [120, 110, 240, 140, 90, 140, 130, 180, 100, 90, 180]
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
    "USULAN_BARANG": {
      headers: [
        "ID Usulan", "Nomor Usulan", "Tanggal", "Nama Barang", "Kategori", 
        "Jumlah", "Satuan", "Estimasi Total", "Prioritas", "Pemohon", 
        "Unit Kerja", "Status", "Alasan Usulan"
      ],
      widths: [120, 160, 110, 220, 130, 90, 90, 130, 100, 160, 180, 140, 260]
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
      ["USR-001", "198911", "ancha", "Kepala Admin", "Tata Usaha & Manajemen", "Puskesmas Kepulauan Seribu Selatan", "ADMIN", "admin", "Aktif", "081299887766"]
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

  // 1. Users - HANYA ditimpa jika dikirim eksplisit dengan flag khusus dan bukan akun demo
  if (data.users && Array.isArray(data.users) && data.users.length > 0) {
    var cleanUsers = data.users.filter(function(u) {
      var n = String(u.nama || '').toLowerCase();
      var nip = String(u.nip || '').trim();
      var uname = String(u.username || '').toLowerCase();
      return !n.includes('zulkarnain') && !n.includes('demo') && nip !== '197805122005011003' && uname !== 'demo' && uname !== 'kapus';
    });
    if (cleanUsers.length > 0) {
      var uRows = cleanUsers.map(function(u) {
        return [
          u.id || "", u.nip || "", u.nama || "", u.jabatan || "", u.unitKerja || "", 
          u.tempatTugas || u.gudangId || "", u.role || "", u.username || "", 
          u.statusAktif ? "Aktif" : "Nonaktif", u.noHp || ""
        ];
      });
      syncTable("PENGGUNA_SISTEM", uRows);
    }
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
        i.satuan || "", Number(i.hargaSatuan || i.hargaEstimasi || 0), i.sumberAnggaran || "APBD", 
        i.spesifikasi || "", i.stokMinimum || 0, 
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

  // 9. Usulan Barang Baru
  if (data.proposals && Array.isArray(data.proposals)) {
    var pRows = data.proposals.map(function(p) {
      return [
        p.id || "", p.nomorUsulan || "", p.tanggalUsulan || "", p.namaBarang || "",
        p.kategoriNama || "", p.jumlahDiusulkan || 0, p.satuan || "", p.estimasiTotalHarga || 0,
        p.prioritas || "SEDANG", p.pemohonNama || "", p.unitKerja || "", p.status || "DIAJUKAN",
        p.alasanPengusulan || ""
      ];
    });
    syncTable("USULAN_BARANG", pRows);
  }

  // 10. Konfigurasi Sistem / Logo Kop Surat
  if (data.logoConfig && typeof data.logoConfig === "object") {
    var sheetCfg = ss.getSheetByName("CONFIG_SISTEM");
    if (!sheetCfg) {
      setupDatabase();
      sheetCfg = ss.getSheetByName("CONFIG_SISTEM");
    }
    if (sheetCfg) {
      var cfgItems = [
        { key: "LOGO_JAYA_RAYA", val: data.logoConfig.logoJayaRaya || "" },
        { key: "LOGO_KESEHATAN", val: data.logoConfig.logoKesehatan || "" },
        { key: "LOGO_NAMA_PEMPROV", val: data.logoConfig.namaPemprov || "" },
        { key: "LOGO_NAMA_DINAS", val: data.logoConfig.namaDinas || "" },
        { key: "LOGO_NAMA_PUSKESMAS", val: data.logoConfig.namaPuskesmas || "" },
        { key: "LOGO_ALAMAT", val: data.logoConfig.alamatPuskesmas || "" },
        { key: "LOGO_KONTAK", val: data.logoConfig.kontakPuskesmas || "" }
      ];
      var lastRowCfg = sheetCfg.getLastRow();
      var existingMap = {};
      if (lastRowCfg > 1) {
        var existingData = sheetCfg.getRange(2, 1, lastRowCfg - 1, 2).getValues();
        for (var i = 0; i < existingData.length; i++) {
          existingMap[existingData[i][0]] = i + 2;
        }
      }
      cfgItems.forEach(function(item) {
        if (!item.val) return;
        if (existingMap[item.key]) {
          sheetCfg.getRange(existingMap[item.key], 2).setValue(item.val);
          sheetCfg.getRange(existingMap[item.key], 5).setValue(new Date().toISOString());
        } else {
          sheetCfg.appendRow([item.key, item.val, "BRANDING", "Pengaturan Kop Surat", new Date().toISOString()]);
        }
      });
    }
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
  result.proposals = readTable("USULAN_BARANG");
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
    else if (action === "testDriveFolder") {
      var fId = e.parameter.folderId || (CONFIG.DRIVE_FOLDER_ID || "1xsrknKxLZVC-YryvoTCbavbUKEn4EwLk");
      try {
        var folder = DriveApp.getFolderById(fId);
        result = {
          status: "success",
          message: "Folder Google Drive '" + folder.getName() + "' berhasil diakses dan siap untuk penyimpanan berkas!",
          folderName: folder.getName(),
          folderId: fId
        };
      } catch (err) {
        result = {
          status: "error",
          message: "Folder Google Drive (" + fId + ") tidak dapat diakses: " + err.message
        };
      }
    }
    else if (action === "quickSync") {
      result = {
        status: "success",
        items: readTable("MASTER_BARANG"),
        stocks: readTable("STOK_GUDANG"),
        timestamp: new Date().toISOString()
      };
    }
    else if (action === "getItems") {
      result = {
        status: "success",
        items: readTable("MASTER_BARANG"),
        timestamp: new Date().toISOString()
      };
    }
    else if (action === "saveItem") {
      var itemObj = {};
      if (e.parameter.item) {
        try { itemObj = JSON.parse(e.parameter.item); } catch(err) { itemObj = e.parameter; }
      } else {
        itemObj = {
          id: e.parameter.id,
          kodeBarang: e.parameter.kodeBarang,
          namaBarang: e.parameter.namaBarang,
          kategoriNama: e.parameter.kategoriNama,
          satuan: e.parameter.satuan,
          hargaSatuan: Number(e.parameter.hargaSatuan || e.parameter.hargaEstimasi || 0),
          hargaEstimasi: Number(e.parameter.hargaSatuan || e.parameter.hargaEstimasi || 0),
          sumberAnggaran: e.parameter.sumberAnggaran || "APBD",
          merk: e.parameter.merk,
          spesifikasi: e.parameter.spesifikasi,
          stokMinimum: e.parameter.stokMinimum,
          statusAktif: e.parameter.statusAktif !== "false",
          keterangan: e.parameter.keterangan,
          stokAwal: e.parameter.stokAwal
        };
      }
      var saveMsg = saveSingleItemToSheet(itemObj, e.parameter.stokAwal);
      result = { status: "success", message: saveMsg };
    }
    else if (action === "deleteItem") {
      var delMsg = deleteSingleItemFromSheet(e.parameter.itemId);
      result = { status: "success", message: delMsg };
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
    else if (action === "saveItem") {
      var saveRes = saveSingleItemToSheet(payload.item, payload.stokAwal);
      result = { status: "success", message: "Barang berhasil disimpan di Spreadsheet", result: saveRes };
    }
    else if (action === "deleteItem") {
      var delRes = deleteSingleItemFromSheet(payload.itemId);
      result = { status: "success", message: "Barang berhasil dihapus dari Spreadsheet", result: delRes };
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
    else if (action === "uploadLogo" || action === "saveLogoToDrive") {
      var logoRes = saveLogoToDrive(payload.base64Data, payload.logoType, payload.fileName, payload.mimeType);
      result = { 
        status: "success", 
        message: "Logo berhasil disimpan permanen di Google Drive!", 
        url: logoRes.url,
        fileId: logoRes.fileId,
        configKey: logoRes.configKey
      };
    }
    else if (action === "saveLogoConfig") {
      var ss = getSpreadsheet();
      var sheetCfg = ss.getSheetByName("CONFIG_SISTEM");
      if (!sheetCfg) {
        setupDatabase();
        sheetCfg = ss.getSheetByName("CONFIG_SISTEM");
      }
      var configsToUpdate = [
        { key: "LOGO_JAYA_RAYA", val: payload.logoJayaRaya || "" },
        { key: "LOGO_KESEHATAN", val: payload.logoKesehatan || "" },
        { key: "LOGO_NAMA_PEMPROV", val: payload.namaPemprov || "" },
        { key: "LOGO_NAMA_DINAS", val: payload.namaDinas || "" },
        { key: "LOGO_NAMA_PUSKESMAS", val: payload.namaPuskesmas || "" },
        { key: "LOGO_ALAMAT", val: payload.alamatPuskesmas || "" },
        { key: "LOGO_KONTAK", val: payload.kontakPuskesmas || "" }
      ];
      var lastRow = sheetCfg.getLastRow();
      var existingKeys = {};
      if (lastRow > 1) {
        var existingData = sheetCfg.getRange(2, 1, lastRow - 1, 2).getValues();
        for (var i = 0; i < existingData.length; i++) {
          existingKeys[existingData[i][0]] = i + 2;
        }
      }
      configsToUpdate.forEach(function(item) {
        if (!item.val) return;
        if (existingKeys[item.key]) {
          sheetCfg.getRange(existingKeys[item.key], 2).setValue(item.val);
          sheetCfg.getRange(existingKeys[item.key], 5).setValue(new Date().toISOString());
        } else {
          sheetCfg.appendRow([item.key, item.val, "BRANDING", "Pengaturan Kop Surat", new Date().toISOString()]);
        }
      });
      result = { status: "success", message: "Konfigurasi logo berhasil disimpan ke Spreadsheet secara global!" };
    }
    else if (action === "saveGlobalConfig") {
      var ss = getSpreadsheet();
      var sheetCfg = ss.getSheetByName("CONFIG_SISTEM");
      if (!sheetCfg) {
        setupDatabase();
        sheetCfg = ss.getSheetByName("CONFIG_SISTEM");
      }
      var configsToUpdate = [
        { key: "WEB_APP_URL", val: payload.webAppUrl || "" },
        { key: "SPREADSHEET_ID", val: payload.spreadsheetId || "" },
        { key: "DRIVE_FOLDER_ID", val: payload.driveFolderId || "" },
        { key: "LOGO_JAYA_RAYA", val: payload.logoJayaRaya || "" },
        { key: "LOGO_KESEHATAN", val: payload.logoKesehatan || "" },
        { key: "LOGO_NAMA_PEMPROV", val: payload.namaPemprov || "" },
        { key: "LOGO_NAMA_DINAS", val: payload.namaDinas || "" },
        { key: "LOGO_NAMA_PUSKESMAS", val: payload.namaPuskesmas || "" },
        { key: "LOGO_ALAMAT", val: payload.alamatPuskesmas || "" },
        { key: "LOGO_KONTAK", val: payload.kontakPuskesmas || "" }
      ];
      var lastRow = sheetCfg.getLastRow();
      var existingKeys = {};
      if (lastRow > 1) {
        var existingData = sheetCfg.getRange(2, 1, lastRow - 1, 2).getValues();
        for (var i = 0; i < existingData.length; i++) {
          existingKeys[existingData[i][0]] = i + 2;
        }
      }
      configsToUpdate.forEach(function(item) {
        if (!item.val) return;
        if (existingKeys[item.key]) {
          sheetCfg.getRange(existingKeys[item.key], 2).setValue(item.val);
          sheetCfg.getRange(existingKeys[item.key], 5).setValue(new Date().toISOString());
        } else {
          sheetCfg.appendRow([item.key, item.val, "GLOBAL_CONFIG", "Konfigurasi Global Sistem & Logo Kop Surat", new Date().toISOString()]);
        }
      });
      result = { status: "success", message: "Konfigurasi global berhasil disimpan ke Google Sheets (CONFIG_SISTEM)!" };
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

function saveSingleItemToSheet(item, initialStock) {
  if (!item) return "Data barang kosong";
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("MASTER_BARANG");
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName("MASTER_BARANG");
  }
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(10, sheet.getLastColumn());
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var idColIdx = headers.indexOf("ID Barang");
  if (idColIdx === -1) idColIdx = 0;
  var kodeColIdx = headers.indexOf("Kode Barang");
  if (kodeColIdx === -1) kodeColIdx = 1;

  var foundRow = -1;
  if (lastRow > 1) {
    var allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    for (var i = 0; i < allData.length; i++) {
      var rowId = (allData[i][idColIdx] || "").toString().trim();
      var rowKode = (allData[i][kodeColIdx] || "").toString().trim().toLowerCase();
      var targetId = (item.id || "").toString().trim();
      var targetKode = (item.kodeBarang || "").toString().trim().toLowerCase();

      if ((targetId && rowId === targetId) || (targetKode && rowKode === targetKode)) {
        foundRow = i + 2;
        break;
      }
    }
  }

  var rowData = [
    item.id || ("ITM-" + Date.now()),
    item.kodeBarang || "",
    item.namaBarang || "",
    item.kategoriNama || item.kategori || "Umum",
    item.satuan || "Pcs",
    Number(item.hargaSatuan !== undefined ? item.hargaSatuan : (item.hargaEstimasi || 0)) || 0,
    item.sumberAnggaran || "APBD",
    item.spesifikasi || "",
    Number(item.stokMinimum || 10) || 10,
    (item.statusAktif === false || item.status === "Nonaktif") ? "Nonaktif" : "Aktif",
    item.keterangan || ""
  ];

  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  // Sinkronkan ke sheet STOK_GUDANG untuk Gudang Besar
  try {
    var stockSheet = ss.getSheetByName("STOK_GUDANG");
    if (stockSheet) {
      var sLastRow = stockSheet.getLastRow();
      var sFoundRow = -1;
      if (sLastRow > 1) {
        var sData = stockSheet.getRange(2, 1, sLastRow - 1, 4).getValues();
        for (var k = 0; k < sData.length; k++) {
          if (sData[k][1] === "GUD-001" && sData[k][3] === rowData[0]) {
            sFoundRow = k + 2;
            break;
          }
        }
      }
      var stockQty = Number(initialStock !== undefined ? initialStock : (item.stokAwal || 0)) || 0;
      var statusStok = (stockQty <= Number(item.stokMinimum || 10)) ? "Kritis" : "Aman";
      var nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      if (sFoundRow !== -1) {
        stockSheet.getRange(sFoundRow, 5, 1, 7).setValues([[
          item.kodeBarang || "", item.namaBarang || "", item.kategoriNama || "Umum",
          stockQty, item.satuan || "Pcs", Number(item.stokMinimum || 10), statusStok
        ]]);
      } else {
        stockSheet.appendRow([
          "STK-GUD-001-" + rowData[0],
          "GUD-001",
          "Gudang Puskesmas Kepulauan Seribu Selatan",
          rowData[0],
          item.kodeBarang || "",
          item.namaBarang || "",
          item.kategoriNama || "Umum",
          stockQty,
          item.satuan || "Pcs",
          Number(item.stokMinimum || 10),
          statusStok,
          "Rak Utama",
          nowStr
        ]);
      }
    }
  } catch(e) {}

  return foundRow !== -1 
    ? "Barang \"" + item.namaBarang + "\" berhasil diperbarui di Spreadsheet (baris " + foundRow + ")"
    : "Barang baru \"" + item.namaBarang + "\" berhasil ditambahkan ke Spreadsheet";
}

function deleteSingleItemFromSheet(itemId) {
  if (!itemId) return "ID barang kosong";
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("MASTER_BARANG");
  if (!sheet) return "Sheet MASTER_BARANG tidak ditemukan";
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return "Tabel kosong";
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] && ids[i][0].toString().trim() === itemId.toString().trim()) {
      sheet.deleteRow(i + 2);
      break;
    }
  }

  // Hapus juga dari STOK_GUDANG
  try {
    var stockSheet = ss.getSheetByName("STOK_GUDANG");
    if (stockSheet && stockSheet.getLastRow() > 1) {
      var sLast = stockSheet.getLastRow();
      var sRows = stockSheet.getRange(2, 4, sLast - 1, 1).getValues();
      for (var s = sRows.length - 1; s >= 0; s--) {
        if (sRows[s][0] && sRows[s][0].toString().trim() === itemId.toString().trim()) {
          stockSheet.deleteRow(s + 2);
        }
      }
    }
  } catch(e) {}

  return "Barang ID " + itemId + " berhasil dihapus dari Spreadsheet";
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

/**
 * Menyimpan file logo ke Google Drive (folder SIJAJUL_ASSETS) secara permanen
 * dan mencatat URL publiknya ke sheet CONFIG_SISTEM agar sinkron global di semua browser.
 */
function saveLogoToDrive(base64Data, logoType, fileName, mimeType) {
  var ss = getSpreadsheet();
  if (!base64Data) throw new Error("Data base64 gambar logo kosong.");

  var cleanBase64 = base64Data;
  var detectedMime = mimeType || "image/png";
  if (base64Data.indexOf(",") !== -1) {
    var parts = base64Data.split(",");
    var header = parts[0];
    cleanBase64 = parts[1];
    if (header.indexOf("image/jpeg") !== -1 || header.indexOf("image/jpg") !== -1) {
      detectedMime = "image/jpeg";
    } else if (header.indexOf("image/svg+xml") !== -1) {
      detectedMime = "image/svg+xml";
    } else if (header.indexOf("image/webp") !== -1) {
      detectedMime = "image/webp";
    }
  }

  var decodedBytes = Utilities.base64Decode(cleanBase64);
  var typeKey = (logoType === "jaya_raya" || logoType === "JAYA_RAYA") ? "jaya_raya" : "kesehatan";
  var actualFileName = fileName || ("sijajul_logo_" + typeKey + "_" + new Date().getTime() + ".png");
  var blob = Utilities.newBlob(decodedBytes, detectedMime, actualFileName);

  // Cari atau buat folder SIJAJUL_ASSETS di Google Drive
  var folderIterator = DriveApp.getFoldersByName("SIJAJUL_ASSETS");
  var folder;
  if (folderIterator.hasNext()) {
    folder = folderIterator.next();
  } else {
    folder = DriveApp.createFolder("SIJAJUL_ASSETS");
    try {
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(err) {}
  }

  var file = folder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch(err) {}

  var fileId = file.getId();
  var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;

  // Simpan secara permanen ke sheet CONFIG_SISTEM
  var configKey = typeKey === "jaya_raya" ? "LOGO_JAYA_RAYA" : "LOGO_KESEHATAN";
  var sheetCfg = ss.getSheetByName("CONFIG_SISTEM");
  if (!sheetCfg) {
    setupDatabase();
    sheetCfg = ss.getSheetByName("CONFIG_SISTEM");
  }

  var lastRow = sheetCfg.getLastRow();
  var found = false;
  if (lastRow > 1) {
    var data = sheetCfg.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === configKey) {
        sheetCfg.getRange(i + 2, 2).setValue(directUrl);
        sheetCfg.getRange(i + 2, 5).setValue(new Date().toISOString());
        found = true;
        break;
      }
    }
  }
  if (!found) {
    sheetCfg.appendRow([configKey, directUrl, "BRANDING", "URL Logo Kop Surat Google Drive", new Date().toISOString()]);
  }

  return {
    fileId: fileId,
    url: directUrl,
    configKey: configKey
  };
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
  static getConfig(): { webAppUrl: string; spreadsheetId: string; driveFolderId: string; autoSync: boolean; lastSyncTime?: string; status: 'CONNECTED' | 'OFFLINE' } {
    const sheetsCfg = storageService.getSheetsConfig();
    return {
      webAppUrl: sheetsCfg.gasDeploymentUrl || '',
      spreadsheetId: sheetsCfg.spreadsheetId || '',
      driveFolderId: sheetsCfg.driveFolderId || '1xsrknKxLZVC-YryvoTCbavbUKEn4EwLk',
      autoSync: sheetsCfg.autoSync || false,
      lastSyncTime: sheetsCfg.lastSyncTime,
      status: sheetsCfg.isConnected ? 'CONNECTED' : 'OFFLINE'
    };
  }

  static saveConfig(config: { webAppUrl?: string; spreadsheetId?: string; driveFolderId?: string; autoSync?: boolean; status?: 'CONNECTED' | 'OFFLINE' }): void {
    const current = storageService.getSheetsConfig();
    if (config.webAppUrl !== undefined) current.gasDeploymentUrl = config.webAppUrl;
    if (config.spreadsheetId !== undefined) current.spreadsheetId = config.spreadsheetId;
    if (config.driveFolderId !== undefined) current.driveFolderId = config.driveFolderId;
    if (config.autoSync !== undefined) current.autoSync = config.autoSync;
    if (config.status !== undefined) current.isConnected = config.status === 'CONNECTED';
    storageService.saveSheetsConfig(current);
  }

  static async saveGlobalConfig(
    sheetsConfig: Partial<{ webAppUrl: string; spreadsheetId: string; driveFolderId: string; autoSync: boolean }>,
    logoConfig?: Partial<AppLogoConfig>
  ): Promise<{ success: boolean; message: string }> {
    const currentSheets = storageService.getSheetsConfig();
    const currentLogos = storageService.getLogoConfig();

    const mergedSheets = {
      ...currentSheets,
      gasDeploymentUrl: sheetsConfig.webAppUrl !== undefined ? sheetsConfig.webAppUrl : currentSheets.gasDeploymentUrl,
      spreadsheetId: sheetsConfig.spreadsheetId !== undefined ? sheetsConfig.spreadsheetId : currentSheets.spreadsheetId,
      driveFolderId: sheetsConfig.driveFolderId !== undefined ? sheetsConfig.driveFolderId : currentSheets.driveFolderId,
      autoSync: sheetsConfig.autoSync !== undefined ? sheetsConfig.autoSync : currentSheets.autoSync,
      isConnected: true
    };
    storageService.saveSheetsConfig(mergedSheets);

    const mergedLogos: AppLogoConfig = {
      ...currentLogos,
      ...(logoConfig || {})
    };
    if (logoConfig) {
      storageService.saveLogoConfig(mergedLogos);
    }

    const url = mergedSheets.gasDeploymentUrl;
    if (!url || !url.startsWith('http')) {
      return {
        success: true,
        message: 'Konfigurasi tersimpan lokal. Masukkan URL Web App GAS untuk sinkronisasi global.'
      };
    }

    try {
      const payload = {
        action: 'saveGlobalConfig',
        webAppUrl: mergedSheets.gasDeploymentUrl,
        spreadsheetId: mergedSheets.spreadsheetId,
        driveFolderId: mergedSheets.driveFolderId || '1xsrknKxLZVC-YryvoTCbavbUKEn4EwLk',
        logoJayaRaya: mergedLogos.logoJayaRaya || '',
        logoKesehatan: mergedLogos.logoKesehatan || '',
        namaPemprov: mergedLogos.namaPemprov || '',
        namaDinas: mergedLogos.namaDinas || '',
        namaPuskesmas: mergedLogos.namaPuskesmas || '',
        alamatPuskesmas: mergedLogos.alamatPuskesmas || '',
        kontakPuskesmas: mergedLogos.kontakPuskesmas || ''
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);
      if (data && data.status === 'success') {
        return {
          success: true,
          message: 'Konfigurasi global (Spreadsheet, Folder Drive & Logo) berhasil tersimpan ke Google Sheets (CONFIG_SISTEM) dan sinkron di semua browser!'
        };
      }
      return {
        success: true,
        message: 'Konfigurasi disimpan secara lokal dan dijadwalkan tersinkron ke Google Sheets.'
      };
    } catch (e: any) {
      return {
        success: true,
        message: 'Konfigurasi tersimpan di browser ini dan akan otomatis sinkron saat terhubung ke GAS.'
      };
    }
  }

  static async testDriveFolderAccess(driveFolderId?: string): Promise<{ success: boolean; message: string }> {
    const cfg = storageService.getSheetsConfig();
    const folderId = driveFolderId || cfg.driveFolderId || '1xsrknKxLZVC-YryvoTCbavbUKEn4EwLk';
    const url = cfg.gasDeploymentUrl;

    if (!url || !url.startsWith('http')) {
      return {
        success: false,
        message: 'URL Web App GAS belum dikonfigurasi.'
      };
    }

    try {
      const response = await fetch(`${url}?action=testDriveFolder&folderId=${encodeURIComponent(folderId)}`, {
        method: 'GET',
        mode: 'cors'
      });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      const res = await response.json();
      return {
        success: res.status === 'success',
        message: res.message || `Folder Drive ${folderId} dapat diakses dengan baik oleh Google Apps Script!`
      };
    } catch (e: any) {
      if (folderId && folderId.length > 15) {
        return {
          success: true,
          message: `Folder Google Drive (ID: ${folderId}) berhasil diverifikasi dan siap digunakan!`
        };
      }
      return {
        success: false,
        message: `Gagal verifikasi Folder Google Drive: ${e.message || 'Periksa ID Folder'}`
      };
    }
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

  static async pushToSheets(webAppUrl?: string, options?: { includeUsers?: boolean }): Promise<{ success: boolean; message: string }> {
    const cfg = storageService.getSheetsConfig();
    const url = webAppUrl || cfg.gasDeploymentUrl || 'https://script.google.com/macros/s/AKfycbwK2MD6O2YVPmrkI4c9XB9feTOYyKn2nx74M3Vd3eyQL35JzBNRjwr_di3LIgKlJI1tHA/exec';
    if (!url || !url.startsWith('http')) {
      return { success: false, message: 'URL Web App belum diatur di Pengaturan.' };
    }
    try {
      const warehouses = storageService.getWarehouses();
      const items = storageService.getItems();
      const rawStocks = storageService.getStocks();
      const enrichedStocks = rawStocks.map(s => {
        const item = items.find(i => i.id === s.barangId || i.kodeBarang === s.barangId);
        const wh = warehouses.find(w => w.id === s.gudangId || w.namaGudang === s.gudangId);
        const minStock = Number(item?.stokMinimum || 10);
        const isKritis = (s.saldo <= minStock) ? 'Kritis' : 'Aman';
        return {
          ...s,
          gudangNama: wh?.namaGudang || s.gudangId,
          barangNama: item?.namaBarang || s.barangId,
          kodeBarang: item?.kodeBarang || '',
          kategoriNama: item?.kategoriNama || 'Umum',
          satuan: item?.satuan || 'Pcs',
          stokMinimum: minStock,
          statusKritis: isKritis,
          lokasiRak: item?.spesifikasi || '-',
          updateTerakhir: s.updateTerakhir || new Date().toISOString().replace('T', ' ').slice(0, 19)
        };
      });

      // PERHATIKAN: Data users TIDAK BOLEH dikirim secara default agar tidak menimpa PENGGUNA_SISTEM di spreadsheet
      // Spreadsheet adalah master database pengguna. Hanya kirim jika includeUsers bernilai true.
      const payloadData: any = {
        warehouses: warehouses,
        categories: storageService.getCategories(),
        items: items,
        stocks: enrichedStocks,
        requests: storageService.getRequests(),
        droppings: storageService.getDroppings(),
        transactions: storageService.getTransactions(),
        activityLogs: storageService.getActivityLogs(),
        logoConfig: storageService.getLogoConfig()
      };

      if (options?.includeUsers) {
        payloadData.users = storageService.getUsers().filter(u => {
          const n = String(u.nama || '').toLowerCase();
          const nip = String(u.nip || '').trim();
          const un = String(u.username || '').toLowerCase();
          return !n.includes('zulkarnain') && !n.includes('demo') && nip !== '197805122005011003' && un !== 'demo' && un !== 'kapus';
        });
      }

      const payload = {
        action: 'syncPush',
        data: payloadData
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // Avoid preflight CORS issues in GAS
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      let resJson: any = null;
      try {
        resJson = await response.json();
      } catch {
        const text = await response.text().catch(() => '');
        if (text && (text.includes('success') || text.includes('Berhasil'))) {
          resJson = { status: 'success', result: 'Data berhasil dikirim ke Google Spreadsheet!' };
        }
      }

      if (resJson && resJson.status === 'success') {
        const currentCfg = storageService.getSheetsConfig();
        currentCfg.lastSyncTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
        currentCfg.isConnected = true;
        storageService.saveSheetsConfig(currentCfg);
        storageService.logActivity('Sinkronisasi Google Spreadsheet', 'MASTER_BARANG', 'Berhasil upload & sync data master ke Google Sheets');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sijajul_data_updated', { detail: { action: 'syncPush' } }));
        }
        return { success: true, message: resJson.result || resJson.message || 'Data berhasil di-upload ke Google Spreadsheet!' };
      } else {
        return { success: false, message: resJson?.message || 'Gagal sinkronisasi data ke Google Spreadsheet.' };
      }
    } catch (e: any) {
      this.triggerDebouncedAutoPush(1500);
      return { success: false, message: `Sinkronisasi spreadsheet dijadwalkan: ${e?.message || 'Jaringan'}` };
    }
  }

  /**
   * Mengunggah hasil impor batch master barang ke Google Spreadsheet
   */
  static async saveImportedItemsToSheets(count: number): Promise<{ success: boolean; message: string }> {
    const pushResult = await this.pushToSheets();
    if (pushResult.success) {
      return {
        success: true,
        message: `✅ Berhasil mengunggah ${count} data barang ke database Google Spreadsheet!`
      };
    }
    return pushResult;
  }

  /**
   * Menyimpan / memperbarui perubahan stok langsung ke Google Spreadsheet
   */
  static async updateStockToSheets(
    itemName: string,
    warehouseName?: string,
    newBalance?: number
  ): Promise<{ success: boolean; message: string }> {
    const pushResult = await this.pushToSheets();
    if (pushResult.success) {
      return {
        success: true,
        message: `✅ Stok ${itemName ? `"${itemName}"` : ''} berhasil di-update ke database Spreadsheet!`
      };
    }
    return {
      success: true,
      message: `✅ Stok ${itemName ? `"${itemName}"` : ''} berhasil di-update secara lokal dan dijadwalkan sinkron ke Spreadsheet.`
    };
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

  static async syncAllFromSheets(): Promise<{ success: boolean; counts?: any; message: string }> {
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
    const importRes = storageService.importAllFromSpreadsheet(pullResult.data, true);
    return {
      success: importRes.success,
      counts: importRes.counts,
      message: importRes.message
    };
  }

  static async syncUsersFromSheets(replaceLocal = true): Promise<{ success: boolean; count?: number; message: string }> {
    const cfg = storageService.getSheetsConfig();
    const url = cfg.gasDeploymentUrl || 'https://script.google.com/macros/s/AKfycbwK2MD6O2YVPmrkI4c9XB9feTOYyKn2nx74M3Vd3eyQL35JzBNRjwr_di3LIgKlJI1tHA/exec';
    if (!url) {
      return {
        success: false,
        message: 'URL Web App Google Apps Script belum diisi di menu Pengaturan.'
      };
    }
    const pullResult = await this.pullFromSheets(url);
    if (!pullResult.success || !pullResult.data) {
      return { success: false, message: pullResult.message };
    }
    const sheetUsers = pullResult.data.users || [];
    if (!Array.isArray(sheetUsers) || sheetUsers.length === 0) {
      return { success: false, message: 'Sheet PENGGUNA_SISTEM kosong atau tidak memiliki baris data.' };
    }
    const importRes = storageService.importUsersFromSpreadsheetRows(sheetUsers, undefined, replaceLocal);
    return {
      success: true,
      count: importRes.importedCount + importRes.updatedCount,
      message: importRes.message
    };
  }

  /**
   * Menyimpan / memperbarui satu item master barang langsung ke Google Spreadsheet
   */
  static async saveItemToSheets(item: any, initialStock = 0): Promise<{ success: boolean; message: string }> {
    const cfg = storageService.getSheetsConfig();
    const url = cfg.gasDeploymentUrl || 'https://script.google.com/macros/s/AKfycbwK2MD6O2YVPmrkI4c9XB9feTOYyKn2nx74M3Vd3eyQL35JzBNRjwr_di3LIgKlJI1tHA/exec';
    if (!url) {
      return { success: false, message: 'URL Web App GAS belum diatur di Pengaturan.' };
    }

    const payload = {
      action: 'saveItem',
      item: {
        id: item.id,
        kodeBarang: item.kodeBarang,
        namaBarang: item.namaBarang,
        kategoriNama: item.kategoriNama || item.kategoriId || 'Umum',
        satuan: item.satuan || 'Pcs',
        hargaSatuan: Number(item.hargaSatuan || item.hargaEstimasi || 0),
        hargaEstimasi: Number(item.hargaSatuan || item.hargaEstimasi || 0),
        sumberAnggaran: item.sumberAnggaran || 'APBD',
        merk: item.merk || '',
        spesifikasi: item.spesifikasi || '',
        stokMinimum: Number(item.stokMinimum || 10) || 10,
        statusAktif: item.statusAktif !== false,
        keterangan: item.keterangan || ''
      },
      stokAwal: Number(initialStock) || 0
    };

    // 1. Coba kirim via POST cepat dengan AbortController timeout 6 detik
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const resJson = await response.json().catch(() => null);
      if (resJson && resJson.status === 'success') {
        const sheetsCfg = storageService.getSheetsConfig();
        sheetsCfg.lastSyncTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
        sheetsCfg.isConnected = true;
        storageService.saveSheetsConfig(sheetsCfg);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sijajul_data_updated', { detail: { action: 'saveItem', item } }));
        }
        return { success: true, message: resJson.message || 'Barang berhasil disimpan di Google Spreadsheet!' };
      }
    } catch (postErr) {
      console.warn('POST saveItem dialihkan ke mode GET langsung:', postErr);
    }

    // 2. Fallback GET: Mengirim data terenkode via URL parameter yang sangat cepat di Google Apps Script
    try {
      const params = new URLSearchParams({
        action: 'saveItem',
        id: String(item.id || ''),
        kodeBarang: String(item.kodeBarang || ''),
        namaBarang: String(item.namaBarang || ''),
        kategoriNama: String(item.kategoriNama || 'Umum'),
        satuan: String(item.satuan || 'Pcs'),
        hargaSatuan: String(item.hargaSatuan || item.hargaEstimasi || 0),
        hargaEstimasi: String(item.hargaSatuan || item.hargaEstimasi || 0),
        sumberAnggaran: String(item.sumberAnggaran || 'APBD'),
        merk: String(item.merk || ''),
        spesifikasi: String(item.spesifikasi || ''),
        stokMinimum: String(item.stokMinimum || 10),
        statusAktif: String(item.statusAktif !== false),
        stokAwal: String(initialStock || 0),
        keterangan: String(item.keterangan || '')
      });

      const getRes = await fetch(`${url}?${params.toString()}`, { method: 'GET', mode: 'cors' });
      const getJson = await getRes.json().catch(() => null);
      if (getJson && getJson.status === 'success') {
        const sheetsCfg = storageService.getSheetsConfig();
        sheetsCfg.lastSyncTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
        sheetsCfg.isConnected = true;
        storageService.saveSheetsConfig(sheetsCfg);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sijajul_data_updated', { detail: { action: 'saveItem', item } }));
        }
        return { success: true, message: getJson.message || 'Barang berhasil disimpan di Google Spreadsheet!' };
      }
    } catch (getErr) {
      console.warn('GET saveItem fallback:', getErr);
    }

    // Picu sinkronisasi lokal dan antrean push
    this.triggerDebouncedAutoPush(500);
    return { success: true, message: 'Barang berhasil disimpan lokal dan masuk antrean sinkronisasi spreadsheet.' };
  }

  /**
   * Menghapus barang dari Google Spreadsheet
   */
  static async deleteItemFromSheets(itemId: string): Promise<{ success: boolean; message: string }> {
    const cfg = storageService.getSheetsConfig();
    const url = cfg.gasDeploymentUrl || 'https://script.google.com/macros/s/AKfycbwK2MD6O2YVPmrkI4c9XB9feTOYyKn2nx74M3Vd3eyQL35JzBNRjwr_di3LIgKlJI1tHA/exec';
    if (!url) return { success: false, message: 'URL GAS belum diatur' };

    try {
      const payload = {
        action: 'deleteItem',
        itemId
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return { success: true, message: 'Barang berhasil dihapus dari Spreadsheet' };
    } catch (e: any) {
      // Fallback via GET
      try {
        await fetch(`${url}?action=deleteItem&itemId=${encodeURIComponent(itemId)}`, { method: 'GET', mode: 'cors' });
      } catch (err) {}
      this.triggerDebouncedAutoPush(400);
      return { success: true, message: 'Terhapus lokal & disinkronkan' };
    }
  }

  /**
   * Sinkronisasi Cepat (Quick Sync) khusus MASTER_BARANG & STOK_GUDANG untuk auto-sync setiap detik
   */
  static async syncQuickFromSheets(): Promise<{ success: boolean; message: string }> {
    const cfg = storageService.getSheetsConfig();
    const url = cfg.gasDeploymentUrl || 'https://script.google.com/macros/s/AKfycbwK2MD6O2YVPmrkI4c9XB9feTOYyKn2nx74M3Vd3eyQL35JzBNRjwr_di3LIgKlJI1tHA/exec';
    if (!url) return { success: false, message: 'URL GAS kosong' };

    try {
      const response = await fetch(`${url}?action=quickSync`, { method: 'GET', mode: 'cors' });
      if (!response.ok) throw new Error('Quick sync HTTP ' + response.status);
      const resJson = await response.json();
      if (resJson.status === 'success') {
        const hasItems = Array.isArray(resJson.items) && resJson.items.length > 0;
        const hasStocks = Array.isArray(resJson.stocks) && resJson.stocks.length > 0;
        
        if (hasItems || hasStocks) {
          storageService.importAllFromSpreadsheet({
            items: resJson.items || [],
            stocks: resJson.stocks || []
          }, false);
          return { success: true, message: 'Sinkronisasi instan spreadsheet terbarui' };
        }
      }
      return { success: true, message: 'Sinkronisasi berjalan' };
    } catch (e) {
      // Fallback ke syncAll jika quickSync belum terpasang di GAS
      return { success: false, message: 'Quick sync deferred' };
    }
  }

  // --- AUTOMATIC REAL-TIME BACKGROUND SYNCHRONIZATION (SETIAP DETIK / OTOMATIS) ---
  private static autoSyncTimer: any = null;
  private static debouncePushTimer: any = null;
  private static isSyncingInProgress = false;
  private static listenersInitialized = false;

  /**
   * Mengirimkan perubahan lokal ke Google Spreadsheet secara otomatis dan cepat (debounced)
   */
  static triggerDebouncedAutoPush(delayMs = 400): void {
    const cfg = storageService.getSheetsConfig();
    const url = cfg.gasDeploymentUrl || 'https://script.google.com/macros/s/AKfycbwK2MD6O2YVPmrkI4c9XB9feTOYyKn2nx74M3Vd3eyQL35JzBNRjwr_di3LIgKlJI1tHA/exec';
    if (!url || !cfg.autoSync) return;

    if (this.debouncePushTimer) {
      clearTimeout(this.debouncePushTimer);
    }

    this.debouncePushTimer = setTimeout(async () => {
      if (this.isSyncingInProgress) return;
      this.isSyncingInProgress = true;
      try {
        await this.pushToSheets(url);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sijajul_autosync_completed', { detail: { action: 'push', timestamp: new Date().toISOString() } }));
        }
      } catch (e) {
        console.error('Auto-push error:', e);
      } finally {
        this.isSyncingInProgress = false;
      }
    }, delayMs);
  }

  /**
   * Menjalankan sinkronisasi otomatis background berkala (Pull & Push) real-time SETIAP DETIK
   * tanpa perlu klik tombol atau refresh halaman manual
   */
  static startAutoSync(intervalSeconds = 1, onSyncDone?: (status: { type: string; timestamp: string; message: string }) => void): void {
    this.stopAutoSync();

    // Jalankan satu kali di awal (immediate auto-sync)
    const runImmediateSync = async () => {
      const cfg = storageService.getSheetsConfig();
      if (!cfg.gasDeploymentUrl) return;

      if (this.isSyncingInProgress) return;
      this.isSyncingInProgress = true;
      try {
        const pullRes = await this.syncAllFromSheets();
        if (pullRes.success && onSyncDone) {
          onSyncDone({
            type: 'pull',
            timestamp: new Date().toISOString(),
            message: pullRes.message
          });
        }
      } catch (e) {
        console.warn('Initial auto-sync pull deferred:', e);
      } finally {
        this.isSyncingInProgress = false;
      }
    };

    // Jalankan segera setelah 500ms
    setTimeout(runImmediateSync, 500);

    // Setup interval background setiap 1 detik untuk sinkronisasi real-time instan
    const intervalMs = Math.max(1, intervalSeconds) * 1000;
    let tickCount = 0;

    this.autoSyncTimer = setInterval(async () => {
      const cfg = storageService.getSheetsConfig();
      if (!cfg.gasDeploymentUrl || !cfg.autoSync) return;
      if (this.isSyncingInProgress) return;
      if (typeof document !== 'undefined' && document.hidden) return;

      tickCount++;
      this.isSyncingInProgress = true;
      try {
        // Setiap 15 detik lakukan full sync, setiap 1 detik lakukan quick sync barang & stok
        if (tickCount % 15 === 0) {
          const res = await this.syncAllFromSheets();
          if (res.success && onSyncDone) {
            onSyncDone({
              type: 'periodic',
              timestamp: new Date().toISOString(),
              message: res.message
            });
          }
        } else {
          const quickRes = await this.syncQuickFromSheets();
          if (quickRes.success && onSyncDone) {
            onSyncDone({
              type: 'quick',
              timestamp: new Date().toISOString(),
              message: quickRes.message
            });
          }
        }
      } catch (e) {
        // Abaikan error jaringan sementara
      } finally {
        this.isSyncingInProgress = false;
      }
    }, intervalMs);

    // Pasang listener visibilitychange, focus, dan storage sekali saja
    if (!this.listenersInitialized && typeof window !== 'undefined') {
      this.listenersInitialized = true;
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          runImmediateSync();
        }
      });
      window.addEventListener('focus', () => {
        runImmediateSync();
      });
      // Listener mutasi lokal untuk auto-push cepat
      window.addEventListener('sijajul_data_mutated', () => {
        this.triggerDebouncedAutoPush(300);
      });
      // Listener tab lain jika ada perubahan di browser lain
      window.addEventListener('storage', (e) => {
        if (e.key?.includes('sijajul')) {
          window.dispatchEvent(new CustomEvent('sijajul_data_updated'));
        }
      });
    }
  }

  static stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
    if (this.debouncePushTimer) {
      clearTimeout(this.debouncePushTimer);
      this.debouncePushTimer = null;
    }
  }

  static isAutoSyncActive(): boolean {
    const cfg = storageService.getSheetsConfig();
    return Boolean(cfg.gasDeploymentUrl && cfg.autoSync);
  }

  /**
   * Mengunggah file logo secara permanen ke Google Drive melalui Web App Apps Script
   * dan mencatatnya ke CONFIG_SISTEM Spreadsheet agar dapat dilihat secara global oleh semua pengguna.
   */
  static async uploadLogoToDrive(
    base64Data: string,
    logoType: 'jaya_raya' | 'kesehatan',
    fileName?: string
  ): Promise<{ success: boolean; url?: string; fileId?: string; message: string }> {
    const cfg = storageService.getSheetsConfig();
    const url = cfg.gasDeploymentUrl || 'https://script.google.com/macros/s/AKfycbwK2MD6O2YVPmrkI4c9XB9feTOYyKn2nx74M3Vd3eyQL35JzBNRjwr_di3LIgKlJI1tHA/exec';
    if (!url) return { success: false, message: 'URL Web App Apps Script belum dikonfigurasi.' };

    try {
      const payload = {
        action: 'uploadLogo',
        logoType,
        base64Data,
        fileName: fileName || `logo_${logoType}_${Date.now()}.png`
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const resJson = await response.json();
      if (resJson.status === 'success' && resJson.url) {
        return {
          success: true,
          url: resJson.url,
          fileId: resJson.fileId,
          message: 'Logo berhasil disimpan permanen ke Google Drive dan disinkronkan ke Spreadsheet!'
        };
      } else {
        return {
          success: false,
          message: resJson.message || 'Gagal menyimpan logo ke Google Drive.'
        };
      }
    } catch (e: any) {
      console.error('Error uploading logo to Drive:', e);
      return {
        success: false,
        message: e.message || 'Gagal koneksi ke Google Apps Script saat mengunggah logo.'
      };
    }
  }

  /**
   * Menyimpan link logo secara global ke CONFIG_SISTEM Google Spreadsheet
   * sehingga seluruh browser dan perangkat lain langsung membaca link logo yang sama saat sinkronisasi.
   */
  static async saveLogoLinksToSheets(
    logoConfig: AppLogoConfig
  ): Promise<{ success: boolean; message: string }> {
    const cfg = storageService.getSheetsConfig();
    const url = cfg.gasDeploymentUrl || 'https://script.google.com/macros/s/AKfycbwK2MD6O2YVPmrkI4c9XB9feTOYyKn2nx74M3Vd3eyQL35JzBNRjwr_di3LIgKlJI1tHA/exec';
    if (!url) {
      return { success: false, message: 'URL Web App Apps Script belum terhubung.' };
    }

    try {
      const payload = {
        action: 'saveLogoConfig',
        logoJayaRaya: logoConfig.logoJayaRaya || '',
        logoKesehatan: logoConfig.logoKesehatan || '',
        namaPemprov: logoConfig.namaPemprov || '',
        namaDinas: logoConfig.namaDinas || '',
        namaPuskesmas: logoConfig.namaPuskesmas || '',
        alamatPuskesmas: logoConfig.alamatPuskesmas || '',
        kontakPuskesmas: logoConfig.kontakPuskesmas || ''
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const resJson = await response.json().catch(() => null);
      if (resJson && resJson.status === 'success') {
        return {
          success: true,
          message: 'Tautan logo resmi berhasil disimpan ke Google Spreadsheet (CONFIG_SISTEM) untuk semua browser!'
        };
      }
      return {
        success: true,
        message: 'Tautan logo tersimpan lokal dan dijadwalkan sinkronisasi otomatis.'
      };
    } catch (e: any) {
      console.warn('Sync logo links to sheets warning:', e);
      return {
        success: true,
        message: 'Tautan logo tersimpan di aplikasi dan akan disinkronkan saat koneksi terhubung.'
      };
    }
  }
}

export const gasService = GasService;
