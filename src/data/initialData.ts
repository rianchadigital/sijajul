import { 
  Warehouse, Category, Item, User, WarehouseStock, 
  ItemRequest, Dropping, StockTransaction, BastDocument, 
  SbbkDocument, NumberFormatConfig, GoogleSheetsConfig, ActivityLog, AppNotification,
  ItemProposal 
} from '../types';

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'GUD-001',
    kodeGudang: 'GB-KSS',
    namaGudang: 'Gudang Puskesmas Kepulauan Seribu Selatan',
    tipeGudang: 'GUDANG_BESAR',
    parentGudangId: null,
    picId: 'USR-002',
    picNama: 'Hendra Setiawan, S.Farm',
    lokasi: 'Puskesmas Kecamatan Kepulauan Seribu Selatan, Pulau Tidung',
    statusAktif: true,
    keterangan: 'Gudang Induk & Pusat Distribusi Logistik Kepulauan Seribu Selatan'
  },
  {
    id: 'GUD-002',
    kodeGudang: 'SG-TDG',
    namaGudang: 'Gudang Puskesmas Tidung',
    tipeGudang: 'SUB_GUDANG',
    parentGudangId: 'GUD-001',
    picId: 'USR-003',
    picNama: 'Siti Rahmawati, A.Md.Keb',
    lokasi: 'Puskesmas Kelurahan Pulau Tidung',
    statusAktif: true,
    keterangan: 'Sub Gudang Layanan Pulau Tidung'
  },
  {
    id: 'GUD-003',
    kodeGudang: 'SG-PRI',
    namaGudang: 'Gudang Pustu Pari',
    tipeGudang: 'SUB_GUDANG',
    parentGudangId: 'GUD-001',
    picId: 'USR-004',
    picNama: 'Ahmad Fauzi, A.Md.Kep',
    lokasi: 'Puskesmas Pembantu (Pustu) Pulau Pari',
    statusAktif: true,
    keterangan: 'Sub Gudang Layanan Pulau Pari'
  },
  {
    id: 'GUD-004',
    kodeGudang: 'SG-LCG',
    namaGudang: 'Gudang Pustu Lancang',
    tipeGudang: 'SUB_GUDANG',
    parentGudangId: 'GUD-001',
    picId: 'USR-005',
    picNama: 'Dewi Lestari, A.Md.Farm',
    lokasi: 'Puskesmas Pembantu (Pustu) Pulau Lancang',
    lokasiPulau: 'Pulau Lancang',
    statusAktif: true,
    keterangan: 'Sub Gudang Layanan Pulau Lancang'
  },
  {
    id: 'GUD-005',
    kodeGudang: 'SG-UTJ',
    namaGudang: 'Gudang Pustu Untung Jawa',
    tipeGudang: 'SUB_GUDANG',
    parentGudangId: 'GUD-001',
    picId: 'USR-016',
    picNama: 'Novi Andriani, S.Tr.Keb',
    lokasi: 'Puskesmas Pembantu (Pustu) Pulau Untung Jawa',
    lokasiPulau: 'Pulau Untung Jawa',
    statusAktif: true,
    keterangan: 'Sub Gudang Layanan Pulau Untung Jawa'
  },
  {
    id: 'GUD-006',
    kodeGudang: 'SG-PYG',
    namaGudang: 'Gudang Pusling Payung',
    tipeGudang: 'SUB_GUDANG',
    parentGudangId: 'GUD-001',
    picId: 'USR-006',
    picNama: 'Bambang Supriyanto, S.Kep',
    lokasi: 'Pos Puskesmas Keliling (Pusling) Pulau Payung',
    lokasiPulau: 'Pulau Payung',
    statusAktif: true,
    keterangan: 'Sub Gudang Layanan Pulau Payung'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'CAT-001', kode: 'ATK', nama: 'ATK & Kantor', statusAktif: true, deskripsi: 'Alat Tulis Kantor & Kertas' },
  { id: 'CAT-002', kode: 'MED', nama: 'Obat-obatan', statusAktif: true, deskripsi: 'Obat-obatan Medis & Farmasi' },
  { id: 'CAT-003', kode: 'BHP', nama: 'BHP Medis', statusAktif: true, deskripsi: 'Bahan Habis Pakai Medis' },
  { id: 'CAT-004', kode: 'ALK', nama: 'Alat Kesehatan', statusAktif: true, deskripsi: 'Peralatan & Instrumen Medis' },
  { id: 'CAT-005', kode: 'KBR', nama: 'Alat Kebersihan', statusAktif: true, deskripsi: 'Peralatan dan Bahan Kebersihan Sanitasi' },
  { id: 'CAT-006', kode: 'LST', nama: 'Alat Listrik', statusAktif: true, deskripsi: 'Komponen Kelistrikan & Lampu Penerangan' },
  { id: 'CAT-007', kode: 'TKG', nama: 'Alat Pertukangan', statusAktif: true, deskripsi: 'Peralatan Perbaikan & Perkakas' },
  { id: 'CAT-008', kode: 'PRT', nama: 'Barang Rumah Tangga', statusAktif: true, deskripsi: 'Perlengkapan Dapur & Akomodasi Puskesmas' },
  { id: 'CAT-009', kode: 'LLN', nama: 'Barang Lainnya', statusAktif: true, deskripsi: 'Logistik Umum dan Barang Pendukung Lainnya' }
];

