import React, { useState } from 'react';
import { SchoolInfo, Guru, AuthUser } from '../types/rapor';
import {
  School,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface LoginPageProps {
  schoolInfo: SchoolInfo;
  guruList: Guru[];
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  schoolInfo,
  guruList,
  onLogin,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'guru'>('all');

  // Helper untuk membersihkan format nomor HP (hapus strip, spasi, format 62 ke 0)
  const normalizePhone = (str: string) => {
    return str.replace(/[\s\-\.\+]/g, '').replace(/^62/, '0');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const inputUser = username.trim();
    const inputPass = password.trim();

    if (!inputUser || !inputPass) {
      setErrorMsg('Harap isi username / no. HP dan kata sandi.');
      return;
    }

    // 1. Cek Login Admin: username 'Admin' (case-insensitive) & password 'Admin123'
    if (inputUser.toLowerCase() === 'admin' && inputPass === 'Admin123') {
      onLogin({
        role: 'admin',
        username: 'Admin',
        nama: 'Administrator Sekolah',
      });
      return;
    }

    // 2. Cek Login Guru umum: username 'Guru' (case-insensitive) & password 'Guru123'
    if (inputUser.toLowerCase() === 'guru' && inputPass === 'Guru123') {
      onLogin({
        role: 'guru',
        username: 'Guru',
        nama: 'Guru Mata Pelajaran',
      });
      return;
    }

    // 3. Cek Login Guru via No. HP dengan password '123123' atau 'Guru123'
    const normInput = normalizePhone(inputUser);
    const matchedGuru = guruList.find((g) => g.noHp && normalizePhone(g.noHp) === normInput);

    if (matchedGuru && (inputPass === '123123' || inputPass === 'Guru123')) {
      onLogin({
        role: 'guru',
        username: matchedGuru.noHp,
        nama: matchedGuru.nama,
        guruId: matchedGuru.id,
        noHp: matchedGuru.noHp,
      });
      return;
    }

    // 4. Jika memasukkan nomor HP apapun dengan password '123123'
    if (inputPass === '123123' && (normInput.startsWith('08') || /^\d{8,14}$/.test(normInput))) {
      onLogin({
        role: 'guru',
        username: inputUser,
        nama: `Guru (${inputUser})`,
        noHp: inputUser,
      });
      return;
    }

    // Gagal login
    setErrorMsg('Username atau kata sandi tidak sesuai. Periksa kembali data login Anda.');
  };

  // Quick Login Buttons
  const handleQuickLoginAdmin = () => {
    setUsername('Admin');
    setPassword('Admin123');
    setErrorMsg('');
  };

  const handleQuickLoginGuru = () => {
    setUsername('Guru');
    setPassword('Guru123');
    setErrorMsg('');
  };

  const handleQuickLoginGuruHp = (guru: Guru) => {
    setUsername(guru.noHp || '081234567890');
    setPassword('123123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header App Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white shadow-xl shadow-indigo-500/25 ring-4 ring-indigo-500/20 mb-1">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            e-Rapor STS / PTS
          </h1>
          <div className="flex items-center justify-center space-x-2 text-xs">
            <span className="font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {schoolInfo.kurikulum}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300 font-medium">
              TP {schoolInfo.tahunAjaran} ({schoolInfo.semester})
            </span>
          </div>
          <p className="text-xs text-indigo-200/80 font-medium max-w-sm mx-auto truncate">
            {schoolInfo.namaSekolah}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 text-slate-800 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <LogIn className="w-5 h-5 text-indigo-600" />
              <span>Masuk ke Akun Anda</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan akun <strong>Admin</strong> atau akun <strong>Guru</strong> untuk mengakses sistem penilaian rapor.
            </p>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 flex items-start space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Gagal Masuk:</span> {errorMsg}
              </div>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Input Username / No HP */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Username atau No. HP</span>
                <span className="text-[10px] text-slate-400 font-normal">Admin / Guru / No HP</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {username.startsWith('0') || /^\d+$/.test(username) ? (
                    <Phone className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <User className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Contoh: Admin, Guru, atau 081234567890"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Kata Sandi (Password)</span>
                <span className="text-[10px] text-slate-400 font-normal">Admin123 / Guru123 / 123123</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-indigo-600" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Aplikasi</span>
            </button>
          </form>

          {/* Panduan Akun & Quick Fill Demo */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pilihan Akses Masuk:</span>
              </span>
              <span className="text-[10px] text-slate-400">Klik untuk isi otomatis</span>
            </div>

            {/* Quick Login Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Akun Admin */}
              <button
                type="button"
                onClick={handleQuickLoginAdmin}
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-indigo-900 group-hover:text-indigo-700 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>User Admin</span>
                  </span>
                  <span className="text-[9px] bg-indigo-200 text-indigo-800 font-bold px-1.5 py-0.2 rounded">
                    Admin
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 leading-tight">
                  User: <code className="font-bold text-indigo-700">Admin</code>
                  <br />
                  Pass: <code className="font-bold text-indigo-700">Admin123</code>
                </div>
              </button>

              {/* Akun Guru */}
              <button
                type="button"
                onClick={handleQuickLoginGuru}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-900 group-hover:text-emerald-700 flex items-center space-x-1">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>User Guru</span>
                  </span>
                  <span className="text-[9px] bg-emerald-200 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                    Guru
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 leading-tight">
                  User: <code className="font-bold text-emerald-700">Guru</code>
                  <br />
                  Pass: <code className="font-bold text-emerald-700">Guru123</code>
                </div>
              </button>
            </div>

            {/* Panduan Login Guru No. HP */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Login Guru Menggunakan No. HP:</span>
              </div>
              <p className="text-[10.5px] text-slate-500 leading-relaxed">
                Guru dapat login langsung dengan <strong>No. HP</strong> terdaftar dan password <strong>123123</strong>.
              </p>

              {guruList && guruList.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 w-full">Contoh Guru Terdaftar:</span>
                  {guruList.slice(0, 3).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleQuickLoginGuruHp(g)}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-[10px] font-semibold text-slate-700 transition cursor-pointer flex items-center space-x-1"
                      title={`Klik untuk login sebagai ${g.nama}`}
                    >
                      <span className="text-emerald-600">●</span>
                      <span>{g.nama.split(' ')[0]} ({g.noHp || '0812..'})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Aplikasi e-Rapor STS/PTS • Kurikulum Merdeka</p>
        </div>
      </div>
    </div>
  );
};
