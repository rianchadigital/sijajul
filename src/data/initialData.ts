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
    statusAktif: true,
    keterangan: 'Sub Gudang Layanan Pulau Lancang'
  },
  {
    id: 'GUD-005',
    kodeGudang: 'SG-PYG',
    namaGudang: 'Gudang Pusling Payung',
    tipeGudang: 'SUB_GUDANG',
    parentGudangId: 'GUD-001',
    picId: 'USR-006',
    picNama: 'Bambang Supriyanto, S.Kep',
    lokasi: 'Pos Puskesmas Keliling (Pusling) Pulau Payung',
    statusAktif: true,
    keterangan: 'Sub Gudang Layanan Pulau Payung'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'CAT-001', kode: 'ATK', nama: 'ATK', statusAktif: true, deskripsi: 'Alat Tulis Kantor & Kertas' },
  { id: 'CAT-002', kode: 'KBR', nama: 'Alat Kebersihan', statusAktif: true, deskripsi: 'Peralatan dan Bahan Kebersihan Sanitasi' },
  { id: 'CAT-003', kode: 'LST', nama: 'Alat Listrik', statusAktif: true, deskripsi: 'Komponen Kelistrikan & Lampu Penerangan' },
  { id: 'CAT-004', kode: 'TKG', nama: 'Alat Pertukangan', statusAktif: true, deskripsi: 'Peralatan Perbaikan & Perkakas' },
  { id: 'CAT-005', kode: 'PRT', nama: 'Barang Rumah Tangga', statusAktif: true, deskripsi: 'Perlengkapan Dapur & Akomodasi Puskesmas' },
  { id: 'CAT-006', kode: 'MED', nama: 'Barang Medis/Non Medis', statusAktif: true, deskripsi: 'Bahan Penunjang Medis & Non-Medis Puskesmas' },
  { id: 'CAT-007', kode: 'LLN', nama: 'Barang Lainnya', statusAktif: true, deskripsi: 'Logistik Umum dan Barang Pendukung Lainnya' }
];

