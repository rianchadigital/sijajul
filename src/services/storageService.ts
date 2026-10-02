import { 
  User, Role, Warehouse, Category, Item, WarehouseStock, 
  ItemRequest, Dropping, StockTransaction, BastDocument, 
  SbbkDocument, InterWarehouseMutation, StockOpname, 
  ActivityLog, AppNotification, NumberFormatConfig, GoogleSheetsConfig,
  WhatsappConfig, AppLogoConfig, ItemProposal, ProposalStatus, ProposalPriority
} from '../types';
import { 
  INITIAL_USERS, INITIAL_WAREHOUSES, INITIAL_CATEGORIES, 
  INITIAL_ITEMS, generateInitialStocks, INITIAL_REQUESTS, 
  INITIAL_DROPPINGS, INITIAL_BAST_DOCS, INITIAL_SBBK_DOCS, 
  INITIAL_TRANSACTIONS, INITIAL_ACTIVITY_LOGS, INITIAL_NOTIFICATIONS, 
  DEFAULT_NUMBER_CONFIG, DEFAULT_SHEETS_CONFIG, INITIAL_PROPOSALS
} from '../data/initialData';
import { DEFAULT_LOGO_JAYA_RAYA, DEFAULT_LOGO_KESEHATAN } from '../data/defaultLogos';

export const DEFAULT_WHATSAPP_CONFIG: WhatsappConfig = {
  provider: 'FONNTE',
  apiUrl: 'https://api.fonnte.com/send',
  apiKey: '',
  senderNumber: '081234567890',
  targetNumber: '081298765432',
  enableStockAlerts: true,
  enableRequestAlerts: true,
  enableDroppingAlerts: true,
  botActive: true,
  botName: 'SI JAJUL Bot KSS',
  botAutoReply: true,
  botPrefix: 'cek',
  lastTestStatus: null,
  lastTestMessage: ''
};

export const DEFAULT_LOGO_CONFIG: AppLogoConfig = {
  logoJayaRaya: DEFAULT_LOGO_JAYA_RAYA,
  logoKesehatan: DEFAULT_LOGO_KESEHATAN,
  namaPemprov: 'PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA',
  namaDinas: 'DINAS KESEHATAN',
  namaPuskesmas: 'PUSKESMAS KECAMATAN KEPULAUAN SERIBU SELATAN',
  alamatPuskesmas: 'Jl. Pantai Selatan No. 1, Pulau Tidung, Kepulauan Seribu Selatan, DKI Jakarta 14520',
  kontakPuskesmas: 'Telepon: (021) 6411234 | Email: puskesmas.kepseribuselatan@jakarta.go.id | Web: puskesmas-kss.jakarta.go.id'
};

const STORAGE_KEYS = {
  USERS: 'sijajul_users_v1',
  CURRENT_USER: 'sijajul_current_user_v1',
  WAREHOUSES: 'sijajul_warehouses_v1',
  CATEGORIES: 'sijajul_categories_v1',
  ITEMS: 'sijajul_items_v1',
  STOCKS: 'sijajul_stocks_v1',
  REQUESTS: 'sijajul_requests_v1',
  DROPPINGS: 'sijajul_droppings_v1',
  BAST_DOCS: 'sijajul_bast_docs_v1',
  SBBK_DOCS: 'sijajul_sbbk_docs_v1',
  MUTATIONS: 'sijajul_mutations_v1',
  OPNAMES: 'sijajul_opnames_v1',
  TRANSACTIONS: 'sijajul_transactions_v1',
  ACTIVITY_LOGS: 'sijajul_activity_logs_v1',
  NOTIFICATIONS: 'sijajul_notifications_v1',
  NUMBER_CONFIG: 'sijajul_number_config_v1',
  SHEETS_CONFIG: 'sijajul_sheets_config_v1',
  WHATSAPP_CONFIG: 'sijajul_whatsapp_config_v1',
  LOGO_CONFIG: 'sijajul_logo_config_v1',
  PROPOSALS: 'sijajul_proposals_v1',
};