// Data master barang standar Puskesmas Kepulauan Seribu Selatan
export const INITIAL_ITEMS: Item[] = [
  {
    id: 'ITM-001',
    kodeBarang: 'MED-PCT-500',
    namaBarang: 'Paracetamol 500 mg Tablet',
    kategoriId: 'CAT-002',
    kategoriNama: 'Obat-obatan',
    satuan: 'Tablet',
    merk: 'Kimia Farma',
    spesifikasi: 'Strip isi 10 tablet',
    stokMinimum: 100,
    statusAktif: true,
    keterangan: 'Analgesik & Antipiretik Utama'
  },
  {
    id: 'ITM-002',
    kodeBarang: 'MED-AMX-500',
    namaBarang: 'Amoxicillin 500 mg Kapsul',
    kategoriId: 'CAT-002',
    kategoriNama: 'Obat-obatan',
    satuan: 'Kapsul',
    merk: 'Indofarma',
    spesifikasi: 'Strip isi 10 kapsul',
    stokMinimum: 80,
    statusAktif: true,
    keterangan: 'Antibiotik Spektrum Luas'
  },
  {
    id: 'ITM-003',
    kodeBarang: 'MED-CPT-025',
    namaBarang: 'Captopril 25 mg Tablet',
    kategoriId: 'CAT-002',
    kategoriNama: 'Obat-obatan',
    satuan: 'Tablet',
    merk: 'Phapros',
    spesifikasi: 'Strip isi 10 tablet',
    stokMinimum: 50,
    statusAktif: true,
    keterangan: 'Antihipertensi ACE Inhibitor'
  },
  {
    id: 'ITM-004',
    kodeBarang: 'MED-ANT-001',
    namaBarang: 'Antasida Doen Tablet Kunyah',
    kategoriId: 'CAT-002',
    kategoriNama: 'Obat-obatan',
    satuan: 'Tablet',
    merk: 'Generic',
    spesifikasi: 'Botol / Strip isi 10',
    stokMinimum: 80,
    statusAktif: true,
    keterangan: 'Antasida Lambung'
  },
  {
    id: 'ITM-005',
    kodeBarang: 'BHP-MSK-003',
    namaBarang: 'Masker Medis 3-Ply Earloop',
    kategoriId: 'CAT-003',
    kategoriNama: 'BHP Medis',
    satuan: 'Box',
    merk: 'Sensi / Onemed',
    spesifikasi: 'Box isi 50 pcs',
    stokMinimum: 20,
    statusAktif: true,
    keterangan: 'APD Perlindungan Pernapasan'
  },
  {
    id: 'ITM-006',
    kodeBarang: 'BHP-SPT-003',
    namaBarang: 'Spuit / Syringe 3 cc / 3 ml',
    kategoriId: 'CAT-003',
    kategoriNama: 'BHP Medis',
    satuan: 'Pcs',
    merk: 'Terumo / Onemed',
    spesifikasi: 'Jarum steril disposable',
    stokMinimum: 50,
    statusAktif: true,
    keterangan: 'Spuit Injeksi Medis'
  },
  {
    id: 'ITM-007',
    kodeBarang: 'BHP-HNS-500',
    namaBarang: 'Hand Sanitizer Gel 500 ml',
    kategoriId: 'CAT-003',
    kategoriNama: 'BHP Medis',
    satuan: 'Botol',
    merk: 'Antis / Care',
    spesifikasi: 'Pump 500 ml',
    stokMinimum: 15,
    statusAktif: true,
    keterangan: 'Desinfeksi Tangan Higienis'
  },
  {
    id: 'ITM-008',
    kodeBarang: 'ATK-HVS-080',
    namaBarang: 'Kertas HVS A4 80 Gram',
    kategoriId: 'CAT-001',
    kategoriNama: 'ATK & Kantor',
    satuan: 'Rim',
    merk: 'PaperOne / Sinar Dunia',
    spesifikasi: '500 Lembar / Rim',
    stokMinimum: 10,
    statusAktif: true,
    keterangan: 'Kebutuhan Administrasi & Cetak'
  },
  {
    id: 'ITM-009',
    kodeBarang: 'ATK-BLP-001',
    namaBarang: 'Ballpoint Hitam 0.5mm',
    kategoriId: 'CAT-001',
    kategoriNama: 'ATK & Kantor',
    satuan: 'Lusin',
    merk: 'Standard / Faster',
    spesifikasi: 'Pack 12 pcs',
    stokMinimum: 5,
    statusAktif: true,
    keterangan: 'Alat Tulis Petugas'
  },
  {
    id: 'ITM-010',
    kodeBarang: 'ALK-TNS-001',
    namaBarang: 'Tensimeter Digital',
    kategoriId: 'CAT-004',
    kategoriNama: 'Alat Kesehatan',
    satuan: 'Unit',
    merk: 'Omron',
    spesifikasi: 'Lengan otomatis',
    stokMinimum: 2,
    statusAktif: true,
    keterangan: 'Pemeriksaan Tekanan Darah'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    nip: '198402152008011005',
    nama: 'Dr. Surya Pratama, M.K.M.',
    jabatan: 'Kepala Puskesmas / Super Admin Sistem',
    unitKerja: 'Tata Usaha & Manajemen',
    tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
    gudangId: 'GUD-001',
    role: 'ADMIN',
    username: 'admin',
    password: '123456',
    statusAktif: true,
    telepon: '081299887766'
  },
  {
    id: 'USR-002',
    nip: '198807212011011008',
    nama: 'Hendra Setiawan, S.Farm',
    jabatan: 'Koordinator Logistik & Farmasi (PIC Gudang Besar)',
    unitKerja: 'Unit Logistik & Perlengkapan',
    tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
    gudangId: 'GUD-001',
    role: 'PIC_GUDANG_BESAR',
    username: 'pic_gudang_besar',
    password: '123456',
    statusAktif: true,
    telepon: '081311223344'
  },
  {
    id: 'USR-003',
    nip: '199203142015022003',
    nama: 'Siti Rahmawati, A.Md.Keb',
    jabatan: 'Pengelola Barang / Bidan Koordinator',
    unitKerja: 'Puskesmas Kelurahan Pulau Tidung',
    tempatTugas: 'Puskesmas Tidung',
    gudangId: 'GUD-002',
    role: 'PIC_SUB_GUDANG',
    username: 'pic_tidung',
    password: '123456',
    statusAktif: true,
    telepon: '085712345678'
  },
  {
    id: 'USR-004',
    nip: '199406182019031006',
    nama: 'Ahmad Fauzi, A.Md.Kep',
    jabatan: 'Pengelola Pustu & Perawat Pelaksana',
    unitKerja: 'Puskesmas Pembantu Pulau Pari',
    tempatTugas: 'Pustu Pari',
    gudangId: 'GUD-003',
    role: 'PIC_SUB_GUDANG',
    username: 'pic_pari',
    password: '123456',
    statusAktif: true,
    telepon: '081900112233'
  },
  {
    id: 'USR-005',
    nip: '199508212020122004',
    nama: 'Dewi Lestari, A.Md.Farm',
    jabatan: 'Pengelola Pustu & Asisten Apoteker',
    unitKerja: 'Puskesmas Pembantu Pulau Lancang',
    tempatTugas: 'Pustu Lancang',
    gudangId: 'GUD-004',
    role: 'PIC_SUB_GUDANG',
    username: 'pic_lancang',
    password: '123456',
    statusAktif: true,
    telepon: '081288776655'
  },
  {
    id: 'USR-006',
    nip: '199109252014031002',
    nama: 'Bambang Supriyanto, S.Kep',
    jabatan: 'Koordinator Pusling Payung',
    unitKerja: 'Pos Pelayanan Pusling Pulau Payung',
    tempatTugas: 'Pusling Payung',
    gudangId: 'GUD-005',
    role: 'PIC_SUB_GUDANG',
    username: 'pic_payung',
    password: '123456',
    statusAktif: true,
    telepon: '081544332211'
  },
  {
    id: 'USR-007',
    nip: '199605122022032008',
    nama: 'Rina Marlina, S.Tr.Keb',
    jabatan: 'Bidan Pelaksana KIA/KB',
    unitKerja: 'Puskesmas Pembantu Pulau Pari',
    tempatTugas: 'Pustu Pari',
    gudangId: 'GUD-003',
    role: 'PEGAWAI',
    username: 'pegawai_pari',
    password: '123456',
    statusAktif: true,
    telepon: '087811224466'
  },
  {
    id: 'USR-008',
    nip: '199008142018012004',
    nama: 'drg. Anisa Permatasari',
    jabatan: 'Dokter Gigi Pelaksana',
    unitKerja: 'Poli Kesehatan Gigi & Mulut',
    tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
    gudangId: 'GUD-001',
    role: 'PEGAWAI',
    username: 'drg_anisa',
    password: '123456',
    statusAktif: true,
    telepon: '081233445566'
  },
  {
    id: 'USR-009',
    nip: '199304192019021005',
    nama: 'dr. Farhan Maulana',
    jabatan: 'Dokter Umum Pelaksana IGD & Rawat Inap',
    unitKerja: 'Pelayanan Medis & UGD 24 Jam',
    tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
    gudangId: 'GUD-001',
    role: 'PEGAWAI',
    username: 'dr_farhan',
    password: '123456',
    statusAktif: true,
    telepon: '081399001122'
  },
  {
    id: 'USR-010',
    nip: '199503112020122007',
    nama: 'Nurul Hidayah, S.Tr.Keb',
    jabatan: 'Bidan Pelaksana Poli KIA / KB',
    unitKerja: 'Puskesmas Kelurahan Pulau Tidung',
    tempatTugas: 'Puskesmas Tidung',
    gudangId: 'GUD-002',
    role: 'PEGAWAI',
    username: 'bidan_nurul',
    password: '123456',
    statusAktif: true,
    telepon: '085811223344'
  },
  {
    id: 'USR-011',
    nip: '199709212022031003',
    nama: 'Fajar Sidik, A.Md.AK',
    jabatan: 'Pranata Laboratorium Kesehatan',
    unitKerja: 'Unit Laboratorium Klinis',
    tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
    gudangId: 'GUD-001',
    role: 'PEGAWAI',
    username: 'lab_fajar',
    password: '123456',
    statusAktif: true,
    telepon: '081977889900'
  },
  {
    id: 'USR-012',
    nip: '199801152023022009',
    nama: 'Maya Anggraini, A.Md.RMIK',
    jabatan: 'Perekam Medis & Informasi Kesehatan',
    unitKerja: 'Loket Pendaftaran & Rekam Medis',
    tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
    gudangId: 'GUD-001',
    role: 'PEGAWAI',
    username: 'rekammedis_maya',
    password: '123456',
    statusAktif: true,
    telepon: '082133221100'
  },
  {
    id: 'USR-013',
    nip: '199412032021021004',
    nama: 'Yudi Prasetyo, SKM',
    jabatan: 'Sanitarian & Pengelola Kesling',
    unitKerja: 'Kesehatan Lingkungan & Sanitasi',
    tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
    gudangId: 'GUD-001',
    role: 'PEGAWAI',
    username: 'kesling_yudi',
    password: '123456',
    statusAktif: true,
    telepon: '081277665544'
  },
  {
    id: 'USR-014',
    nip: '199507182020122006',
    nama: 'Ratna Sari, A.Md.Kep',
    jabatan: 'Perawat Pelaksana Pustu',
    unitKerja: 'Puskesmas Pembantu Pulau Lancang',
    tempatTugas: 'Pustu Lancang',
    gudangId: 'GUD-004',
    role: 'PEGAWAI',
    username: 'perawat_ratna',
    password: '123456',
    statusAktif: true,
    telepon: '087766554433'
  },
  {
    id: 'USR-015',
    nip: '199611292022031007',
    nama: 'Dimas Ramadhan, A.Md.Kep',
    jabatan: 'Perawat Pelaksana Pusling',
    unitKerja: 'Pos Pelayanan Pusling Pulau Payung',
    tempatTugas: 'Pusling Payung',
    gudangId: 'GUD-006',
    role: 'PEGAWAI',
    username: 'perawat_dimas',
    password: '123456',
    statusAktif: true,
    telepon: '085211998877'
  },
  {
    id: 'USR-016',
    nip: '199310152019032007',
    nama: 'Novi Andriani, S.Tr.Keb',
    jabatan: 'PIC Pustu Untung Jawa & Bidan Koordinator',
    unitKerja: 'Puskesmas Pembantu Pulau Untung Jawa',
    tempatTugas: 'Pustu Untung Jawa',
    gudangId: 'GUD-005',
    role: 'PIC_SUB_GUDANG',
    username: 'pic_untungjawa',
    password: '123456',
    statusAktif: true,
    telepon: '081377889911'
  },
  {
    id: 'USR-017',
    nip: '199704202022031005',
    nama: 'Budi Santoso, A.Md.Kep',
    jabatan: 'Perawat Pelaksana Pelayanan Pustu',
    unitKerja: 'Puskesmas Pembantu Pulau Untung Jawa',
    tempatTugas: 'Pustu Untung Jawa',
    gudangId: 'GUD-005',
    role: 'PEGAWAI',
    username: 'pegawai_untungjawa',
    password: '123456',
    statusAktif: true,
    telepon: '081266554433'
  }
];