export const INITIAL_ITEMS: Item[] = [
  // ATK
  {
    id: 'ITM-001',
    kodeBarang: 'ATK001',
    namaBarang: 'Kertas HVS A4 80gr',
    kategoriId: 'CAT-001',
    kategoriNama: 'ATK',
    satuan: 'Rim',
    merk: 'PaperOne',
    spesifikasi: '75/80 GSM White, 500 sheets/rim',
    stokMinimum: 15,
    statusAktif: true,
    keterangan: 'Kebutuhan cetak rekam medis dan administrasi kantor',
    hargaEstimasi: 55000
  },
  {
    id: 'ITM-002',
    kodeBarang: 'ATK002',
    namaBarang: 'Kertas HVS F4 75gr',
    kategoriId: 'CAT-001',
    kategoriNama: 'ATK',
    satuan: 'Rim',
    merk: 'Sinar Dunia',
    spesifikasi: 'F4 Folio 75 GSM, 500 lembar',
    stokMinimum: 10,
    statusAktif: true,
    keterangan: 'Pencetakan surat resmi & blanko rujukan',
    hargaEstimasi: 60000
  },
  {
    id: 'ITM-003',
    kodeBarang: 'ATK003',
    namaBarang: 'Pulpen Gel 0.5 Hitam',
    kategoriId: 'CAT-001',
    kategoriNama: 'ATK',
    satuan: 'Lusin',
    merk: 'Standard AE7',
    spesifikasi: 'Fine tip 0.5mm Tinta Hitam',
    stokMinimum: 8,
    statusAktif: true,
    keterangan: 'Pulpen pelayanan medis & loket pendaftaran',
    hargaEstimasi: 28000
  },
  {
    id: 'ITM-004',
    kodeBarang: 'ATK004',
    namaBarang: 'Tinta Printer Epson Black 003',
    kategoriId: 'CAT-001',
    kategoriNama: 'ATK',
    satuan: 'Botol',
    merk: 'Epson Original',
    spesifikasi: '65ml Black T00V100',
    stokMinimum: 6,
    statusAktif: true,
    keterangan: 'Tinta printer L3110/L3210 loket dan poli',
    hargaEstimasi: 95000
  },
  {
    id: 'ITM-005',
    kodeBarang: 'ATK005',
    namaBarang: 'Map Odner Karton Folio',
    kategoriId: 'CAT-001',
    kategoriNama: 'ATK',
    satuan: 'Buah',
    merk: 'Bantex',
    spesifikasi: 'Kapasitas 7cm Lebar Folio',
    stokMinimum: 10,
    statusAktif: true,
    keterangan: 'Arsip rekam medis & laporan bulanan',
    hargaEstimasi: 35000
  },

  // Kebersihan
  {
    id: 'ITM-006',
    kodeBarang: 'KBR001',
    namaBarang: 'Sapu Lantai Nilon',
    kategoriId: 'CAT-002',
    kategoriNama: 'Alat Kebersihan',
    satuan: 'Buah',
    merk: 'Nagata',
    spesifikasi: 'Gagang aluminium dengan bulu nilon tebal',
    stokMinimum: 5,
    statusAktif: true,
    keterangan: 'Sanitasi ruang tunggu dan ruang periksa',
    hargaEstimasi: 42000
  },
  {
    id: 'ITM-007',
    kodeBarang: 'KBR002',
    namaBarang: 'Cairan Karbol Desinfektan 4L',
    kategoriId: 'CAT-002',
    kategoriNama: 'Alat Kebersihan',
    satuan: 'Jerigen',
    merk: 'Wipol / SOS',
    spesifikasi: 'Jerigen 4 Liter formula cemara antibakteri',
    stokMinimum: 6,
    statusAktif: true,
    keterangan: 'Pembersihan lantai dan ruang tindakan medis',
    hargaEstimasi: 85000
  },
  {
    id: 'ITM-008',
    kodeBarang: 'KBR003',
    namaBarang: 'Kain Pel Microfiber Set',
    kategoriId: 'CAT-002',
    kategoriNama: 'Alat Kebersihan',
    satuan: 'Set',
    merk: 'Scotch-Brite',
    spesifikasi: 'Tongkat stainless steel + 2 kain refill',
    stokMinimum: 4,
    statusAktif: true,
    keterangan: 'Peralatan pel basah ruang rawat dan IGD',
    hargaEstimasi: 120000
  },
  {
    id: 'ITM-009',
    kodeBarang: 'KBR004',
    namaBarang: 'Sabun Cuci Tangan Antiseptik 4L',
    kategoriId: 'CAT-002',
    kategoriNama: 'Alat Kebersihan',
    satuan: 'Jerigen',
    merk: 'Yuri Handsoap',
    spesifikasi: 'Isi ulang 4 Liter antibacterial with moisturizer',
    stokMinimum: 5,
    statusAktif: true,
    keterangan: 'Wastafel dokter, perawat, dan pengunjung',
    hargaEstimasi: 78000
  },
  {
    id: 'ITM-010',
    kodeBarang: 'KBR005',
    namaBarang: 'Plastik Sampah Medis Kuning 60x80',
    kategoriId: 'CAT-002',
    kategoriNama: 'Alat Kebersihan',
    satuan: 'Pak',
    merk: 'Biohazard Med',
    spesifikasi: 'Ketebalan 0.5 micron isi 50 lembar',
    stokMinimum: 10,
    statusAktif: true,
    keterangan: 'Kantong limbah medis padat B3',
    hargaEstimasi: 48000
  },

  // Listrik
  {
    id: 'ITM-011',
    kodeBarang: 'LST001',
    namaBarang: 'Lampu LED Bulb 14W Putih',
    kategoriId: 'CAT-003',
    kategoriNama: 'Alat Listrik',
    satuan: 'Buah',
    merk: 'Philips',
    spesifikasi: 'E27 Cool Daylight 6500K 1400 Lumen',
    stokMinimum: 12,
    statusAktif: true,
    keterangan: 'Penerangan ruang poli, farmasi dan lab',
    hargaEstimasi: 49000
  },
  {
    id: 'ITM-012',
    kodeBarang: 'LST002',
    namaBarang: 'Kabel Stop Kontak 5 Lubang 5M',
    kategoriId: 'CAT-003',
    kategoriNama: 'Alat Listrik',
    satuan: 'Buah',
    merk: 'Uticon',
    spesifikasi: 'Kabel 5 meter dengan switch on/off per lubang',
    stokMinimum: 5,
    statusAktif: true,
    keterangan: 'Colokan alat medis dan komputer loket',
    hargaEstimasi: 92000
  },
  {
    id: 'ITM-013',
    kodeBarang: 'LST003',
    namaBarang: 'Baterai AA Alkaline (Isi 4)',
    kategoriId: 'CAT-003',
    kategoriNama: 'Alat Listrik',
    satuan: 'Pak',
    merk: 'Energizer Max',
    spesifikasi: '1.5V AA isi 4 pcs leak proof',
    stokMinimum: 10,
    statusAktif: true,
    keterangan: 'Tensimeter digital & termometer infrared',
    hargaEstimasi: 45000
  },

  // Pertukangan
  {
    id: 'ITM-014',
    kodeBarang: 'TKG001',
    namaBarang: 'Palu Kambing Baja 16oz',
    kategoriId: 'CAT-004',
    kategoriNama: 'Alat Pertukangan',
    satuan: 'Buah',
    merk: 'Tekiro',
    spesifikasi: 'Gagang fiber rubber grip anti-slip',
    stokMinimum: 2,
    statusAktif: true,
    keterangan: 'Perbaikan sarana gedung puskesmas',
    hargaEstimasi: 75000
  },
  {
    id: 'ITM-015',
    kodeBarang: 'TKG002',
    namaBarang: 'Obeng Set Presisi 8 in 1',
    kategoriId: 'CAT-004',
    kategoriNama: 'Alat Pertukangan',
    satuan: 'Set',
    merk: 'Stanley',
    spesifikasi: 'Mata magnetik plus, minus, torx',
    stokMinimum: 3,
    statusAktif: true,
    keterangan: 'Perawatan alat administrasi & furniture',
    hargaEstimasi: 88000
  },

  // Rumah Tangga
  {
    id: 'ITM-016',
    kodeBarang: 'PRT001',
    namaBarang: 'Galon Air Mineral 19L',
    kategoriId: 'CAT-005',
    kategoriNama: 'Barang Rumah Tangga',
    satuan: 'Galon',
    merk: 'Aqua',
    spesifikasi: 'Isi ulang dispenser ruang tunggu pasien',
    stokMinimum: 8,
    statusAktif: true,
    keterangan: 'Kebutuhan konsumsi pasien & petugas piket',
    hargaEstimasi: 22000
  },
  {
    id: 'ITM-017',
    kodeBarang: 'PRT002',
    namaBarang: 'Tissue Kotak Facial 250s',
    kategoriId: 'CAT-005',
    kategoriNama: 'Barang Rumah Tangga',
    satuan: 'Kotak',
    merk: 'Paseo 2 ply',
    spesifikasi: '250 sheets soft & hygienic',
    stokMinimum: 15,
    statusAktif: true,
    keterangan: 'Meja dokter, poli gigi, dan USG',
    hargaEstimasi: 16500
  },

  // Medis / Non Medis
  {
    id: 'ITM-018',
    kodeBarang: 'MED001',
    namaBarang: 'Masker Medis 3 Ply Bedah (Box 50)',
    kategoriId: 'CAT-006',
    kategoriNama: 'Barang Medis/Non Medis',
    satuan: 'Box',
    merk: 'Sensi Mask',
    spesifikasi: 'Earloop BFE > 99% Kemenkes RI AKD',
    stokMinimum: 20,
    statusAktif: true,
    keterangan: 'APD rutin tenaga kesehatan & pasien ISPA',
    hargaEstimasi: 38000
  },
  {
    id: 'ITM-019',
    kodeBarang: 'MED002',
    namaBarang: 'Sarung Tangan Medis Latex M (Box 100)',
    kategoriId: 'CAT-006',
    kategoriNama: 'Barang Medis/Non Medis',
    satuan: 'Box',
    merk: 'Safeglove',
    spesifikasi: 'Non-sterile powder free Size M',
    stokMinimum: 15,
    statusAktif: true,
    keterangan: 'Tindakan imunisasi, lab, dan poli umum',
    hargaEstimasi: 72000
  },
  {
    id: 'ITM-020',
    kodeBarang: 'MED003',
    namaBarang: 'Alkohol 70% Antiseptik 1 Liter',
    kategoriId: 'CAT-006',
    kategoriNama: 'Barang Medis/Non Medis',
    satuan: 'Botol',
    merk: 'OneMed',
    spesifikasi: 'Ethyl Alcohol 70% botol 1000ml',
    stokMinimum: 10,
    statusAktif: true,
    keterangan: 'Desinfeksi kulit injeksi dan alat medis',
    hargaEstimasi: 34000
  },
  {
    id: 'ITM-021',
    kodeBarang: 'MED004',
    namaBarang: 'Kasa Steril Hidrofil 16x16 (Box 10)',
    kategoriId: 'CAT-006',
    kategoriNama: 'Barang Medis/Non Medis',
    satuan: 'Box',
    merk: 'Husada',
    spesifikasi: 'Kasa lipat steril individual pack',
    stokMinimum: 12,
    statusAktif: true,
    keterangan: 'Perawatan luka & tindakan bedah minor IGD',
    hargaEstimasi: 24000
  },
  {
    id: 'ITM-022',
    kodeBarang: 'MED005',
    namaBarang: 'Povidone Iodine 10% 300ml',
    kategoriId: 'CAT-006',
    kategoriNama: 'Barang Medis/Non Medis',
    satuan: 'Botol',
    merk: 'Betadine Med',
    spesifikasi: 'Antiseptik luka 300 ml botol',
    stokMinimum: 8,
    statusAktif: true,
    keterangan: 'Cairan pembersih luka poli tindakan & VK',
    hargaEstimasi: 42000
  },

  // Barang Lainnya
  {
    id: 'ITM-023',
    kodeBarang: 'LLN001',
    namaBarang: 'Gembok Pagar Kuningan 50mm',
    kategoriId: 'CAT-007',
    kategoriNama: 'Barang Lainnya',
    satuan: 'Buah',
    merk: 'Yale',
    spesifikasi: 'Solid brass with 3 keys anti karat laut',
    stokMinimum: 3,
    statusAktif: true,
    keterangan: 'Keamanan gerbang dermaga & gudang puskesmas',
    hargaEstimasi: 65000
  },
  {
    id: 'ITM-024',
    kodeBarang: 'LLN002',
    namaBarang: 'Jas Hujan Ponco Parasut Karet',
    kategoriId: 'CAT-007',
    kategoriNama: 'Barang Lainnya',
    satuan: 'Buah',
    merk: 'Tiger Head',
    spesifikasi: 'Heavy duty waterproof untuk dinas pulau',
    stokMinimum: 5,
    statusAktif: true,
    keterangan: 'Petugas ambulans laut dan puskesmas keliling',
    hargaEstimasi: 110000
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
    telepon: '081809876543'
  },
  {
    id: 'USR-005',
    nip: '199511082020122011',
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
    gudangId: 'GUD-005',
    role: 'PEGAWAI',
    username: 'perawat_dimas',
    password: '123456',
    statusAktif: true,
    telepon: '085211998877'
  }
];

