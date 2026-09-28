export type UserRole = 'ADMIN' | 'PIC_GUDANG_BESAR' | 'PIC_SUB_GUDANG' | 'PEGAWAI';
export type Role = UserRole;

export interface User {
  id: string;
  nip?: string;
  nama: string;
  jabatan: string;
  unitKerja?: string;
  tempatTugas?: string;
  gudangId?: string;
  gudangNama?: string;
  role: UserRole;
  username: string;
  password?: string;
  statusAktif: boolean;
  telepon?: string;
  noHp?: string;
  email?: string;
}

export type WarehouseType = 'GUDANG_BESAR' | 'SUB_GUDANG';

export interface Warehouse {
  id: string;
  kodeGudang: string;
  namaGudang: string;
  tipeGudang: WarehouseType;
  parentGudangId?: string | null;
  picId?: string;
  picNama: string;
  picNip?: string;
  picKontak?: string;
  lokasi?: string;
  lokasiPulau?: string;
  statusAktif?: boolean;
  keterangan?: string;
}

export interface Category {
  id: string;
  kode: string;
  nama: string;
  statusAktif?: boolean;
  deskripsi?: string;
}

export interface Item {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kategoriId: string;
  kategoriNama: string;
  satuan: string;
  merk: string;
  spesifikasi: string;
  stokMinimum: number;
  statusAktif: boolean;
  keterangan: string;
  hargaEstimasi?: number;
}

export interface WarehouseStock {
  id: string;
  gudangId: string;
  barangId: string;
  stokAwal: number;
  stokMasuk: number;
  stokKeluar: number;
  saldo: number;
  updateTerakhir: string;
}

export type RequestStatus = 
  | 'DRAFT' 
  | 'DIAJUKAN' 
  | 'DIPERIKSA' 
  | 'DISETUJUI' 
  | 'DITOLAK' 
  | 'DROPPING' 
  | 'DITERIMA' 
  | 'SELESAI';

export interface RequestItem {
  id: string;
  barangId: string;
  kodeBarang: string;
  namaBarang: string;
  satuan: string;
  stokGudangAsal: number;
  jumlahDiminta: number;
  jumlahDisetujui: number;
  keterangan?: string;
}

export interface ItemRequest {
  id: string;
  nomorPermintaan: string;
  tanggalPermintaan: string;
  pemohonId: string;
  pemohonNama: string;
  pemohonNip: string;
  pemohonJabatan: string;
  tempatTugas: string;
  gudangAsalId: string;
  gudangAsalNama: string;
  gudangTujuanId: string;
  gudangTujuanNama: string;
  status: RequestStatus;
  catatanPemohon: string;
  items: RequestItem[];
  approverId?: string;
  approverNama?: string;
  tanggalApproval?: string;
  catatanApproval?: string;
  nomorDropping?: string;
  createdAt: string;
  updatedAt: string;
}

export type DroppingStatus = 'MENUNGGU_PENGIRIMAN' | 'DIKIRIM' | 'DROPPING' | 'DIPROSES' | 'DITERIMA' | 'SELESAI';

export interface DroppingItem {
  id: string;
  barangId: string;
  kodeBarang: string;
  namaBarang: string;
  satuan: string;
  jumlahDisetujui: number;
  jumlahDikirim: number;
  jumlahDiterima?: number;
  kondisiBarang?: string;
  keterangan?: string;
}

export interface Dropping {
  id: string;
  nomorDropping: string;
  permintaanId: string;
  nomorPermintaan: string;
  tanggalDropping: string;
  gudangAsalId: string;
  gudangAsalNama: string;
  gudangTujuanId: string;
  gudangTujuanNama: string;
  petugasPengirimId: string;
  petugasPengirimNama: string;
  status: DroppingStatus;
  keterangan: string;
  catatan?: string;
  items: DroppingItem[];
  nomorBast?: string;
  nomorSbbk?: string;
  tanggalPenerimaan?: string;
  penerimaId?: string;
  penerimaNama?: string;
  catatanPenerima?: string;
  createdAt: string;
}

