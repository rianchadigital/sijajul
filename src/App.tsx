import React, { useState, useEffect, useCallback } from 'react';
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
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [botModalOpen, setBotModalOpen] = useState(false);

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
    const pendingRec = droppings.filter(d => d.status === 'DROPPING' || d.status === 'DIPROSES').length;
    const unread = notifs.filter(n => !n.isRead).length;

    setPendingApprovalCount(pendingAppr);
    setPendingDroppingCount(pendingDrp);
    setPendingReceivingCount(pendingRec);
    setUnreadNotifsCount(unread);
  }, []);

  const handleSyncData = useCallback(() => {
    setIsSyncing(true);
    try {
      const result = storageService.syncDatabase();
      refreshBadgesAndStats();
      setSyncVersion(v => v + 1);
      setSyncToast({
        message: `Sinkronisasi Berhasil: ${result.stats.items} master barang, ${result.stats.warehouses} gudang pulau, dan ${result.stats.requests} permohonan logistik ter-refresh dari database.`,
        type: 'success'
      });
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
        return <MasterUserView currentUser={currentUser} onSwitchUser={handleSwitchUser} />;
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
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenNotifs={() => setNotifDrawerOpen(true)}
        onOpenBot={() => setBotModalOpen(true)}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
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

      {/* Main App Layout */}
      <div className="flex-1 flex pt-16 pb-20 md:pb-8">
        {/* Sidebar Navigation */}
        <Sidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          pendingApprovalCount={pendingApprovalCount}
          pendingDroppingCount={pendingDroppingCount}
          pendingReceivingCount={pendingReceivingCount}
        />

        {/* Dynamic Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
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

      {/* WhatsApp Stock Robot Modal */}
      <WhatsappBotModal
        isOpen={botModalOpen}
        onClose={() => setBotModalOpen(false)}
      />

      {/* Floating Robot Chatbot Button (Melayang) */}
      <FloatingRobotButton
        onClick={() => setBotModalOpen(true)}
      />
    </div>
  );
}