export const generateInitialStocks = (): WarehouseStock[] => {
  const stocks: WarehouseStock[] = [];
  const baseAllocation: Record<string, { besar: number; tidung: number; pari: number; lancang: number; payung: number }> = {
    'ITM-001': { besar: 80, tidung: 15, pari: 6, lancang: 8, payung: 3 }, // Kertas A4
    'ITM-002': { besar: 50, tidung: 12, pari: 4, lancang: 5, payung: 2 }, // Kertas F4
    'ITM-003': { besar: 35, tidung: 8, pari: 3, lancang: 4, payung: 2 }, // Pulpen
    'ITM-004': { besar: 24, tidung: 5, pari: 2, lancang: 2, payung: 1 }, // Tinta Epson
    'ITM-005': { besar: 40, tidung: 10, pari: 4, lancang: 4, payung: 2 }, // Map Odner
    'ITM-006': { besar: 20, tidung: 5, pari: 2, lancang: 2, payung: 1 }, // Sapu
    'ITM-007': { besar: 25, tidung: 6, pari: 3, lancang: 3, payung: 1 }, // Karbol
    'ITM-008': { besar: 15, tidung: 4, pari: 2, lancang: 2, payung: 1 }, // Kain Pel
    'ITM-009': { besar: 30, tidung: 8, pari: 4, lancang: 3, payung: 1 }, // Handsoap
    'ITM-010': { besar: 45, tidung: 12, pari: 6, lancang: 6, payung: 3 }, // Plastik Medis
    'ITM-011': { besar: 40, tidung: 10, pari: 4, lancang: 4, payung: 2 }, // Lampu LED
    'ITM-012': { besar: 18, tidung: 4, pari: 2, lancang: 2, payung: 1 }, // Kabel Roll
    'ITM-013': { besar: 50, tidung: 12, pari: 5, lancang: 6, payung: 2 }, // Baterai AA
    'ITM-014': { besar: 8, tidung: 2, pari: 1, lancang: 1, payung: 1 }, // Palu
    'ITM-015': { besar: 10, tidung: 3, pari: 1, lancang: 1, payung: 1 }, // Obeng Set
    'ITM-016': { besar: 35, tidung: 8, pari: 4, lancang: 3, payung: 2 }, // Galon Aqua
    'ITM-017': { besar: 60, tidung: 15, pari: 6, lancang: 6, payung: 3 }, // Tissue Kotak
    'ITM-018': { besar: 100, tidung: 25, pari: 10, lancang: 12, payung: 5 }, // Masker
    'ITM-019': { besar: 80, tidung: 20, pari: 8, lancang: 8, payung: 4 }, // Handschoen
    'ITM-020': { besar: 45, tidung: 12, pari: 5, lancang: 5, payung: 2 }, // Alkohol 70%
    'ITM-021': { besar: 60, tidung: 15, pari: 6, lancang: 6, payung: 3 }, // Kasa Steril
    'ITM-022': { besar: 35, tidung: 8, pari: 4, lancang: 3, payung: 2 }, // Betadine
    'ITM-023': { besar: 12, tidung: 3, pari: 1, lancang: 1, payung: 1 }, // Gembok
    'ITM-024': { besar: 20, tidung: 5, pari: 2, lancang: 2, payung: 2 } // Jas Hujan
  };

  const warehouses = [
    { id: 'GUD-001', key: 'besar' as const },
    { id: 'GUD-002', key: 'tidung' as const },
    { id: 'GUD-003', key: 'pari' as const },
    { id: 'GUD-004', key: 'lancang' as const },
    { id: 'GUD-005', key: 'payung' as const }
  ];

  INITIAL_ITEMS.forEach(item => {
    warehouses.forEach(wh => {
      const qty = baseAllocation[item.id] ? baseAllocation[item.id][wh.key] : 10;
      stocks.push({
        id: `STK-${wh.id}-${item.id}`,
        gudangId: wh.id,
        barangId: item.id,
        stokAwal: qty,
        stokMasuk: 0,
        stokKeluar: 0,
        saldo: qty,
        updateTerakhir: '2026-08-27 08:00:00'
      });
    });
  });

  return stocks;
};

