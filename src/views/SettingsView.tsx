import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Cloud, RefreshCw, 
  CheckCircle2, AlertCircle, Copy, Check, Download, Upload, RotateCcw, 
  FileCode2, MessageSquare, Send, Bot, 
  Sparkles, Image as ImageIcon, Trash2, Eye, ShieldCheck, 
  Layers, Rocket, Server, Globe, ExternalLink
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { gasService, generateGoogleAppsScriptCode } from '../services/gasService';
import { WhatsappBotService } from '../services/whatsappBotService';
import { User, GasConfig, WhatsappConfig, AppLogoConfig, BotChatMessage } from '../types';
import { KopSurat } from '../components/common/KopSurat';

interface SettingsViewProps {
  currentUser: User | null;
  onRefreshAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser: _currentUser, onRefreshAll }) => {
  const [activeTab, setActiveTab] = useState<'WHATSAPP_BOT' | 'LOGO_CONFIG' | 'GAS_CONFIG' | 'SCRIPT_CODE' | 'HOSTINGER_DEPLOY' | 'BACKUP'>('WHATSAPP_BOT');
  
  // GAS Config State
  const [gasConfig, setGasConfig] = useState<GasConfig>({
    webAppUrl: '',
    spreadsheetId: '',
    autoSync: true,
    lastSyncTime: '',
    status: 'OFFLINE'
  });

  // WhatsApp & Bot Config State
  const [waConfig, setWaConfig] = useState<WhatsappConfig>({
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
  });

  // Logo & Kop Surat Config State
  const [logoConfig, setLogoConfig] = useState<AppLogoConfig>({
    logoJayaRaya: '',
    logoKesehatan: '',
    namaPemprov: 'PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA',
    namaDinas: 'DINAS KESEHATAN',
    namaPuskesmas: 'PUSKESMAS KECAMATAN KEPULAUAN SERIBU SELATAN',
    alamatPuskesmas: 'Jl. Pantai Selatan No. 1, Pulau Tidung, Kepulauan Seribu Selatan, DKI Jakarta 14520',
    kontakPuskesmas: 'Telepon: (021) 6411234 | Email: puskesmas.kepseribuselatan@jakarta.go.id | Web: puskesmas-kss.jakarta.go.id'
  });

  // Bot Simulator Interactive State
  const [chatMessages, setChatMessages] = useState<BotChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'BOT',
      text: `👋 Halo! Saya *${storageService.getWhatsappConfig().botName || 'SI JAJUL Bot'}*, robot asisten otomatis untuk jaga stok dan informasi logistik Puskesmas Kepulauan Seribu Selatan.\n\nKetik nama barang (contoh: *paracetamol*, *kertas hvs*, *masker*) atau klik salah satu tombol cepat di bawah untuk mencoba!`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // General States
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [waTestAlertSent, setWaTestAlertSent] = useState<string | null>(null);

  // File Upload Refs
  const jayaRayaFileRef = useRef<HTMLInputElement>(null);
  const kesehatanFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGasConfig(gasService.getConfig());
    setWaConfig(storageService.getWhatsappConfig());
    setLogoConfig(storageService.getLogoConfig());
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isBotTyping]);

  // --- GAS HANDLERS ---
  const handleSaveGasConfig = (e: React.FormEvent) => {
    e.preventDefault();
    gasService.saveConfig(gasConfig);
    alert('Pengaturan integrasi Google Apps Script & Spreadsheet berhasil disimpan!');
  };

  const handleTestGasConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await gasService.testConnection(gasConfig.webAppUrl);
      setTestResult(res);
      if (res.success) {
        setGasConfig(prev => ({ ...prev, status: 'CONNECTED' }));
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Gagal tersambung ke endpoint GAS' });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncAllNow = async () => {
    setTesting(true);
    try {
      const res = await gasService.syncAllData();
      if (res.success) {
        setGasConfig(gasService.getConfig());
        onRefreshAll();
        alert('Sinkronisasi penuh dengan Google Spreadsheet BERHASIL!');
      } else {
        alert(`Sinkronisasi gagal: ${res.message}`);
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sinkronisasi');
    } finally {
      setTesting(false);
    }
  };

  const handlePullRealDataFromSheets = async () => {
    if (!gasConfig.webAppUrl) {
      alert('Masukkan URL Web App Google Apps Script terlebih dahulu.');
      return;
    }
    const confirmPull = confirm(
      'Tarik data real dari Google Spreadsheet?\n\n' +
      'Data master barang, saldo stok 5 gudang pulau, dan akun pegawai akan disinkronkan langsung dari isi Google Spreadsheet Anda.'
    );
    if (!confirmPull) return;

    setTesting(true);
    try {
      const res = await gasService.syncAllFromSheets();
      if (res.success) {
        setGasConfig(gasService.getConfig());
        onRefreshAll();
        alert(`✅ ${res.message}`);
      } else {
        alert(`Gagal menarik data: ${res.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message || 'Gagal koneksi ke Spreadsheet'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleClearDummyData = () => {
    const confirmClear = confirm(
      '⚠️ PERINGATAN BERSIHKAN DATA CONTOH / DUMMY:\n\n' +
      'Apakah Anda yakin ingin membersihkan data contoh (transaksi demo, dropping demo, dan barang contoh)?\n\n' +
      'Sistem akan dikosongkan agar data murni dan real berasal dari Google Spreadsheet Anda.'
    );
    if (!confirmClear) return;

    const res = storageService.clearDummyData(true);
    onRefreshAll();
    alert(res.message);
  };

  // --- WHATSAPP & BOT HANDLERS ---
  const handleSaveWaConfig = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveWhatsappConfig(waConfig);
    alert('Konfigurasi API WhatsApp & Robot Bot berhasil disimpan!');
  };

  const handleSendTestWhatsapp = async () => {
    if (!waConfig.targetNumber) {
      alert('Masukkan nomor WhatsApp tujuan terlebih dahulu.');
      return;
    }
    setTesting(true);
    setWaTestAlertSent(null);
    try {
      const sampleText = `🔔 *TES KONEKSI API WHATSAPP SI-GUDANG*\n\n` +
        `Puskesmas Kecamatan Kepulauan Seribu Selatan\n` +
        `Status: ✅ Gateway Terhubung\n` +
        `Provider: ${waConfig.provider}\n` +
        `Waktu: ${new Date().toLocaleString('id-ID')}\n\n` +
        `_Pesan ini dikirim secara otomatis dari modul pengaturan SI-GUDANG._`;

      const res = await WhatsappBotService.sendWhatsappMessage(waConfig.targetNumber, sampleText, waConfig);
      setWaTestAlertSent(res.message);
      setWaConfig(prev => ({
        ...prev,
        lastTestStatus: res.success ? 'SUCCESS' : 'FAILED',
        lastTestMessage: res.message,
        lastTestedAt: new Date().toISOString()
      }));
      storageService.saveWhatsappConfig({
        ...waConfig,
        lastTestStatus: res.success ? 'SUCCESS' : 'FAILED',
        lastTestMessage: res.message,
        lastTestedAt: new Date().toISOString()
      });
    } catch (err: any) {
      setWaTestAlertSent(`Gagal: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleBroadcastStockAlert = async () => {
    setTesting(true);
    setWaTestAlertSent(null);
    try {
      const res = await WhatsappBotService.broadcastLowStockAlert(waConfig);
      setWaTestAlertSent(res.message);
      alert(`Hasil Pengiriman Broadcast Alert: ${res.message}`);
    } catch (err: any) {
      alert(`Error broadcast: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSendBotMessage = (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;

    const userMsg: BotChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setIsBotTyping(true);

    setTimeout(() => {
      const botRes = WhatsappBotService.processStockQuery(text);
      const botMsg: BotChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'BOT',
        text: botRes.message,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, botMsg]);
      setIsBotTyping(false);
    }, 450);
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        id: `bot-${Date.now()}`,
        sender: 'BOT',
        text: `Percakapan telah direset. Silakan tanyakan stok barang seperti *paracetamol*, *stok kritis*, atau *stok tidung*.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // --- LOGO & KOP SURAT HANDLERS ---
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    logoType: 'JAYA_RAYA' | 'KESEHATAN'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (PNG, JPG, JPEG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (logoType === 'JAYA_RAYA') {
        const updated = { ...logoConfig, logoJayaRaya: base64Url };
        setLogoConfig(updated);
        storageService.saveLogoConfig(updated);
      } else {
        const updated = { ...logoConfig, logoKesehatan: base64Url };
        setLogoConfig(updated);
        storageService.saveLogoConfig(updated);
      }
      onRefreshAll();
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogoTexts = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveLogoConfig(logoConfig);
    onRefreshAll();
    alert('Pengaturan teks Kop Surat & Logo resmi berhasil diperbarui!');
  };

  const handleResetLogosToDefault = () => {
    if (confirm('Kembalikan logo Jaya Raya dan Logo Kesehatan ke setelan logo resmi standar?')) {
      const reseted = storageService.resetLogoConfig();
      setLogoConfig(reseted);
      onRefreshAll();
      alert('Logo telah dikembalikan ke logo resmi bawaan DKI Jakarta & Bakti Husada.');
    }
  };

  // --- BACKUP & RESTORE HANDLERS ---
  const handleDownloadBackup = () => {
    const jsonStr = storageService.exportAllDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_SiGudang_KSS_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = storageService.importAllDataJson(content);
        if (res.success) {
          onRefreshAll();
          setWaConfig(storageService.getWhatsappConfig());
          setLogoConfig(storageService.getLogoConfig());
          setGasConfig(gasService.getConfig());
          alert('Database berhasil dipulihkan dari file backup!');
        } else {
          alert(`Gagal memulihkan database: ${res.message}`);
        }
      } catch (err: any) {
        alert('File JSON tidak valid');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('PERINGATAN: Yakin ingin mereset seluruh database ke data awal bawaan sistem? Seluruh perubahan baru akan terhapus.')) {
      storageService.resetToInitialData();
      onRefreshAll();
      setWaConfig(storageService.getWhatsappConfig());
      setLogoConfig(storageService.getLogoConfig());
      setGasConfig(gasService.getConfig());
      alert('Data sistem telah direset ke setelan awal Puskesmas Kepulauan Seribu Selatan.');
    }
  };

  const googleAppsScriptCode = generateGoogleAppsScriptCode(gasConfig.spreadsheetId);

  const handleDownloadCodeGs = () => {
    const blob = new Blob([googleAppsScriptCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTriggerRemoteSetup = async () => {
    if (!gasConfig.webAppUrl) {
      alert('Silakan simpan URL Web App Google Apps Script terlebih dahulu pada tab "Google Apps Script & Spreadsheet".');
      setActiveTab('GAS_CONFIG');
      return;
    }
    setTesting(true);
    const res = await gasService.triggerRemoteDatabaseSetup(gasConfig.webAppUrl);
    setTesting(false);
    if (res.success) {
      alert(res.message);
    } else {
      alert(`Pemberitahuan: ${res.message}\n\nTip: Anda juga dapat menjalankan fungsi setupDatabase langsung di dalam menu Google Spreadsheet (📦 SI-GUDANG KSS > ⚡ 1. Setup & Inisialisasi Database Lengkap).`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-800" />
          Pengaturan Sistem & Integrasi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Konfigurasi API WhatsApp & Robot Chat Cek Stok, Upload Logo Instansi Resmi, Sinkronisasi Google Sheets, dan Cadangan Database.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('WHATSAPP_BOT')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'WHATSAPP_BOT'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          API WhatsApp & Robot Cek Stok
          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-extrabold">
            Bot AI
          </span>
        </button>

        <button
          onClick={() => setActiveTab('LOGO_CONFIG')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'LOGO_CONFIG'
              ? 'border-teal-800 text-teal-900 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-teal-700" />
          Upload Logo & Kop Surat Resmi
        </button>

        <button
          onClick={() => setActiveTab('GAS_CONFIG')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'GAS_CONFIG'
              ? 'border-teal-800 text-teal-900 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Cloud className="w-4 h-4 text-teal-700" />
          Google Apps Script & Spreadsheet
        </button>

        <button
          onClick={() => setActiveTab('SCRIPT_CODE')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'SCRIPT_CODE'
              ? 'border-teal-800 text-teal-900 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <FileCode2 className="w-4 h-4 text-teal-700" />
          Script Backend Code.gs
        </button>

        <button
          onClick={() => setActiveTab('HOSTINGER_DEPLOY')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'HOSTINGER_DEPLOY'
              ? 'border-blue-700 text-blue-900 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Rocket className="w-4 h-4 text-blue-600" />
          Deploy Hostinger &amp; GitHub
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full font-extrabold">
            Auto-Deploy
          </span>
        </button>

        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'BACKUP'
              ? 'border-teal-800 text-teal-900 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-teal-700" />
          Backup & Reset Data
        </button>
      </div>

      {/* TAB 1: WHATSAPP BOT & GATEWAY */}
      {activeTab === 'WHATSAPP_BOT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Configuration Form */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Konfigurasi Gateway WhatsApp
                    </h2>
                    <p className="text-xs text-slate-500">
                      Hubungkan gateway WhatsApp untuk bot tanya stok & notifikasi dropping otomatis
                    </p>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  waConfig.lastTestStatus === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                  {waConfig.lastTestStatus === 'SUCCESS' ? 'Gateway Aktif' : 'Mode Simulasi / Siap'}
                </div>
              </div>

              <form onSubmit={handleSaveWaConfig} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilihan Provider WhatsApp
                    </label>
                    <select
                      value={waConfig.provider}
                      onChange={(e) => {
                        const prov = e.target.value as any;
                        let defaultUrl = 'https://api.fonnte.com/send';
                        if (prov === 'WABLAS') defaultUrl = 'https://kudus.wablas.com/api/send-message';
                        if (prov === 'ULTRAMSG') defaultUrl = 'https://api.ultramsg.com/instance/messages/chat';
                        if (prov === 'GENERIC_WEBHOOK' || prov === 'CUSTOM') defaultUrl = '';
                        setWaConfig(prev => ({ ...prev, provider: prov, apiUrl: defaultUrl }));
                      }}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="FONNTE">Fonnte (Rekomendasi Indonesia)</option>
                      <option value="WABLAS">Wablas Gateway</option>
                      <option value="ULTRAMSG">UltraMsg WhatsApp API</option>
                      <option value="GENERIC_WEBHOOK">Custom Webhook / N8N / Node.js</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Robot Asisten (Bot)
                    </label>
                    <input
                      type="text"
                      value={waConfig.botName}
                      onChange={(e) => setWaConfig(prev => ({ ...prev, botName: e.target.value }))}
                      placeholder="Contoh: SiGudang Bot KSS"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Endpoint API Gateway
                  </label>
                  <input
                    type="url"
                    value={waConfig.apiUrl}
                    onChange={(e) => setWaConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                    placeholder="https://api.fonnte.com/send"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Endpoint pengiriman pesan API dari provider yang Anda gunakan.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    API Token / Authorization Key
                  </label>
                  <input
                    type="password"
                    value={waConfig.apiKey}
                    onChange={(e) => setWaConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Masukkan API Token / Secret Token dari Dashboard Gateway WA"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    *Jika dikosongkan, robot bot tetap berjalan lancar dalam <strong>Mode Simulasi & Simulator Chat Interaktif</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor WA Pengirim / Device ID
                    </label>
                    <input
                      type="text"
                      value={waConfig.senderNumber}
                      onChange={(e) => setWaConfig(prev => ({ ...prev, senderNumber: e.target.value }))}
                      placeholder="08123456789"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor WA Tujuan Alert (PIC / Group)
                    </label>
                    <input
                      type="text"
                      value={waConfig.targetNumber}
                      onChange={(e) => setWaConfig(prev => ({ ...prev, targetNumber: e.target.value }))}
                      placeholder="081298765432"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div className="text-xs font-bold text-slate-800">Fitur Otomatisasi Robot WhatsApp:</div>
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waConfig.botActive}
                      onChange={(e) => setWaConfig(prev => ({ ...prev, botActive: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span><strong>Aktifkan Robot Cek Stok:</strong> Merespons chat masuk untuk inquiry saldo barang seluruh pulau.</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waConfig.enableStockAlerts}
                      onChange={(e) => setWaConfig(prev => ({ ...prev, enableStockAlerts: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span><strong>Notifikasi Stok Kritis:</strong> Kirim alert WhatsApp otomatis saat saldo barang mencapai batas minimum.</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waConfig.enableDroppingAlerts}
                      onChange={(e) => setWaConfig(prev => ({ ...prev, enableDroppingAlerts: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span><strong>Notifikasi Dropping & BAST:</strong> Kirim info pengiriman logistik ke nomor PIC Sub Gudang tujuan.</span>
                  </label>
                </div>

                {waTestAlertSent && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{waTestAlertSent}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    Simpan Konfigurasi WA
                  </button>

                  <button
                    type="button"
                    onClick={handleSendTestWhatsapp}
                    disabled={testing}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-300 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    {testing ? 'Mengirim...' : 'Tes Kirim WA'}
                  </button>

                  <button
                    type="button"
                    onClick={handleBroadcastStockAlert}
                    disabled={testing}
                    className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-colors border border-amber-200 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Broadcast Alert Stok Kritis
                  </button>
                </div>
              </form>
            </div>

            {/* Webhook Guide Box */}
            <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Bot className="w-4 h-4" />
                <span>Format Perintah Robot WA untuk Staf & Nakes di Pulau:</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Staf di Puskesmas Kelurahan Pulau Tidung, Pustu Pari, Pustu Lancang, dan Pusling Payung dapat mengirim chat teks berikut ke nomor WhatsApp Bot untuk cek stok seketika:
              </p>
              <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] space-y-1.5 border border-slate-800 text-emerald-300">
                <div>💬 <strong>cek paracetamol</strong> ➔ Cek stok Paracetamol di semua pulau</div>
                <div>💬 <strong>stok kritis</strong> ➔ Lihat daftar obat/barang yang menipis</div>
                <div>💬 <strong>stok tidung</strong> ➔ Lihat stok lengkap di Sub Gudang Tidung</div>
                <div>💬 <strong>stok pari</strong> ➔ Lihat persediaan di Pustu Pari</div>
                <div>💬 <strong>bantuan</strong> ➔ Panduan format lengkap</div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Robot Chat Simulator */}
          <div className="lg:col-span-6 flex flex-col h-[650px] bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            {/* WA Header */}
            <div className="bg-emerald-800 px-4 py-3 text-white flex items-center justify-between border-b border-emerald-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white border border-white/30 relative">
                  <Bot className="w-5 h-5 text-white" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute bottom-0 right-0 border-2 border-emerald-800"></span>
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                    {waConfig.botName || 'Robot Cek Stok SI-GUDANG'}
                    <span className="px-1.5 py-0.2 bg-emerald-900/60 text-[10px] rounded font-mono">Simulasi WA</span>
                  </div>
                  <div className="text-[11px] text-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping"></span>
                    Online • Otomatis membalas stok real-time
                  </div>
                </div>
              </div>

              <button
                onClick={handleClearChat}
                className="text-xs text-emerald-200 hover:text-white px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-900 rounded-lg transition-colors"
                title="Bersihkan percakapan"
              >
                Reset Chat
              </button>
            </div>

            {/* Quick Action Suggestion Pills */}
            <div className="bg-slate-950/80 px-3 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 flex-shrink-0 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Contoh Cepat:
              </span>
              <button
                onClick={() => handleSendBotMessage('cek paracetamol')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-900 hover:text-emerald-300 text-slate-200 rounded-full whitespace-nowrap border border-slate-700 transition-colors"
              >
                💊 Cek Paracetamol
              </button>
              <button
                onClick={() => handleSendBotMessage('stok kritis')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-amber-900 hover:text-amber-300 text-slate-200 rounded-full whitespace-nowrap border border-slate-700 transition-colors"
              >
                ⚠️ Stok Kritis
              </button>
              <button
                onClick={() => handleSendBotMessage('cek kertas hvs')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-900 hover:text-emerald-300 text-slate-200 rounded-full whitespace-nowrap border border-slate-700 transition-colors"
              >
                📄 Kertas HVS
              </button>
              <button
                onClick={() => handleSendBotMessage('stok tidung')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-teal-900 hover:text-teal-300 text-slate-200 rounded-full whitespace-nowrap border border-slate-700 transition-colors"
              >
                🏝️ Stok Tidung
              </button>
              <button
                onClick={() => handleSendBotMessage('stok pari')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-teal-900 hover:text-teal-300 text-slate-200 rounded-full whitespace-nowrap border border-slate-700 transition-colors"
              >
                🏖️ Stok Pari
              </button>
              <button
                onClick={() => handleSendBotMessage('bantuan')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full whitespace-nowrap border border-slate-700 transition-colors"
              >
                ❓ Bantuan
              </button>
            </div>

            {/* WA Chat Body */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
            >
              {chatMessages.map((msg) => {
                const isUser = msg.sender === 'USER';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md space-y-1 ${
                        isUser
                          ? 'bg-[#005c4b] text-emerald-50 rounded-tr-none'
                          : 'bg-[#202c33] text-slate-200 rounded-tl-none border border-slate-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {/* Simple parser to render *bold* text in WhatsApp style */}
                        {msg.text.split('\n').map((line, lIdx) => (
                          <div key={lIdx} className="min-h-[1rem]">
                            {line.split(/(\*[^*]+\*|`[^`]+`)/g).map((part, pIdx) => {
                              if (part.startsWith('*') && part.endsWith('*')) {
                                return <strong key={pIdx} className="font-extrabold text-white">{part.slice(1, -1)}</strong>;
                              }
                              if (part.startsWith('`') && part.endsWith('`')) {
                                return <code key={pIdx} className="bg-black/30 px-1 py-0.5 rounded text-emerald-300 font-mono text-[11px]">{part.slice(1, -1)}</code>;
                              }
                              return <span key={pIdx}>{part}</span>;
                            })}
                          </div>
                        ))}
                      </div>
                      <div className={`text-[10px] text-right ${isUser ? 'text-emerald-200' : 'text-slate-400'} flex items-center justify-end gap-1`}>
                        <span>{msg.timestamp}</span>
                        {isUser && <span className="text-emerald-300 font-bold">✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isBotTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#202c33] text-slate-400 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-1.5 border border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-[11px] ml-1 text-slate-300">Robot sedang mengecek saldo gudang...</span>
                  </div>
                </div>
              )}
            </div>

            {/* WA Input Footer */}
            <div className="bg-[#202c33] p-3 border-t border-slate-800">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendBotMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ketik nama barang, contoh: cek paracetamol..."
                  className="flex-1 bg-[#2a3942] text-white text-xs px-4 py-2.5 rounded-full placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isBotTyping}
                  className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:bg-slate-700 text-white flex items-center justify-center transition-colors flex-shrink-0 shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD LOGO JAYA RAYA & LOGO KESEHATAN + KOP SURAT */}
      {activeTab === 'LOGO_CONFIG' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Upload Logo Instansi & Kop Surat Resmi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Upload Logo Jaya Raya (Pemprov DKI Jakarta) dan Logo Kesehatan (Bakti Husada / Puskesmas) untuk dokumen resmi BAST, SBBK, dan Kop Laporan
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetLogosToDefault}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Kembalikan Logo Bawaan
              </button>
            </div>

            {/* Two Logo Upload Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Logo Jaya Raya (DKI Jakarta) */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    1. Logo Jaya Raya (Prov. DKI Jakarta)
                  </div>
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
                    Kiri Kop Surat
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 p-2 shadow-inner">
                    {logoConfig.logoJayaRaya ? (
                      <img 
                        src={logoConfig.logoJayaRaya} 
                        alt="Logo Jaya Raya" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center text-xs text-slate-400">Belum ada logo</div>
                    )}
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <p className="text-xs text-slate-600">
                      Format: PNG, JPG, SVG, WebP. Disarankan gambar dengan latar belakang transparan / resolusi tajam.
                    </p>

                    <input 
                      type="file" 
                      ref={jayaRayaFileRef}
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'JAYA_RAYA')}
                      className="hidden" 
                    />

                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => jayaRayaFileRef.current?.click()}
                        className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Pilih File Logo
                      </button>

                      {logoConfig.logoJayaRaya && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...logoConfig, logoJayaRaya: '' };
                            setLogoConfig(updated);
                            storageService.saveLogoConfig(updated);
                            onRefreshAll();
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Logo Kesehatan (Bakti Husada / Puskesmas) */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    2. Logo Kesehatan / Puskesmas
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Kanan Kop Surat
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 p-2 shadow-inner">
                    {logoConfig.logoKesehatan ? (
                      <img 
                        src={logoConfig.logoKesehatan} 
                        alt="Logo Kesehatan" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center text-xs text-slate-400">Belum ada logo</div>
                    )}
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <p className="text-xs text-slate-600">
                      Logo Bakti Husada Kemenkes RI, Dinas Kesehatan DKI, atau lambang Puskesmas Kepulauan Seribu Selatan.
                    </p>

                    <input 
                      type="file" 
                      ref={kesehatanFileRef}
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'KESEHATAN')}
                      className="hidden" 
                    />

                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => kesehatanFileRef.current?.click()}
                        className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Pilih File Logo
                      </button>

                      {logoConfig.logoKesehatan && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...logoConfig, logoKesehatan: '' };
                            setLogoConfig(updated);
                            storageService.saveLogoConfig(updated);
                            onRefreshAll();
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kop Surat Text Form */}
            <form onSubmit={handleSaveLogoTexts} className="space-y-4 pt-4 border-t border-slate-200">
              <div className="text-xs sm:text-sm font-bold text-slate-800">
                Informasi & Identitas Teks Kop Surat Dokumen Resmi:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Pemerintah Provinsi
                  </label>
                  <input
                    type="text"
                    value={logoConfig.namaPemprov}
                    onChange={(e) => setLogoConfig(prev => ({ ...prev, namaPemprov: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none uppercase font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Dinas / Suku Dinas Kesehatan
                  </label>
                  <input
                    type="text"
                    value={logoConfig.namaDinas}
                    onChange={(e) => setLogoConfig(prev => ({ ...prev, namaDinas: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none uppercase font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Satuan Kerja / Puskesmas
                </label>
                <input
                  type="text"
                  value={logoConfig.namaPuskesmas}
                  onChange={(e) => setLogoConfig(prev => ({ ...prev, namaPuskesmas: e.target.value }))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none uppercase font-bold text-teal-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Lengkap Kantor / Pos Pulau
                  </label>
                  <input
                    type="text"
                    value={logoConfig.alamatPuskesmas}
                    onChange={(e) => setLogoConfig(prev => ({ ...prev, alamatPuskesmas: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kontak, Telepon, Email, & Website
                  </label>
                  <input
                    type="text"
                    value={logoConfig.kontakPuskesmas}
                    onChange={(e) => setLogoConfig(prev => ({ ...prev, kontakPuskesmas: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Simpan Perubahan Teks Kop Surat
              </button>
            </form>

            {/* Live Preview Section */}
            <div className="space-y-3 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Eye className="w-4 h-4 text-teal-700" />
                Live Preview Kop Surat Resmi (Tampilan BAST & SBBK):
              </div>
              <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 shadow-xs">
                <KopSurat />
                <div className="text-center text-slate-400 text-xs py-2 italic">
                  [Bagian isi dokumen Berita Acara Serah Terima / Surat Bukti Barang Keluar akan tercetak di bawah kop ini]
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE APPS SCRIPT CONFIG */}
      {activeTab === 'GAS_CONFIG' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Integrasi Google Apps Script (GAS)
                </h2>
                <p className="text-xs text-slate-500">
                  Sinkronisasi database barang, dropping, dan mutasi dengan Google Spreadsheet Anda secara gratis tanpa database berbayar.
                </p>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              gasConfig.status === 'CONNECTED' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-slate-100 text-slate-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${gasConfig.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              {gasConfig.status === 'CONNECTED' ? 'Tersambung (Online)' : 'Belum Terhubung'}
            </div>
          </div>

          <form onSubmit={handleSaveGasConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL Aplikasi Web Google Apps Script (Web App URL)
              </label>
              <input
                type="url"
                value={gasConfig.webAppUrl}
                onChange={(e) => setGasConfig({ ...gasConfig, webAppUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                URL yang didapatkan setelah melakukan deployment 'New Deployment' &gt; 'Web App' di Google Apps Script.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ID Google Spreadsheet (Opsional untuk Catatan)
              </label>
              <input
                type="text"
                value={gasConfig.spreadsheetId || ''}
                onChange={(e) => setGasConfig({ ...gasConfig, spreadsheetId: e.target.value })}
                placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none"
              />
            </div>

            <div className="pt-2 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 space-y-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gasConfig.autoSync}
                  onChange={(e) => setGasConfig({ ...gasConfig, autoSync: e.target.checked })}
                  className="rounded text-teal-800 focus:ring-teal-700 w-4 h-4 mt-0.5"
                />
                <div>
                  <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Aktifkan Sinkronisasi Otomatis Real-Time (Tanpa Perlu Klik Tombol)
                  </span>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    Setiap transaksi, permohonan usulan, dropping, atau penerimaan akan otomatis dikirim ke Google Spreadsheet. Aplikasi juga secara berkala mengecek dan memperbarui data terbaru di latar belakang secara mulus.
                  </p>
                </div>
              </label>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                testResult.success 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}</div>
                  <div className="text-[11px] mt-0.5">{testResult.message}</div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="submit"
                className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Simpan Pengaturan GAS
              </button>

              <button
                type="button"
                onClick={handleTestGasConnection}
                disabled={testing || !gasConfig.webAppUrl}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-300 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Menguji...' : 'Uji Koneksi'}
              </button>

              <button
                type="button"
                onClick={handlePullRealDataFromSheets}
                disabled={testing || !gasConfig.webAppUrl}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                title="Tarik data real dari Google Spreadsheet dan perbarui master barang serta stok"
              >
                <Download className="w-3.5 h-3.5" />
                Tarik Data Real dari Spreadsheet (Pull Real Data)
              </button>

              <button
                type="button"
                onClick={handleSyncAllNow}
                disabled={testing || !gasConfig.webAppUrl}
                className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition-colors border border-teal-200 flex items-center gap-1.5"
              >
                <Cloud className="w-3.5 h-3.5" />
                Kirim Data Lokal ke Spreadsheet (Push)
              </button>

              <button
                type="button"
                onClick={handleClearDummyData}
                className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-colors border border-amber-300 flex items-center gap-1.5"
                title="Bersihkan transaksi dummy/contoh agar data murni dari Spreadsheet"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                Bersihkan Seluruh Data Dummy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: SCRIPT CODE */}
      {activeTab === 'SCRIPT_CODE' && (
        <div className="space-y-6">
          {/* Header & Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Kode Backend Google Apps Script (Code.gs) & Setup Database
                  </h2>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                    v2.5.0 Auto-Setup
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Skrip otomatis untuk membuat 12 sheet database Google Spreadsheet, format warna Puskesmas, data awal 5 pulau, serta API sinkronisasi.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCodeGs}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-300 shadow-2xs"
                  title="Unduh file Code.gs"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  Unduh Code.gs
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(googleAppsScriptCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Kode'}
                </button>

                {gasConfig.webAppUrl && (
                  <button
                    type="button"
                    onClick={handleTriggerRemoteSetup}
                    disabled={testing}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Jalankan setupDatabase jarak jauh via Web App"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    {testing ? 'Memproses...' : 'Inisialisasi Database via API'}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Steps Banner */}
            <div className="bg-emerald-50/70 rounded-xl border border-emerald-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  1
                </div>
                <div>
                  <div className="font-bold text-emerald-950">Buka Spreadsheet & Apps Script</div>
                  <div className="text-emerald-800 text-[11px] mt-0.5">
                    Buat Google Spreadsheet baru, lalu klik <strong>Ekstensi &gt; Apps Script</strong>.
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  2
                </div>
                <div>
                  <div className="font-bold text-emerald-950">Tempel & Jalankan setupDatabase</div>
                  <div className="text-emerald-800 text-[11px] mt-0.5">
                    Paste kode di bawah ke <code className="font-mono bg-white/70 px-1 py-0.2 rounded">Code.gs</code>, pilih fungsi <strong className="font-mono">setupDatabase</strong> lalu klik <strong>Run ▶️</strong>.
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  3
                </div>
                <div>
                  <div className="font-bold text-emerald-950">Deploy Web App (Akses Anyone)</div>
                  <div className="text-emerald-800 text-[11px] mt-0.5">
                    Klik <strong>Deploy &gt; New Deployment &gt; Web App</strong>, pilih akses <strong>Anyone</strong>, lalu salin URL ke SI-GUDANG.
                  </div>
                </div>
              </div>
            </div>

            {/* 12 Tables Architecture Preview */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-700" />
                  12 Tabel Sheet yang Otomatis Dibuat oleh Fungsi <code className="text-teal-900 bg-teal-100 px-1 py-0.5 rounded">setupDatabase()</code>:
                </span>
                <span className="text-[11px] text-slate-500 font-normal">Format Resmi Puskesmas KSS</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px]">
                {[
                  { name: 'MASTER_BARANG', desc: 'Daftar obat, BHP, alkes, ATK' },
                  { name: 'GUDANG_PULAU', desc: '5 Gudang pulau KSS' },
                  { name: 'STOK_GUDANG', desc: 'Saldo & status kritis tiap pulau' },
                  { name: 'PERMINTAAN_BARANG', desc: 'Surat permintaan logistik' },
                  { name: 'DROPPING_LOGISTIK', desc: 'Distribusi kapal & ekspedisi' },
                  { name: 'TRANSAKSI_MUTASI', desc: 'Riwayat mutasi keluar/masuk' },
                  { name: 'DOKUMEN_BAST', desc: 'Berita acara serah terima' },
                  { name: 'DOKUMEN_SBBK', desc: 'Surat bukti barang keluar' },
                  { name: 'STOCK_OPNAME', desc: 'Hasil fisik opname berkala' },
                  { name: 'PENGGUNA_SISTEM', desc: 'Akun nakes & petugas pulau' },
                  { name: 'LOG_AKTIVITAS', desc: 'Audit trail log sistem' },
                  { name: 'CONFIG_SISTEM', desc: 'Kunci & variabel aplikasi' },
                ].map((t, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="font-bold text-teal-900 truncate font-mono text-[10px]">{t.name}</div>
                    <div className="text-slate-500 text-[10px] truncate">{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono text-slate-700 font-bold">📄 Code.gs (Google Apps Script)</span>
                <span>Ukuran: ~{Math.round(googleAppsScriptCode.length / 1024)} KB</span>
              </div>
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[520px] border border-slate-800 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                {googleAppsScriptCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DEPLOY HOSTINGER & GITHUB (FIX LAYAR BLANK & AUTO-DEPLOY) */}
      {activeTab === 'HOSTINGER_DEPLOY' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Otomatisasi Deployment GitHub ke Hostinger
                  </h2>
                  <p className="text-xs text-slate-500">
                    Solusi tuntas masalah tampilan blank ("ngeblenk") &amp; panduan deploy otomatis langsung tampil saat web diakses.
                  </p>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5 self-start sm:self-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Fix Blank Screen &amp; .htaccess Siap</span>
              </div>
            </div>

            {/* Diagnostic Alert Box */}
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 font-extrabold text-blue-950 text-sm">
                <AlertCircle className="w-4 h-4 text-blue-700" />
                <span>Penyebab Layar Blank ("Ngeblenk") di Hostinger &amp; Solusinya:</span>
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                Hosting standar Hostinger (Apache / LiteSpeed) tidak mengompilasi file TypeScript/React (<code>.tsx</code>) secara langsung. Jika Anda hanya menarik repositori Git ke <code>public_html/</code>, browser akan meminta <code>/src/main.tsx</code> dan memicu layar putih kosong (blank).
              </p>
              <div className="bg-white/80 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1.5 font-medium">
                <div>✅ <strong>Vite Base URL:</strong> Telah disetel ke <code>base: './'</code> agar aset CSS/JS dapat dimuat dari direktori mana pun tanpa error 404.</div>
                <div>✅ <strong>File .htaccess:</strong> Telah dibuat otomatis di <code>public/.htaccess</code> dan root untuk mendukung SPA routing Apache.</div>
                <div>✅ <strong>GitHub Actions Workflow:</strong> File <code>.github/workflows/deploy.yml</code> telah disiapkan untuk mengompilasi dan mengunggah otomatis ke Hostinger via FTP!</div>
              </div>
            </div>

            {/* Two Methods Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Method 1: GitHub Actions Auto Deploy */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[11px] font-extrabold rounded-full">
                      METODE 1 (OTOMATIS &amp; TERBAIK)
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold">GitHub Actions</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900">
                    Deploy Otomatis Setiap Kali Push ke GitHub
                  </h3>

                  <ol className="text-xs text-slate-600 space-y-2.5 list-decimal pl-4 leading-relaxed">
                    <li>
                      Buka <strong>hPanel Hostinger</strong> &gt; menu <strong>Akun FTP (FTP Accounts)</strong>. Catat <em>Host</em>, <em>Username</em>, dan <em>Password</em>.
                    </li>
                    <li>
                      Buka repositori Anda di <strong>GitHub</strong> &gt; klik <strong>Settings</strong> &gt; <strong>Secrets and variables</strong> &gt; <strong>Actions</strong>.
                    </li>
                    <li>
                      Klik <strong>New repository secret</strong> dan buat 3 variabel rahasia ini:
                      <div className="mt-1.5 bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[10px] space-y-1">
                        <div><strong className="text-amber-400">HOSTINGER_FTP_HOST</strong>: ftp.domainanda.com</div>
                        <div><strong className="text-amber-400">HOSTINGER_FTP_USER</strong>: u123456789</div>
                        <div><strong className="text-amber-400">HOSTINGER_FTP_PASSWORD</strong>: PasswordFTPAnda</div>
                      </div>
                    </li>
                    <li>
                      <strong>Selesai!</strong> Setiap kali Anda push commit ke GitHub, GitHub Actions otomatis menjalankan <code>npm run build</code> dan mengirimkan folder <code>dist/</code> ke Hostinger. Web Anda langsung tampil tanpa blank!
                    </li>
                  </ol>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <div className="text-[11px] text-slate-500">
                    File konfigurasi tersimpan di: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">.github/workflows/deploy.yml</code>
                  </div>
                </div>
              </div>

              {/* Method 2: Manual Upload Build dist */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-emerald-700 text-white text-[11px] font-extrabold rounded-full">
                      METODE 2 (CEPAT LANGSUNG)
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold">File Manager</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900">
                    Upload Hasil Build Folder "dist/" ke Hostinger
                  </h3>

                  <ol className="text-xs text-slate-600 space-y-2.5 list-decimal pl-4 leading-relaxed">
                    <li>
                      Jalankan perintah build di terminal proyek Anda:
                      <div className="mt-1 bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px]">
                        npm run build
                      </div>
                    </li>
                    <li>
                      Buka folder <strong>dist/</strong> yang dihasilkan.
                    </li>
                    <li>
                      Buka <strong>File Manager</strong> di hPanel Hostinger &gt; masuk ke folder <strong>public_html/</strong>.
                    </li>
                    <li>
                      Unggah seluruh file di dalam <code>dist/</code> (yaitu <code>index.html</code>, folder <code>assets/</code>, dan file <code>.htaccess</code>) langsung ke dalam <code>public_html/</code>.
                    </li>
                    <li>
                      Buka alamat web domain Anda. Aplikasi SI JAJUL langsung tampil sempurna!
                    </li>
                  </ol>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <div className="text-[11px] text-slate-500">
                    💡 Tips: Pastikan mengunggah <strong>isi yang ada di dalam dist</strong>, bukan foldernya sendiri.
                  </div>
                </div>
              </div>
            </div>

            {/* Apache .htaccess Preview */}
            <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Server className="w-4 h-4" />
                  <span>Konfigurasi Rewrite Rule (.htaccess) untuk Server Hostinger:</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">public/.htaccess</span>
              </div>
              <pre className="bg-slate-950 p-3.5 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed border border-slate-800">
{`<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`}
              </pre>
              <p className="text-[11px] text-slate-400">
                Aturan rewrite ini otomatis menyalurkan rute SPA (Single Page Application) ke <code>index.html</code>, sehingga saat pengguna me-refresh halaman seperti <code>/stok</code> atau <code>/usulan</code>, tidak akan muncul error 404 Not Found.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BACKUP & RESTORE */}
      {activeTab === 'BACKUP' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Cadangkan Database (Backup)</h3>
                <p className="text-xs text-slate-500">Unduh seluruh data aplikasi ke dalam format file JSON aman</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              File cadangan ini mencakup seluruh data pengguna, barang, saldo per gudang pulau, mutasi, BAST, SBBK, hingga konfigurasi logo & WhatsApp.
            </p>

            <button
              onClick={handleDownloadBackup}
              className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" /> Unduh File Cadangan (.JSON)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Pulihkan Data (Restore)</h3>
                <p className="text-xs text-slate-500">Unggah file cadangan JSON untuk memulihkan database</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pilih file cadangan JSON yang pernah Anda unduh sebelumnya. Seluruh data saat ini akan diselaraskan dengan file tersebut.
            </p>

            <label className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Pilih File Backup JSON</span>
              <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
            </label>
          </div>

          <div className="md:col-span-2 bg-rose-50 rounded-2xl border border-rose-200 p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-rose-900">Reset Database ke Data Awal Standar</h3>
                <p className="text-xs text-rose-700">Kembalikan seluruh data sistem ke kondisi awal bawaan Puskesmas Kepulauan Seribu Selatan</p>
              </div>
            </div>

            <p className="text-xs text-rose-800">
              Tindakan ini akan menghapus transaksi baru dan mengembalikan daftar 5 gudang pulau, barang medis/non-medis, dan akun bawaan standar.
            </p>

            <button
              onClick={handleResetData}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Reset Total Database
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