class StorageService {
  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data || data === 'undefined' || data === 'null') {
        this.setItem(key, fallback);
        return fallback;
      }
      const parsed = JSON.parse(data);
      if (parsed === null || parsed === undefined) {
        this.setItem(key, fallback);
        return fallback;
      }
      if (Array.isArray(fallback) && !Array.isArray(parsed)) {
        this.setItem(key, fallback);
        return fallback;
      }
      return parsed as T;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      if (typeof window !== 'undefined' && key.startsWith('sijajul_')) {
        const mutatingKeys = [
          STORAGE_KEYS.ITEMS, STORAGE_KEYS.STOCKS, STORAGE_KEYS.REQUESTS,
          STORAGE_KEYS.DROPPINGS, STORAGE_KEYS.TRANSACTIONS, STORAGE_KEYS.PROPOSALS,
          STORAGE_KEYS.BAST_DOCS, STORAGE_KEYS.SBBK_DOCS, STORAGE_KEYS.USERS,
          STORAGE_KEYS.WAREHOUSES, STORAGE_KEYS.CATEGORIES
        ];
        if (mutatingKeys.includes(key)) {
          window.dispatchEvent(new CustomEvent('sijajul_data_mutated', { detail: { key } }));
          window.dispatchEvent(new CustomEvent('sijajul_data_updated', { detail: { key } }));
        }
      }
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  }

  // Users & Auth
  getUsers(): User[] {
    const rawUsers = this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const seenIds = new Set<string>();
    const seenNips = new Set<string>();
    const seenUsernames = new Set<string>();
    const uniqueUsers: User[] = [];
    let needsSave = false;

    // Helper to format clean ID (e.g. USR-001)
    const formatCleanId = (rawId: any, fallbackSeq: number): string => {
      const trimmed = String(rawId || '').trim().toUpperCase();
      if (/^USR-\d+$/.test(trimmed)) return trimmed;
      return `USR-${String(fallbackSeq).padStart(3, '0')}`;
    };

    // 1. Process candidate users from storage, deduplicating strictly by ID, NIP, and username
    const candidates = Array.isArray(rawUsers) && rawUsers.length > 0 ? rawUsers : INITIAL_USERS;

    candidates.forEach((u, idx) => {
      if (!u) return;
      let cleanId = formatCleanId(u.id, idx + 1);
      const cleanNip = (u.nip || '').trim();
      const cleanUsername = (u.username || (u.nip ? u.nip : u.nama.toLowerCase().replace(/\s+/g, '_').slice(0, 15))).trim().toLowerCase();

      // Check for duplicates
      const idTaken = seenIds.has(cleanId);
      const nipTaken = cleanNip ? seenNips.has(cleanNip) : false;
      const usernameTaken = cleanUsername ? seenUsernames.has(cleanUsername) : false;

      if (idTaken || nipTaken || usernameTaken) {
        if (idTaken && !nipTaken && !usernameTaken) {
          // Different person but ID collided: allocate next free unique sequence ID
          let seq = 1;
          while (seenIds.has(`USR-${String(seq).padStart(3, '0')}`)) {
            seq++;
          }
          cleanId = `USR-${String(seq).padStart(3, '0')}`;
          needsSave = true;
        } else {
          // Same person already in list: merge details into existing user
          const existing = uniqueUsers.find(ex => 
            ex.id === cleanId || 
            (cleanNip && ex.nip && ex.nip.trim() === cleanNip) ||
            (cleanUsername && ex.username && ex.username.trim().toLowerCase() === cleanUsername)
          );
          if (existing) {
            existing.password = existing.password || u.password || '123456';
            existing.telepon = existing.telepon || u.telepon || (u as any).noHp || existing.noHp;
            existing.noHp = existing.noHp || (u as any).noHp || u.telepon || existing.telepon;
            if (u.tempatTugas && !existing.tempatTugas) existing.tempatTugas = u.tempatTugas;
            if (u.gudangId && !existing.gudangId) existing.gudangId = u.gudangId;
          }
          needsSave = true;
          return;
        }
      }

      seenIds.add(cleanId);
      if (cleanNip) seenNips.add(cleanNip);
      if (cleanUsername) seenUsernames.add(cleanUsername);

      uniqueUsers.push({
        ...u,
        id: cleanId,
        password: u.password || '123456',
        username: cleanUsername,
        telepon: u.telepon || (u as any).noHp || '',
        noHp: (u as any).noHp || u.telepon || ''
      });
    });

    // 2. Ensure all INITIAL_USERS exist without duplicating IDs or accounts
    INITIAL_USERS.forEach((initU, initIdx) => {
      const cleanInitId = formatCleanId(initU.id, initIdx + 1);
      const cleanInitNip = (initU.nip || '').trim();
      const cleanInitUsername = (initU.username || '').trim().toLowerCase();

      const existsById = seenIds.has(cleanInitId);
      const existsByNip = cleanInitNip ? seenNips.has(cleanInitNip) : false;
      const existsByUsername = cleanInitUsername ? seenUsernames.has(cleanInitUsername) : false;

      if (!existsById && !existsByNip && !existsByUsername) {
        let cleanId = cleanInitId;
        if (seenIds.has(cleanId)) {
          let seq = 1;
          while (seenIds.has(`USR-${String(seq).padStart(3, '0')}`)) {
            seq++;
          }
          cleanId = `USR-${String(seq).padStart(3, '0')}`;
        }

        seenIds.add(cleanId);
        if (cleanInitNip) seenNips.add(cleanInitNip);
        if (cleanInitUsername) seenUsernames.add(cleanInitUsername);

        uniqueUsers.push({
          ...initU,
          id: cleanId,
          password: initU.password || '123456',
          username: cleanInitUsername
        });
        needsSave = true;
      }
    });

    // 3. Absolute final verification: every item strictly unique by ID
    const finalSet = new Set<string>();
    const finalUsers: User[] = [];
    uniqueUsers.forEach(u => {
      let finalId = formatCleanId(u.id, finalUsers.length + 1);
      if (finalSet.has(finalId)) {
        let seq = 1;
        while (finalSet.has(`USR-${String(seq).padStart(3, '0')}`)) {
          seq++;
        }
        finalId = `USR-${String(seq).padStart(3, '0')}`;
        needsSave = true;
      }
      finalSet.add(finalId);
      finalUsers.push({
        ...u,
        id: finalId
      });
    });

    if (needsSave || finalUsers.length !== rawUsers.length) {
      this.setItem(STORAGE_KEYS.USERS, finalUsers);
    }
    return finalUsers;
  }

  saveUsers(users: User[]): void {
    const seenIds = new Set<string>();
    const seenUsernames = new Set<string>();
    const uniqueUsers: User[] = [];

    users.forEach((u, idx) => {
      if (!u) return;
      let cleanId = String(u.id || '').trim().toUpperCase();
      if (!cleanId || seenIds.has(cleanId)) {
        let seq = 1;
        while (seenIds.has(`USR-${String(seq).padStart(3, '0')}`)) {
          seq++;
        }
        cleanId = `USR-${String(seq).padStart(3, '0')}`;
      }
      seenIds.add(cleanId);

      const cleanUsername = (u.username || (u.nip ? u.nip : u.nama.toLowerCase().replace(/\s+/g, '_').slice(0, 15))).trim().toLowerCase();

      uniqueUsers.push({
        ...u,
        id: cleanId,
        password: u.password || '123456',
        username: cleanUsername,
        telepon: u.telepon || (u as any).noHp || '',
        noHp: (u as any).noHp || u.telepon || ''
      });
    });

    this.setItem(STORAGE_KEYS.USERS, uniqueUsers);
  }

  saveUser(user: User, adminName?: string): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    const sanitizedUser: User = {
      ...user,
      password: user.password || '123456',
      username: user.username?.trim().toLowerCase() || (user.nip ? user.nip : user.nama.toLowerCase().replace(/\s+/g, '_').slice(0, 15))
    };

    const isNew = idx < 0;
    if (isNew) {
      users.push(sanitizedUser);
    } else {
      users[idx] = sanitizedUser;
    }
    this.saveUsers(users);
    
    // If current logged-in user is updated, update CURRENT_USER session too
    const current = this.getCurrentUser();
    if (current && current.id === sanitizedUser.id) {
      this.setCurrentUser(sanitizedUser);
    }

    this.recordAuditLog(
      isNew ? 'CREATE' : 'UPDATE', 
      'MASTER_USER', 
      `${isNew ? 'Menambahkan akun pengguna baru' : 'Memperbarui data akun'} ${sanitizedUser.nama} (Username: ${sanitizedUser.username}, Role: ${sanitizedUser.role})`,
      adminName || current?.nama || 'Super Admin',
      current?.role || 'ADMIN'
    );
  }

  resetUserPassword(userId: string, defaultPassword = '123456', adminName?: string): { success: boolean; message: string; user?: User } {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) {
      return { success: false, message: 'User tidak ditemukan' };
    }

    const user = { ...users[idx], password: defaultPassword };
    users[idx] = user;
    this.saveUsers(users);

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(user);
    }

    this.recordAuditLog(
      'RESET_PASSWORD', 
      'AUTH', 
      `Super Admin mereset password akun ${user.nama} (${user.username}) menjadi default: ${defaultPassword}`,
      adminName || current?.nama || 'Super Admin',
      current?.role || 'ADMIN'
    );

    return { 
      success: true, 
      message: `Password akun ${user.nama} (${user.username}) berhasil direset ke default: ${defaultPassword}`,
      user 
    };
  }

  changeUserPassword(userId: string, newPass: string, performerName?: string): { success: boolean; message: string } {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) {
      return { success: false, message: 'User tidak ditemukan' };
    }

    users[idx].password = newPass;
    this.saveUsers(users);

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(users[idx]);
    }

    this.recordAuditLog(
      'UPDATE_PASSWORD', 
      'AUTH', 
      `Mengubah kata sandi akun ${users[idx].nama} (${users[idx].username})`,
      performerName || current?.nama || 'Pengguna',
      current?.role || 'PEGAWAI'
    );

    return { success: true, message: 'Kata sandi berhasil diperbarui' };
  }

  deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    this.saveUsers(users);
    this.recordAuditLog('DELETE', 'MASTER_USER', `Menghapus user ID ${id}`);
  }

  importUsersFromSpreadsheetRows(rows: any[], currentUser?: User): { success: boolean; importedCount: number; updatedCount: number; message: string; users: User[] } {
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return { success: false, importedCount: 0, updatedCount: 0, message: 'Tidak ada baris data pengguna yang valid.', users: this.getUsers() };
    }

    const existingUsers = this.getUsers();
    const warehouses = this.getWarehouses();
    let importedCount = 0;
    let updatedCount = 0;

    rows.forEach((row, idx) => {
      // Support object format (Google Sheets readTable) or array format
      let id = '';
      let nip = '';
      let nama = '';
      let jabatan = '';
      let unitKerja = '';
      let tempatTugas = '';
      let roleRaw = '';
      let username = '';
      let statusRaw = '';
      let noHp = '';

      if (Array.isArray(row)) {
        id = (row[0] || '').toString().trim();
        nip = (row[1] || '').toString().trim();
        nama = (row[2] || '').toString().trim();
        jabatan = (row[3] || '').toString().trim();
        unitKerja = (row[4] || '').toString().trim();
        tempatTugas = (row[5] || '').toString().trim();
        roleRaw = (row[6] || '').toString().trim();
        username = (row[7] || '').toString().trim();
        statusRaw = (row[8] || '').toString().trim();
        noHp = (row[9] || '').toString().trim();
      } else if (typeof row === 'object' && row !== null) {
        id = (row['ID User'] || row['id'] || row['ID'] || '').toString().trim();
        nip = (row['NIP'] || row['nip'] || '').toString().trim();
        nama = (row['Nama Lengkap'] || row['Nama'] || row['nama'] || row['NAMA'] || '').toString().trim();
        jabatan = (row['Jabatan'] || row['jabatan'] || '').toString().trim();
        unitKerja = (row['Unit Kerja'] || row['unitKerja'] || '').toString().trim();
        tempatTugas = (row['Gudang Penugasan'] || row['Tempat Tugas'] || row['tempatTugas'] || row['Lokasi'] || '').toString().trim();
        roleRaw = (row['Hak Akses (Role)'] || row['Role'] || row['role'] || row['HAK AKSES'] || '').toString().trim();
        username = (row['Username'] || row['username'] || '').toString().trim();
        statusRaw = (row['Status Akun'] || row['Status'] || row['status'] || row['statusAktif'] || '').toString().trim();
        noHp = (row['No WhatsApp'] || row['No HP'] || row['telepon'] || row['noHp'] || row['Kontak'] || '').toString().trim();
      }

      if (!nama && !username && !nip) return; // Skip empty row

      // Normalize Role
      let role: Role = 'PEGAWAI';
      const roleUpper = roleRaw.toUpperCase();
      if (roleUpper.includes('ADMIN') || roleUpper.includes('SUPER')) {
        role = 'ADMIN';
      } else if (roleUpper.includes('BESAR') || roleUpper.includes('INDUK') || roleUpper.includes('KSS')) {
        role = 'PIC_GUDANG_BESAR';
      } else if (roleUpper.includes('SUB') || roleUpper.includes('PUSTU') || roleUpper.includes('PUSLING') || roleUpper.includes('PIC')) {
        role = 'PIC_SUB_GUDANG';
      } else {
        role = 'PEGAWAI';
      }

      // Map Tempat Tugas to Warehouse
      let gudangId = 'GUD-001';
      const ttLower = (tempatTugas || unitKerja || '').toLowerCase();
      if (ttLower.includes('tidung')) {
        gudangId = 'GUD-002';
      } else if (ttLower.includes('pari')) {
        gudangId = 'GUD-003';
      } else if (ttLower.includes('lancang')) {
        gudangId = 'GUD-004';
      } else if (ttLower.includes('payung')) {
        gudangId = 'GUD-005';
      } else {
        gudangId = 'GUD-001';
      }

      // Find Warehouse name
      const wh = warehouses.find(w => w.id === gudangId);
      const gudangNama = wh ? wh.namaGudang : 'Gudang Puskesmas Kepulauan Seribu Selatan';

      // Auto-generate clean username if missing
      let cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!cleanUsername) {
        if (nip && nip.length >= 4) {
          cleanUsername = nip;
        } else {
          cleanUsername = (nama || 'pegawai').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 15);
        }
      }

      // Status
      const statusAktif = !(statusRaw.toLowerCase().includes('non') || statusRaw.toLowerCase().includes('tidak') || statusRaw.toLowerCase().includes('inaktif') || statusRaw === 'false');

      // Check if user already exists (by ID, NIP, or username)
      const cleanUpperId = id ? id.toUpperCase() : '';
      const existingIdx = existingUsers.findIndex(u => 
        (cleanUpperId && u.id.toUpperCase() === cleanUpperId) || 
        (nip && u.nip && u.nip.trim() === nip.trim()) || 
        (cleanUsername && u.username.toLowerCase() === cleanUsername)
      );

      if (existingIdx >= 0) {
        // Update existing user without changing id
        existingUsers[existingIdx] = {
          ...existingUsers[existingIdx],
          id: existingUsers[existingIdx].id.toUpperCase(), // Strictly preserve existing ID
          nama: nama || existingUsers[existingIdx].nama,
          nip: nip || existingUsers[existingIdx].nip,
          jabatan: jabatan || existingUsers[existingIdx].jabatan,
          unitKerja: unitKerja || existingUsers[existingIdx].unitKerja,
          tempatTugas: tempatTugas || existingUsers[existingIdx].tempatTugas,
          gudangId: gudangId || existingUsers[existingIdx].gudangId,
          gudangNama: gudangNama,
          role: role || existingUsers[existingIdx].role,
          username: cleanUsername || existingUsers[existingIdx].username,
          password: existingUsers[existingIdx].password || '123456',
          statusAktif: statusAktif,
          telepon: noHp || existingUsers[existingIdx].telepon || existingUsers[existingIdx].noHp,
          noHp: noHp || existingUsers[existingIdx].noHp
        };
        updatedCount++;
      } else {
        // Add new with guaranteed non-colliding ID
        let newId = cleanUpperId;
        if (!newId || existingUsers.some(u => u.id.toUpperCase() === newId.toUpperCase())) {
          let seq = 1;
          while (existingUsers.some(u => u.id.toUpperCase() === `USR-${String(seq).padStart(3, '0')}`)) {
            seq++;
          }
          newId = `USR-${String(seq).padStart(3, '0')}`;
        }

        const newUser: User = {
          id: newId,
          nip: nip,
          nama: nama || 'Pegawai Baru',
          jabatan: jabatan || 'Pegawai Puskesmas',
          unitKerja: unitKerja || 'Puskesmas Kepulauan Seribu Selatan',
          tempatTugas: tempatTugas || 'Puskesmas Kepulauan Seribu Selatan',
          gudangId: gudangId,
          gudangNama: gudangNama,
          role: role,
          username: cleanUsername,
          password: '123456', // Default password for new users
          statusAktif: statusAktif,
          telepon: noHp,
          noHp: noHp
        };
        existingUsers.push(newUser);
        importedCount++;
      }
    });

    this.saveUsers(existingUsers);

    const performer = currentUser?.nama || this.getCurrentUser()?.nama || 'Super Admin';
    const performerRole = currentUser?.role || this.getCurrentUser()?.role || 'ADMIN';
    this.recordAuditLog(
      'IMPORT_USERS',
      'MASTER_USER',
      `Import / Sinkronisasi data pegawai dari Spreadsheet: ${importedCount} akun baru dibuat, ${updatedCount} akun diperbarui. Password default: 123456`,
      performer,
      performerRole
    );

    return {
      success: true,
      importedCount,
      updatedCount,
      message: `Berhasil memproses data pegawai! Ditambahkan ${importedCount} akun baru dan diperbarui ${updatedCount} akun. Pegawai sekarang dapat langsung login dengan username masing-masing dan password default "123456".`,
      users: existingUsers
    };
  }

  getCurrentUser(): User | null {
    return this.getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  setCurrentUser(user: User | null): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Warehouses
  getWarehouses(): Warehouse[] {
    const list = this.getItem<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
    let needsSave = false;
    INITIAL_WAREHOUSES.forEach(initWh => {
      const exists = list.some(w => w.id === initWh.id || w.kodeGudang === initWh.kodeGudang || w.namaGudang.toLowerCase() === initWh.namaGudang.toLowerCase());
      if (!exists) {
        list.push(initWh);
        needsSave = true;
      }
    });
    if (needsSave) {
      this.setItem(STORAGE_KEYS.WAREHOUSES, list);
    }
    return list;
  }

  saveWarehouses(warehouses: Warehouse[]): void {
    this.setItem(STORAGE_KEYS.WAREHOUSES, warehouses);
  }

  saveWarehouse(warehouse: Warehouse): void {
    const warehouses = this.getWarehouses();
    const idx = warehouses.findIndex(w => w.id === warehouse.id);
    if (idx >= 0) {
      warehouses[idx] = warehouse;
    } else {
      warehouses.push(warehouse);
    }
    this.saveWarehouses(warehouses);
    this.recordAuditLog('UPDATE', 'MASTER_GUDANG', `Menyimpan data gudang ${warehouse.namaGudang}`);
  }

  deleteWarehouse(id: string): void {
    const warehouses = this.getWarehouses().filter(w => w.id !== id);
    this.saveWarehouses(warehouses);
    this.recordAuditLog('DELETE', 'MASTER_GUDANG', `Menghapus gudang ID ${id}`);
  }

  // Categories
  getCategories(): Category[] {
    return this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  saveCategories(categories: Category[]): void {
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);
  }

  saveCategory(category: Category): void {
    const categories = this.getCategories();
    const idx = categories.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      categories[idx] = category;
    } else {
      categories.push(category);
    }
    this.saveCategories(categories);
    this.recordAuditLog('UPDATE', 'MASTER_KATEGORI', `Menyimpan data kategori ${category.nama}`);
  }

  deleteCategory(id: string, reassignToCatId?: string): { success: boolean; affectedItemsCount: number; deletedCategoryName: string } {
    const categories = this.getCategories();
    const catToDelete = categories.find(c => c.id === id);
    const catName = catToDelete ? catToDelete.nama : 'Kategori';
    
    // Filter out the category
    const remainingCategories = categories.filter(c => c.id !== id);
    this.saveCategories(remainingCategories);

    // Check items assigned to this category
    const items = this.getItems();
    let affectedCount = 0;
    
    // Determine fallback category
    let targetCat = remainingCategories.find(c => c.id === reassignToCatId);
    if (!targetCat && remainingCategories.length > 0) {
      targetCat = remainingCategories[0];
    }

    const updatedItems = items.map(item => {
      if (item.kategoriId === id || item.kategoriNama === catName) {
        affectedCount++;
        return {
          ...item,
          kategoriId: targetCat ? targetCat.id : 'CAT-UMUM',
          kategoriNama: targetCat ? targetCat.nama : 'Umum'
        };
      }
      return item;
    });

    if (affectedCount > 0) {
      this.saveItems(updatedItems);
    }

    const current = this.getCurrentUser();
    this.recordAuditLog(
      'DELETE', 
      'MASTER_KATEGORI', 
      `Menghapus kategori "${catName}". ${affectedCount > 0 ? `${affectedCount} barang dialihkan ke "${targetCat?.nama || 'Umum'}"` : ''}`,
      current?.nama || 'Super Admin',
      current?.role || 'ADMIN'
    );

    return {
      success: true,
      affectedItemsCount: affectedCount,
      deletedCategoryName: catName
    };
  }

  // Items
  getItems(): Item[] {
    const items = this.getItem<Item[]>(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    if (!items || items.length === 0) {
      this.saveItems(INITIAL_ITEMS);
      return INITIAL_ITEMS;
    }
    return items;
  }

  saveItems(items: Item[]): void {
    this.setItem(STORAGE_KEYS.ITEMS, items);
  }

  saveItem(item: Item, initialStockBigWarehouse = 0): void {
    const items = this.getItems();
    const idx = items.findIndex(i => i.id === item.id);
    const isNew = idx < 0;
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.push(item);
    }
    this.saveItems(items);

    // Sinkronkan atau buat saldo stok awal untuk gudang
    const stocks = this.getStocks();
    const warehouses = this.getWarehouses();

    if (isNew) {
      warehouses.forEach(wh => {
        const stockExists = stocks.some(s => s.barangId === item.id && s.gudangId === wh.id);
        if (!stockExists) {
          const initQty = (wh.tipeGudang === 'GUDANG_BESAR' || wh.id === 'GUD-001') ? initialStockBigWarehouse : 0;
          stocks.push({
            id: `STK-${wh.id}-${item.id}`,
            gudangId: wh.id,
            barangId: item.id,
            stokAwal: initQty,
            stokMasuk: 0,
            stokKeluar: 0,
            saldo: initQty,
            updateTerakhir: new Date().toISOString().replace('T', ' ').slice(0, 19)
          });
        }
      });
      this.saveStocks(stocks);
    } else {
      let changed = false;
      stocks.forEach(s => {
        if (s.barangId === item.id) {
          s.updateTerakhir = new Date().toISOString().replace('T', ' ').slice(0, 19);
          changed = true;
        }
      });
      if (changed) this.saveStocks(stocks);
    }

    this.recordAuditLog(
      isNew ? 'CREATE' : 'UPDATE', 
      'MASTER_BARANG', 
      `${isNew ? 'Menambahkan' : 'Memperbarui'} master barang "${item.namaBarang}" (Kode: ${item.kodeBarang}, Satuan: ${item.satuan})`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sijajul_data_mutated', { detail: { key: STORAGE_KEYS.ITEMS, item } }));
      window.dispatchEvent(new CustomEvent('sijajul_data_updated', { detail: { key: STORAGE_KEYS.ITEMS, item } }));
    }
  }

  deleteItem(id: string): void {
    const items = this.getItems();
    const itemToDelete = items.find(i => i.id === id);
    const updated = items.filter(i => i.id !== id);
    this.saveItems(updated);

    // Hapus juga saldo stok barang ini di seluruh gudang
    const stocks = this.getStocks().filter(s => s.barangId !== id);
    this.saveStocks(stocks);
    
    const current = this.getCurrentUser();
    this.recordAuditLog(
      'DELETE', 
      'MASTER_BARANG', 
      `Menghapus barang "${itemToDelete?.namaBarang || id}"`,
      current?.nama || 'Super Admin',
      current?.role || 'ADMIN'
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sijajul_data_mutated', { detail: { key: STORAGE_KEYS.ITEMS, deletedId: id } }));
      window.dispatchEvent(new CustomEvent('sijajul_data_updated', { detail: { key: STORAGE_KEYS.ITEMS, deletedId: id } }));
    }
  }

  /**
   * Batch Import Items from parsed Excel data with automatic category creation and stock initialization
   */
  importItemsBatch(
    importRows: {
      kodeBarang?: string;
      namaBarang: string;
      kategoriNama?: string;
      satuan?: string;
      merk?: string;
      spesifikasi?: string;
      stokMinimum?: number;
      stokAwalGudangBesar?: number;
      keterangan?: string;
    }[],
    options: {
      updateExisting?: boolean;
      targetWarehouseId?: string;
      performerName?: string;
    } = {}
  ): {
    success: boolean;
    importedCount: number;
    updatedCount: number;
    newCategoriesCount: number;
    items: Item[];
    message: string;
  } {
    const existingItems = [...this.getItems()];
    const existingCategories = [...this.getCategories()];
    const warehouses = this.getWarehouses();
    const stocks = [...this.getStocks()];

    const categoryMap = new Map<string, Category>();
    existingCategories.forEach(c => categoryMap.set(c.nama.trim().toLowerCase(), c));

    const itemCodeMap = new Map<string, Item>();
    const itemNameMap = new Map<string, Item>();
    existingItems.forEach(i => {
      if (i.kodeBarang) itemCodeMap.set(i.kodeBarang.trim().toLowerCase(), i);
      if (i.namaBarang) itemNameMap.set(i.namaBarang.trim().toLowerCase(), i);
    });

    let importedCount = 0;
    let updatedCount = 0;
    let newCategoriesCount = 0;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const primaryGudangId = options.targetWarehouseId || (warehouses.find(w => w.tipeGudang === 'GUDANG_BESAR')?.id || 'GUDANG-001');

    importRows.forEach((row, idx) => {
      if (!row.namaBarang || !row.namaBarang.trim()) return;

      const cleanNama = row.namaBarang.trim();
      const cleanKategoriNama = (row.kategoriNama || 'Umum').trim();
      const catKey = cleanKategoriNama.toLowerCase();

      // Ensure Category Exists or Create It
      let category = categoryMap.get(catKey);
      if (!category) {
        const newCatCode = `KAT-${(existingCategories.length + newCategoriesCount + 1).toString().padStart(3, '0')}`;
        category = {
          id: `CAT-${Date.now()}-${newCategoriesCount}`,
          kode: newCatCode,
          nama: cleanKategoriNama,
          deskripsi: `Kategori otomatis hasil import Excel`,
          statusAktif: true
        };
        existingCategories.push(category);
        categoryMap.set(catKey, category);
        newCategoriesCount++;
      }

      // Check if existing
      const cleanKode = (row.kodeBarang || '').trim();
      const matchByCode = cleanKode ? itemCodeMap.get(cleanKode.toLowerCase()) : undefined;
      const matchByName = itemNameMap.get(cleanNama.toLowerCase());
      const existing = matchByCode || matchByName;

      let targetItem: Item;

      if (existing && options.updateExisting !== false) {
        // Update existing item
        targetItem = {
          ...existing,
          kodeBarang: cleanKode || existing.kodeBarang,
          namaBarang: cleanNama,
          kategoriId: category.id,
          kategoriNama: category.nama,
          satuan: row.satuan?.trim() || existing.satuan || 'Pcs',
          merk: row.merk?.trim() !== undefined ? row.merk.trim() : existing.merk,
          spesifikasi: row.spesifikasi?.trim() !== undefined ? row.spesifikasi.trim() : existing.spesifikasi,
          stokMinimum: typeof row.stokMinimum === 'number' && !isNaN(row.stokMinimum) ? row.stokMinimum : existing.stokMinimum,
          keterangan: row.keterangan?.trim() !== undefined ? row.keterangan.trim() : existing.keterangan,
          statusAktif: true
        };

        const itemIdx = existingItems.findIndex(i => i.id === existing.id);
        if (itemIdx >= 0) {
          existingItems[itemIdx] = targetItem;
        }
        updatedCount++;
      } else {
        // Create new item
        const generatedCode = cleanKode || `BRG-${(existingItems.length + importedCount + 1).toString().padStart(4, '0')}`;
        targetItem = {
          id: `ITEM-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          kodeBarang: generatedCode,
          namaBarang: cleanNama,
          kategoriId: category.id,
          kategoriNama: category.nama,
          satuan: row.satuan?.trim() || 'Pcs',
          merk: row.merk?.trim() || '-',
          spesifikasi: row.spesifikasi?.trim() || '',
          stokMinimum: typeof row.stokMinimum === 'number' && !isNaN(row.stokMinimum) ? row.stokMinimum : 10,
          keterangan: row.keterangan?.trim() || '',
          statusAktif: true
        };

        existingItems.push(targetItem);
        itemCodeMap.set(targetItem.kodeBarang.toLowerCase(), targetItem);
        itemNameMap.set(targetItem.namaBarang.toLowerCase(), targetItem);
        importedCount++;
      }

      // Initialize stock for all warehouses for this item
      const initialStockQty = typeof row.stokAwalGudangBesar === 'number' && !isNaN(row.stokAwalGudangBesar) ? Math.max(0, row.stokAwalGudangBesar) : 0;

      warehouses.forEach(wh => {
        let stockRecord = stocks.find(s => s.gudangId === wh.id && s.barangId === targetItem.id);
        if (!stockRecord) {
          const isTargetWarehouse = wh.id === primaryGudangId;
          const qty = isTargetWarehouse ? initialStockQty : 0;
          stockRecord = {
            id: `STK-${wh.id}-${targetItem.id}`,
            gudangId: wh.id,
            barangId: targetItem.id,
            stokAwal: qty,
            stokMasuk: 0,
            stokKeluar: 0,
            saldo: qty,
            updateTerakhir: nowStr
          };
          stocks.push(stockRecord);
        } else if (wh.id === primaryGudangId && initialStockQty > 0 && stockRecord.saldo === 0) {
          // If stock was 0 and initial stock is provided, populate it
          stockRecord.stokAwal = initialStockQty;
          stockRecord.saldo = initialStockQty;
          stockRecord.updateTerakhir = nowStr;
        }
      });
    });

    // Persist all changes
    if (newCategoriesCount > 0) {
      this.saveCategories(existingCategories);
    }
    this.saveItems(existingItems);
    this.saveStocks(stocks);

    const performer = options.performerName || this.getCurrentUser()?.nama || 'Super Admin';
    const role = this.getCurrentUser()?.role || 'ADMIN';
    this.recordAuditLog(
      'IMPORT_EXCEL',
      'MASTER_BARANG',
      `Import data master barang Excel: ${importedCount} barang baru ditambahkan, ${updatedCount} barang diperbarui, ${newCategoriesCount} kategori baru dibuat.`,
      performer,
      role
    );

    return {
      success: true,
      importedCount,
      updatedCount,
      newCategoriesCount,
      items: existingItems,
      message: `Import berhasil! Ditambahkan ${importedCount} barang baru, ${updatedCount} barang diperbarui.${newCategoriesCount > 0 ? ` Otomatis membuat ${newCategoriesCount} kategori baru.` : ''}`
    };
  }

  // Stocks
  getStocks(): WarehouseStock[] {
    const stocks = this.getItem<WarehouseStock[]>(STORAGE_KEYS.STOCKS, generateInitialStocks());
    if (!stocks || stocks.length === 0) {
      const init = generateInitialStocks();
      this.saveStocks(init);
      return init;
    }
    return stocks;
  }

  saveStocks(stocks: WarehouseStock[]): void {
    this.setItem(STORAGE_KEYS.STOCKS, stocks);
  }

  getStockByWarehouseAndItem(warehouseId: string, itemId: string): WarehouseStock {
    const stocks = this.getStocks();
    let stock = stocks.find(s => s.gudangId === warehouseId && s.barangId === itemId);
    if (!stock) {
      stock = {
        id: `STK-${warehouseId}-${itemId}`,
        gudangId: warehouseId,
        barangId: itemId,
        stokAwal: 0,
        stokMasuk: 0,
        stokKeluar: 0,
        saldo: 0,
        updateTerakhir: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };
      stocks.push(stock);
      this.saveStocks(stocks);
    }
    return stock;
  }

  // Requests
  getRequests(): ItemRequest[] {
    return this.getItem<ItemRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
  }

  saveRequests(requests: ItemRequest[]): void {
    this.setItem(STORAGE_KEYS.REQUESTS, requests);
  }

  // Proposals (Usulan Barang Baru)
  getProposals(): ItemProposal[] {
    return this.getItem<ItemProposal[]>(STORAGE_KEYS.PROPOSALS, INITIAL_PROPOSALS);
  }

  saveProposals(proposals: ItemProposal[]): void {
    this.setItem(STORAGE_KEYS.PROPOSALS, proposals);
  }

  saveProposal(proposal: ItemProposal, userName?: string): void {
    const list = this.getProposals();
    const idx = list.findIndex(p => p.id === proposal.id);
    const isNew = idx < 0;
    if (isNew) {
      list.unshift(proposal);
    } else {
      list[idx] = proposal;
    }
    this.saveProposals(list);
    this.recordAuditLog(
      isNew ? 'CREATE' : 'UPDATE',
      'USULAN_BARANG',
      `${isNew ? 'Mengajukan usulan barang baru' : 'Memperbarui usulan'} ${proposal.nomorUsulan}: ${proposal.namaBarang} (${proposal.jumlahDiusulkan} ${proposal.satuan})`,
      userName || this.getCurrentUser()?.nama || proposal.pemohonNama,
      this.getCurrentUser()?.role || 'PEGAWAI'
    );
  }

  createProposal(data: Partial<ItemProposal>, currentUser: User): ItemProposal {
    const list = this.getProposals();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(list.length + 1).padStart(4, '0');
    const nomorUsulan = `USL/${year}/${month}/${seq}`;

    const newProposal: ItemProposal = {
      id: `USL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nomorUsulan,
      tanggalUsulan: data.tanggalUsulan || now.toISOString().split('T')[0],
      pemohonId: currentUser.id,
      pemohonNama: currentUser.nama,
      pemohonNip: currentUser.nip || '',
      pemohonJabatan: currentUser.jabatan || 'Pegawai',
      unitKerja: currentUser.unitKerja || 'Puskesmas Kepulauan Seribu Selatan',
      tempatTugas: currentUser.tempatTugas || 'Puskesmas Kepulauan Seribu Selatan',
      namaBarang: data.namaBarang || '',
      kategoriId: data.kategoriId || 'CAT-007',
      kategoriNama: data.kategoriNama || 'Barang Lainnya',
      spesifikasi: data.spesifikasi || '',
      merkRekomendasi: data.merkRekomendasi || '',
      jumlahDiusulkan: Number(data.jumlahDiusulkan) || 1,
      satuan: data.satuan || 'Pcs',
      estimasiHargaSatuan: Number(data.estimasiHargaSatuan) || 0,
      estimasiTotalHarga: (Number(data.jumlahDiusulkan) || 1) * (Number(data.estimasiHargaSatuan) || 0),
      alasanPengusulan: data.alasanPengusulan || '',
      prioritas: data.prioritas || 'SEDANG',
      urgensi: data.urgensi || '',
      linkReferensi: data.linkReferensi || '',
      status: 'DIAJUKAN',
      sudahMasukMasterBarang: false,
      createdAt: now.toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: now.toISOString().replace('T', ' ').slice(0, 19)
    };

    this.saveProposal(newProposal, currentUser.nama);

    // Send notification to Admin and PIC Gudang Besar
    this.sendNotification(
      'ROLE_PIC_BESAR',
      'Usulan Barang Baru Masuk',
      `Usulan ${newProposal.nomorUsulan} (${newProposal.namaBarang}) diajukan oleh ${currentUser.nama} (${newProposal.tempatTugas}).`,
      'INFO',
      'usulan_barang'
    );
    this.sendNotification(
      'ROLE_ADMIN',
      'Usulan Barang Baru Masuk',
      `Usulan belanja ${newProposal.nomorUsulan} (${newProposal.namaBarang}) diajukan oleh ${currentUser.nama}.`,
      'INFO',
      'usulan_barang'
    );

    return newProposal;
  }

  approveProposal(
    proposalId: string, 
    approver: User, 
    status: ProposalStatus, 
    catatan?: string, 
    dpaRekening?: string
  ): void {
    const list = this.getProposals();
    const idx = list.findIndex(p => p.id === proposalId);
    if (idx < 0) return;

    const prop = list[idx];
    prop.status = status;
    prop.approverId = approver.id;
    prop.approverNama = approver.nama;
    prop.tanggalApproval = new Date().toISOString().split('T')[0];
    prop.catatanApproval = catatan || prop.catatanApproval;
    if (dpaRekening) prop.nomorDpaRekening = dpaRekening;
    prop.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

    this.saveProposals(list);

    // Notify requester
    const statusLabel = 
      status === 'DISETUJUI_PENGADAAN' ? 'Disetujui untuk Rencana Pengadaan' :
      status === 'DIPROSES_BELANJA' ? 'Sedang Diproses Belanja' :
      status === 'TERBELANJA' ? 'Telah Selesai Dibelanjakan' :
      status === 'DITOLAK' ? 'Ditolak' : status;

    this.sendNotification(
      prop.pemohonId,
      `Status Usulan Barang: ${statusLabel}`,
      `Usulan ${prop.nomorUsulan} (${prop.namaBarang}) telah diverifikasi: ${statusLabel}. ${catatan ? `Catatan: ${catatan}` : ''}`,
      status === 'DITOLAK' ? 'DANGER' : 'SUCCESS',
      'usulan_barang'
    );

    this.recordAuditLog(
      'APPROVE_PROPOSAL',
      'USULAN_BARANG',
      `Verifikasi status usulan barang ${prop.nomorUsulan} (${prop.namaBarang}) -> ${status} oleh ${approver.nama}`,
      approver.nama,
      approver.role
    );
  }

  convertProposalToMasterItem(proposalId: string, currentUser: User): Item {
    const list = this.getProposals();
    const idx = list.findIndex(p => p.id === proposalId);
    if (idx < 0) throw new Error('Usulan barang tidak ditemukan.');

    const prop = list[idx];
    const items = this.getItems();
    const categories = this.getCategories();

    // Check category exists
    let cat = categories.find(c => c.id === prop.kategoriId);
    if (!cat) {
      cat = categories.find(c => c.nama.toLowerCase() === prop.kategoriNama.toLowerCase());
    }
    if (!cat) {
      cat = categories[0] || { id: 'CAT-007', kode: 'LLN', nama: 'Barang Lainnya' };
    }

    // Generate Item Code
    const prefix = cat.kode || 'BRG';
    const catItems = items.filter(i => i.kategoriId === cat!.id);
    const kodeBarang = `${prefix}${String(catItems.length + 1).padStart(3, '0')}`;
    const itemId = `ITM-${String(items.length + 1).padStart(3, '0')}`;

    const newItem: Item = {
      id: itemId,
      kodeBarang,
      namaBarang: prop.namaBarang,
      kategoriId: cat.id,
      kategoriNama: cat.nama,
      satuan: prop.satuan || 'Pcs',
      merk: prop.merkRekomendasi || '-',
      spesifikasi: prop.spesifikasi || '',
      stokMinimum: 5,
      statusAktif: true,
      keterangan: `Pengadaan dari Usulan ${prop.nomorUsulan} (${prop.pemohonNama} - ${prop.tempatTugas})`,
      hargaEstimasi: prop.estimasiHargaSatuan || 0
    };

    items.push(newItem);
    this.saveItems(items);

    // Initialize stock across warehouses
    const stocks = this.getStocks();
    const warehouses = this.getWarehouses();
    warehouses.forEach(wh => {
      const isGB = wh.tipeGudang === 'GUDANG_BESAR';
      const initialQty = isGB ? (prop.jumlahDiusulkan || 0) : 0;
      stocks.push({
        id: `STK-${wh.id}-${newItem.id}`,
        gudangId: wh.id,
        barangId: newItem.id,
        stokAwal: initialQty,
        stokMasuk: 0,
        stokKeluar: 0,
        saldo: initialQty,
        updateTerakhir: new Date().toISOString().replace('T', ' ').slice(0, 19)
      });
    });
    this.saveStocks(stocks);

    // Mark proposal as TERBELANJA & sudahMasukMasterBarang
    prop.status = 'TERBELANJA';
    prop.sudahMasukMasterBarang = true;
    prop.masterBarangIdGenerated = newItem.id;
    prop.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    this.saveProposals(list);

    this.recordAuditLog(
      'CONVERT_TO_MASTER',
      'MASTER_BARANG',
      `Menambahkan ${newItem.namaBarang} (${newItem.kodeBarang}) ke Master Barang dari Usulan Belanja ${prop.nomorUsulan}`,
      currentUser.nama,
      currentUser.role
    );

    return newItem;
  }

  deleteProposal(id: string, userName?: string): void {
    const list = this.getProposals().filter(p => p.id !== id);
    this.saveProposals(list);
    this.recordAuditLog('DELETE', 'USULAN_BARANG', `Menghapus usulan barang ID ${id}`, userName);
  }

  // Droppings
  getDroppings(): Dropping[] {
    return this.getItem<Dropping[]>(STORAGE_KEYS.DROPPINGS, INITIAL_DROPPINGS);
  }

  saveDroppings(droppings: Dropping[]): void {
    this.setItem(STORAGE_KEYS.DROPPINGS, droppings);
  }

  // BAST
  getBastDocs(): BastDocument[] {
    return this.getItem<BastDocument[]>(STORAGE_KEYS.BAST_DOCS, INITIAL_BAST_DOCS);
  }

  saveBastDocs(docs: BastDocument[]): void {
    this.setItem(STORAGE_KEYS.BAST_DOCS, docs);
  }

  // SBBK
  getSbbkDocs(): SbbkDocument[] {
    return this.getItem<SbbkDocument[]>(STORAGE_KEYS.SBBK_DOCS, INITIAL_SBBK_DOCS);
  }

  saveSbbkDocs(docs: SbbkDocument[]): void {
    this.setItem(STORAGE_KEYS.SBBK_DOCS, docs);
  }

  // Mutations
  getMutations(): InterWarehouseMutation[] {
    return this.getItem<InterWarehouseMutation[]>(STORAGE_KEYS.MUTATIONS, []);
  }

  saveMutations(mutations: InterWarehouseMutation[]): void {
    this.setItem(STORAGE_KEYS.MUTATIONS, mutations);
  }

  // Stock Opname
  getOpnames(): StockOpname[] {
    return this.getItem<StockOpname[]>(STORAGE_KEYS.OPNAMES, []);
  }

  saveOpnames(opnames: StockOpname[]): void {
    this.setItem(STORAGE_KEYS.OPNAMES, opnames);
  }

  // Transactions
  getTransactions(): StockTransaction[] {
    return this.getItem<StockTransaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }

  saveTransactions(transactions: StockTransaction[]): void {
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  getItemStockTransactions(warehouseId: string, itemId: string): StockTransaction[] {
    return this.getTransactions().filter(t => t.gudangId === warehouseId && t.barangId === itemId);
  }

  // Activity Logs / Audit Log
  getActivityLogs(): ActivityLog[] {
    const raw = this.getItem<any[]>(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
    return raw.map((l: any) => ({
      ...l,
      timestamp: l.timestamp || l.waktu || new Date().toLocaleString('id-ID'),
      action: l.action || l.aktivitas || 'AKTIVITAS',
      module: l.module || l.modul || 'SISTEM',
      details: l.details || l.keterangan || ''
    }));
  }

  getAuditLogs(): ActivityLog[] {
    return this.getActivityLogs();
  }

  saveActivityLogs(logs: ActivityLog[]): void {
    this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, logs);
  }

  recordAuditLog(action: string, module: string, details: string, customUser?: string, customRole?: string): void {
    const currentUser = this.getCurrentUser();
    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString('id-ID'),
      waktu: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: currentUser?.id || 'SYS-001',
      userNama: customUser || currentUser?.nama || 'Petugas',
      role: customRole || currentUser?.role || 'PEGAWAI',
      action: action,
      aktivitas: action,
      module: module,
      modul: module,
      details: details,
      keterangan: details
    };
    const logs = [newLog, ...this.getActivityLogs()];
    this.saveActivityLogs(logs.slice(0, 500));
  }

  logActivity(activity: string, modul: string, keterangan: string, nomorTransaksi?: string): void {
    this.recordAuditLog(activity, modul, keterangan);
  }

  // Notifications
  getNotifications(): AppNotification[] {
    const raw = this.getItem<any[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    return raw.map(n => ({
      ...n,
      isRead: n.isRead !== undefined ? n.isRead : n.dibaca,
      dibaca: n.dibaca !== undefined ? n.dibaca : n.isRead
    }));
  }

  saveNotifications(notifications: AppNotification[]): void {
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  sendNotification(
    targetRoleOrUser: string, 
    judul: string, 
    pesan: string, 
    tipe: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' = 'INFO',
    linkTarget?: string,
    gudangId?: string
  ): void {
    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: targetRoleOrUser,
      gudangId: gudangId,
      judul,
      pesan,
      tipe,
      linkTarget,
      dibaca: false,
      isRead: false,
      waktu: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    const notifs = [newNotif, ...this.getNotifications()];
    this.saveNotifications(notifs.slice(0, 100));
  }

  markNotificationAsRead(id: string): void {
    const notifs = this.getNotifications().map(n => n.id === id ? { ...n, dibaca: true, isRead: true } : n);
    this.saveNotifications(notifs);
  }

  markAllNotificationsAsRead(): void {
    const notifs = this.getNotifications().map(n => ({ ...n, dibaca: true, isRead: true }));
    this.saveNotifications(notifs);
  }

  // Configs
  getNumberConfig(): NumberFormatConfig {
    return this.getItem<NumberFormatConfig>(STORAGE_KEYS.NUMBER_CONFIG, DEFAULT_NUMBER_CONFIG);
  }

  saveNumberConfig(cfg: NumberFormatConfig): void {
    this.setItem(STORAGE_KEYS.NUMBER_CONFIG, cfg);
  }

  getSheetsConfig(): GoogleSheetsConfig {
    const cfg = this.getItem<GoogleSheetsConfig>(STORAGE_KEYS.SHEETS_CONFIG, DEFAULT_SHEETS_CONFIG);
    const targetGasUrl = 'https://script.google.com/macros/s/AKfycbwK2MD6O2YVPmrkI4c9XB9feTOYyKn2nx74M3Vd3eyQL35JzBNRjwr_di3LIgKlJI1tHA/exec';
    const targetSpreadsheetId = '1L2D_5jHPQibHovZEPOW6kJdgGHILFbp3_AImlh6pvAs';

    if (!cfg.gasDeploymentUrl || cfg.gasDeploymentUrl !== targetGasUrl || !cfg.spreadsheetId || cfg.spreadsheetId !== targetSpreadsheetId) {
      cfg.spreadsheetId = targetSpreadsheetId;
      cfg.gasDeploymentUrl = targetGasUrl;
      cfg.autoSync = true;
      cfg.isConnected = true;
      this.saveSheetsConfig(cfg);
    }
    return cfg;
  }

  saveSheetsConfig(cfg: GoogleSheetsConfig): void {
    this.setItem(STORAGE_KEYS.SHEETS_CONFIG, cfg);
  }

  // Automatic Number Generator
  generateNumber(type: 'REQ' | 'DRP' | 'BAST' | 'SBBK' | 'MUT' | 'OPN' | 'TRX'): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const cfg = this.getNumberConfig();

    let template = '';
    let sequence = 1;

    switch (type) {
      case 'REQ':
        template = cfg.prefixPermintaan || 'REQ/{YYYY}/{MM}/{XXXX}';
        sequence = this.getRequests().length + 1;
        break;
      case 'DRP':
        template = cfg.prefixDropping || 'DRP/{YYYY}/{MM}/{XXXX}';
        sequence = this.getDroppings().length + 1;
        break;
      case 'BAST':
        template = cfg.prefixBast || 'BAST/{YYYY}/{MM}/{XXXX}';
        sequence = this.getBastDocs().length + 1;
        break;
      case 'SBBK':
        template = cfg.prefixSbbk || 'SBBK/{YYYY}/{MM}/{XXXX}';
        sequence = this.getSbbkDocs().length + 1;
        break;
      case 'MUT':
        template = cfg.prefixMutasi || 'MUT/{YYYY}/{MM}/{XXXX}';
        sequence = this.getMutations().length + 1;
        break;
      case 'OPN':
        template = cfg.prefixOpname || 'OPN/{YYYY}/{MM}/{XXXX}';
        sequence = this.getOpnames().length + 1;
        break;
      case 'TRX':
        template = cfg.prefixTransaksi || 'TRX/{YYYY}/{MM}/{XXXX}';
        sequence = this.getTransactions().length + 1;
        break;
    }

    const seqStr = sequence.toString().padStart(4, '0');
    return template
      .replace('{YYYY}', year)
      .replace('{MM}', month)
      .replace('{XXXX}', seqStr);
  }

  // Record Stock Transaction & Update Balances with Transactional Integrity
  recordTransaction(
    gudangId: string,
    barangId: string,
    jenisTransaksi: StockTransaction['jenisTransaksi'],
    qtyMasuk: number,
    qtyKeluar: number,
    keterangan: string,
    referensiDokumen?: string
  ): StockTransaction {
    const stocks = this.getStocks();
    const items = this.getItems();
    const warehouses = this.getWarehouses();
    const currentUser = this.getCurrentUser();

    let item = items.find(i => i.id === barangId || i.kodeBarang === barangId);
    let warehouse = warehouses.find(w => w.id === gudangId || w.namaGudang === gudangId);

    if (!warehouse) {
      warehouse = warehouses[0] || {
        id: gudangId,
        kodeGudang: 'GB-KSS',
        namaGudang: 'Gudang Puskesmas Kepulauan Seribu Selatan',
        tipeGudang: 'GUDANG_BESAR',
        parentGudangId: null,
        picId: 'USR-002',
        picNama: 'Hendra Setiawan, S.Farm',
        lokasi: 'Puskesmas Kecamatan',
        statusAktif: true,
        keterangan: 'Gudang Induk'
      };
    }

    if (!item) {
      item = {
        id: barangId,
        kodeBarang: `BRG-${barangId.slice(-4)}`,
        namaBarang: `Barang Persediaan (${barangId})`,
        kategoriId: 'CAT-001',
        kategoriNama: 'Persediaan Umum',
        satuan: 'Pcs',
        merk: 'Standar Logistik',
        spesifikasi: 'Kebutuhan Pelayanan',
        stokMinimum: 5,
        statusAktif: true,
        keterangan: 'Item terdaftar otomatis oleh sistem transaksi'
      };
      items.push(item);
      this.saveItems(items);
    }

    let stockIndex = stocks.findIndex(s => s.gudangId === gudangId && s.barangId === barangId);
    let currentStock: WarehouseStock;

    if (stockIndex === -1) {
      currentStock = {
        id: `STK-${gudangId}-${barangId}`,
        gudangId: gudangId,
        barangId: barangId,
        stokAwal: 0,
        stokMasuk: 0,
        stokKeluar: 0,
        saldo: 0,
        updateTerakhir: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };
      stocks.push(currentStock);
      stockIndex = stocks.length - 1;
    } else {
      currentStock = stocks[stockIndex];
    }

    const previousBalance = currentStock.saldo;
    const newBalance = previousBalance + qtyMasuk - qtyKeluar;

    if (newBalance < 0) {
      // Auto-penyesuaian stok awal fisik agar penyerahan/dropping barang di lapangan tidak gagal terblokir
      currentStock.stokAwal = (currentStock.stokAwal || 0) + (qtyKeluar - previousBalance);
      currentStock.stokMasuk += qtyMasuk;
      currentStock.stokKeluar += qtyKeluar;
      currentStock.saldo = 0;
    } else {
      currentStock.stokMasuk += qtyMasuk;
      currentStock.stokKeluar += qtyKeluar;
      currentStock.saldo = newBalance;
    }
    currentStock.updateTerakhir = new Date().toISOString().replace('T', ' ').slice(0, 19);

    stocks[stockIndex] = currentStock;
    this.saveStocks(stocks);

    const trxNumber = this.generateNumber('TRX');
    const transaction: StockTransaction = {
      id: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tanggal: new Date().toISOString().slice(0, 10),
      nomorTransaksi: trxNumber,
      gudangId: gudangId,
      gudangNama: warehouse.namaGudang,
      barangId: barangId,
      barangNama: item.namaBarang,
      kodeBarang: item.kodeBarang,
      satuan: item.satuan,
      jenisTransaksi: jenisTransaksi,
      masuk: qtyMasuk,
      keluar: qtyKeluar,
      saldoSebelumnya: previousBalance,
      saldoAkhir: newBalance,
      userId: currentUser?.id || 'SYS-001',
      userNama: currentUser?.nama || 'Sistem',
      referensiDokumen: referensiDokumen,
      keterangan: keterangan,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    const transactions = [transaction, ...this.getTransactions()];
    this.saveTransactions(transactions);

    if (newBalance <= item.stokMinimum) {
      this.sendNotification(
        'ROLE_PIC_BESAR',
        'Peringatan Stok Menipis',
        `Stok ${item.namaBarang} di ${warehouse.namaGudang} tersisa ${newBalance} ${item.satuan} (Batas minimum: ${item.stokMinimum} ${item.satuan}).`,
        newBalance === 0 ? 'DANGER' : 'WARNING',
        'stok',
        gudangId
      );
    }

    return transaction;
  }

  // User Warehouse Resolution Helper
  resolveWarehouseForUser(user: User): Warehouse {
    const warehouses = this.getWarehouses();
    if (user.gudangId) {
      const found = warehouses.find(w => w.id === user.gudangId);
      if (found) return found;
    }
    if (user.tempatTugas || user.unitKerja) {
      const tt = (user.tempatTugas || user.unitKerja || '').toLowerCase();
      if (tt.includes('untung') || tt.includes('jawa')) {
        const uj = warehouses.find(w => w.id === 'GUD-005' || w.namaGudang.toLowerCase().includes('untung') || w.kodeGudang === 'SG-UTJ');
        if (uj) return uj;
      }
      if (tt.includes('tidung')) {
        const tdg = warehouses.find(w => w.id === 'GUD-002' || w.namaGudang.toLowerCase().includes('tidung'));
        if (tdg) return tdg;
      }
      if (tt.includes('pari')) {
        const pri = warehouses.find(w => w.id === 'GUD-003' || w.namaGudang.toLowerCase().includes('pari'));
        if (pri) return pri;
      }
      if (tt.includes('lancang')) {
        const lcg = warehouses.find(w => w.id === 'GUD-004' || w.namaGudang.toLowerCase().includes('lancang'));
        if (lcg) return lcg;
      }
      if (tt.includes('payung')) {
        const pyg = warehouses.find(w => w.id === 'GUD-006' || w.namaGudang.toLowerCase().includes('payung'));
        if (pyg) return pyg;
      }
      if (tt.includes('besar') || tt.includes('seribu selatan') || tt.includes('kss') || tt.includes('kecamatan')) {
        return warehouses.find(w => w.tipeGudang === 'GUDANG_BESAR') || warehouses[0];
      }
    }
    return warehouses[0];
  }

  // Synchronize / Refresh Database & Cache
  syncDatabase(): {
    success: boolean;
    timestamp: string;
    stats: {
      users: number;
      warehouses: number;
      items: number;
      stocks: number;
      requests: number;
      droppings: number;
    };
    message: string;
  } {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    // Read all datasets to ensure local storage integrity
    const users = this.getUsers();
    const warehouses = this.getWarehouses();
    const items = this.getItems();
    const stocks = this.getStocks();
    const requests = this.getRequests();
    const droppings = this.getDroppings();

    // Verify stock records exist for each item and warehouse
    let newStocksCreated = 0;
    const updatedStocks = [...stocks];
    warehouses.forEach(wh => {
      items.forEach(itm => {
        const hasStock = updatedStocks.some(s => s.gudangId === wh.id && s.barangId === itm.id);
        if (!hasStock) {
          updatedStocks.push({
            id: `STK-${wh.id}-${itm.id}`,
            gudangId: wh.id,
            barangId: itm.id,
            stokAwal: 0,
            stokMasuk: 0,
            stokKeluar: 0,
            saldo: 0,
            updateTerakhir: nowStr
          });
          newStocksCreated++;
        }
      });
    });

    if (newStocksCreated > 0) {
      this.saveStocks(updatedStocks);
    }

    const lastSyncIso = new Date().toISOString();
    this.setItem('sijajul_last_sync_time', lastSyncIso);

    this.recordAuditLog(
      'SYNC',
      'DATABASE',
      `Sinkronisasi database & aplikasi berhasil. Total ${items.length} barang, ${warehouses.length} gudang, ${requests.length} permintaan disinkronkan.`
    );

    return {
      success: true,
      timestamp: nowStr,
      stats: {
        users: users.length,
        warehouses: warehouses.length,
        items: items.length,
        stocks: updatedStocks.length,
        requests: requests.length,
        droppings: droppings.length
      },
      message: 'Database berhasil disinkronisasi penuh dengan aplikasi.'
    };
  }

  getLastSyncTime(): string | null {
    return this.getItem<string | null>('sijajul_last_sync_time', null);
  }

  // Workflows
  createRequest(
    items: { barangId: string; jumlahDiminta: number; keterangan?: string }[],
    catatanPemohon: string,
    customGudangTujuanId?: string,
    customGudangAsalId?: string
  ): ItemRequest {
    let currentUser = this.getCurrentUser();
    if (!currentUser) {
      const allUsers = this.getUsers();
      currentUser = allUsers.find(u => u.role === 'PEGAWAI') || allUsers[0];
    }

    const warehouses = this.getWarehouses();
    const allItems = this.getItems();
    const gudangBesar = warehouses.find(w => w.tipeGudang === 'GUDANG_BESAR') || warehouses[0];
    
    // Prosedur Penentuan Gudang:
    // 1. Pegawai dengan tempat tugas -> Gudang asal & tujuan otomatis di gudang tempat tugas yang bersangkutan
    // 2. PIC Sub Gudang (Tidung, Pari, Lancang, Untung Jawa) -> Tujuan permintaannya adalah Gudang Besar (penyedia pasokan dropping)
    let gudangTujuan: Warehouse;
    let gudangAsal: Warehouse;

    if (currentUser.role === 'PEGAWAI') {
      const assignedWh = this.resolveWarehouseForUser(currentUser);
      gudangAsal = customGudangAsalId ? (warehouses.find(w => w.id === customGudangAsalId) || assignedWh) : assignedWh;
      gudangTujuan = customGudangTujuanId ? (warehouses.find(w => w.id === customGudangTujuanId) || assignedWh) : assignedWh;
    } else if (currentUser.role === 'PIC_SUB_GUDANG') {
      const subWh = this.resolveWarehouseForUser(currentUser);
      gudangAsal = customGudangAsalId ? (warehouses.find(w => w.id === customGudangAsalId) || gudangBesar) : gudangBesar;
      gudangTujuan = customGudangTujuanId ? (warehouses.find(w => w.id === customGudangTujuanId) || subWh) : subWh;
    } else {
      gudangAsal = customGudangAsalId ? (warehouses.find(w => w.id === customGudangAsalId) || gudangBesar) : gudangBesar;
      gudangTujuan = customGudangTujuanId ? (warehouses.find(w => w.id === customGudangTujuanId) || warehouses[1] || gudangBesar) : warehouses[1] || gudangBesar;
    }

    const nomorReq = this.generateNumber('REQ');
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const requestItems = (items || []).map((itm, idx) => {
      const itemDetail = allItems.find(i => i.id === itm.barangId || i.kodeBarang === itm.barangId);
      const stockAsal = this.getStockByWarehouseAndItem(gudangAsal.id, itm.barangId);
      const reqQty = Math.max(1, Number(itm.jumlahDiminta) || 1);
      return {
        id: `REQITM-${Date.now()}-${idx}`,
        barangId: itm.barangId,
        kodeBarang: itemDetail?.kodeBarang || itm.barangId,
        namaBarang: itemDetail?.namaBarang || `Barang (${itm.barangId})`,
        satuan: itemDetail?.satuan || 'Buah',
        stokGudangAsal: stockAsal?.saldo ?? 0,
        jumlahDiminta: reqQty,
        jumlahDisetujui: reqQty,
        keterangan: itm.keterangan || ''
      };
    });

    const newRequest: ItemRequest = {
      id: `REQ-${Date.now()}`,
      nomorPermintaan: nomorReq,
      tanggalPermintaan: new Date().toISOString().slice(0, 10),
      pemohonId: currentUser.id,
      pemohonNama: currentUser.nama,
      pemohonNip: currentUser.nip || '-',
      pemohonJabatan: currentUser.jabatan,
      tempatTugas: currentUser.tempatTugas || 'Puskesmas',
      gudangAsalId: gudangAsal.id,
      gudangAsalNama: gudangAsal.namaGudang,
      gudangTujuanId: gudangTujuan.id,
      gudangTujuanNama: gudangTujuan.namaGudang,
      status: 'DIAJUKAN',
      catatanPemohon: catatanPemohon,
      items: requestItems,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    const requests = [newRequest, ...this.getRequests()];
    this.saveRequests(requests);

    const deskripsiAudit = currentUser.role === 'PIC_SUB_GUDANG'
      ? `Pengajuan permintaan dropping dari ${gudangAsal.namaGudang} ke ${gudangTujuan.namaGudang} (${nomorReq})`
      : `Pengajuan permintaan barang internal tempat tugas ${gudangAsal.namaGudang} (${nomorReq})`;

    this.recordAuditLog(
      'CREATE',
      'PERMINTAAN',
      deskripsiAudit
    );

    if (currentUser.role === 'PIC_SUB_GUDANG') {
      this.sendNotification(
        'ROLE_PIC_BESAR',
        'Permintaan Dropping dari Sub Gudang',
        `PIC ${currentUser.nama} (${gudangTujuan.namaGudang}) mengajukan permintaan dropping ke Gudang Besar (${nomorReq}).`,
        'INFO',
        'approval'
      );
      this.sendNotification(
        'ROLE_ADMIN',
        'Permintaan Dropping Sub Gudang',
        `PIC ${currentUser.nama} (${gudangTujuan.namaGudang}) mengajukan dropping (${nomorReq}).`,
        'INFO',
        'approval'
      );
    } else {
      this.sendNotification(
        'ROLE_PIC_SUB',
        'Permintaan Barang Pegawai',
        `Permintaan ${nomorReq} diajukan oleh ${currentUser.nama} di ${gudangAsal.namaGudang}.`,
        'INFO',
        'approval',
        gudangAsal.id
      );
      this.sendNotification(
        'ROLE_ADMIN',
        'Permintaan Barang Pegawai',
        `Permintaan ${nomorReq} diajukan oleh ${currentUser.nama} di ${gudangAsal.namaGudang}.`,
        'INFO',
        'approval'
      );
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sijajul_data_updated', { detail: { action: 'createRequest', request: newRequest } }));
    }

    return newRequest;
  }

  fulfillInternalRequest(
    requestId: string,
    notes?: string
  ): ItemRequest {
    const currentUser = this.getCurrentUser();
    const requests = this.getRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Permintaan tidak ditemukan');

    const req = requests[reqIndex];
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // Record out transaction for each item from the source warehouse to employee
    (req.items || []).forEach(itm => {
      const qty = (itm.jumlahDisetujui !== undefined && itm.jumlahDisetujui > 0) ? itm.jumlahDisetujui : itm.jumlahDiminta;
      if (qty > 0) {
        this.recordTransaction(
          req.gudangAsalId,
          itm.barangId,
          'PENGELUARAN_LANGSUNG',
          0,
          qty,
          `Penyerahan barang permintaan tempat tugas kepada ${req.pemohonNama} (${req.nomorPermintaan}). Catatan: ${notes || 'Diserahkan langsung'}`,
          req.nomorPermintaan
        );
      }
    });

    req.status = 'SELESAI';
    req.approverId = req.approverId || currentUser?.id || 'USR-001';
    req.approverNama = req.approverNama || currentUser?.nama || 'Petugas Pengelola';
    req.tanggalApproval = req.tanggalApproval || nowStr;
    req.catatanApproval = req.catatanApproval || notes || 'Diserahkan langsung kepada pemohon';
    req.updatedAt = nowStr;
    requests[reqIndex] = req;
    this.saveRequests(requests);

    this.recordAuditLog(
      'FULFILL',
      'PERMINTAAN',
      `Menyerahkan barang permintaan ${req.nomorPermintaan} kepada ${req.pemohonNama} di ${req.gudangAsalNama}`,
      currentUser?.nama,
      currentUser?.role
    );

    this.sendNotification(
      req.pemohonId,
      'Barang Permintaan Telah Diserahkan',
      `Barang untuk permintaan ${req.nomorPermintaan} telah diserahkan oleh petugas pengelola ${req.gudangAsalNama}.`,
      'SUCCESS',
      'request'
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sijajul_data_updated', { detail: { action: 'fulfillRequest', request: req } }));
    }

    return req;
  }

  processApproval(
    requestId: string, 
    status: 'DISETUJUI' | 'DITOLAK', 
    approvedItemsOrNotes?: { barangId: string; jumlahDisetujui: number; keterangan?: string }[] | string,
    catatanApprovalOrItems?: string | { barangId: string; jumlahDisetujui: number; keterangan?: string }[]
  ): ItemRequest {
    const currentUser = this.getCurrentUser();
    const requests = this.getRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Permintaan tidak ditemukan');

    const req = requests[reqIndex];
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    let notes = '';
    let itemsList: { barangId: string; jumlahDisetujui: number; keterangan?: string }[] = [];

    if (typeof approvedItemsOrNotes === 'string') {
      notes = approvedItemsOrNotes;
      if (Array.isArray(catatanApprovalOrItems)) {
        itemsList = catatanApprovalOrItems;
      }
    } else if (Array.isArray(approvedItemsOrNotes)) {
      itemsList = approvedItemsOrNotes;
      if (typeof catatanApprovalOrItems === 'string') {
        notes = catatanApprovalOrItems;
      }
    }

    if (status === 'DISETUJUI') {
      req.items = req.items.map(item => {
        const matching = itemsList.find(ai => ai && ai.barangId === item.barangId);
        const qtyApproved = matching !== undefined && matching.jumlahDisetujui !== undefined
          ? matching.jumlahDisetujui
          : (item.jumlahDisetujui !== undefined ? item.jumlahDisetujui : item.jumlahDiminta);
        return {
          ...item,
          jumlahDisetujui: qtyApproved,
          keterangan: matching?.keterangan || item.keterangan
        };
      });
      req.status = 'DISETUJUI';
    } else {
      req.status = 'DITOLAK';
    }

    req.approverId = currentUser?.id || 'USR-001';
    req.approverNama = currentUser?.nama || 'Kepala Puskesmas';
    req.tanggalApproval = nowStr;
    req.catatanApproval = notes;
    req.updatedAt = nowStr;

    requests[reqIndex] = req;
    this.saveRequests(requests);

    this.recordAuditLog(
      status === 'DISETUJUI' ? 'APPROVE' : 'REJECT',
      'APPROVAL',
      `${status === 'DISETUJUI' ? 'Menyetujui' : 'Menolak'} permohonan ${req.nomorPermintaan}: ${notes || (status === 'DISETUJUI' ? 'Disetujui untuk distribusi logistik' : 'Ditolak')}`
    );

    this.sendNotification(
      req.pemohonId,
      status === 'DISETUJUI' ? 'Permintaan Disetujui' : 'Permintaan Ditolak',
      `Permintaan ${req.nomorPermintaan} Anda telah ${status === 'DISETUJUI' ? 'disetujui' : 'ditolak'} oleh ${currentUser?.nama || 'Kepala Puskesmas'}.`,
      status === 'DISETUJUI' ? 'SUCCESS' : 'DANGER',
      'request'
    );

    return req;
  }

  processDropping(
    requestId: string,
    keteranganDropping: string
  ): Dropping {
    const currentUser = this.getCurrentUser();
    const requests = this.getRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Permintaan tidak ditemukan');

    const req = requests[reqIndex];
    if (req.status !== 'DISETUJUI') {
      throw new Error('Permintaan harus berstatus DISETUJUI sebelum proses dropping.');
    }

    const nomorDropping = this.generateNumber('DRP');
    const nomorBast = this.generateNumber('BAST');
    const nomorSbbk = this.generateNumber('SBBK');
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const todayStr = new Date().toISOString().slice(0, 10);

    const droppingItems = (req.items || []).map(item => {
      const qty = (item.jumlahDisetujui !== undefined && item.jumlahDisetujui > 0)
        ? item.jumlahDisetujui
        : (item.jumlahDiminta || 1);
      return {
        id: `DRPITM-${Date.now()}-${item.barangId}`,
        barangId: item.barangId,
        kodeBarang: item.kodeBarang,
        namaBarang: item.namaBarang,
        satuan: item.satuan,
        jumlahDisetujui: qty,
        jumlahDikirim: qty,
        kondisiBarang: 'Baik'
      };
    });

    droppingItems.forEach(item => {
      if (item.jumlahDikirim > 0) {
        this.recordTransaction(
          req.gudangAsalId,
          item.barangId,
          'KELUAR_DROPPING',
          0,
          item.jumlahDikirim,
          `Dropping pengeluaran ke ${req.gudangTujuanNama} (${nomorDropping})`,
          nomorDropping
        );
      }
    });

    const newDropping: Dropping = {
      id: `DRP-${Date.now()}`,
      nomorDropping,
      permintaanId: req.id,
      nomorPermintaan: req.nomorPermintaan,
      tanggalDropping: todayStr,
      gudangAsalId: req.gudangAsalId,
      gudangAsalNama: req.gudangAsalNama,
      gudangTujuanId: req.gudangTujuanId,
      gudangTujuanNama: req.gudangTujuanNama,
      petugasPengirimId: currentUser?.id || 'USR-002',
      petugasPengirimNama: currentUser?.nama || 'Petugas Gudang Besar',
      status: 'DIKIRIM',
      keterangan: keteranganDropping || `Distribusi dropping ke ${req.gudangTujuanNama}`,
      items: droppingItems,
      nomorBast,
      nomorSbbk,
      createdAt: nowStr
    };

    req.status = 'DROPPING';
    req.nomorDropping = nomorDropping;
    req.updatedAt = nowStr;
    requests[reqIndex] = req;
    this.saveRequests(requests);

    const droppings = [newDropping, ...this.getDroppings()];
    this.saveDroppings(droppings);

    const newBast: BastDocument = {
      id: `BAST-${Date.now()}`,
      nomorBast,
      droppingId: newDropping.id,
      nomorDropping,
      tanggal: todayStr,
      pihakPertamaId: currentUser?.id || 'USR-002',
      pihakPertamaNama: currentUser?.nama || 'Hendra Setiawan, S.Farm',
      pihakPertamaNip: currentUser?.nip || '198807212011011008',
      pihakPertamaJabatan: currentUser?.jabatan || 'Koordinator Logistik',
      pihakKeduaId: req.pemohonId,
      pihakKeduaNama: req.pemohonNama,
      pihakKeduaNip: req.pemohonNip,
      pihakKeduaJabatan: req.pemohonJabatan,
      gudangAsalId: req.gudangAsalId,
      gudangAsalNama: req.gudangAsalNama,
      gudangTujuanId: req.gudangTujuanId,
      gudangTujuanNama: req.gudangTujuanNama,
      items: droppingItems,
      keterangan: `Serah terima barang persediaan dari Gudang Besar ke ${req.gudangTujuanNama}`,
      createdAt: nowStr
    };
    this.saveBastDocs([newBast, ...this.getBastDocs()]);

    const newSbbk: SbbkDocument = {
      id: `SBBK-${Date.now()}`,
      nomorSbbk,
      droppingId: newDropping.id,
      nomorDropping,
      tanggal: todayStr,
      gudangAsalId: req.gudangAsalId,
      gudangAsalNama: req.gudangAsalNama,
      gudangTujuanId: req.gudangTujuanId,
      gudangTujuanNama: req.gudangTujuanNama,
      petugasGudangId: currentUser?.id || 'USR-002',
      petugasGudangNama: currentUser?.nama || 'Hendra Setiawan, S.Farm',
      penerimaNama: req.pemohonNama,
      penerimaNip: req.pemohonNip,
      items: droppingItems,
      keterangan: `Pengeluaran persediaan barang atas dropping ${nomorDropping}`,
      createdAt: nowStr
    };
    this.saveSbbkDocs([newSbbk, ...this.getSbbkDocs()]);

    this.recordAuditLog(
      'CREATE',
      'DROPPING',
      `Memproses pengiriman dropping ${nomorDropping} menuju ${req.gudangTujuanNama}`
    );

    this.sendNotification(
      'ROLE_PIC_SUB',
      'Pengiriman Barang Dropping',
      `Barang dropping ${nomorDropping} sedang dikirim ke ${req.gudangTujuanNama}. Silakan konfirmasi penerimaan saat tiba.`,
      'INFO',
      'receiving',
      req.gudangTujuanId
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sijajul_data_updated', { detail: { action: 'processDropping', dropping: newDropping } }));
    }

    return newDropping;
  }

  confirmReceiving(
    droppingId: string,
    catatanPenerimaOrItems: string | { barangId: string; jumlahDiterima?: number; kondisiBarang?: string; keterangan?: string }[],
    optionalItemsOrCatatan?: any
  ): Dropping {
    const currentUser = this.getCurrentUser();
    const droppings = this.getDroppings();
    const drpIndex = droppings.findIndex(d => d.id === droppingId);
    if (drpIndex === -1) throw new Error('Data dropping tidak ditemukan');

    const dropping = droppings[drpIndex];
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    let notes = '';
    let itemsList: any[] = [];

    if (typeof catatanPenerimaOrItems === 'string') {
      notes = catatanPenerimaOrItems;
      itemsList = Array.isArray(optionalItemsOrCatatan) ? optionalItemsOrCatatan : [];
    } else {
      itemsList = catatanPenerimaOrItems || [];
      notes = typeof optionalItemsOrCatatan === 'string' ? optionalItemsOrCatatan : '';
    }

    dropping.items = dropping.items.map(item => {
      const match = itemsList.find((r: any) => r.barangId === item.barangId);
      const qtyDiterima = match && match.jumlahDiterima !== undefined ? match.jumlahDiterima : item.jumlahDikirim;
      return {
        ...item,
        jumlahDiterima: qtyDiterima,
        kondisiBarang: match?.kondisiBarang || item.kondisiBarang || 'Baik & Utuh'
      };
    });

    dropping.items.forEach(item => {
      const qty = item.jumlahDiterima ?? item.jumlahDikirim;
      if (qty > 0) {
        this.recordTransaction(
          dropping.gudangTujuanId,
          item.barangId,
          'PENERIMAAN_DROPPING',
          qty,
          0,
          `Penerimaan dropping dari ${dropping.gudangAsalNama} (${dropping.nomorDropping})`,
          dropping.nomorDropping
        );
      }
    });

    dropping.status = 'SELESAI';
    dropping.tanggalPenerimaan = nowStr;
    dropping.penerimaId = currentUser?.id;
    dropping.penerimaNama = currentUser?.nama;
    dropping.catatanPenerima = notes;

    droppings[drpIndex] = dropping;
    this.saveDroppings(droppings);

    const requests = this.getRequests();
    const reqIndex = requests.findIndex(r => r.id === dropping.permintaanId);
    if (reqIndex !== -1) {
      requests[reqIndex].status = 'SELESAI';
      requests[reqIndex].updatedAt = nowStr;
      this.saveRequests(requests);
    }

    this.recordAuditLog(
      'UPDATE',
      'PENERIMAAN',
      `Konfirmasi penerimaan barang dropping ${dropping.nomorDropping} di ${dropping.gudangTujuanNama}`
    );

    this.sendNotification(
      'ROLE_PIC_BESAR',
      'Dropping Diterima Lengkap',
      `Dropping ${dropping.nomorDropping} telah berhasil diterima dan diverifikasi oleh ${currentUser?.nama || 'Petugas'} di ${dropping.gudangTujuanNama}.`,
      'SUCCESS',
      'dropping'
    );

    return dropping;
  }

  getWhatsappConfig(): WhatsappConfig {
    return this.getItem<WhatsappConfig>(STORAGE_KEYS.WHATSAPP_CONFIG, DEFAULT_WHATSAPP_CONFIG);
  }

  saveWhatsappConfig(config: WhatsappConfig): void {
    this.setItem(STORAGE_KEYS.WHATSAPP_CONFIG, config);
  }

  getLogoConfig(): AppLogoConfig {
    return this.getItem<AppLogoConfig>(STORAGE_KEYS.LOGO_CONFIG, DEFAULT_LOGO_CONFIG);
  }

  saveLogoConfig(config: AppLogoConfig): void {
    this.setItem(STORAGE_KEYS.LOGO_CONFIG, {
      ...config,
      updatedAt: new Date().toISOString()
    });
  }

  resetLogoConfig(): AppLogoConfig {
    this.setItem(STORAGE_KEYS.LOGO_CONFIG, DEFAULT_LOGO_CONFIG);
    return DEFAULT_LOGO_CONFIG;
  }

  resetToInitialData(): void {
    localStorage.clear();
    this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.setItem(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
    this.setItem(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
    this.setItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    this.setItem(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    this.setItem(STORAGE_KEYS.STOCKS, generateInitialStocks());
    this.setItem(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
    this.setItem(STORAGE_KEYS.DROPPINGS, INITIAL_DROPPINGS);
    this.setItem(STORAGE_KEYS.BAST_DOCS, INITIAL_BAST_DOCS);
    this.setItem(STORAGE_KEYS.SBBK_DOCS, INITIAL_SBBK_DOCS);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    this.setItem(STORAGE_KEYS.NUMBER_CONFIG, DEFAULT_NUMBER_CONFIG);
    this.setItem(STORAGE_KEYS.SHEETS_CONFIG, DEFAULT_SHEETS_CONFIG);
    this.setItem(STORAGE_KEYS.WHATSAPP_CONFIG, DEFAULT_WHATSAPP_CONFIG);
    this.setItem(STORAGE_KEYS.LOGO_CONFIG, DEFAULT_LOGO_CONFIG);
    this.setItem(STORAGE_KEYS.PROPOSALS, INITIAL_PROPOSALS);
  }

  exportAllDataJson(): string {
    const data = {
      users: this.getUsers(),
      warehouses: this.getWarehouses(),
      categories: this.getCategories(),
      items: this.getItems(),
      stocks: this.getStocks(),
      requests: this.getRequests(),
      proposals: this.getProposals(),
      droppings: this.getDroppings(),
      bastDocs: this.getBastDocs(),
      sbbkDocs: this.getSbbkDocs(),
      mutations: this.getMutations(),
      opnames: this.getOpnames(),
      transactions: this.getTransactions(),
      activityLogs: this.getActivityLogs(),
      numberConfig: this.getNumberConfig(),
      whatsappConfig: this.getWhatsappConfig(),
      logoConfig: this.getLogoConfig(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importAllDataJson(jsonStr: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (data.users) this.saveUsers(data.users);
      if (data.warehouses) this.saveWarehouses(data.warehouses);
      if (data.categories) this.saveCategories(data.categories);
      if (data.items) this.saveItems(data.items);
      if (data.stocks) this.saveStocks(data.stocks);
      if (data.requests) this.saveRequests(data.requests);
      if (data.proposals) this.saveProposals(data.proposals);
      if (data.droppings) this.saveDroppings(data.droppings);
      if (data.bastDocs) this.saveBastDocs(data.bastDocs);
      if (data.sbbkDocs) this.saveSbbkDocs(data.sbbkDocs);
      if (data.mutations) this.saveMutations(data.mutations);
      if (data.opnames) this.saveOpnames(data.opnames);
      if (data.transactions) this.saveTransactions(data.transactions);
      if (data.activityLogs) this.saveActivityLogs(data.activityLogs);
      if (data.whatsappConfig) this.saveWhatsappConfig(data.whatsappConfig);
      if (data.logoConfig) this.saveLogoConfig(data.logoConfig);
      return { success: true, message: 'Data berhasil diimport!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'File JSON tidak valid' };
    }
  }

  /**
   * Membersihkan seluruh data transaksi dan data dummy agar data murni dari Google Spreadsheet
   */
  clearDummyData(keepUsers = true): { success: boolean; message: string } {
    // Kosongkan riwayat mutasi transaksi, permintaan, dropping, dokumen, dan usulan dummy
    this.setItem(STORAGE_KEYS.REQUESTS, []);
    this.setItem(STORAGE_KEYS.DROPPINGS, []);
    this.setItem(STORAGE_KEYS.BAST_DOCS, []);
    this.setItem(STORAGE_KEYS.SBBK_DOCS, []);
    this.setItem(STORAGE_KEYS.MUTATIONS, []);
    this.setItem(STORAGE_KEYS.OPNAMES, []);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, []);
    this.setItem(STORAGE_KEYS.PROPOSALS, []);
    this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, []);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, []);

    // Kosongkan master barang dan saldo stok dummy agar diisi data real dari Spreadsheet
    this.setItem(STORAGE_KEYS.ITEMS, []);
    this.setItem(STORAGE_KEYS.STOCKS, []);

    if (!keepUsers) {
      this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    }

    this.setItem('sijajul_dummy_cleared_v2', 'true');
    this.recordAuditLog(
      'CLEAR_DATA',
      'DATABASE',
      'Seluruh data dummy (barang contoh, transaksi, dropping, permohonan) telah dibersihkan. Sistem siap menerima data real dari Spreadsheet.'
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sijajul_data_updated'));
    }

    return {
      success: true,
      message: 'Data contoh/dummy berhasil dibersihkan! Aplikasi kini siap menampilkan data riil dari Google Spreadsheet.'
    };
  }

  /**
   * Impor seluruh dataset dari Google Spreadsheet (hasil pull GAS) ke penyimpanan lokal
   */
  importAllFromSpreadsheet(sheetData: any, purgeDummyBeforeImport = true): {
    success: boolean;
    counts: { items: number; stocks: number; warehouses: number; requests: number; droppings: number; transactions: number; users: number };
    message: string;
  } {
    if (!sheetData || typeof sheetData !== 'object') {
      return {
        success: false,
        counts: { items: 0, stocks: 0, warehouses: 0, requests: 0, droppings: 0, transactions: 0, users: 0 },
        message: 'Data dari Google Spreadsheet kosong atau tidak terbaca.'
      };
    }

    const counts = { items: 0, stocks: 0, warehouses: 0, requests: 0, droppings: 0, transactions: 0, users: 0 };
    const nowIso = new Date().toISOString();

    // 1. Gudang Pulau
    if (Array.isArray(sheetData.warehouses) && sheetData.warehouses.length > 0) {
      const warehousesList: Warehouse[] = sheetData.warehouses.map((row: any, idx: number) => {
        const id = row['ID Gudang'] || row['id'] || `GUD-00${idx + 1}`;
        const kodeGudang = row['Kode Gudang'] || row['kodeGudang'] || `GD-${idx + 1}`;
        const namaGudang = row['Nama Gudang'] || row['namaGudang'] || `Gudang Pulau ${idx + 1}`;
        const tipeGudang = (row['Tipe Gudang'] || '').includes('BESAR') ? 'GUDANG_BESAR' : 'SUB_GUDANG';
        const lokasi = row['Lokasi Pulau'] || row['Alamat'] || row['lokasi'] || '';
        const picNama = row['PIC / Penanggung Jawab'] || row['picNama'] || '';
        const statusAktif = String(row['Status'] || row['statusAktif'] || 'Aktif').toLowerCase() !== 'nonaktif';
        const keterangan = row['Keterangan'] || row['keterangan'] || '';

        return {
          id,
          kodeGudang,
          namaGudang,
          tipeGudang: tipeGudang as any,
          parentGudangId: tipeGudang === 'SUB_GUDANG' ? 'GUD-001' : null,
          picId: `USR-00${idx + 2}`,
          picNama,
          lokasi,
          statusAktif,
          keterangan
        };
      }).filter((w: Warehouse) => !!w.namaGudang);

      if (warehousesList.length > 0) {
        this.saveWarehouses(warehousesList);
        counts.warehouses = warehousesList.length;
      }
    }

    // 2. Master Barang & Kategori Otomatis
    if (Array.isArray(sheetData.items) && sheetData.items.length > 0) {
      const existingCategories = [...this.getCategories()];
      const categoryMap = new Map<string, Category>();
      existingCategories.forEach(c => categoryMap.set(c.nama.trim().toLowerCase(), c));

      const itemsList: Item[] = sheetData.items.map((row: any, idx: number) => {
        const id = row['ID Barang'] || row['id'] || `ITM-${String(idx + 1).padStart(3, '0')}`;
        const kodeBarang = row['Kode Barang'] || row['kodeBarang'] || `BRG-${idx + 1}`;
        const namaBarang = row['Nama Barang'] || row['namaBarang'] || row['nama'] || '';
        const kategoriNama = (row['Kategori'] || row['kategoriNama'] || 'Umum').trim();
        const satuan = row['Satuan'] || row['satuan'] || 'Pcs';
        const merk = row['Merk / Pabrikan'] || row['merk'] || '';
        const spesifikasi = row['Spesifikasi'] || row['spesifikasi'] || '';
        const stokMinimum = Number(row['Stok Minimum'] || row['stokMinimum'] || 10) || 10;
        const statusAktif = String(row['Status'] || row['statusAktif'] || 'Aktif').toLowerCase() !== 'nonaktif';
        const keterangan = row['Keterangan'] || row['keterangan'] || '';

        const catKey = kategoriNama.toLowerCase();
        let cat = categoryMap.get(catKey);
        if (!cat) {
          cat = {
            id: `CAT-${Date.now()}-${idx}`,
            kode: `KAT-${existingCategories.length + 1}`,
            nama: kategoriNama,
            deskripsi: `Kategori dari Spreadsheet`,
            statusAktif: true
          };
          existingCategories.push(cat);
          categoryMap.set(catKey, cat);
        }

        return {
          id,
          kodeBarang,
          namaBarang,
          kategoriId: cat.id,
          kategoriNama: cat.nama,
          satuan,
          merk,
          spesifikasi,
          stokMinimum,
          statusAktif,
          keterangan
        };
      }).filter((i: Item) => !!i.namaBarang);

      if (itemsList.length > 0) {
        this.saveCategories(existingCategories);
        this.saveItems(itemsList);
        counts.items = itemsList.length;
      }
    }

    // 3. Saldo Stok Gudang
    if (Array.isArray(sheetData.stocks) && sheetData.stocks.length > 0) {
      const stocksList: WarehouseStock[] = sheetData.stocks.map((row: any, idx: number) => {
        const id = row['ID Stok'] || row['id'] || `STK-${idx + 1}`;
        const gudangId = row['ID Gudang'] || row['gudangId'] || 'GUD-001';
        const barangId = row['ID Barang'] || row['barangId'] || '';
        const saldo = Number(row['Saldo Stok'] || row['saldo'] || 0) || 0;
        const lokasiRak = row['Lokasi Rak'] || row['lokasiRak'] || '';
        const updateTerakhir = row['Terakhir Diperbarui'] || row['updateTerakhir'] || nowIso;

        return {
          id,
          gudangId,
          barangId,
          stokAwal: saldo,
          stokMasuk: 0,
          stokKeluar: 0,
          saldo,
          lokasiRak,
          updateTerakhir
        };
      }).filter((s: WarehouseStock) => !!s.barangId);

      if (stocksList.length > 0) {
        this.saveStocks(stocksList);
        counts.stocks = stocksList.length;
      }
    }

    // 4. Permintaan Barang
    if (Array.isArray(sheetData.requests) && sheetData.requests.length > 0) {
      const existingRequests = this.getRequests();
      const requestsList: ItemRequest[] = sheetData.requests.map((row: any, idx: number) => {
        let items: any[] = [];
        try {
          if (row['Detail Items (JSON)']) items = JSON.parse(row['Detail Items (JSON)']);
        } catch (e) {}

        const reqId = row['ID Permintaan'] || row['id'] || `REQ-${idx + 1}`;
        const existing = existingRequests.find(r => r.id === reqId || r.nomorPermintaan === row['Nomor Permintaan']);

        return {
          id: reqId,
          nomorPermintaan: row['Nomor Permintaan'] || row['nomorPermintaan'] || `REQ-${idx + 1}`,
          tanggalPermintaan: row['Tanggal'] || row['tanggalPermintaan'] || nowIso.slice(0, 10),
          pemohonId: existing?.pemohonId || row['ID Pemohon'] || 'USR-003',
          pemohonNama: row['Nama Pemohon'] || existing?.pemohonNama || 'Petugas',
          pemohonNip: row['NIP Pemohon'] || existing?.pemohonNip || '-',
          pemohonJabatan: existing?.pemohonJabatan || 'Petugas',
          tempatTugas: row['Nama Gudang Pemohon'] || existing?.tempatTugas || 'Puskesmas',
          gudangAsalId: existing?.gudangAsalId || 'GUD-001',
          gudangAsalNama: existing?.gudangAsalNama || 'Gudang Puskesmas Kepulauan Seribu Selatan',
          gudangTujuanId: row['ID Gudang Pemohon'] || existing?.gudangTujuanId || 'GUD-002',
          gudangTujuanNama: row['Nama Gudang Pemohon'] || existing?.gudangTujuanNama || 'Gudang Tujuan',
          status: row['Status Approval'] || row['status'] || existing?.status || 'DIAJUKAN',
          catatanPemohon: row['Keperluan'] || existing?.catatanPemohon || '',
          catatanApproval: row['Catatan Verifikasi'] || existing?.catatanApproval || '',
          tanggalApproval: row['Tanggal Approval'] || existing?.tanggalApproval || '',
          items: items.length > 0 ? items : (existing?.items || []),
          createdAt: row['Tanggal'] || existing?.createdAt || nowIso,
          updatedAt: row['Tanggal Approval'] || existing?.updatedAt || nowIso
        };
      });

      const mergedRequests = [...existingRequests];
      requestsList.forEach(incoming => {
        const idxFound = mergedRequests.findIndex(r => r.id === incoming.id || r.nomorPermintaan === incoming.nomorPermintaan);
        if (idxFound >= 0) {
          mergedRequests[idxFound] = {
            ...mergedRequests[idxFound],
            ...incoming,
            items: (incoming.items && incoming.items.length > 0) ? incoming.items : mergedRequests[idxFound].items
          };
        } else {
          mergedRequests.push(incoming);
        }
      });

      this.saveRequests(mergedRequests);
      counts.requests = mergedRequests.length;
    }

    // 5. Dropping Logistik
    if (Array.isArray(sheetData.droppings) && sheetData.droppings.length > 0) {
      const existingDroppings = this.getDroppings();
      const droppingsList: Dropping[] = sheetData.droppings.map((row: any, idx: number) => {
        let items: any[] = [];
        try {
          if (row['Detail Items (JSON)']) items = JSON.parse(row['Detail Items (JSON)']);
        } catch (e) {}

        const dropId = row['ID Dropping'] || row['id'] || `DRP-${idx + 1}`;
        const existing = existingDroppings.find(d => d.id === dropId || d.nomorDropping === row['Nomor Dropping']);

        return {
          id: dropId,
          nomorDropping: row['Nomor Dropping'] || row['nomorDropping'] || `DRP-${idx + 1}`,
          permintaanId: row['Nomor Permintaan'] || existing?.permintaanId || `REQ-${idx + 1}`,
          nomorPermintaan: row['Nomor Permintaan'] || existing?.nomorPermintaan || '',
          tanggalDropping: row['Tanggal Kirim'] || existing?.tanggalDropping || nowIso.slice(0, 10),
          gudangAsalId: existing?.gudangAsalId || 'GUD-001',
          gudangAsalNama: row['Gudang Asal'] || existing?.gudangAsalNama || 'Gudang Besar KSS',
          gudangTujuanId: existing?.gudangTujuanId || 'GUD-002',
          gudangTujuanNama: row['Gudang Tujuan'] || existing?.gudangTujuanNama || 'Sub Gudang',
          petugasPengirimId: existing?.petugasPengirimId || 'USR-002',
          petugasPengirimNama: row['Petugas Pengirim'] || existing?.petugasPengirimNama || 'Petugas Pengirim',
          penerimaNama: row['Petugas Penerima'] || existing?.penerimaNama || '',
          status: row['Status Pengiriman'] || existing?.status || 'DIKIRIM',
          keterangan: row['Catatan'] || existing?.keterangan || '',
          items: items.length > 0 ? items : (existing?.items || []),
          nomorBast: row['Nomor BAST'] || existing?.nomorBast || '',
          nomorSbbk: existing?.nomorSbbk || '',
          createdAt: row['Tanggal Kirim'] || existing?.createdAt || nowIso
        };
      });

      const mergedDroppings = [...existingDroppings];
      droppingsList.forEach(incoming => {
        const idxFound = mergedDroppings.findIndex(d => d.id === incoming.id || d.nomorDropping === incoming.nomorDropping);
        if (idxFound >= 0) {
          mergedDroppings[idxFound] = {
            ...mergedDroppings[idxFound],
            ...incoming,
            items: (incoming.items && incoming.items.length > 0) ? incoming.items : mergedDroppings[idxFound].items
          };
        } else {
          mergedDroppings.push(incoming);
        }
      });

      this.saveDroppings(mergedDroppings);
      counts.droppings = mergedDroppings.length;
    }

    // 6. Transaksi Mutasi
    if (Array.isArray(sheetData.transactions) && sheetData.transactions.length > 0) {
      const trxList: StockTransaction[] = sheetData.transactions.map((row: any, idx: number) => {
        return {
          id: row['ID Transaksi'] || row['id'] || `TRX-${idx + 1}`,
          tanggal: row['Tanggal & Waktu'] ? String(row['Tanggal & Waktu']).slice(0, 10) : nowIso.slice(0, 10),
          nomorTransaksi: row['Nomor Transaksi'] || `TRX-${idx + 1}`,
          gudangId: 'GUD-001',
          gudangNama: row['Gudang Terkait'] || '',
          barangId: 'ITM-001',
          barangNama: row['Nama Barang'] || '',
          kodeBarang: row['Kode Barang'] || '',
          satuan: 'Pcs',
          jenisTransaksi: row['Tipe Transaksi'] || 'PENYESUAIAN',
          masuk: Number(row['Jumlah Masuk'] || 0) || 0,
          keluar: Number(row['Jumlah Keluar'] || 0) || 0,
          saldoSebelumnya: 0,
          saldoAkhir: Number(row['Saldo Akhir'] || 0) || 0,
          userId: 'USR-001',
          userNama: row['Petugas Operator'] || 'Operator',
          referensiDokumen: row['Referensi Dokumen'] || '',
          keterangan: row['Keterangan / Catatan'] || '',
          createdAt: row['Tanggal & Waktu'] || nowIso
        };
      });

      if (trxList.length > 0) {
        this.saveTransactions(trxList);
        counts.transactions = trxList.length;
      }
    }

    // 7. Pengguna Sistem
    if (Array.isArray(sheetData.users) && sheetData.users.length > 0) {
      const userRes = this.importUsersFromSpreadsheetRows(sheetData.users);
      counts.users = userRes.importedCount + userRes.updatedCount;
    }

    // Update config status
    const cfg = this.getSheetsConfig();
    cfg.lastSyncTime = nowIso.replace('T', ' ').slice(0, 19);
    cfg.isConnected = true;
    this.saveSheetsConfig(cfg);

    this.recordAuditLog(
      'SYNC_PULL',
      'DATABASE',
      `Otomatis memperbarui data dari Spreadsheet: ${counts.items} barang, ${counts.stocks} baris stok, ${counts.warehouses} gudang.`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sijajul_data_updated'));
    }

    return {
      success: true,
      counts,
      message: `Berhasil menyelaraskan ${counts.items} barang, ${counts.stocks} catatan saldo stok, ${counts.warehouses} gudang, dan ${counts.users} pegawai langsung dari Google Spreadsheet!`
    };
  }

  checkAndAutoPurgeDummy(): void {
    try {
      if (typeof window === 'undefined') return;
      const flag = localStorage.getItem('sijajul_dummy_cleared_v8_real');
      if (!flag) {
        const existingItems = this.getItems();
        const hasDummy = existingItems.some(i => 
          i.kodeBarang === 'ATK001' || 
          i.kodeBarang === 'KBR001' || 
          i.id === 'ITM-006' || 
          i.id?.startsWith('ITM-0') ||
          i.namaBarang?.includes('Sapu Lantai') ||
          i.namaBarang?.includes('Contoh')
        );
        if (hasDummy || existingItems.length === 24) {
          this.clearDummyData(true);
        }
        // Pastikan konfigurasi Google Spreadsheet & GAS terpasang aktif
        const targetGasUrl = 'https://script.google.com/macros/s/AKfycbwK2MD6O2YVPmrkI4c9XB9feTOYyKn2nx74M3Vd3eyQL35JzBNRjwr_di3LIgKlJI1tHA/exec';
        const targetSpreadsheetId = '1L2D_5jHPQibHovZEPOW6kJdgGHILFbp3_AImlh6pvAs';
        const cfg = this.getSheetsConfig();
        cfg.spreadsheetId = targetSpreadsheetId;
        cfg.gasDeploymentUrl = targetGasUrl;
        cfg.autoSync = true;
        cfg.isConnected = true;
        this.saveSheetsConfig(cfg);
        localStorage.setItem('sijajul_dummy_cleared_v8_real', 'true');
      }
    } catch (e) {
      console.warn('Auto dummy purge check warning:', e);
    }
  }
}

export const storageService = new StorageService();
storageService.checkAndAutoPurgeDummy();