export const INITIAL_REQUESTS: ItemRequest[] = [
  {
    id: 'REQ-202608-0001',
    nomorPermintaan: 'REQ/2026/08/0001',
    tanggalPermintaan: '2026-08-24',
    pemohonId: 'USR-004',
    pemohonNama: 'Ahmad Fauzi, A.Md.Kep',
    pemohonNip: '199406182019031006',
    pemohonJabatan: 'Pengelola Pustu & Perawat Pelaksana',
    tempatTugas: 'Pustu Pari',
    gudangAsalId: 'GUD-001',
    gudangAsalNama: 'Gudang Puskesmas Kepulauan Seribu Selatan',
    gudangTujuanId: 'GUD-003',
    gudangTujuanNama: 'Gudang Pustu Pari',
    status: 'SELESAI',
    catatanPemohon: 'Permintaan berkala bulanan logistik administrasi dan kebersihan Pustu Pari',
    items: [
      {
        id: 'REQITM-001',
        barangId: 'ITM-001',
        kodeBarang: 'ATK001',
        namaBarang: 'Kertas HVS A4 80gr',
        satuan: 'Rim',
        stokGudangAsal: 80,
        jumlahDiminta: 10,
        jumlahDisetujui: 10,
        keterangan: 'Untuk cetak rekam medis pasien umum'
      },
      {
        id: 'REQITM-002',
        barangId: 'ITM-007',
        kodeBarang: 'KBR002',
        namaBarang: 'Cairan Karbol Desinfektan 4L',
        satuan: 'Jerigen',
        stokGudangAsal: 25,
        jumlahDiminta: 2,
        jumlahDisetujui: 2,
        keterangan: 'Sanitasi ruang tindakan'
      },
      {
        id: 'REQITM-003',
        barangId: 'ITM-018',
        kodeBarang: 'MED001',
        namaBarang: 'Masker Medis 3 Ply Bedah (Box 50)',
        satuan: 'Box',
        stokGudangAsal: 100,
        jumlahDiminta: 5,
        jumlahDisetujui: 5,
        keterangan: 'Pelayanan poli harian'
      }
    ],
    approverId: 'USR-002',
    approverNama: 'Hendra Setiawan, S.Farm',
    tanggalApproval: '2026-08-24 10:30:00',
    catatanApproval: 'Disetujui penuh sesuai pagu bulanan Pustu Pari',
    nomorDropping: 'DRP/2026/08/0001',
    createdAt: '2026-08-24 09:15:00',
    updatedAt: '2026-08-25 14:00:00'
  },
  {
    id: 'REQ-202608-0002',
    nomorPermintaan: 'REQ/2026/08/0002',
    tanggalPermintaan: '2026-08-26',
    pemohonId: 'USR-003',
    pemohonNama: 'Siti Rahmawati, A.Md.Keb',
    pemohonNip: '199203142015022003',
    pemohonJabatan: 'Pengelola Barang / Bidan Koordinator',
    tempatTugas: 'Puskesmas Tidung',
    gudangAsalId: 'GUD-001',
    gudangAsalNama: 'Gudang Puskesmas Kepulauan Seribu Selatan',
    gudangTujuanId: 'GUD-002',
    gudangTujuanNama: 'Gudang Puskesmas Tidung',
    status: 'DROPPING',
    catatanPemohon: 'Permintaan logistik pendukung pemeriksaan ibu hamil dan loket pendaftaran',
    items: [
      {
        id: 'REQITM-004',
        barangId: 'ITM-004',
        kodeBarang: 'ATK004',
        namaBarang: 'Tinta Printer Epson Black 003',
        satuan: 'Botol',
        stokGudangAsal: 24,
        jumlahDiminta: 4,
        jumlahDisetujui: 3,
        keterangan: 'Tinta loket pendaftaran menipis'
      },
      {
        id: 'REQITM-005',
        barangId: 'ITM-019',
        kodeBarang: 'MED002',
        namaBarang: 'Sarung Tangan Medis Latex M (Box 100)',
        satuan: 'Box',
        stokGudangAsal: 80,
        jumlahDiminta: 10,
        jumlahDisetujui: 8,
        keterangan: 'Kebutuhan VK Bersalin dan Poli KIA'
      }
    ],
    approverId: 'USR-002',
    approverNama: 'Hendra Setiawan, S.Farm',
    tanggalApproval: '2026-08-26 11:20:00',
    catatanApproval: 'Disetujui sebagian karena alokasi cadangan Puskesmas Kecamatan',
    nomorDropping: 'DRP/2026/08/0002',
    createdAt: '2026-08-26 08:30:00',
    updatedAt: '2026-08-26 13:45:00'
  },
  {
    id: 'REQ-202608-0003',
    nomorPermintaan: 'REQ/2026/08/0003',
    tanggalPermintaan: '2026-08-27',
    pemohonId: 'USR-005',
    pemohonNama: 'Dewi Lestari, A.Md.Farm',
    pemohonNip: '199511082020122011',
    pemohonJabatan: 'Pengelola Pustu & Asisten Apoteker',
    tempatTugas: 'Pustu Lancang',
    gudangAsalId: 'GUD-001',
    gudangAsalNama: 'Gudang Puskesmas Kepulauan Seribu Selatan',
    gudangTujuanId: 'GUD-004',
    gudangTujuanNama: 'Gudang Pustu Lancang',
    status: 'DIAJUKAN',
    catatanPemohon: 'Kebutuhan mendesak lampu penerangan dan cairan pembersih luka',
    items: [
      {
        id: 'REQITM-006',
        barangId: 'ITM-011',
        kodeBarang: 'LST001',
        namaBarang: 'Lampu LED Bulb 14W Putih',
        satuan: 'Buah',
        stokGudangAsal: 40,
        jumlahDiminta: 6,
        jumlahDisetujui: 6,
        keterangan: 'Penggantian lampu ruang obat dan IGD Pustu Lancang'
      },
      {
        id: 'REQITM-007',
        barangId: 'ITM-020',
        kodeBarang: 'MED003',
        namaBarang: 'Alkohol 70% Antiseptik 1 Liter',
        satuan: 'Botol',
        stokGudangAsal: 45,
        jumlahDiminta: 3,
        jumlahDisetujui: 3,
        keterangan: 'Stok di Pustu sisa 1 botol'
      }
    ],
    createdAt: '2026-08-27 07:45:00',
    updatedAt: '2026-08-27 07:45:00'
  }
];

