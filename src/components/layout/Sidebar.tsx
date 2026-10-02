import React from 'react';
import { 
  Home, Package, FileText, CheckSquare, Truck, 
  Inbox, ArrowLeftRight, ClipboardCheck, CreditCard, 
  FileCheck2, FileOutput, BarChart3, Building2, 
  Layers, Users, Settings, History, ShieldAlert, X, Lightbulb
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  activeView?: string;
  currentView?: string;
  onNavigate: (viewId: string) => void;
  currentUser: User | null;
  isOpen?: boolean;
  onClose?: () => void;
  pendingApprovalCount?: number;
  pendingApprovalsCount?: number;
  pendingDroppingCount?: number;
  pendingReceivingCount?: number;
  incomingDroppingsCount?: number;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  currentView,
  onNavigate,
  currentUser,
  isOpen = false,
  onClose,
  pendingApprovalCount = 0,
  pendingApprovalsCount = 0,
  pendingDroppingCount = 0,
  pendingReceivingCount = 0,
  incomingDroppingsCount = 0,
  lowStockCount = 0
}) => {
  const current = activeView || currentView || 'dashboard';
  const role = currentUser?.role || 'PEGAWAI';

  const approvalCount = pendingApprovalCount || pendingApprovalsCount || 0;
  const receivingCount = pendingReceivingCount || incomingDroppingsCount || 0;

  // Normalize view check helper
  const isItemActive = (id: string) => {
    if (current === id) return true;
    if (id === 'stok' && current === 'stock') return true;
    if (id === 'stock' && current === 'stok') return true;
    if (id === 'permintaan' && current === 'request') return true;
    if (id === 'request' && current === 'permintaan') return true;
    if (id === 'penerimaan' && current === 'receiving') return true;
    if (id === 'receiving' && current === 'penerimaan') return true;
    if (id === 'kartu_stok' && current === 'kartu-stok') return true;
    if (id === 'kartu-stok' && current === 'kartu_stok') return true;
    if (id === 'audit_log' && current === 'audit-log') return true;
    if (id === 'master_barang' && current === 'master-barang') return true;
    if (id === 'master_kategori' && current === 'master-kategori') return true;
    if (id === 'master_gudang' && current === 'master-gudang') return true;
    if (id === 'master_pegawai' && current === 'master-pegawai') return true;
    if (id === 'usulan_barang' && (current === 'usulan_barang' || current === 'usulan' || current === 'proposal')) return true;
    return false;
  };

  // Navigation Items Definitions
  const navSections = [
    {
      title: 'Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG', 'PEGAWAI'] },
        { 
          id: 'stock', 
          label: 'Stok Persediaan', 
          icon: Package, 
          roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG', 'PEGAWAI'],
          badge: lowStockCount > 0 ? `${lowStockCount} Kritis` : undefined,
          badgeColor: 'bg-amber-100 text-amber-800'
        },
      ]
    },
    {
      title: 'Logistik & Distribusi',
      items: [
        { id: 'request', label: 'Permintaan Barang', icon: FileText, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG', 'PEGAWAI'] },
        { id: 'usulan_barang', label: 'Usulan Barang Baru', icon: Lightbulb, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG', 'PEGAWAI'] },
        { 
          id: 'approval', 
          label: 'Approval Permintaan', 
          icon: CheckSquare, 
          roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'],
          badge: approvalCount > 0 ? `${approvalCount}` : undefined,
          badgeColor: 'bg-rose-500 text-white font-bold'
        },
        { 
          id: 'dropping', 
          label: 'Dropping / Distribusi', 
          icon: Truck, 
          roles: ['ADMIN', 'PIC_GUDANG_BESAR'],
          badge: pendingDroppingCount > 0 ? `${pendingDroppingCount}` : undefined,
          badgeColor: 'bg-amber-500 text-white font-bold'
        },
        { 
          id: 'receiving', 
          label: 'Penerimaan Dropping', 
          icon: Inbox, 
          roles: ['ADMIN', 'PIC_SUB_GUDANG'],
          badge: receivingCount > 0 ? `${receivingCount}` : undefined,
          badgeColor: 'bg-teal-600 text-white font-bold'
        },
        { id: 'mutasi', label: 'Mutasi Antar Gudang', icon: ArrowLeftRight, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'] },
        { id: 'opname', label: 'Stock Opname Fisik', icon: ClipboardCheck, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'] },
        { id: 'kartu_stok', label: 'Kartu Stok', icon: CreditCard, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'] },
      ]
    },
    {
      title: 'Dokumen & Laporan',
      items: [
        { id: 'bast', label: 'Dokumen BAST', icon: FileCheck2, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'] },
        { id: 'sbbk', label: 'Dokumen SBBK', icon: FileOutput, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'] },
        { id: 'laporan', label: 'Laporan Persediaan', icon: BarChart3, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'] },
      ]
    },
    {
      title: 'Master Data & Konfigurasi',
      items: [
        { id: 'master_barang', label: 'Master Barang', icon: Package, roles: ['ADMIN', 'PIC_GUDANG_BESAR'] },
        { id: 'master_kategori', label: 'Master Kategori', icon: Layers, roles: ['ADMIN'] },
        { id: 'master_gudang', label: 'Master Gudang', icon: Building2, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'] },
        { id: 'master_pegawai', label: 'Manajemen Pengguna & Akun', icon: Users, roles: ['ADMIN'] },
        { id: 'pengaturan', label: 'Pengaturan & GAS Sync', icon: Settings, roles: ['ADMIN'] },
        { id: 'audit_log', label: 'Log Aktivitas', icon: History, roles: ['ADMIN'] },
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 select-none">
      {/* Mobile Header if in Drawer */}
      <div className="flex md:hidden items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white font-bold text-xs">
            JJ
          </div>
          <span className="font-bold text-white text-sm">Menu SI JAJUL</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
        {navSections.map((section, sIdx) => {
          const visibleItems = section.items.filter(item => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx}>
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.id);
                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      onClick={() => {
                        onNavigate(item.id);
                        if (onClose) onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-teal-700 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-teal-500" />
          <span className="font-semibold text-slate-300">SI JAJUL • Puskesmas KSS</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
          Gudang: {currentUser?.tempatTugas || currentUser?.gudangNama || 'Kep. Seribu'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 h-[calc(100vh-4rem)] sticky top-16 select-none flex-shrink-0 border-r border-slate-800 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/70 backdrop-blur-xs flex">
          <div className="w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={onClose}></div>
        </div>
      )}
    </>
  );
};