export type TransactionType = 
  | 'SALDO_AWAL' 
  | 'MASUK_DROPPING' 
  | 'PENERIMAAN_DROPPING'
  | 'KELUAR_DROPPING' 
  | 'MUTASI_MASUK' 
  | 'MUTASI_KELUAR' 
  | 'PENYESUAIAN_OPNAME' 
  | 'PENYESUAIAN_MANUAL'
  | 'PENGELUARAN_LANGSUNG'
  | 'PENGEMBALIAN';

export interface StockTransaction {
  id: string;
  tanggal: string;
  nomorTransaksi: string;
  gudangId: string;
  gudangNama: string;
  barangId: string;
  barangNama: string;
  kodeBarang: string;
  satuan: string;
  jenisTransaksi: TransactionType;
  masuk: number;
  keluar: number;
  saldoSebelumnya: number;
  saldoAkhir: number;
  userId: string;
  userNama: string;
  referensiDokumen?: string;
  keterangan: string;
  createdAt: string;
}

export interface BastDocument {
  id: string;
  nomorBast: string;
  droppingId: string;
  nomorDropping: string;
  tanggal: string;
  pihakPertamaId: string;
  pihakPertamaNama: string;
  pihakPertamaNip: string;
  pihakPertamaJabatan: string;
  pihakKeduaId: string;
  pihakKeduaNama: string;
  pihakKeduaNip: string;
  pihakKeduaJabatan: string;
  gudangAsalId: string;
  gudangAsalNama: string;
  gudangTujuanId: string;
  gudangTujuanNama: string;
  items: DroppingItem[];
  keterangan: string;
  createdAt: string;
}

export interface SbbkDocument {
  id: string;
  nomorSbbk: string;
  droppingId: string;
  nomorDropping: string;
  tanggal: string;
  gudangAsalId: string;
  gudangAsalNama: string;
  gudangTujuanId: string;
  gudangTujuanNama: string;
  petugasGudangId: string;
  petugasGudangNama: string;
  penerimaNama: string;
  penerimaNip: string;
  items: DroppingItem[];
  keterangan: string;
  createdAt: string;
}

export interface InterWarehouseMutation {
  id: string;
  nomorMutasi: string;
  tanggal: string;
  gudangAsalId: string;
  gudangAsalNama: string;
  gudangTujuanId: string;
  gudangTujuanNama: string;
  barangId: string;
  kodeBarang: string;
  namaBarang: string;
  satuan: string;
  jumlah: number;
  alasan: string;
  petugasId: string;
  petugasNama: string;
  status: 'MENUNGGU_APPROVAL' | 'DISETUJUI' | 'DITOLAK' | 'SELESAI';
  approverId?: string;
  approverNama?: string;
  catatanApproval?: string;
  createdAt: string;
}

export interface StockOpnameItem {
  barangId: string;
  kodeBarang: string;
  namaBarang: string;
  satuan: string;
  stokSistem: number;
  stokFisik: number;
  selisih: number;
  keterangan: string;
}

export interface StockOpname {
  id: string;
  nomorOpname: string;
  tanggal: string;
  gudangId: string;
  gudangNama: string;
  petugasId: string;
  petugasNama: string;
  status: 'DRAFT' | 'SELESAI' | 'DISETUJUI';
  keterangan: string;
  items: StockOpnameItem[];
  approverNama?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp?: string;
  userId: string;
  userNama: string;
  role: string;
  waktu?: string;
  action?: string;
  aktivitas?: string;
  module?: string;
  modul?: string;
  details?: string;
  nomorTransaksi?: string;
  keterangan?: string;
  deviceInfo?: string;
  ipAddress?: string;
}

export type AuditLog = ActivityLog;

export interface AppNotification {
  id: string;
  userId: string | 'ALL' | 'ROLE_ADMIN' | 'ROLE_PIC_BESAR' | 'ROLE_PIC_SUB';
  gudangId?: string;
  judul: string;
  pesan: string;
  tipe: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  linkTarget?: string;
  dibaca: boolean;
  isRead?: boolean;
  waktu: string;
}