export const INITIAL_DROPPINGS: Dropping[] = [
  {
    id: 'DRP-202608-0001',
    nomorDropping: 'DRP/2026/08/0001',
    permintaanId: 'REQ-202608-0001',
    nomorPermintaan: 'REQ/2026/08/0001',
    tanggalDropping: '2026-08-25',
    gudangAsalId: 'GUD-001',
    gudangAsalNama: 'Gudang Puskesmas Kepulauan Seribu Selatan',
    gudangTujuanId: 'GUD-003',
    gudangTujuanNama: 'Gudang Pustu Pari',
    petugasPengirimId: 'USR-002',
    petugasPengirimNama: 'Hendra Setiawan, S.Farm',
    status: 'SELESAI',
    keterangan: 'Distribusi logistik via kapal dinas Puskesmas Keliling ke Pulau Pari',
    items: [
      {
        id: 'DRPITM-001',
        barangId: 'ITM-001',
        kodeBarang: 'ATK001',
        namaBarang: 'Kertas HVS A4 80gr',
        satuan: 'Rim',
        jumlahDisetujui: 10,
        jumlahDikirim: 10,
        jumlahDiterima: 10,
        kondisiBarang: 'Baik & Utuh'
      },
      {
        id: 'DRPITM-002',
        barangId: 'ITM-007',
        kodeBarang: 'KBR002',
        namaBarang: 'Cairan Karbol Desinfektan 4L',
        satuan: 'Jerigen',
        jumlahDisetujui: 2,
        jumlahDikirim: 2,
        jumlahDiterima: 2,
        kondisiBarang: 'Baik & Utuh'
      },
      {
        id: 'DRPITM-003',
        barangId: 'ITM-018',
        kodeBarang: 'MED001',
        namaBarang: 'Masker Medis 3 Ply Bedah (Box 50)',
        satuan: 'Box',
        jumlahDisetujui: 5,
        jumlahDikirim: 5,
        jumlahDiterima: 5,
        kondisiBarang: 'Baik & Utuh'
      }
    ],
    nomorBast: 'BAST/2026/08/0001',
    nomorSbbk: 'SBBK/2026/08/0001',
    tanggalPenerimaan: '2026-08-25 14:00:00',
    penerimaId: 'USR-004',
    penerimaNama: 'Ahmad Fauzi, A.Md.Kep',
    catatanPenerima: 'Semua barang telah diterima dalam kondisi segel baik di Dermaga Pulau Pari',
    createdAt: '2026-08-24 14:00:00'
  },
  {
    id: 'DRP-202608-0002',
    nomorDropping: 'DRP/2026/08/0002',
    permintaanId: 'REQ-202608-0002',
    nomorPermintaan: 'REQ/2026/08/0002',
    tanggalDropping: '2026-08-26',
    gudangAsalId: 'GUD-001',
    gudangAsalNama: 'Gudang Puskesmas Kepulauan Seribu Selatan',
    gudangTujuanId: 'GUD-002',
    gudangTujuanNama: 'Gudang Puskesmas Tidung',
    petugasPengirimId: 'USR-002',
    petugasPengirimNama: 'Hendra Setiawan, S.Farm',
    status: 'DIKIRIM',
    keterangan: 'Barang dikirim via kurir internal Puskesmas Pulau Tidung',
    items: [
      {
        id: 'DRPITM-004',
        barangId: 'ITM-004',
        kodeBarang: 'ATK004',
        namaBarang: 'Tinta Printer Epson Black 003',
        satuan: 'Botol',
        jumlahDisetujui: 3,
        jumlahDikirim: 3,
        kondisiBarang: 'Segel Baru'
      },
      {
        id: 'DRPITM-005',
        barangId: 'ITM-019',
        kodeBarang: 'MED002',
        namaBarang: 'Sarung Tangan Medis Latex M (Box 100)',
        satuan: 'Box',
        jumlahDisetujui: 8,
        jumlahDikirim: 8,
        kondisiBarang: 'Segel Baru'
      }
    ],
    nomorBast: 'BAST/2026/08/0002',
    nomorSbbk: 'SBBK/2026/08/0002',
    createdAt: '2026-08-26 13:45:00'
  }
];

