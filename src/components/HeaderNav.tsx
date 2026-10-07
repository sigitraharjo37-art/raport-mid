import React, { useState } from 'react';
import { SchoolInfo, AuthUser } from '../types/rapor';
import { School, Settings, RotateCcw, Download, Upload, CheckCircle2, AlertCircle, LogOut, User } from 'lucide-react';

interface HeaderNavProps {
  schoolInfo: SchoolInfo;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenSchoolSettings: () => void;
  onResetData: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  schoolInfo,
  currentUser,
  onLogout,
  onOpenSchoolSettings,
  onResetData,
  onExportJson,
  onImportJson,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">e-Rapor STS / PTS</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {schoolInfo.kurikulum}
                </span>
                <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-semibold" title="Data tersimpan di Firebase Firestore dan otomatis sinkron antar perangkat">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Cloud Sync Aktif</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium truncate max-w-xs sm:max-w-md">
                {schoolInfo.namaSekolah} • TP {schoolInfo.tahunAjaran} ({schoolInfo.semester})
              </p>
            </div>
          </div>

          {/* Action Buttons & User Profile */}
          <div className="flex items-center space-x-2">
            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={onOpenSchoolSettings}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                  title="Pengaturan Data Sekolah & Kepala Sekolah"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Data Sekolah</span>
                </button>

                <button
                  onClick={onExportJson}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  title="Backup Data ke file JSON"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Backup</span>
                </button>

                <label className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer" title="Restore Data dari JSON">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Restore</span>
                  <input type="file" accept=".json" onChange={onImportJson} className="hidden" />
                </label>

                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium border border-rose-800/40 transition"
                  title="Reset ke Contoh Data Demo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Reset Demo</span>
                </button>
              </>
            )}

            {/* User Info Badge & Logout */}
            {currentUser && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-700">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white truncate max-w-[130px]">
                    {currentUser.nama}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase ${
                    currentUser.role === 'admin' ? 'text-indigo-400' : 'text-emerald-400'
                  }`}>
                    {currentUser.role === 'admin' ? 'Administrator' : 'Guru'}
                  </span>
                </div>
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    currentUser.role === 'admin'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  }`}
                  title={`${currentUser.nama} (${currentUser.role})`}
                >
                  {currentUser.role === 'admin' ? 'AD' : 'GU'}
                </span>

                {/* Logout Button */}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                    title="Keluar dari akun (Logout)"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Keluar</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-900">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Kembalikan ke Data Contoh (Demo)?</h3>
            <p className="text-sm text-slate-600 mt-2">
              Tindakan ini akan mereset data sekolah, kelas, mapel, siswa, dan seluruh nilai kembali ke contoh bawaan.
            </p>
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onResetData();
                  setShowConfirmReset(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