export type Notification = AppNotification;

export interface NumberFormatConfig {
  prefixPermintaan: string;
  prefixDropping: string;
  prefixBast: string;
  prefixSbbk: string;
  prefixMutasi: string;
  prefixOpname: string;
  prefixTransaksi: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  gasDeploymentUrl: string;
  autoSync: boolean;
  lastSyncTime?: string;
  isConnected: boolean;
}

export interface GasConfig {
  webAppUrl: string;
  spreadsheetId?: string;
  autoSync: boolean;
  lastSyncTime?: string;
  status: 'CONNECTED' | 'OFFLINE';
}

export type WhatsappProvider = 'FONNTE' | 'WABLAS' | 'ULTRAMSG' | 'GENERIC_WEBHOOK' | 'CUSTOM';

export interface WhatsappConfig {
  provider: WhatsappProvider;
  apiUrl: string;
  apiKey: string;
  senderNumber: string;
  targetNumber: string;
  enableStockAlerts: boolean;
  enableRequestAlerts: boolean;
  enableDroppingAlerts: boolean;
  botActive: boolean;
  botName: string;
  botAutoReply: boolean;
  botPrefix: string;
  lastTestStatus?: 'SUCCESS' | 'FAILED' | 'PENDING' | null;
  lastTestMessage?: string;
  lastTestedAt?: string;
}

export interface AppLogoConfig {
  logoJayaRaya: string; // Base64 or Image URL
  logoKesehatan: string; // Base64 or Image URL
  namaPemprov: string;
  namaDinas: string;
  namaPuskesmas: string;
  alamatPuskesmas: string;
  kontakPuskesmas: string;
  updatedAt?: string;
}

export interface BotChatMessage {
  id: string;
  sender: 'USER' | 'BOT' | 'SYSTEM';
  text: string;
  timestamp: string;
  senderName?: string;
  senderPhone?: string;
  warehouseId?: string;
}

export interface BotQueryResponse {
  message: string;
  matchedItems?: {
    barangId: string;
    kodeBarang: string;
    namaBarang: string;
    satuan: string;
    stocks: {
      gudangId: string;
      namaGudang: string;
      saldo: number;
      stokMinimum: number;
      status: 'AMAN' | 'KRITIS' | 'HABIS';
    }[];
    totalStok: number;
  }[];
  intent: 'STOCK_CHECK' | 'LOW_STOCK' | 'WAREHOUSE_STOCK' | 'REQUEST_STATUS' | 'DROPPING_STATUS' | 'HELP' | 'UNKNOWN';
}

// USULAN BARANG BARU (PENGADAAN / BELANJA)
export type ProposalStatus = 
  | 'DIAJUKAN' 
  | 'DISETUJUI_PENGADAAN' 
  | 'DIPROSES_BELANJA' 
  | 'TERBELANJA' 
  | 'DITOLAK';

export type ProposalPriority = 'MENDESAK' | 'TINGGI' | 'SEDANG' | 'RENDAH' | 'RUTIN';

export interface ItemProposal {
  id: string;
  nomorUsulan: string;
  tanggalUsulan: string;
  pemohonId: string;
  pemohonNama: string;
  pemohonNip?: string;
  pemohonJabatan: string;
  unitKerja: string;
  tempatTugas: string;
  namaBarang: string;
  kategoriId: string;
  kategoriNama: string;
  spesifikasi: string;
  merkRekomendasi?: string;
  jumlahDiusulkan: number;
  satuan: string;
  estimasiHargaSatuan: number;
  estimasiTotalHarga: number;
  alasanPengusulan: string;
  prioritas: ProposalPriority;
  urgensi?: string;
  linkReferensi?: string;
  status: ProposalStatus;
  catatanApproval?: string;
  approverId?: string;
  approverNama?: string;
  tanggalApproval?: string;
  nomorDpaRekening?: string;
  sudahMasukMasterBarang?: boolean;
  masterBarangIdGenerated?: string;
  createdAt: string;
  updatedAt: string;
}
