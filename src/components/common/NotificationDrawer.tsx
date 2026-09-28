import React from 'react';
import { X, CheckCheck, Bell, MessageSquare, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { AppNotification } from '../../types';
import { storageService } from '../../services/storageService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onRefresh: () => void;
  onNavigate: (viewId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh,
  onNavigate
}) => {
  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    storageService.markAllNotificationsAsRead();
    onRefresh();
  };

  const handleItemClick = (notif: AppNotification) => {
    storageService.markNotificationAsRead(notif.id);
    onRefresh();
    if (notif.linkTarget) {
      onNavigate(notif.linkTarget);
      onClose();
    }
  };

  const generateWhatsAppLink = (notif: AppNotification) => {
    const text = encodeURIComponent(`*SI-GUDANG PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n📢 *${notif.judul}*\n${notif.pesan}\n\n_Waktu: ${notif.waktu}_\n_Sistem Informasi Stok Persediaan Puskesmas Kepulauan Seribu Selatan_`);
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  const getIcon = (type: AppNotification['tipe']) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'DANGER':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-800" />
            <h3 className="font-bold text-slate-800 text-base">Notifikasi Sistem</h3>
            <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-semibold">
              {notifications.filter(n => !n.dibaca).length} Baru
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleMarkAllRead}
              title="Tandai semua telah dibaca"
              className="p-1.5 text-xs text-slate-600 hover:text-teal-800 hover:bg-slate-200 rounded-lg flex items-center gap-1"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Tandai Dibaca</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tidak ada notifikasi saat ini.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 transition-colors hover:bg-slate-50 relative ${!notif.dibaca ? 'bg-teal-50/40' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(notif.tipe)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-sm font-semibold truncate ${!notif.dibaca ? 'text-teal-950 font-bold' : 'text-slate-800'}`}>
                        {notif.judul}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.waktu.slice(5, 16)}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.pesan}</p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      {notif.linkTarget ? (
                        <button
                          onClick={() => handleItemClick(notif)}
                          className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline"
                        >
                          Lihat Detail <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <div></div>
                      )}

                      {/* WhatsApp Share Button */}
                      <a
                        href={generateWhatsAppLink(notif)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded"
                        title="Teruskan pesan ke WhatsApp Petugas / Grup"
                      >
                        <MessageSquare className="w-3 h-3" /> WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
          Notifikasi Real-time Alur Distribusi Logistik
        </div>
      </div>
    </div>
  );
};