export const INITIAL_BAST_DOCS: BastDocument[] = [
  {
    id: 'BAST-202608-0001',
    nomorBast: 'BAST/2026/08/0001',
    droppingId: 'DRP-202608-0001',
    nomorDropping: 'DRP/2026/08/0001',
    tanggal: '2026-08-25',
    pihakPertamaId: 'USR-002',
    pihakPertamaNama: 'Hendra Setiawan, S.Farm',
    pihakPertamaNip: '198807212011011008',
    pihakPertamaJabatan: 'Koordinator Logistik (PIC Gudang Besar)',
    pihakKeduaId: 'USR-004',
    pihakKeduaNama: 'Ahmad Fauzi, A.Md.Kep',
    pihakKeduaNip: '199406182019031006',
    pihakKeduaJabatan: 'Pengelola Pustu Pari (PIC Sub Gudang)',
    gudangAsalId: 'GUD-001',
    gudangAsalNama: 'Gudang Puskesmas Kepulauan Seribu Selatan',
    gudangTujuanId: 'GUD-003',
    gudangTujuanNama: 'Gudang Pustu Pari',
    items: [
      {
        id: 'DRPITM-001',
        barangId: 'ITM-001',
        kodeBarang: 'ATK001',
        namaBarang: 'Kertas HVS A4 80gr',
        satuan: 'Rim',
        jumlahDisetujui: 10,
        jumlahDikirim: 10,
        jumlahDiterima: 10,
        kondisiBarang: 'Baik'
      },
      {
        id: 'DRPITM-002',
        barangId: 'ITM-007',
        kodeBarang: 'KBR002',
        namaBarang: 'Cairan Karbol Desinfektan 4L',
        satuan: 'Jerigen',
        jumlahDisetujui: 2,
        jumlahDikirim: 2,
        jumlahDiterima: 2,
        kondisiBarang: 'Baik'
      },
      {
        id: 'DRPITM-003',
        barangId: 'ITM-018',
        kodeBarang: 'MED001',
        namaBarang: 'Masker Medis 3 Ply Bedah (Box 50)',
        satuan: 'Box',
        jumlahDisetujui: 5,
        jumlahDikirim: 5,
        jumlahDiterima: 5,
        kondisiBarang: 'Baik'
      }
    ],
    keterangan: 'Telah diserahterimakan barang persediaan dalam keadaan baik dan lengkap untuk menunjang operasional Pustu Pari.',
    createdAt: '2026-08-25 14:00:00'
  }
];

export const INITIAL_SBBK_DOCS: SbbkDocument[] = [
  {
    id: 'SBBK-202608-0001',
    nomorSbbk: 'SBBK/2026/08/0001',
    droppingId: 'DRP-202608-0001',
    nomorDropping: 'DRP/2026/08/0001',
    tanggal: '2026-08-24',
    gudangAsalId: 'GUD-001',
    gudangAsalNama: 'Gudang Puskesmas Kepulauan Seribu Selatan',
    gudangTujuanId: 'GUD-003',
    gudangTujuanNama: 'Gudang Pustu Pari',
    petugasGudangId: 'USR-002',
    petugasGudangNama: 'Hendra Setiawan, S.Farm',
    penerimaNama: 'Ahmad Fauzi, A.Md.Kep',
    penerimaNip: '199406182019031006',
    items: [
      {
        id: 'DRPITM-001',
        barangId: 'ITM-001',
        kodeBarang: 'ATK001',
        namaBarang: 'Kertas HVS A4 80gr',
        satuan: 'Rim',
        jumlahDisetujui: 10,
        jumlahDikirim: 10
      },
      {
        id: 'DRPITM-002',
        barangId: 'ITM-007',
        kodeBarang: 'KBR002',
        namaBarang: 'Cairan Karbol Desinfektan 4L',
        satuan: 'Jerigen',
        jumlahDisetujui: 2,
        jumlahDikirim: 2
      },
      {
        id: 'DRPITM-003',
        barangId: 'ITM-018',
        kodeBarang: 'MED001',
        namaBarang: 'Masker Medis 3 Ply Bedah (Box 50)',
        satuan: 'Box',
        jumlahDisetujui: 5,
        jumlahDikirim: 5
      }
    ],
    keterangan: 'Pengeluaran persediaan dropping barang rutin Pustu Pari',
    createdAt: '2026-08-24 14:00:00'
  }
];

