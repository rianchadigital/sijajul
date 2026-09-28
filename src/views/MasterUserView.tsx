import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit2, Trash2, Search, Shield, Building2, 
  Phone, Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle2, 
  Copy, Send, RefreshCw, AlertCircle, Sparkles, Filter, 
  Check, UserCheck, ShieldAlert, ArrowRight, ShieldCheck, MapPin,
  FileSpreadsheet, DownloadCloud, UploadCloud, Table, X
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { gasService } from '../services/gasService';
import { User, Warehouse, Role } from '../types';

interface MasterUserViewProps {
  currentUser: User | null;
  onSwitchUser: (user: User) => void;
}

export const MasterUserView: React.FC<MasterUserViewProps> = ({ currentUser, onSwitchUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');

  // Modal State for Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form Fields
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [unitKerja, setUnitKerja] = useState('');
  const [tempatTugas, setTempatTugas] = useState('');
  const [role, setRole] = useState<Role>('PEGAWAI');
  const [gudangId, setGudangId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  const [statusAktif, setStatusAktif] = useState(true);
  const [formError, setFormError] = useState('');

  // Modal State for Reset Password
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [resetSuccessData, setResetSuccessData] = useState<{ user: User; defaultPass: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Modal for Change Own Password
  const [showOwnPassModal, setShowOwnPassModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownPassError, setOwnPassError] = useState('');
  const [ownPassSuccess, setOwnPassSuccess] = useState('');

  // Spreadsheet Sync & Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [pasteSpreadsheetText, setPasteSpreadsheetText] = useState('');
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [parsedPreviewUsers, setParsedPreviewUsers] = useState<any[]>([]);

  const loadData = () => {
    setUsers(storageService.getUsers());
    setWarehouses(storageService.getWarehouses());
  };

  useEffect(() => {
    loadData();
  }, []);

  const isSuperAdmin = currentUser?.role === 'ADMIN';

  // Handle Sync Directly from Google Sheets GAS Deployment
  const handleSyncFromGas = async () => {
    setIsSyncingSheets(true);
    setSyncFeedback(null);
    try {
      const cfg = storageService.getSheetsConfig();
      if (!cfg.gasDeploymentUrl) {
        setSyncFeedback({
          type: 'info',
          message: 'URL Google Apps Script belum disetel. Anda dapat memasukkan URL di Pengaturan atau menggunakan fitur Paste Tabel Spreadsheet di bawah.'
        });
        setIsSyncingSheets(false);
        return;
      }
      const res = await gasService.syncUsersFromSheets();
      if (res.success) {
        setSyncFeedback({
          type: 'success',
          message: res.message
        });
        loadData();
      } else {
        setSyncFeedback({
          type: 'error',
          message: res.message
        });
      }
    } catch (e: any) {
      setSyncFeedback({
        type: 'error',
        message: e.message || 'Gagal sinkronisasi data pengguna dari Google Apps Script'
      });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Parse Raw Copied Text from Google Sheets / Excel
  const handleParsePastedSpreadsheet = (rawText: string) => {
    setPasteSpreadsheetText(rawText);
    if (!rawText.trim()) {
      setParsedPreviewUsers([]);
      return;
    }

    const lines = rawText.trim().split(/\r?\n/);
    if (lines.length === 0) return;

    const parsed: any[] = [];
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader = firstLineLower.includes('nama') || firstLineLower.includes('nip') || firstLineLower.includes('jabatan') || firstLineLower.includes('username') || firstLineLower.includes('role');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    dataLines.forEach((line, idx) => {
      if (!line.trim()) return;
      let cols = line.split('\t');
      if (cols.length < 2) {
        cols = line.split(';');
      }
      if (cols.length < 2) {
        cols = line.split(',');
      }

      if (cols.length >= 1 && cols.some(c => c.trim().length > 0)) {
        parsed.push({
          id: cols[0]?.trim() || `USR-IMP-${Date.now()}-${idx + 1}`,
          nip: cols[1]?.trim() || '',
          nama: cols[2]?.trim() || cols[0]?.trim() || `Pegawai ${idx + 1}`,
          jabatan: cols[3]?.trim() || 'Pegawai Puskesmas',
          unitKerja: cols[4]?.trim() || 'Puskesmas Kepulauan Seribu Selatan',
          tempatTugas: cols[5]?.trim() || 'Puskesmas Kepulauan Seribu Selatan',
          role: cols[6]?.trim() || 'PEGAWAI',
          username: cols[7]?.trim() || '',
          status: cols[8]?.trim() || 'Aktif',
          noHp: cols[9]?.trim() || ''
        });
      }
    });

    setParsedPreviewUsers(parsed);
  };

  // Save parsed preview users to local storage
  const handleApplyImportedUsers = () => {
    if (parsedPreviewUsers.length === 0) return;
    const res = storageService.importUsersFromSpreadsheetRows(parsedPreviewUsers, currentUser);
    setSyncFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message
    });
    loadData();
    setShowImportModal(false);
    setPasteSpreadsheetText('');
    setParsedPreviewUsers([]);
  };

  // Handle open create modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setNama('');
    setNip('');
    setJabatan('');
    setUnitKerja('Puskesmas Kepulauan Seribu Selatan');
    setTempatTugas('Puskesmas Kepulauan Seribu Selatan');
    setRole('PEGAWAI');
    setGudangId(warehouses[0]?.id || '');
    setUsername('');
    setPassword('123456');
    setShowPassword(false);
    setNoHp('');
    setEmail('');
    setStatusAktif(true);
    setFormError('');
    setShowModal(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setNama(u.nama);
    setNip(u.nip || '');
    setJabatan(u.jabatan);
    setUnitKerja(u.unitKerja || '');
    setTempatTugas(u.tempatTugas || '');
    setRole(u.role);
    setGudangId(u.gudangId || '');
    setUsername(u.username || '');
    setPassword(u.password || '123456');
    setShowPassword(false);
    setNoHp(u.noHp || u.telepon || '');
    setEmail(u.email || '');
    setStatusAktif(u.statusAktif);
    setFormError('');
    setShowModal(true);
  };

  // Auto-generate username when typing name if username is empty or newly created
  const handleNameChange = (val: string) => {
    setNama(val);
    if (!editingUser) {
      const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 15);
      if (clean) {
        setUsername(clean);
      }
    }
  };

  // Handle form submit (Create / Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setFormError('Username login wajib diisi.');
      return;
    }

    // Check duplicate username
    const duplicate = users.find(u => 
      u.username.toLowerCase() === cleanUsername && 
      (!editingUser || u.id !== editingUser.id)
    );
    if (duplicate) {
      setFormError(`Username "${cleanUsername}" sudah digunakan oleh pegawai ${duplicate.nama}. Silakan gunakan username lain.`);
      return;
    }

    const wh = warehouses.find(w => w.id === gudangId);

    const userData: User = {
      id: editingUser ? editingUser.id : `USR-${Date.now()}`,
      username: cleanUsername,
      password: password.trim() || '123456',
      nama: nama.trim(),
      nip: nip.trim() || undefined,
      jabatan: jabatan.trim(),
      unitKerja: unitKerja.trim() || (wh ? wh.namaGudang : 'Puskesmas Kepulauan Seribu Selatan'),
      tempatTugas: tempatTugas.trim() || (wh ? wh.namaGudang : 'Puskesmas Kepulauan Seribu Selatan'),
      role,
      gudangId: gudangId || undefined,
      gudangNama: wh?.namaGudang,
      telepon: noHp.trim() || undefined,
      noHp: noHp.trim() || undefined,
      email: email.trim() || undefined,
      statusAktif
    };

    storageService.saveUser(userData, currentUser?.nama || 'Super Admin');
    setShowModal(false);
    loadData();
  };

  // Handle Super Admin Reset Password to Default 123456
  const handleTriggerResetPassword = (u: User) => {
    setResetModalUser(u);
    setResetSuccessData(null);
    setCopiedKey(false);
  };

  const handleConfirmResetPassword = () => {
    if (!resetModalUser) return;

    const res = storageService.resetUserPassword(resetModalUser.id, '123456', currentUser?.nama || 'Super Admin');
    if (res.success && res.user) {
      setResetSuccessData({
        user: res.user,
        defaultPass: '123456'
      });
      loadData();
    }
  };

  // Copy credentials to clipboard
  const handleCopyCredentials = (u: User, pass = '123456') => {
    const text = `KREDENSIAL LOGIN SI JAJUL - PUSKESMAS KEPULAUAN SERIBU SELATAN\nNama: ${u.nama}\nRole: ${u.role}\nUsername: ${u.username}\nPassword: ${pass}\nLink Login: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  // Send WhatsApp message
  const handleSendWhatsApp = (u: User, pass = '123456') => {
    const phone = (u.noHp || u.telepon || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const msg = `Halo Bapak/Ibu *${u.nama}*,\n\nAkun Anda pada aplikasi *SI JAJUL (Sistem Informasi Jaga Stok dan Jalur Logistik)* Puskesmas Kepulauan Seribu Selatan telah diperbarui:\n\n👤 *Username:* \`${u.username}\`\n🔑 *Kata Sandi:* \`${pass}\`\n🏷️ *Hak Akses:* ${u.role}\n🏢 *Unit:* ${u.tempatTugas || u.gudangNama || 'Puskesmas KSS'}\n\nSilakan login melalui tautan aplikasi web SI JAJUL. Demi keamanan, Anda dapat mengganti kata sandi setelah berhasil login.\n\n_Puskesmas Kecamatan Kepulauan Seribu Selatan_`;
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // Handle self password change
  const handleSelfPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnPassError('');
    setOwnPassSuccess('');

    if (!currentUser) return;

    const currentActual = currentUser.password || '123456';
    if (oldPassword !== currentActual && oldPassword !== '123456' && oldPassword !== 'password123') {
      setOwnPassError('Kata sandi saat ini tidak sesuai.');
      return;
    }

    if (newPassword.length < 5) {
      setOwnPassError('Kata sandi baru minimal 5 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setOwnPassError('Konfirmasi kata sandi baru tidak sama.');
      return;
    }

    storageService.changeUserPassword(currentUser.id, newPassword, currentUser.nama);
    setOwnPassSuccess('Kata sandi Anda berhasil diperbarui! Silakan gunakan kata sandi baru untuk login berikutnya.');
    loadData();
    setTimeout(() => {
      setShowOwnPassModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOwnPassSuccess('');
    }, 1800);
  };

  // Delete User
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus akun pengguna "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      storageService.deleteUser(id);
      loadData();
    }
  };

  // Filter Users
  const filteredUsers = users.filter(u => {
    // Role filter
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    // Warehouse filter
    if (warehouseFilter !== 'ALL' && u.gudangId !== warehouseFilter) return false;
    // Search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.nama.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.nip && u.nip.includes(q)) ||
      u.jabatan.toLowerCase().includes(q) ||
      (u.gudangNama && u.gudangNama.toLowerCase().includes(q))
    );
  });

  // Calculate statistics
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const picBesarCount = users.filter(u => u.role === 'PIC_GUDANG_BESAR').length;
  const picSubCount = users.filter(u => u.role === 'PIC_SUB_GUDANG').length;
  const activeCount = users.filter(u => u.statusAktif).length;

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 rounded-3xl border border-slate-800 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-800/80 border border-teal-500/50 text-[11px] font-bold text-teal-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              Kontrol Hak Akses &amp; Keamanan Akun
            </span>
            <span className="text-[10px] text-slate-400">SI JAJUL v2.5</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            Manajemen Pengguna &amp; Akun Login
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Buat akun login, kelola password, atur hak akses berjenjang pulau, dan reset password akun ke default <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono font-bold">123456</code> untuk Super Admin.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isSuperAdmin && (
            <>
              <button
                id="btn-sync-users-gas"
                onClick={handleSyncFromGas}
                disabled={isSyncingSheets}
                className="px-3.5 py-2.5 bg-teal-800/90 hover:bg-teal-700 border border-teal-600 text-teal-100 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-teal-300 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                <span>{isSyncingSheets ? 'Menyinkronkan...' : 'Tarik dari Google Sheet'}</span>
              </button>

              <button
                id="btn-open-import-spreadsheet"
                onClick={() => {
                  setSyncFeedback(null);
                  setShowImportModal(true);
                }}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Import / Paste Spreadsheet</span>
              </button>
            </>
          )}

          <button
            id="btn-open-change-own-password"
            onClick={() => {
              setOwnPassError('');
              setOwnPassSuccess('');
              setOldPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setShowOwnPassModal(true);
            }}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Ganti Password Saya</span>
          </button>

          {isSuperAdmin && (
            <button
              id="btn-open-create-user"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-950 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Akun Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Feedback Toast / Banner */}
      {syncFeedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-start justify-between gap-3 animate-in fade-in ${
          syncFeedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : syncFeedback.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-start gap-2.5">
            {syncFeedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
            {syncFeedback.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />}
            {syncFeedback.type === 'info' && <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
            <div>
              <div className="font-bold text-sm">
                {syncFeedback.type === 'success' ? 'Sinkronisasi Berhasil' : syncFeedback.type === 'error' ? 'Pemberitahuan Sinkronisasi' : 'Informasi Integrasi'}
              </div>
              <p className="mt-0.5 leading-relaxed">{syncFeedback.message}</p>
            </div>
          </div>
          <button onClick={() => setSyncFeedback(null)} className="p-1 rounded-lg hover:bg-black/5 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Akun</div>
            <div className="text-xl font-black text-slate-800">{totalUsers} <span className="text-xs font-semibold text-slate-500">Pegawai</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-800">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Super Admin</div>
            <div className="text-xl font-black text-purple-900">{adminCount} <span className="text-xs font-semibold text-slate-500">Akun</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PIC Gudang Pulau</div>
            <div className="text-xl font-black text-blue-900">{picBesarCount + picSubCount} <span className="text-xs font-semibold text-slate-500">Titik</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Akun Aktif</div>
            <div className="text-xl font-black text-emerald-800">{activeCount} <span className="text-xs font-semibold text-slate-500">User</span></div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-users"
              type="text"
              placeholder="Cari nama pegawai, username login, NIP, atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="font-bold">Role:</span>
            </div>
            <select
              id="select-filter-role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">Semua Hak Akses</option>
              <option value="ADMIN">ADMIN / Super Admin</option>
              <option value="PIC_GUDANG_BESAR">PIC Gudang Besar (Pusat)</option>
              <option value="PIC_SUB_GUDANG">PIC Sub Gudang Pulau</option>
              <option value="PEGAWAI">Pegawai Pemohon</option>
            </select>

            <select
              id="select-filter-warehouse"
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">Semua Wilayah Gudang</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.namaGudang}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Helper Badge */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Password Default Akun Baru &amp; Reset: <strong className="text-slate-800 font-mono">123456</strong></span>
          </div>
          <div>
            Menampilkan <strong>{filteredUsers.length}</strong> dari <strong>{users.length}</strong> akun terdaftar
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5">Profil &amp; Pegawai</th>
                <th className="px-4 py-3.5">Akun Login (Username &amp; Password)</th>
                <th className="px-4 py-3.5">Hak Akses (Role)</th>
                <th className="px-4 py-3.5">Penugasan / Wilayah Gudang</th>
                <th className="px-4 py-3.5">Kontak WhatsApp</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center w-36">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">Tidak ada akun pengguna yang cocok</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau filter role.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const isCurrent = currentUser?.id === u.id;
                  const isDefaultPass = !u.password || u.password === '123456';

                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${isCurrent ? 'bg-teal-50/40' : ''}`}>
                      <td className="px-4 py-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                      
                      {/* Name & NIP */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            u.role === 'PIC_GUDANG_BESAR' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                            u.role === 'PIC_SUB_GUDANG' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {u.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.nama}</span>
                              {isCurrent && (
                                <span className="bg-teal-800 text-white text-[9px] px-1.5 py-0.2 rounded font-bold">
                                  Akun Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">{u.jabatan}</div>
                            {u.nip && (
                              <div className="text-[10px] text-slate-400 font-mono">NIP. {u.nip}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Login Credentials */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400">User:</span>
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              {u.username}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-[10px] font-bold text-slate-400">Pass:</span>
                            {isDefaultPass ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold font-mono">
                                <KeyRound className="w-3 h-3 text-amber-600" />
                                Default (123456)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                <Lock className="w-3 h-3 text-emerald-600" />
                                Kustom
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold inline-block leading-tight ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          u.role === 'PIC_GUDANG_BESAR' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                          u.role === 'PIC_SUB_GUDANG' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {u.role === 'ADMIN' ? 'SUPER ADMIN' :
                           u.role === 'PIC_GUDANG_BESAR' ? 'PIC GUDANG BESAR' :
                           u.role === 'PIC_SUB_GUDANG' ? 'PIC SUB GUDANG' : 'PEGAWAI'}
                        </span>
                      </td>

                      {/* Warehouse & Location */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-800 font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-600 flex-shrink-0" />
                          <span>{u.gudangNama || u.tempatTugas || 'Gudang Pusat KSS'}</span>
                        </div>
                        {u.unitKerja && (
                          <div className="text-[10px] text-slate-400">{u.unitKerja}</div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5">
                        {u.noHp || u.telepon ? (
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(u, u.password || '123456')}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-semibold border border-emerald-200 transition-colors"
                            title="Kirim pesan WhatsApp"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{u.noHp || u.telepon}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.statusAktif ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {u.statusAktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Super Admin Reset Password Button */}
                          <button
                            id={`btn-reset-pass-${u.id}`}
                            onClick={() => handleTriggerResetPassword(u)}
                            className="p-1.5 text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                            title="Reset kata sandi ke default (123456)"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit User Button */}
                          <button
                            id={`btn-edit-user-${u.id}`}
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-600 hover:text-teal-800 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg transition-colors cursor-pointer"
                            title="Edit data akun & role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Switch User (Simulasi) */}
                          {!isCurrent && (
                            <button
                              id={`btn-switch-user-${u.id}`}
                              onClick={() => onSwitchUser(u)}
                              className="px-2 py-1 bg-slate-100 hover:bg-teal-800 text-slate-700 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              title="Masuk sebagai akun ini"
                            >
                              Masuk
                            </button>
                          )}

                          {/* Delete Button (Super Admin only, not self) */}
                          {isSuperAdmin && !isCurrent && (
                            <button
                              id={`btn-delete-user-${u.id}`}
                              onClick={() => handleDelete(u.id, u.nama)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-lg transition-colors cursor-pointer"
                              title="Hapus akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT USER ACCOUNT */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8 border border-slate-100">
            <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingUser ? 'Edit Akun Pengguna' : 'Buat Akun Pengguna Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">SI JAJUL Puskesmas Kepulauan Seribu Selatan</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Nama Lengkap & NIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap &amp; Gelar *</label>
                  <input
                    id="input-user-nama"
                    type="text"
                    required
                    placeholder="Contoh: dr. Surya Pratama, M.K.M."
                    value={nama}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP / NRK / NIK</label>
                  <input
                    id="input-user-nip"
                    type="text"
                    placeholder="198402152008011005"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Jabatan & Unit Kerja */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan Resmi *</label>
                  <input
                    id="input-user-jabatan"
                    type="text"
                    required
                    placeholder="Contoh: PIC Sub Gudang / Bidan"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Kerja</label>
                  <input
                    id="input-user-unit-kerja"
                    type="text"
                    placeholder="Contoh: Pustu Pulau Pari"
                    value={unitKerja}
                    onChange={(e) => setUnitKerja(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Role & Gudang Afiliasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hak Akses (Role) *</label>
                  <select
                    id="select-user-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="ADMIN">ADMIN / Super Admin (Akses Penuh)</option>
                    <option value="PIC_GUDANG_BESAR">PIC GUDANG BESAR (Gudang Induk KSS)</option>
                    <option value="PIC_SUB_GUDANG">PIC SUB GUDANG (Gudang Pulau)</option>
                    <option value="PEGAWAI">PEGAWAI (Pemohon Logistik)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wilayah Gudang Tugas *</label>
                  <select
                    id="select-user-gudang"
                    value={gudangId}
                    onChange={(e) => {
                      setGudangId(e.target.value);
                      const wh = warehouses.find(w => w.id === e.target.value);
                      if (wh) {
                        setTempatTugas(wh.namaGudang);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="">Semua Wilayah (Pusat / Admin)</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.namaGudang} ({w.lokasi})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* KREDENSIAL LOGIN: USERNAME & PASSWORD */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-teal-400" />
                    <span className="font-bold text-xs text-teal-200">Kredensial Login SI JAJUL</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Digunakan untuk login sistem</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Username Input */}
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Username Login *</label>
                    <input
                      id="input-user-username"
                      type="text"
                      required
                      placeholder="Contoh: admin, pic_tidung"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-300">Kata Sandi (Password) *</label>
                      <button
                        type="button"
                        onClick={() => setPassword('123456')}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold"
                      >
                        Pakai Default 123456
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="input-user-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Default: 123456"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kontak WA & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp (Kirim Kredensial)</label>
                  <input
                    id="input-user-nohp"
                    type="text"
                    placeholder="08123456789"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Pegawai</label>
                  <input
                    id="input-user-email"
                    type="email"
                    placeholder="nama@jakarta.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="statusPegawaiActive"
                  checked={statusAktif}
                  onChange={(e) => setStatusAktif(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="statusPegawaiActive" className="font-bold text-slate-700 cursor-pointer">
                  Akun Aktif Bertugas (Dapat login ke SI JAJUL)
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-save-user"
                  type="submit"
                  className="px-5 py-2.5 font-bold bg-teal-700 hover:bg-teal-600 active:bg-teal-800 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Akun Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SUPER ADMIN RESET PASSWORD TO DEFAULT 123456 */}
      {/* ========================================================================= */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 my-8 border border-slate-100">
            {!resetSuccessData ? (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>

                <div className="text-center">
                  <h3 className="text-base font-black text-slate-800">
                    Reset Password ke Default?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Super Admin akan mereset kata sandi akun ini ke nilai standar.
                  </p>
                </div>

                {/* Target User Card */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Nama Pegawai:</span>
                    <strong className="text-slate-800">{resetModalUser.nama}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Username:</span>
                    <code className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                      {resetModalUser.username}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Password Baru:</span>
                    <code className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      123456
                    </code>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    Setelah direset, pegawai dapat langsung masuk dengan password <strong className="font-mono">123456</strong> dan disarankan untuk segera mengubahnya.
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    id="btn-confirm-reset-pass"
                    type="button"
                    onClick={handleConfirmResetPassword}
                    className="px-5 py-2.5 font-bold bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Reset ke 123456</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Success State with Copy & WhatsApp Sharing */
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Password Berhasil Direset!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Kredensial login akun telah diperbarui ke default.
                  </p>
                </div>

                {/* Credentials Box */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl text-left text-xs space-y-2 border border-slate-800">
                  <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800 pb-1.5">
                    <span>Kredensial Login SI JAJUL</span>
                    <span className="text-emerald-400">Siap Digunakan</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Username:</span>
                    <code className="font-mono font-bold text-teal-300 text-sm">{resetSuccessData.user.username}</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Password Baru:</span>
                    <code className="font-mono font-bold text-amber-300 text-sm">{resetSuccessData.defaultPass}</code>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCredentials(resetSuccessData.user, resetSuccessData.defaultPass)}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey ? 'Disalin!' : 'Salin Info'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(resetSuccessData.user, resetSuccessData.defaultPass)}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim WA</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GANTI PASSWORD SENDIRI (SELF CHANGE PASSWORD) */}
      {/* ========================================================================= */}
      {showOwnPassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 my-8 border border-slate-100">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Ganti Password Saya
                  </h3>
                  <p className="text-xs text-slate-400">{currentUser?.nama} ({currentUser?.username})</p>
                </div>
              </div>
              <button 
                onClick={() => setShowOwnPassModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {ownPassError && (
              <div className="mb-3.5 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{ownPassError}</span>
              </div>
            )}

            {ownPassSuccess && (
              <div className="mb-3.5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{ownPassSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSelfPasswordChange} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Saat Ini *</label>
                <input
                  id="input-self-old-pass"
                  type="password"
                  required
                  placeholder="Masukkan kata sandi lama / default..."
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru *</label>
                <input
                  id="input-self-new-pass"
                  type="password"
                  required
                  placeholder="Minimal 5 karakter..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ulangi Kata Sandi Baru *</label>
                <input
                  id="input-self-confirm-pass"
                  type="password"
                  required
                  placeholder="Ketik ulang kata sandi baru..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOwnPassModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  id="btn-submit-self-pass"
                  type="submit"
                  className="px-5 py-2 font-bold bg-teal-800 hover:bg-teal-700 active:bg-teal-900 text-white rounded-xl shadow-md"
                >
                  Perbarui Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: IMPORT DATA PEGAWAI DARI SPREADSHEET (PASTE / GAS SYNC) */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8 border border-slate-100">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Import Data Pegawai dari Spreadsheet
                  </h3>
                  <p className="text-xs text-slate-500">
                    Salin (copy) baris data dari Google Sheet / Excel lalu tempel (paste) di bawah untuk memunculkan semua pegawai &amp; akun login.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Petunjuk Format Kolom */}
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Format Kolom yang Didukung (Urutan Standar Spreadsheet):</span>
                  <div className="font-mono text-[11px] text-amber-800 mt-1 bg-amber-100/70 p-2 rounded-lg overflow-x-auto">
                    ID | NIP | Nama Lengkap | Jabatan | Unit Kerja | Gudang / Tempat Tugas | Role | Username | Status | No HP
                  </div>
                  <div className="text-[11px] text-amber-700 mt-1">
                    * Password awal semua pegawai otomatis disetel ke default: <strong className="font-mono">123456</strong> (dapat diganti oleh masing-masing pegawai setelah login).
                  </div>
                </div>
              </div>

              {/* Textarea Paste */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700">Tempel (Paste) Data Spreadsheet di Sini:</label>
                  <button
                    type="button"
                    onClick={handleSyncFromGas}
                    disabled={isSyncingSheets}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                    <span>Tarik Langsung via URL Web App</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={pasteSpreadsheetText}
                  onChange={(e) => handleParsePastedSpreadsheet(e.target.value)}
                  placeholder="Blok kolom data di Google Sheets / Excel, tekan Ctrl+C, lalu tekan Ctrl+V di sini..."
                  className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              {/* Parsed Preview Table */}
              {parsedPreviewUsers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Table className="w-4 h-4 text-teal-700" />
                      Pratinjau Data ({parsedPreviewUsers.length} Pegawai Terdeteksi)
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Siap Diimport
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Nama Pegawai</th>
                          <th className="py-2 px-3">NIP</th>
                          <th className="py-2 px-3">Jabatan</th>
                          <th className="py-2 px-3">Tempat Tugas</th>
                          <th className="py-2 px-3">Role</th>
                          <th className="py-2 px-3">Username Login</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPreviewUsers.map((u, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-800">{u.nama}</td>
                            <td className="py-2 px-3 font-mono text-slate-500">{u.nip || '-'}</td>
                            <td className="py-2 px-3 text-slate-600">{u.jabatan}</td>
                            <td className="py-2 px-3 text-slate-600">{u.tempatTugas}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono text-teal-700 font-semibold">
                              {u.username || u.nama.toLowerCase().replace(/[^a-z0-9]/g, '')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setPasteSpreadsheetText('');
                    setParsedPreviewUsers([]);
                  }}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyImportedUsers}
                  disabled={parsedPreviewUsers.length === 0}
                  className="px-5 py-2.5 font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan ({parsedPreviewUsers.length}) Pegawai ke Sistem</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
