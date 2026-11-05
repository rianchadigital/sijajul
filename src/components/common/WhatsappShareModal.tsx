import React, { useState } from 'react';
import { 
  Send, Copy, Check, ExternalLink, MessageSquare, 
  Users, User, Phone, CheckCircle2, X 
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { WhatsappBotService } from '../../services/whatsappBotService';

export interface WhatsappShareData {
  type: 'PERMINTAAN' | 'DROPPING';
  nomorDokumen: string;
  tanggal: string;
  namaPengaju: string;
  kontakPengaju?: string;
  gudangAsal: string;
  gudangTujuan: string;
  items: Array<{ namaBarang: string; jumlah: number; satuan: string }>;
  catatan?: string;
  deepLinkView: 'approval' | 'receiving' | 'request' | 'dropping';
  targetPhone?: string;
  targetRoleName?: string;
}

interface WhatsappShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: WhatsappShareData | null;
}

export const WhatsappShareModal: React.FC<WhatsappShareModalProps> = ({
  isOpen,
  onClose,
  shareData
}) => {
  const [targetType, setTargetType] = useState<'PIC' | 'GROUP' | 'CUSTOM'>('PIC');
  const [customPhone, setCustomPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSendingGateway, setIsSendingGateway] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen || !shareData) return null;

  const waConfig = storageService.getWhatsappConfig();
  const appOrigin = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const directLink = `${appOrigin}?view=${shareData.deepLinkView}`;

  // Build structured message
  const isPermintaan = shareData.type === 'PERMINTAAN';
  const titleHeader = isPermintaan 
    ? '📦 *NOTIFIKASI PERMINTAAN LOGISTIK BARU*'
    : '🚚 *NOTIFIKASI DROPPING & DISTRIBUSI LOGISTIK*';

  const itemsListText = shareData.items
    .map((item, idx) => `   ${idx + 1}. *${item.namaBarang}* : ${item.jumlah} ${item.satuan}`)
    .join('\n');

  const messageText = `${titleHeader}
*SI JAJUL - PUSKESMAS KEC. KEPULAUAN SERIBU SELATAN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 *No. Dokumen:* ${shareData.nomorDokumen}
📅 *Tanggal:* ${shareData.tanggal}
👤 *${isPermintaan ? 'Pemohon' : 'Petugas Pengirim'}:* ${shareData.namaPengaju}
🏢 *${isPermintaan ? 'Gudang Tujuan Permintaan' : 'Sub Gudang Penerima'}:* ${shareData.gudangTujuan}
${shareData.catatan ? `📝 *Keperluan / Catatan:* ${shareData.catatan}\n` : ''}
📋 *Daftar Barang:*
${itemsListText}

🔗 *Buka & Proses Langsung di Aplikasi SI JAJUL:*
${directLink}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Pesan otomatis dikirim melalui Sistem Informasi Jaga Stok dan Jalur Logistik_`;

  const getEffectivePhone = () => {
    if (targetType === 'PIC') {
      return shareData.targetPhone || waConfig.targetNumber || '';
    } else if (targetType === 'GROUP') {
      // Group sharing usually doesn't have an individual phone, sends text directly to WA share dialog
      return '';
    } else {
      return customPhone.trim();
    }
  };

  const cleanPhoneNumber = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return cleaned;
  };

  const handleOpenWhatsApp = () => {
    const rawPhone = getEffectivePhone();
    const phone = rawPhone ? cleanPhoneNumber(rawPhone) : '';
    const encodedText = encodeURIComponent(messageText);
    
    let waUrl = '';
    if (phone) {
      waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
    } else {
      waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    }

    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }
  };

  const handleCopyText = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(messageText);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (e) {
      console.warn('Gagal menyalin:', e);
    }
  };

  const handleSendViaGateway = async () => {
    const rawPhone = getEffectivePhone();
    const phone = rawPhone ? cleanPhoneNumber(rawPhone) : '';
    if (!phone) {
      setGatewayStatus({ success: false, message: 'Nomor WhatsApp tujuan wajib diisi untuk pengiriman otomatis via Gateway.' });
      return;
    }

    setIsSendingGateway(true);
    setGatewayStatus(null);
    try {
      const res = await WhatsappBotService.sendWhatsappMessage(phone, messageText, waConfig);
      setGatewayStatus({
        success: res.success,
        message: res.success 
          ? 'Notifikasi WhatsApp berhasil dikirim langsung ke penerima!' 
          : `Gagal kirim via gateway: ${res.message}`
      });
    } catch (err: any) {
      setGatewayStatus({
        success: false,
        message: err.message || 'Terjadi kesalahan saat memanggil API WhatsApp Gateway.'
      });
    } finally {
      setIsSendingGateway(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                Kirim Notifikasi via WhatsApp
              </h3>
              <p className="text-xs text-slate-500">
                Kirim link {isPermintaan ? 'permohonan' : 'dropping'} ke PIC atau WhatsApp Group agar segera dibuka.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Target Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Pilih Tujuan Pengiriman:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('PIC')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  targetType === 'PIC'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>PIC Terkait</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('GROUP')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  targetType === 'GROUP'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Group WA</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('CUSTOM')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  targetType === 'CUSTOM'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Nomor Lain</span>
              </button>
            </div>
          </div>

          {/* Conditional Input for Phone */}
          {targetType === 'PIC' && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Tujuan: {shareData.targetRoleName || 'Penanggung Jawab Gudang'}</span>
                <span className="text-slate-500">{shareData.targetPhone ? `Nomor: ${shareData.targetPhone}` : 'Nomor WhatsApp default sistem'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Otomatis
              </span>
            </div>
          )}

          {targetType === 'GROUP' && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-600">
              💡 <span className="font-semibold">Tips Group WA:</span> Klik tombol <strong>Buka WhatsApp</strong> di bawah untuk memilih Grup Logistik Puskesmas Anda di daftar obrolan WhatsApp.
            </div>
          )}

          {targetType === 'CUSTOM' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Masukkan Nomor WhatsApp Tujuan:
              </label>
              <input
                type="text"
                placeholder="Contoh: 081234567890"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
              />
            </div>
          )}

          {/* Message Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700">Preview Teks Pesan & Link:</span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Pesan'}</span>
              </button>
            </div>
            <div className="bg-slate-900 text-emerald-300 font-mono text-[11px] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto border border-slate-800">
              {messageText}
            </div>
          </div>

          {/* Gateway Status Toast */}
          {gatewayStatus && (
            <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
              gatewayStatus.success 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}>
              {gatewayStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : null}
              <span>{gatewayStatus.message}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2 justify-end">
          {waConfig.targetNumber && waConfig.apiKey && (
            <button
              type="button"
              disabled={isSendingGateway}
              onClick={handleSendViaGateway}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingGateway ? 'Mengirim...' : 'Kirim via Gateway API'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Buka WhatsApp Sekarang</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