export const INITIAL_TRANSACTIONS: StockTransaction[] = [
  {
    id: 'TRX-001',
    tanggal: '2026-08-01',
    nomorTransaksi: 'TRX/2026/08/0001',
    gudangId: 'GUD-001',
    gudangNama: 'Gudang Puskesmas Kepulauan Seribu Selatan',
    barangId: 'ITM-001',
    barangNama: 'Kertas HVS A4 80gr',
    kodeBarang: 'ATK001',
    satuan: 'Rim',
    jenisTransaksi: 'SALDO_AWAL',
    masuk: 90,
    keluar: 0,
    saldoSebelumnya: 0,
    saldoAkhir: 90,
    userId: 'USR-001',
    userNama: 'Dr. Surya Pratama, M.K.M.',
    keterangan: 'Saldo awal pencatatan persediaan Agustus 2026',
    createdAt: '2026-08-01 08:00:00'
  },
  {
    id: 'TRX-002',
    tanggal: '2026-08-24',
    nomorTransaksi: 'TRX/2026/08/0002',
    gudangId: 'GUD-001',
    gudangNama: 'Gudang Puskesmas Kepulauan Seribu Selatan',
    barangId: 'ITM-001',
    barangNama: 'Kertas HVS A4 80gr',
    kodeBarang: 'ATK001',
    satuan: 'Rim',
    jenisTransaksi: 'KELUAR_DROPPING',
    masuk: 0,
    keluar: 10,
    saldoSebelumnya: 90,
    saldoAkhir: 80,
    userId: 'USR-002',
    userNama: 'Hendra Setiawan, S.Farm',
    referensiDokumen: 'DRP/2026/08/0001',
    keterangan: 'Dropping ke Gudang Pustu Pari',
    createdAt: '2026-08-24 14:00:00'
  },
  {
    id: 'TRX-003',
    tanggal: '2026-08-25',
    nomorTransaksi: 'TRX/2026/08/0003',
    gudangId: 'GUD-003',
    gudangNama: 'Gudang Pustu Pari',
    barangId: 'ITM-001',
    barangNama: 'Kertas HVS A4 80gr',
    kodeBarang: 'ATK001',
    satuan: 'Rim',
    jenisTransaksi: 'MASUK_DROPPING',
    masuk: 10,
    keluar: 0,
    saldoSebelumnya: 6,
    saldoAkhir: 16,
    userId: 'USR-004',
    userNama: 'Ahmad Fauzi, A.Md.Kep',
    referensiDokumen: 'DRP/2026/08/0001',
    keterangan: 'Penerimaan dropping dari Gudang Besar',
    createdAt: '2026-08-25 14:00:00'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'LOG-001',
    userId: 'USR-001',
    userNama: 'Dr. Surya Pratama, M.K.M.',
    role: 'ADMIN',
    waktu: '2026-08-27 08:00:00',
    aktivitas: 'Inisialisasi Sistem',
    modul: 'PENGATURAN',
    keterangan: 'Sistem SI JAJUL (Sistem Informasi Jaga Stok dan Jalur Logistik) Puskesmas Kepulauan Seribu Selatan siap digunakan.'
  },
  {
    id: 'LOG-002',
    userId: 'USR-004',
    userNama: 'Ahmad Fauzi, A.Md.Kep',
    role: 'PIC_SUB_GUDANG',
    waktu: '2026-08-25 14:05:00',
    aktivitas: 'Konfirmasi Penerimaan Dropping',
    modul: 'PENERIMAAN',
    nomorTransaksi: 'DRP/2026/08/0001',
    keterangan: 'Konfirmasi penerimaan dropping BAST/2026/08/0001 di Gudang Pustu Pari'
  },
  {
    id: 'LOG-003',
    userId: 'USR-002',
    userNama: 'Hendra Setiawan, S.Farm',
    role: 'PIC_GUDANG_BESAR',
    waktu: '2026-08-26 11:20:00',
    aktivitas: 'Approval Permintaan',
    modul: 'APPROVAL',
    nomorTransaksi: 'REQ/2026/08/0002',
    keterangan: 'Menyetujui permohonan logistik Puskesmas Tidung'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'NOTIF-001',
    userId: 'ROLE_PIC_BESAR',
    judul: 'Permintaan Barang Baru Masuk',
    pesan: 'Permintaan REQ/2026/08/0003 dari Dewi Lestari (Pustu Lancang) membutuhkan peninjauan dan approval.',
    tipe: 'INFO',
    linkTarget: 'approval',
    dibaca: false,
    waktu: '2026-08-27 07:45:00'
  },
  {
    id: 'NOTIF-002',
    userId: 'USR-003',
    gudangId: 'GUD-002',
    judul: 'Barang Sedang Dalam Proses Dropping',
    pesan: 'Dropping DRP/2026/08/0002 telah dikirim dari Gudang Besar menuju Gudang Puskesmas Tidung.',
    tipe: 'SUCCESS',
    linkTarget: 'penerimaan',
    dibaca: false,
    waktu: '2026-08-26 13:45:00'
  },
  {
    id: 'NOTIF-003',
    userId: 'ROLE_ADMIN',
    judul: 'Peringatan Stok Menipis',
    pesan: 'Stok Kertas A4 di Gudang Pusling Payung tersisa 3 Rim (Mendekati batas kritis).',
    tipe: 'WARNING',
    linkTarget: 'stok',
    dibaca: true,
    waktu: '2026-08-26 10:00:00'
  }
];

export const DEFAULT_NUMBER_CONFIG: NumberFormatConfig = {
  prefixPermintaan: 'REQ/{YYYY}/{MM}/{XXXX}',
  prefixDropping: 'DRP/{YYYY}/{MM}/{XXXX}',
  prefixBast: 'BAST/{YYYY}/{MM}/{XXXX}',
  prefixSbbk: 'SBBK/{YYYY}/{MM}/{XXXX}',
  prefixMutasi: 'MUT/{YYYY}/{MM}/{XXXX}',
  prefixOpname: 'OPN/{YYYY}/{MM}/{XXXX}',
  prefixTransaksi: 'TRX/{YYYY}/{MM}/{XXXX}'
};