export const generateInitialStocks = (itemsList: Item[] = INITIAL_ITEMS): WarehouseStock[] => {
  const stocks: WarehouseStock[] = [];
  const warehouses = [
    'GUD-001', 'GUD-002', 'GUD-003', 'GUD-004', 'GUD-005', 'GUD-006'
  ];

  // Base stock multipliers by item ID for Gudang Besar and Sub Gudangs
  const stockConfig: Record<string, { big: number; sub: number }> = {
    'ITM-001': { big: 1500, sub: 250 },
    'ITM-002': { big: 800, sub: 120 },
    'ITM-003': { big: 500, sub: 80 },
    'ITM-004': { big: 600, sub: 90 },
    'ITM-005': { big: 120, sub: 25 },
    'ITM-006': { big: 300, sub: 50 },
    'ITM-007': { big: 50, sub: 10 },
    'ITM-008': { big: 60, sub: 15 },
    'ITM-009': { big: 40, sub: 10 },
    'ITM-010': { big: 15, sub: 3 }
  };

  itemsList.forEach(item => {
    const cfg = stockConfig[item.id] || { big: 100, sub: 30 };
    warehouses.forEach(whId => {
      const isBig = whId === 'GUD-001';
      const initialQty = isBig ? cfg.big : cfg.sub;

      stocks.push({
        id: `STK-${whId}-${item.id}`,
        gudangId: whId,
        barangId: item.id,
        stokAwal: initialQty,
        stokMasuk: 0,
        stokKeluar: 0,
        saldo: initialQty,
        updateTerakhir: new Date().toISOString().replace('T', ' ').slice(0, 19)
      });
    });
  });

  return stocks;
};

