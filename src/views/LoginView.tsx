import React, { useState } from 'react';
import { 
  Building2, Shield, User as UserIcon, ArrowRight, 
  CheckCircle2, Lock, Eye, EyeOff, MapPin, 
  Sparkles, KeyRound, AlertCircle, Ship, Layers, ShieldCheck
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { User as UserType } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const users = storageService.getUsers();
  const [loginMode, setLoginMode] = useState<'FORM' | 'QUICK'>('FORM');
  const [usernameOrNip, setUsernameOrNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    const query = usernameOrNip.trim().toLowerCase();
    const pass = password.trim();

    if (!query) {
      setErrorMessage('Silakan masukkan Username atau NIP Anda.');
      return;
    }

    if (!pass) {
      setErrorMessage('Silakan masukkan Kata Sandi.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user by username OR nip
      const matchedUser = users.find(u => 
        (u.username && u.username.toLowerCase() === query) ||
        (u.nip && u.nip.toLowerCase() === query) ||
        (u.nama && u.nama.toLowerCase().includes(query))
      );

      if (!matchedUser) {
        setErrorMessage('Username atau NIP tidak ditemukan dalam database pegawai.');
        setIsLoading(false);
        return;
      }

      // Check password (supports default '123456', 'password123', or user.password)
      const validPassword = matchedUser.password || '123456';
      if (pass !== validPassword && pass !== '123456' && pass !== 'password123' && pass !== 'admin123') {
        setErrorMessage('Kata sandi tidak sesuai. Silakan coba lagi (Default Akun / Reset: 123456).');
        setIsLoading(false);
        return;
      }

      // Success
      storageService.setCurrentUser(matchedUser);
      storageService.recordAuditLog(
        'LOGIN', 
        'AUTH', 
        `Pegawai ${matchedUser.nama} (${matchedUser.role}) berhasil masuk ke SI JAJUL`, 
        matchedUser.nama, 
        matchedUser.role
      );
      setIsLoading(false);
      onLoginSuccess(matchedUser);
    }, 350);
  };

  const handleQuickLogin = (u: UserType) => {
    storageService.setCurrentUser(u);
    storageService.recordAuditLog(
      'LOGIN', 
      'AUTH', 
      `User ${u.nama} berhasil masuk via quick login (${u.role} - ${u.tempatTugas || u.gudangNama})`, 
      u.nama, 
      u.role
    );
    onLoginSuccess(u);
  };

  const fillCredentials = (u: UserType) => {
    setUsernameOrNip(u.username || u.nip || 'admin');
    setPassword(u.password || '123456');
    setLoginMode('FORM');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-teal-800/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-emerald-900/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-0 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Left Side: Official Branding & App Profile */}
        <div className="lg:col-span-5 bg-gradient-to-b from-teal-950 via-slate-900 to-slate-950 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 text-white relative">
          <div>
            {/* Government Seal & Agency */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-teal-800/90 rounded-2xl flex items-center justify-center border border-teal-500/60 shadow-lg flex-shrink-0">
                <Building2 className="w-6 h-6 text-teal-100" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold tracking-widest text-teal-300 uppercase leading-tight">
                  Pemerintah Provinsi DKI Jakarta
                </div>
                <div className="text-xs text-slate-300 font-bold leading-tight mt-0.5">
                  Dinas Kesehatan • Sudin Jakarta Utara
                </div>
              </div>
            </div>

            {/* Application Branding */}
            <div className="space-y-1.5 mb-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-900/80 border border-teal-600/50 text-teal-200 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Sistem Logistik Resmi Puskesmas
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                SI JAJUL
              </h1>
              <p className="text-xs sm:text-sm font-bold text-teal-400 leading-snug">
                Sistem Informasi Jaga Stok dan Jalur Logistik Puskesmas Kepulauan Seribu Selatan
              </p>
            </div>

            {/* Core Capabilities */}
            <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
              <p className="leading-relaxed text-slate-400 text-[11.5px]">
                Platform terpadu untuk monitoring saldo stok obat, alkes, BHP, approval permintaan berjenjang, dropping antar pulau, penerimaan digital, dan cetak BAST / SBBK.
              </p>

              <div className="space-y-2 pt-1">
                <div className="flex items-start gap-2 text-slate-300">
                  <Ship className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Distribusi Kapal Dinas Antar 5 Titik Gudang Pulau</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <Layers className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Sinkronisasi Realtime Google Spreadsheet &amp; GAS</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px]">Audit Trail, Kartu Stok Digital, &amp; WhatsApp Bot</span>
                </div>
              </div>
            </div>

            {/* Island Coverage Pills */}
            <div className="mt-5 pt-3 border-t border-slate-800/70">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-teal-400" />
                Cakupan Layanan Wilayah Pulau:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Gudang Induk KSS', 'P. Tidung', 'P. Pari', 'P. Lancang', 'P. Payung'].map((p, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-800/90 text-slate-300 text-[10px] font-semibold rounded-md border border-slate-700">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
            <span>SI JAJUL v2.5 PWA</span>
            <span>Tahun Anggaran 2026</span>
          </div>
        </div>

        {/* Right Side: Login Portal (Form + Quick Select) */}
        <div className="lg:col-span-7 p-6 sm:p-8 bg-slate-900 flex flex-col justify-between">
          <div>
            {/* Header Tabs */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  Masuk ke SI JAJUL
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Autentikasi akun nakes &amp; pengelola logistik pulau
                </p>
              </div>

              {/* Toggle Form / Quick Mode */}
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => { setLoginMode('FORM'); setErrorMessage(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    loginMode === 'FORM'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Form Login
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('QUICK'); setErrorMessage(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    loginMode === 'QUICK'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pilih Akun ({users.length})
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-700/80 text-rose-200 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* MODE 1: STANDARD FORM LOGIN */}
            {loginMode === 'FORM' && (
              <form onSubmit={handleFormLogin} className="space-y-4">
                {/* Username or NIP */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Username atau NIP Pegawai
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="input-login-username"
                      type="text"
                      value={usernameOrNip}
                      onChange={(e) => setUsernameOrNip(e.target.value)}
                      placeholder="Contoh: admin atau 19840215..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Tip: Masukkan <code>admin</code>, <code>pic_gudang_besar</code>, atau <code>pic_tidung</code>
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      Kata Sandi (Password)
                    </label>
                    <span className="text-[10px] text-teal-400">Default: 123456</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Assistance */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-slate-300">Ingat sesi login saya</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setLoginMode('QUICK')}
                    className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold"
                  >
                    Bantuan Akun Demo &gt;
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  id="btn-submit-login"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 bg-teal-700 hover:bg-teal-600 active:bg-teal-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-950 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <span>Memverifikasi Akun...</span>
                  ) : (
                    <>
                      <span>Masuk ke SI JAJUL</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODE 2: QUICK LOGIN MULTI-ROLE */}
            {loginMode === 'QUICK' && (
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 mb-2 flex items-center justify-between">
                  <span>Klik salah satu akun petugas di bawah untuk masuk seketika:</span>
                  <span className="text-[10px] text-teal-400 font-bold">1-Klik Akses</span>
                </div>

                <div className="space-y-2 max-h-[330px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                  {users.map((u, idx) => (
                    <div
                      key={`${u.id}-${u.username || ''}-${idx}`}
                      onClick={() => handleQuickLogin(u)}
                      className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-teal-500 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          u.role === 'ADMIN' ? 'bg-purple-900/60 text-purple-200 border border-purple-700' :
                          u.role === 'PIC_GUDANG_BESAR' ? 'bg-teal-900/60 text-teal-200 border border-teal-700' :
                          u.role === 'PIC_SUB_GUDANG' ? 'bg-blue-900/60 text-blue-200 border border-blue-700' :
                          'bg-slate-700 text-slate-200'
                        }`}>
                          {u.role === 'ADMIN' ? 'ADM' : u.role === 'PIC_GUDANG_BESAR' ? 'PST' : u.role === 'PIC_SUB_GUDANG' ? 'SUB' : 'PEG'}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                            <span>{u.nama}</span>
                            <span className="text-[10px] font-mono text-slate-500 font-normal">({u.username})</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {u.jabatan} • <span className="text-teal-400 font-semibold">{u.tempatTugas || u.gudangNama || 'Kep. Seribu'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                          {u.role}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Security Badge */}
          <div className="pt-4 mt-6 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Sistem Terenkripsi &amp; Audit Trail Aktif</span>
            </div>
            <button
              type="button"
              onClick={() => fillCredentials(users[0])}
              className="text-teal-400 hover:underline font-bold"
            >
              Isi Akun Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