export const DEFAULT_SHEETS_CONFIG: GoogleSheetsConfig = {
  spreadsheetId: '1AbCdEfGhIjKlMnOpQrStUvWxYz_SAMPLE_ID_PUSKESMAS_KSS',
  gasDeploymentUrl: '',
  autoSync: true,
  isConnected: false
};

export const INITIAL_PROPOSALS: ItemProposal[] = [
  {
    id: 'USL-001',
    nomorUsulan: 'USL/2026/08/0001',
    tanggalUsulan: '2026-08-25',
    pemohonId: 'USR-008',
    pemohonNama: 'drg. Anisa Permatasari',
    pemohonNip: '199008142018012004',
    pemohonJabatan: 'Dokter Gigi Pelaksana',
    unitKerja: 'Poli Kesehatan Gigi & Mulut',
    tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
    namaBarang: 'Scaler Gigi Ultrasonik Portable LED',
    kategoriId: 'CAT-006',
    kategoriNama: 'Barang Medis/Non Medis',
    spesifikasi: 'Ultrasonic Piezo Scaler dengan handpiece autoclavable, frekuensi 28kHz-32kHz, lampu LED',
    merkRekomendasi: 'Woodpecker / DTE',
    jumlahDiusulkan: 2,
    satuan: 'Unit',
    estimasiHargaSatuan: 2850000,
    estimasiTotalHarga: 5700000,
    alasanPengusulan: 'Peralatan scaler poli gigi lama rusak total dan tidak tersedia pada katalog persediaan rutin. Dibutuhkan mendesak untuk tindakan pembersihan karang gigi pasien BPJS & Umum.',
    prioritas: 'TINGGI',
    urgensi: 'Mendesak untuk pelayanan poli gigi',
    linkReferensi: 'https://e-katalog.lkpp.go.id',
    status: 'DISETUJUI_PENGADAAN',
    catatanApproval: 'Disetujui untuk dimasukkan dalam pengadaan RBA BOK Puskesmas Triwulan III',
    approverId: 'USR-001',
    approverNama: 'Dr. Surya Pratama, M.K.M.',
    tanggalApproval: '2026-08-26',
    nomorDpaRekening: '5.2.2.01.03 - Belanja Alat Kedokteran Gigi',
    sudahMasukMasterBarang: false,
    createdAt: '2026-08-25 09:30:00',
    updatedAt: '2026-08-26 10:15:00'
  },
  {
    id: 'USL-002',
    nomorUsulan: 'USL/2026/08/0002',
    tanggalUsulan: '2026-08-26',
    pemohonId: 'USR-007',
    pemohonNama: 'Rina Marlina, S.Tr.Keb',
    pemohonNip: '199605122022032008',
    pemohonJabatan: 'Bidan Pelaksana KIA/KB',
    unitKerja: 'Puskesmas Pembantu Pulau Pari',
    tempatTugas: 'Pustu Pari',
    namaBarang: 'Doppler Fetal Monitor Jantung Janin Digital',
    kategoriId: 'CAT-006',
    kategoriNama: 'Barang Medis/Non Medis',
    spesifikasi: 'Fetal Doppler LCD Backlight display, probe 2.5 MHz waterproof, speaker jernih & rechargeable baterai',
    merkRekomendasi: 'Sonoline B / Onemed',
    jumlahDiusulkan: 1,
    satuan: 'Unit',
    estimasiHargaSatuan: 750000,
    estimasiTotalHarga: 750000,
    alasanPengusulan: 'Stok tidak ada di gudang puskesmas. Sangat diperlukan untuk deteksi dini detak jantung janin pada pemeriksaan ibu hamil ANC di Pulau Pari.',
    prioritas: 'TINGGI',
    urgensi: 'Pemeriksaan rutin bumil di pulau terpencil',
    linkReferensi: 'https://e-katalog.lkpp.go.id',
    status: 'DIAJUKAN',
    sudahMasukMasterBarang: false,
    createdAt: '2026-08-26 11:00:00',
    updatedAt: '2026-08-26 11:00:00'
  },
  {
    id: 'USL-003',
    nomorUsulan: 'USL/2026/08/0003',
    tanggalUsulan: '2026-08-26',
    pemohonId: 'USR-012',
    pemohonNama: 'Maya Anggraini, A.Md.RMIK',
    pemohonNip: '199801152023022009',
    pemohonJabatan: 'Perekam Medis & Informasi Kesehatan',
    unitKerja: 'Loket Pendaftaran & Rekam Medis',
    tempatTugas: 'Puskesmas Kepulauan Seribu Selatan',
    namaBarang: 'Mesin Penghancur Kertas / Paper Shredder Heavy Duty',
    kategoriId: 'CAT-001',
    kategoriNama: 'ATK',
    spesifikasi: 'Cross-cut shredder kapasitas 15 lembar, kapasitas wadah 25L, proteksi overheat',
    merkRekomendasi: 'GBC / Deli',
    jumlahDiusulkan: 1,
    satuan: 'Unit',
    estimasiHargaSatuan: 1450000,
    estimasiTotalHarga: 1450000,
    alasanPengusulan: 'Pemusnahan berkas rekam medis inaktif dan dokumen rahasia pasien yang telah melewati batas retensi sesuai permenkes.',
    prioritas: 'SEDANG',
    urgensi: 'Kerahasiaan data rekam medis pasien',
    linkReferensi: '',
    status: 'DIAJUKAN',
    sudahMasukMasterBarang: false,
    createdAt: '2026-08-26 14:20:00',
    updatedAt: '2026-08-26 14:20:00'
  }
];
