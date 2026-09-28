import React, { useState } from 'react';
import { 
  Home, Package, FileText, CheckSquare, 
  Menu, X, Truck, Inbox, BarChart3, Settings, 
  Layers, Users, Building2, CreditCard, FileCheck2,
  FileOutput, ArrowLeftRight, ClipboardCheck, History
} from 'lucide-react';
import { User } from '../../types';

interface MobileNavProps {
  activeView?: string;
  currentView?: string;
  onNavigate: (viewId: string) => void;
  currentUser: User | null;
  pendingApprovalCount?: number;
  pendingApprovalsCount?: number;
  pendingDroppingCount?: number;
  pendingReceivingCount?: number;
  incomingDroppingsCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeView,
  currentView,
  onNavigate,
  currentUser,
  pendingApprovalCount = 0,
  pendingApprovalsCount = 0,
  pendingDroppingCount = 0,
  pendingReceivingCount = 0,
  incomingDroppingsCount = 0
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const current = activeView || currentView || 'dashboard';
  const role = currentUser?.role || 'PEGAWAI';

  const isPicOrAdmin = role === 'ADMIN' || role === 'PIC_GUDANG_BESAR';
  const isSubGudang = role === 'PIC_SUB_GUDANG';

  const approvalCount = pendingApprovalCount || pendingApprovalsCount || 0;
  const receivingCount = pendingReceivingCount || incomingDroppingsCount || 0;

  const isItemActive = (id: string) => {
    if (current === id) return true;
    if (id === 'stock' && current === 'stok') return true;
    if (id === 'request' && current === 'permintaan') return true;
    if (id === 'receiving' && current === 'penerimaan') return true;
    if (id === 'kartu_stok' && current === 'kartu-stok') return true;
    return false;
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'stock', label: 'Stok', icon: Package },
    { id: 'request', label: 'Permintaan', icon: FileText },
    { 
      id: isPicOrAdmin ? 'approval' : (isSubGudang ? 'receiving' : 'kartu_stok'), 
      label: isPicOrAdmin ? 'Approval' : (isSubGudang ? 'Penerimaan' : 'Kartu Stok'), 
      icon: isPicOrAdmin ? CheckSquare : (isSubGudang ? Inbox : CreditCard),
      badge: isPicOrAdmin ? approvalCount : (isSubGudang ? receivingCount : 0)
    }
  ];

  const drawerItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: Home, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG', 'PEGAWAI'] },
    { id: 'stock', label: 'Stok Persediaan', icon: Package, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG', 'PEGAWAI'] },
    { id: 'request', label: 'Permintaan Barang', icon: FileText, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG', 'PEGAWAI'] },
    { id: 'approval', label: 'Approval Permintaan', icon: CheckSquare, badge: approvalCount, roles: ['ADMIN', 'PIC_GUDANG_BESAR'] },
    { id: 'dropping', label: 'Dropping / Distribusi', icon: Truck, badge: pendingDroppingCount, roles: ['ADMIN', 'PIC_GUDANG_BESAR'] },
    { id: 'receiving', label: 'Penerimaan Dropping', icon: Inbox, badge: receivingCount, roles: ['ADMIN', 'PIC_SUB_GUDANG'] },
    { id: 'mutasi', label: 'Mutasi Antar Gudang', icon: ArrowLeftRight, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'] },
    { id: 'opname', label: 'Stock Opname Fisik', icon: ClipboardCheck, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'] },
    { id: 'kartu_stok', label: 'Kartu Stok', icon: CreditCard, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'] },
    { id: 'bast', label: 'Dokumen BAST', icon: FileCheck2, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'] },
    { id: 'sbbk', label: 'Dokumen SBBK', icon: FileOutput, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'] },
    { id: 'laporan', label: 'Laporan Persediaan', icon: BarChart3, roles: ['ADMIN', 'PIC_GUDANG_BESAR', 'PIC_SUB_GUDANG'] },
    { id: 'master_barang', label: 'Master Barang', icon: Package, roles: ['ADMIN', 'PIC_GUDANG_BESAR'] },
    { id: 'master_kategori', label: 'Master Kategori', icon: Layers, roles: ['ADMIN'] },
    { id: 'master_gudang', label: 'Master Gudang', icon: Building2, roles: ['ADMIN'] },
    { id: 'master_pegawai', label: 'Manajemen Pengguna & Akun', icon: Users, roles: ['ADMIN'] },
    { id: 'pengaturan', label: 'Pengaturan & GAS', icon: Settings, roles: ['ADMIN'] },
    { id: 'audit_log', label: 'Log Aktivitas', icon: History, roles: ['ADMIN'] },
  ];

  return (
    <>
      {/* Bottom Nav Bar (Mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = isItemActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 relative ${
                isActive ? 'text-teal-800 font-bold' : 'text-slate-500'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-800"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Semua Menu</span>
        </button>
      </nav>

      {/* Drawer for Mobile */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end md:hidden animate-in fade-in">
          <div className="bg-white rounded-t-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Semua Fitur SI JAJUL</h3>
                <p className="text-xs text-slate-500">Sistem Informasi Jaga Stok &amp; Logistik</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2.5">
              {drawerItems
                .filter(item => item.roles.includes(role))
                .map(item => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-colors ${
                        isActive
                          ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-teal-700' : 'text-slate-500'}`} />
                      <span className="truncate flex-1">{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
