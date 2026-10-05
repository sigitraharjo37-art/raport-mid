import React from 'react';
import { SchoolInfo, Kelas, MataPelajaran, Siswa, SubjectConfig, NilaiRecord } from '../types/rapor';
import { calculateLegger } from '../utils/storage';
import {
  GraduationCap,
  Users,
  BookOpen,
  Award,
  ArrowRight,
  FileEdit,
  Table2,
  Printer,
  Sparkles,
  School,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface DashboardViewProps {
  schoolInfo: SchoolInfo;
  kelasList: Kelas[];
  mapelList: MataPelajaran[];
  siswaList: Siswa[];
  subjectConfigs: SubjectConfig[];
  scoresList: NilaiRecord[];
  onNavigate: (tab: string) => void;
  onSelectKelas: (kelasId: string) => void;
  selectedKelasId: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  schoolInfo,
  kelasList,
  mapelList,
  siswaList,
  subjectConfigs,
  scoresList,
  onNavigate,
  onSelectKelas,
  selectedKelasId,
}) => {
  const currentKelas = kelasList.find((k) => k.id === selectedKelasId) || kelasList[0];
  const sortedMapel = [...mapelList].sort((a, b) => a.urutan - b.urutan);

  // Compute calculated leger for current class
  const legerRows = calculateLegger(
    currentKelas?.id || '',
    siswaList,
    sortedMapel,
    subjectConfigs,
    scoresList
  );

  const top5 = [...legerRows].sort((a, b) => a.ranking - b.ranking).slice(0, 5);

  // Calculate completion percentage
  const totalSlots = kelasList.length * mapelList.length;
  let filledSlots = 0;

  kelasList.forEach((k) => {
    const kSiswa = siswaList.filter((s) => s.kelasId === k.id);
    mapelList.forEach((m) => {
      const recs = scoresList.filter((r) => r.kelasId === k.id && r.mapelId === m.id);
      if (recs.length > 0 && recs.length >= kSiswa.length * 0.8) {
        filledSlots += 1;
      }
    });
  });

  const completionPercent = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  // Average score of current class
  const allAvg = legerRows.map((r) => r.rataRata);
  const classAvg = allAvg.length > 0 ? (allAvg.reduce((a, b) => a + b, 0) / allAvg.length).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-radial from-indigo-400 to-transparent pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sistem Informasi e-Rapor {schoolInfo.jenisRapor}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Selamat Datang di Portal Rapor
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-2 leading-relaxed">
            {schoolInfo.namaSekolah} • Tahun Ajaran {schoolInfo.tahunAjaran} ({schoolInfo.semester})
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Kepala Sekolah: <span className="text-white font-medium">{schoolInfo.namaKepalaSekolah}</span> | Wali Kelas Aktif: <span className="text-white font-medium">{currentKelas?.waliKelas}</span>
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => onNavigate('nilai')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              <FileEdit className="w-4 h-4" />
              <span>Input Nilai Siswa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigate('legger')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              <Table2 className="w-4 h-4 text-amber-400" />
              <span>Buku Leger & Peringkat</span>
            </button>

            <button
              onClick={() => onNavigate('rapor')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rapor Siswa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Siswa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Siswa</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{siswaList.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{kelasList.length} Rombel aktif</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Kelas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rombel / Kelas</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{kelasList.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Wali kelas terdaftar</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Mapel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mata Pelajaran</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{mapelList.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{schoolInfo.kurikulum}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Rata-Rata */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rata-Rata STS</p>
            <p className="text-2xl font-black text-indigo-700 mt-1">{classAvg}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Kelas {currentKelas?.nama}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Class Leaderboard & Subject Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Peringkat 5 Tertinggi Kelas {currentKelas?.nama}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Berdasarkan akumulasi nilai seluruh mata pelajaran</p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedKelasId}
                onChange={(e) => onSelectKelas(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-indigo-700"
              >
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    Kelas {k.nama}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onNavigate('legger')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
              >
                Lihat Semua &rarr;
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3 w-20 text-center">NIS</th>
                  <th className="py-2.5 px-3 w-24 text-center">Total Nilai</th>
                  <th className="py-2.5 px-3 w-24 text-center">Rata-Rata</th>
                  <th className="py-2.5 px-3 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {top5.map((row) => (
                  <tr key={row.siswa.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                          row.ranking === 1
                            ? 'bg-amber-400 text-amber-950'
                            : row.ranking === 2
                            ? 'bg-slate-200 text-slate-800'
                            : row.ranking === 3
                            ? 'bg-amber-600/30 text-amber-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.ranking}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {row.siswa.nama}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {row.siswa.nis}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {row.totalNilai}
                    </td>
                    <td className="py-3 px-3 text-center font-black text-indigo-700 text-sm">
                      {row.rataRata}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {row.jumlahTuntas} Tuntas
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Progress & Quick Shortcuts */}
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h4 className="font-bold text-slate-800 text-sm mb-1">Status Pengisian Nilai</h4>
            <p className="text-xs text-slate-500 mb-3">Tingkat kelengkapan input nilai seluruh rombel</p>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Kelengkapan Data</span>
                <span className="text-indigo-600">{completionPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {filledSlots} dari {totalSlots} mata pelajaran per kelas telah selesai diinput.
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
            <h4 className="font-bold text-slate-800 text-sm mb-2">Aksi Cepat</h4>

            <button
              onClick={() => onNavigate('nilai')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-left transition border border-slate-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                  <FileEdit className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Input Nilai</p>
                  <p className="text-[11px] text-slate-400">Isi Formatif, STS & KKTP</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>

            <button
              onClick={() => onNavigate('legger')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-left transition border border-slate-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <Table2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Buku Leger Nilai</p>
                  <p className="text-[11px] text-slate-400">Total, rata-rata & rank</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>

            <button
              onClick={() => onNavigate('rapor')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-amber-50 text-left transition border border-slate-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-amber-700">Cetak Rapor</p>
                  <p className="text-[11px] text-slate-400">PDF per siswa atau kelas</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
