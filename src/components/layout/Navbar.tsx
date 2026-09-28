import React, { useState } from 'react';
import { 
  Bell, Search, User as UserIcon, LogOut, 
  Building2, ChevronDown, Check, RefreshCw, Menu, MessageSquare, Database, Sparkles
} from 'lucide-react';
import { User, Warehouse } from '../../types';
import { storageService } from '../../services/storageService';

interface NavbarProps {
  currentUser: User | null;
  activeView?: string;
  onNavigate: (viewId: string) => void;
  onToggleSidebar?: () => void;
  onOpenSearch?: () => void;
  onOpenNotifs?: () => void;
  onOpenNotifications?: () => void;
  onOpenBot?: () => void;
  onLogout: () => void;
  onSwitchUser?: (user: User) => void;
  onUserChange?: (user: User) => void;
  onSync?: () => void;
  isSyncing?: boolean;
  unreadNotifCount?: number;
  unreadNotifsCount?: number;
  warehouses?: Warehouse[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView: _activeView,
  onNavigate,
  onToggleSidebar,
  onOpenSearch,
  onOpenNotifs,
  onOpenNotifications,
  onOpenBot,
  onLogout,
  onSwitchUser,
  onUserChange,
  onSync,
  isSyncing = false,
  unreadNotifCount = 0,
  unreadNotifsCount = 0,
  warehouses: propWarehouses
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [localSyncing, setLocalSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const users = storageService.getUsers() || [];
  const warehouses = (propWarehouses && propWarehouses.length > 0) ? propWarehouses : (storageService.getWarehouses() || []);
  const userWarehouse = warehouses.find(w => w.id === currentUser?.gudangId);

  const effectiveNotifCount = unreadNotifCount || unreadNotifsCount || 0;
  const handleOpenNotif = onOpenNotifs || onOpenNotifications || (() => {});
  const handleSwitch = onSwitchUser || onUserChange || (() => {});

  const handleSyncClick = () => {
    setLocalSyncing(true);
    if (onSync) {
      onSync();
    } else {
      storageService.syncDatabase();
    }
    setTimeout(() => {
      setLocalSyncing(false);
      setSyncFeedback('Data Tersinkronisasi');
      setTimeout(() => setSyncFeedback(null), 3000);
    }, 600);
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'PIC_GUDANG_BESAR': return 'PIC Gudang Besar';
      case 'PIC_SUB_GUDANG': return 'PIC Sub Gudang';
      case 'PEGAWAI': return 'Pegawai';
      default: return role || 'Pengguna';
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PIC_GUDANG_BESAR': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'PIC_SUB_GUDANG': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 shadow-xs h-16">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand / Mobile Sidebar Toggle & Active Warehouse Indicator */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              id="btn-toggle-sidebar"
              onClick={onToggleSidebar}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-9 h-9 rounded-lg bg-teal-800 flex items-center justify-center text-white font-extrabold text-sm shadow-xs flex-shrink-0">
              JJ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base leading-none">
                  SI JAJUL
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                  Kep. Seribu Selatan
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Sistem Informasi Jaga Stok &amp; Jalur Logistik • Puskesmas KSS
              </p>
            </div>
          </div>

          {/* Active Warehouse Chip */}
          {userWarehouse && (
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md border border-slate-200 font-medium ml-3">
              <Building2 className="w-3.5 h-3.5 text-teal-700" />
              <span>{userWarehouse.namaGudang}</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Tombol Sinkronisasi Database & Aplikasi */}
          <button
            id="btn-sync-database"
            onClick={handleSyncClick}
            disabled={localSyncing || isSyncing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
              localSyncing || isSyncing
                ? 'bg-teal-700 text-teal-100 cursor-wait'
                : syncFeedback
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-teal-800 text-white hover:bg-teal-900 active:scale-95'
            }`}
            title="Singkronisasi Data: Muat ulang dan perbarui seluruh data dari database ke aplikasi"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${localSyncing || isSyncing ? 'animate-spin text-teal-200' : ''}`} />
            <span className="hidden sm:inline">
              {localSyncing || isSyncing ? 'Sinkronisasi...' : syncFeedback ? syncFeedback : 'Sinkron Data'}
            </span>
            <span className="sm:hidden">
              {localSyncing || isSyncing ? '...' : 'Sync'}
            </span>
          </button>

          {/* Quick Global Search Button */}
          {onOpenSearch && (
            <button
              id="btn-global-search"
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors border border-slate-200"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pencarian Cepat</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] text-slate-500">
                Ctrl+K
              </kbd>
            </button>
          )}

          {/* WhatsApp Stock Bot Assistant Button */}
          {onOpenBot && (
            <button
              id="btn-whatsapp-bot-modal"
              onClick={onOpenBot}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition-colors shadow-2xs"
              title="Tanya Robot Stok Barang WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Robot Cek Stok</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          )}

          {/* Quick Role Switcher (Simulasi Multi-User) */}
          <div className="relative">
            <button
              id="btn-switch-role"
              onClick={() => setShowSwitchMenu(!showSwitchMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold border border-teal-200 transition-colors"
              title="Ganti Pengguna untuk Menguji Role Berbeda"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Ganti Akun Role</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showSwitchMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pilih Akun Pengguna (Simulasi)
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        handleSwitch(u);
                        setShowSwitchMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        currentUser?.id === u.id ? 'bg-teal-50 font-bold text-teal-900' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{u.nama}</div>
                        <div className="text-[11px] text-slate-500">{getRoleLabel(u.role)} • {u.tempatTugas || u.gudangNama || 'Puskesmas'}</div>
                      </div>
                      {currentUser?.id === u.id && <Check className="w-4 h-4 text-teal-700" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            id="btn-notifications"
            onClick={handleOpenNotif}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {effectiveNotifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {effectiveNotifCount > 9 ? '9+' : effectiveNotifCount}
              </span>
            )}
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              id="btn-user-profile-menu"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center text-xs">
                {currentUser?.nama?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                  {currentUser?.nama}
                </div>
                <div className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border inline-block ${getRoleBadgeColor(currentUser?.role)}`}>
                  {getRoleLabel(currentUser?.role)}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800">{currentUser?.nama}</div>
                  <div className="text-[11px] text-slate-500">NIP: {currentUser?.nip || '-'}</div>
                  <div className="text-[11px] text-teal-700 font-medium">{currentUser?.jabatan}</div>
                </div>

                <button
                  id="nav-btn-profile-user-management"
                  onClick={() => {
                    onNavigate('master_pegawai');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <UserIcon className="w-4 h-4 text-teal-700" /> 
                  <span>Manajemen Pengguna &amp; Akun</span>
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-rose-500" /> Keluar (Logout)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