// Seluruh data transaksi & riwayat kosong secara default (bersih dari dummy)
export const INITIAL_REQUESTS: ItemRequest[] = [];
export const INITIAL_DROPPINGS: Dropping[] = [];
export const INITIAL_BAST_DOCS: BastDocument[] = [];
export const INITIAL_SBBK_DOCS: SbbkDocument[] = [];
export const INITIAL_TRANSACTIONS: StockTransaction[] = [];
export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const DEFAULT_NUMBER_CONFIG: NumberFormatConfig = {
  prefixPermintaan: 'REQ/{YYYY}/{MM}/{XXXX}',
  prefixDropping: 'DRP/{YYYY}/{MM}/{XXXX}',
  prefixBast: 'BAST/{YYYY}/{MM}/{XXXX}',
  prefixSbbk: 'SBBK/{YYYY}/{MM}/{XXXX}',
  prefixMutasi: 'MUT/{YYYY}/{MM}/{XXXX}',
  prefixOpname: 'OPN/{YYYY}/{MM}/{XXXX}',
  prefixTransaksi: 'TRX/{YYYY}/{MM}/{XXXX}'
};

// Konfigurasi Google Apps Script & Spreadsheet Aktif dari User
export const DEFAULT_SHEETS_CONFIG: GoogleSheetsConfig = {
  spreadsheetId: '1L2D_5jHPQibHovZEPOW6kJdgGHILFbp3_AImlh6pvAs',
  gasDeploymentUrl: 'https://script.google.com/macros/s/AKfycbwK2MD6O2YVPmrkI4c9XB9feTOYyKn2nx74M3Vd3eyQL35JzBNRjwr_di3LIgKlJI1tHA/exec',
  autoSync: true,
  isConnected: true
};

export const INITIAL_PROPOSALS: ItemProposal[] = [];
