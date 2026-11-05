import React, { useState, useEffect, useCallback } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import { storageService } from './services/storageService';
import { gasService } from './services/gasService';
import { User, Notification } from './types';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { WhatsappBotModal } from './components/common/WhatsappBotModal';
import { FloatingRobotButton } from './components/common/FloatingRobotButton';

// Views
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { StockView } from './views/StockView';
import { RequestView } from './views/RequestView';
import { ApprovalView } from './views/ApprovalView';
import { DroppingView } from './views/DroppingView';
import { ReceivingView } from './views/ReceivingView';
import { BastView } from './views/BastView';
import { SbbkView } from './views/SbbkView';
import { StockCardView } from './views/StockCardView';
import { MutationView } from './views/MutationView';
import { StockOpnameView } from './views/StockOpnameView';
import { ReportsView } from './views/ReportsView';
import { MasterItemView } from './views/MasterItemView';
import { MasterCategoryView } from './views/MasterCategoryView';
import { MasterWarehouseView } from './views/MasterWarehouseView';
import { MasterUserView } from './views/MasterUserView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';
import { ProposalView } from './views/ProposalView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getCurrentUser());
  const [activeView, setActiveView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlView = params.get('view');
        if (urlView) return urlView;
      } catch {}
    }
    return 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sijajul_sidebar_collapsed') === 'true';
    }
    return false;
  });
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [botModalOpen, setBotModalOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => {
        const next = !prev;
        if (typeof window !== 'undefined') {
          localStorage.setItem('sijajul_sidebar_collapsed', String(next));
        }
        return next;
      });
    }
  };

  // Badge counts
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [pendingDroppingCount, setPendingDroppingCount] = useState(0);
  const [pendingReceivingCount, setPendingReceivingCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Sync state & version
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const refreshBadgesAndStats = useCallback(() => {
    const requests = storageService.getRequests();
    const droppings = storageService.getDroppings();
    const notifs = storageService.getNotifications();

    const pendingAppr = requests.filter(r => r.status === 'DIAJUKAN' || r.status === 'DIPERIKSA').length;
    const pendingDrp = requests.filter(r => r.status === 'DISETUJUI').length;
    const pendingRec = droppings.filter(d => d.status !== 'SELESAI' && d.status !== 'DITERIMA').length;
    const unread = notifs.filter(n => !n.isRead).length;

    setPendingApprovalCount(pendingAppr);
    setPendingDroppingCount(pendingDrp);
    setPendingReceivingCount(pendingRec);
    setUnreadNotifsCount(unread);
  }, []);

  const handleSyncData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const sheetsCfg = storageService.getSheetsConfig();
      if (sheetsCfg.gasDeploymentUrl) {
        const pullRes = await gasService.syncAllFromSheets();
        refreshBadgesAndStats();
        setSyncVersion(v => v + 1);
        setSyncToast({
          message: pullRes.message || 'Sinkronisasi real-time Google Spreadsheet berhasil!',
          type: 'success'
        });
      } else {
        const result = storageService.syncDatabase();
        refreshBadgesAndStats();
        setSyncVersion(v => v + 1);
        setSyncToast({
          message: `Sinkronisasi Database Berhasil: ${result.stats.items} barang, ${result.stats.warehouses} gudang ter-refresh.`,
          type: 'success'
        });
      }
      setTimeout(() => {
        setSyncToast(null);
      }, 4000);
    } catch (err: any) {
      setSyncToast({
        message: `Gagal sinkronisasi: ${err.message || 'Terjadi kesalahan sistem'}`,
        type: 'info'
      });
      setTimeout(() => {
        setSyncToast(null);
      }, 4000);
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 500);
    }
  }, [refreshBadgesAndStats]);

  useEffect(() => {
    refreshBadgesAndStats();
  }, [refreshBadgesAndStats, activeView]);

  // Otomatisasi Sinkronisasi Spreadsheet Real-Time Setiap Detik (Tanpa Perlu Klik Tombol atau Refresh)
  useEffect(() => {
    gasService.startAutoSync(1, (_status) => {
      refreshBadgesAndStats();
      setSyncVersion(v => v + 1);
    });

    const handleDataUpdated = () => {
      refreshBadgesAndStats();
      setSyncVersion(v => v + 1);
    };

    window.addEventListener('sijajul_data_updated', handleDataUpdated);
    window.addEventListener('sijajul_autosync_completed', handleDataUpdated);

    return () => {
      gasService.stopAutoSync();
      window.removeEventListener('sijajul_data_updated', handleDataUpdated);
      window.removeEventListener('sijajul_autosync_completed', handleDataUpdated);
    };
  }, [refreshBadgesAndStats]);

  // Global shortcut for search: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (viewId: string) => {
    setActiveView(viewId);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchUser = (user: User) => {
    storageService.setCurrentUser(user);
    setCurrentUser(user);
    refreshBadgesAndStats();
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null as any);
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={(u) => { setCurrentUser(u); setActiveView('dashboard'); }} />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} currentUser={currentUser} />;
      case 'stock':
      case 'stok':
        return <StockView onNavigate={handleNavigate} currentUser={currentUser} onRefreshStats={refreshBadgesAndStats} />;
      case 'request':
      case 'permintaan':
        return <RequestView currentUser={currentUser} onRefreshStats={refreshBadgesAndStats} />;
      case 'usulan_barang':
      case 'usulan':
      case 'proposal':
        return <ProposalView currentUser={currentUser} onRefreshStats={refreshBadgesAndStats} />;
      case 'approval':
        return <ApprovalView currentUser={currentUser} onRefreshStats={refreshBadgesAndStats} onNavigate={handleNavigate} />;
      case 'dropping':
        return <DroppingView currentUser={currentUser} onRefreshStats={refreshBadgesAndStats} onNavigate={handleNavigate} />;
      case 'receiving':
      case 'penerimaan':
        return <ReceivingView onNavigate={handleNavigate} currentUser={currentUser} onRefreshStats={refreshBadgesAndStats} />;
      case 'bast':
        return <BastView currentUser={currentUser} />;
      case 'sbbk':
        return <SbbkView currentUser={currentUser} />;
      case 'kartu_stok':
      case 'kartu-stok':
        return <StockCardView currentUser={currentUser} />;
      case 'mutasi':
        return <MutationView currentUser={currentUser} onRefreshStats={refreshBadgesAndStats} />;
      case 'opname':
        return <StockOpnameView currentUser={currentUser} onRefreshStats={refreshBadgesAndStats} />;
      case 'laporan':
        return <ReportsView currentUser={currentUser} />;
      case 'master_barang':
      case 'master-barang':
        return <MasterItemView currentUser={currentUser} />;
      case 'master_kategori':
      case 'master-kategori':
        return <MasterCategoryView currentUser={currentUser} />;
      case 'master_gudang':
      case 'master-gudang':
        return <MasterWarehouseView currentUser={currentUser} />;
      case 'master_pegawai':
      case 'master-pegawai':
      case 'profil':
        return <MasterUserView currentUser={currentUser} />;
      case 'audit_log':
      case 'audit-log':
        return <AuditLogView currentUser={currentUser} />;
      case 'pengaturan':
        return <SettingsView currentUser={currentUser} onRefreshAll={refreshBadgesAndStats} />;
      default:
        return <DashboardView onNavigate={handleNavigate} currentUser={currentUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-teal-700 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onNavigate={handleNavigate}
        onToggleSidebar={handleToggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenNotifs={() => setNotifDrawerOpen(true)}
        onLogout={handleLogout}
        onSync={handleSyncData}
        isSyncing={isSyncing}
        unreadNotifCount={unreadNotifsCount}
      />

      {/* Sync Toast Feedback Banner */}
      {syncToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md">
          <div className="bg-teal-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-teal-700 flex items-start gap-3">
            <div className="p-1 bg-teal-800 rounded-lg text-teal-200 mt-0.5 flex-shrink-0">
              <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-200">Database Tersinkron</h4>
              <p className="text-xs text-slate-100 mt-0.5 leading-relaxed">{syncToast.message}</p>
            </div>
            <button
              onClick={() => setSyncToast(null)}
              className="text-teal-300 hover:text-white text-sm p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Floating Reopen Menu Tab (when desktop sidebar is hidden) */}
      {isSidebarCollapsed && (
        <button
          onClick={handleToggleSidebar}
          className="hidden md:flex fixed left-0 top-20 z-20 bg-teal-800 hover:bg-teal-700 text-white py-2 px-3 rounded-r-xl shadow-lg border-y border-r border-teal-600 items-center gap-1.5 text-xs font-bold transition-all cursor-pointer hover:pl-4 group"
          title="Tampilkan Menu Samping"
        >
          <PanelLeftOpen className="w-4 h-4 text-teal-200 group-hover:scale-110 transition-transform" />
          <span>Buka Menu</span>
        </button>
      )}

      {/* Main App Layout */}
      <div className="flex-1 flex pt-16 pb-20 md:pb-8">
        {/* Sidebar Navigation */}
        <Sidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          pendingApprovalCount={pendingApprovalCount}
          pendingDroppingCount={pendingDroppingCount}
          pendingReceivingCount={pendingReceivingCount}
        />

        {/* Dynamic Content Area - Full screen width when sidebar is collapsed/hidden */}
        <main className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 transition-all duration-200 ${isSidebarCollapsed ? 'w-full max-w-none px-4 sm:px-8 lg:px-10' : 'max-w-7xl mx-auto w-full'}`}>
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeView={activeView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        pendingApprovalCount={pendingApprovalCount}
      />

      {/* Notification Drawer Modal */}
      <NotificationDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        onNavigate={handleNavigate}
        onMarkAllRead={refreshBadgesAndStats}
      />

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Floating Chatbot Cek Stok Icon (Melayang) */}
      <FloatingRobotButton onClick={() => setBotModalOpen(true)} />

      {/* WhatsApp Stock Robot Modal */}
      <WhatsappBotModal
        isOpen={botModalOpen}
        onClose={() => setBotModalOpen(false)}
      />
    </div>
  );
}
