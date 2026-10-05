import React, { useState } from 'react';
import { SchoolInfo, Kelas, MataPelajaran, Siswa, SubjectConfig, NilaiRecord, LegerRow } from '../types/rapor';
import { calculateLegger } from '../utils/storage';
import { exportLeggerToExcel } from '../utils/excelExport';
import {
  Table2,
  FileSpreadsheet,
  Printer,
  Trophy,
  Medal,
  ArrowUpDown,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeggerViewProps {
  schoolInfo: SchoolInfo;
  kelasList: Kelas[];
  selectedKelasId: string;
  onSelectKelas: (kelasId: string) => void;
  mapelList: MataPelajaran[];
  siswaList: Siswa[];
  subjectConfigs: SubjectConfig[];
  scoresList: NilaiRecord[];
}

export const LeggerView: React.FC<LeggerViewProps> = ({
  schoolInfo,
  kelasList,
  selectedKelasId,
  onSelectKelas,
  mapelList,
  siswaList,
  subjectConfigs,
  scoresList,
}) => {
  const [sortBy, setSortBy] = useState<'ranking' | 'nis' | 'nama'>('ranking');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const currentKelas = kelasList.find((k) => k.id === selectedKelasId) || kelasList[0];
  const sortedMapel = [...mapelList].sort((a, b) => a.urutan - b.urutan);

  // Compute calculated leger rows (totals, averages, and ranks)
  const rawLegerRows = calculateLegger(
    selectedKelasId,
    siswaList,
    sortedMapel,
    subjectConfigs,
    scoresList
  );

  // Apply sorting
  const sortedRows = [...rawLegerRows].sort((a, b) => {
    if (sortBy === 'ranking') {
      return a.ranking - b.ranking;
    } else if (sortBy === 'nis') {
      return a.siswa.nis.localeCompare(b.siswa.nis);
    } else {
      return a.siswa.nama.localeCompare(b.siswa.nama);
    }
  });

  const displayedRows = sortedRows.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.siswa.nama.toLowerCase().includes(q) ||
      r.siswa.nis.toLowerCase().includes(q)
    );
  });

  // Calculate subject-level statistics for the bottom of the table
  const subjectStats: Record<string, { avg: number; max: number; min: number; tuntas: number; belum: number }> = {};
  sortedMapel.forEach((m) => {
    const cfg = subjectConfigs.find((c) => c.kelasId === selectedKelasId && c.mapelId === m.id);
    const kktp = cfg?.kktp ?? 75;
    const scores = rawLegerRows.map((r) => r.nilaiMapel[m.id] || 0).filter((v) => v > 0);

    if (scores.length > 0) {
      const sum = scores.reduce((a, b) => a + b, 0);
      const avg = parseFloat((sum / scores.length).toFixed(1));
      const max = Math.max(...scores);
      const min = Math.min(...scores);
      const tuntas = scores.filter((v) => v >= kktp).length;
      const belum = scores.length - tuntas;
      subjectStats[m.id] = { avg, max, min, tuntas, belum };
    } else {
      subjectStats[m.id] = { avg: 0, max: 0, min: 0, tuntas: 0, belum: 0 };
    }
  });

  // Class overall stats
  const allTotals = rawLegerRows.map((r) => r.totalNilai);
  const classAvgTotal = allTotals.length > 0 ? (allTotals.reduce((a, b) => a + b, 0) / allTotals.length).toFixed(1) : 0;
  const allAverages = rawLegerRows.map((r) => r.rataRata);
  const classAvgMean = allAverages.length > 0 ? (allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(1) : 0;

  // Top 3 students for podium / celebration
  const top1 = rawLegerRows.find((r) => r.ranking === 1);
  const top2 = rawLegerRows.find((r) => r.ranking === 2);
  const top3 = rawLegerRows.find((r) => r.ranking === 3);

  const handleCelebrate = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  const handleExportExcel = () => {
    if (!currentKelas) return;
    exportLeggerToExcel(schoolInfo, currentKelas, sortedMapel, subjectConfigs, sortedRows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Khusus Cetak / Ekspor PDF Leger: Kertas Ukuran F4 / Folio (330mm x 215mm) Landscape */}
      <style>{`
        @media print {
          @page {
            size: 330mm 215mm landscape !important;
            margin: 6mm 8mm 6mm 8mm !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            font-size: 8.5pt !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid black !important;
            padding: 2.5px 2px !important;
          }
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Top Banner and Filter Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Table2 className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Buku Leger Nilai ({schoolInfo.jenisRapor})
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Rekapitulasi lengkap seluruh mata pelajaran, total nilai, rata-rata, dan peringkat (ranking) otomatis kelas {currentKelas?.nama}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Kelas Selector */}
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 pl-2">Kelas:</span>
              <select
                value={selectedKelasId}
                onChange={(e) => onSelectKelas(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-indigo-700 shadow-xs focus:ring-2 focus:ring-indigo-500"
              >
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    Kelas {k.nama} ({k.waliKelas})
                  </option>
                ))}
              </select>
            </div>

            {/* Excel Export */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition"
              title="Unduh Buku Leger ke format Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            {/* Print / PDF button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition"
              title="Cetak atau Simpan Buku Leger ke PDF Ukuran Kertas F4 / Folio (330 x 215 mm) Posisi Landscape"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Leger (PDF F4 Landscape)</span>
            </button>
          </div>
        </div>

        {/* Top 3 Ranking Highlights */}
        {top1 && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Peringkat 3 Besar Kelas {currentKelas?.nama}</span>
              </h4>
              <button
                onClick={handleCelebrate}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                🎉 Beri Selamat
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Rank 1 */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-100/70 border border-amber-300 rounded-xl p-3.5 flex items-center space-x-3 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 font-black text-lg flex items-center justify-center shadow-md">
                  1
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1">
                    <Medal className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Peringkat 1</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm truncate">{top1.siswa.nama}</p>
                  <p className="text-xs text-amber-900 font-semibold">
                    Rata-rata: <span className="font-black">{top1.rataRata}</span> (Total: {top1.totalNilai})
                  </p>
                </div>
              </div>

              {/* Rank 2 */}
              {top2 && (
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-300 rounded-xl p-3.5 flex items-center space-x-3 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-800 font-black text-lg flex items-center justify-center shadow-md">
                    2
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Peringkat 2</span>
                    <p className="font-bold text-slate-900 text-sm truncate">{top2.siswa.nama}</p>
                    <p className="text-xs text-slate-700 font-semibold">
                      Rata-rata: <span className="font-black">{top2.rataRata}</span> (Total: {top2.totalNilai})
                    </p>
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {top3 && (
                <div className="bg-gradient-to-r from-amber-950/5 to-amber-900/10 border border-amber-600/30 rounded-xl p-3.5 flex items-center space-x-3 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-amber-600/40 text-amber-900 font-black text-lg flex items-center justify-center shadow-md">
                    3
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Peringkat 3</span>
                    <p className="font-bold text-slate-900 text-sm truncate">{top3.siswa.nama}</p>
                    <p className="text-xs text-slate-700 font-semibold">
                      Rata-rata: <span className="font-black">{top3.rataRata}</span> (Total: {top3.totalNilai})
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Sorting Bar (No-Print) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa di legger..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Urutkan:</span>
          </span>
          <div className="inline-flex rounded-xl bg-slate-200 p-1 text-xs font-medium text-slate-700">
            <button
              onClick={() => setSortBy('ranking')}
              className={`px-3 py-1 rounded-lg transition ${
                sortBy === 'ranking' ? 'bg-white font-bold text-indigo-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Peringkat (Rank)
            </button>
            <button
              onClick={() => setSortBy('nama')}
              className={`px-3 py-1 rounded-lg transition ${
                sortBy === 'nama' ? 'bg-white font-bold text-indigo-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Nama (A-Z)
            </button>
            <button
              onClick={() => setSortBy('nis')}
              className={`px-3 py-1 rounded-lg transition ${
                sortBy === 'nis' ? 'bg-white font-bold text-indigo-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              NIS
            </button>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY HEADER FOR LEGER */}
      <div className="hidden print-only mb-4 border-b pb-2">
        <div className="flex items-center justify-between">
          <div className="w-16 h-16 flex items-center justify-center shrink-0">
            {schoolInfo.logoKabupaten && (
              <img src={schoolInfo.logoKabupaten} alt="Logo Kabupaten" className="max-w-[60px] max-h-[60px] object-contain" />
            )}
          </div>
          <div className="flex-1 text-center px-4">
            <h1 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {schoolInfo.kopInstansi1 || 'PEMERINTAH KABUPATEN LOMBOK UTARA'}
            </h1>
            <h2 className="text-[11px] font-semibold text-slate-700">
              {(schoolInfo.kopInstansi2 || 'Dinas Pendidikan, Kebudayaan, Pemuda dan Olahraga (Dikbudpora)').replace(/\s*Kabupaten Lombok Utara\s*$/i, '')}
            </h2>
            <h3 className="text-base font-bold uppercase text-black mt-0.5">{schoolInfo.namaSekolah}</h3>
            <h4 className="text-xs font-bold uppercase">
              LEGER NILAI {schoolInfo.jenisRapor.toUpperCase()}
            </h4>
            <p className="text-[11px]">
              Tahun Ajaran {schoolInfo.tahunAjaran} • Semester {schoolInfo.semester} • Kurikulum {schoolInfo.kurikulum}
            </p>
          </div>
          <div className="w-16 h-16 flex items-center justify-center shrink-0">
            {schoolInfo.logoSekolah && (
              <img src={schoolInfo.logoSekolah} alt="Logo Sekolah" className="max-w-[60px] max-h-[60px] object-contain" />
            )}
          </div>
        </div>
        <div className="flex justify-between text-xs mt-2 pt-1 border-t border-dotted font-medium">
          <span>Kelas: <strong>{currentKelas?.nama}</strong></span>
          <span>Wali Kelas: <strong>{currentKelas?.waliKelas}</strong> (NIP. {currentKelas?.nipWaliKelas})</span>
          <span>Dicetak: {schoolInfo.tempatTanggalRapor}</span>
        </div>
      </div>

      {/* MAIN COMPREHENSIVE LEGER TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs print:border-black print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 print:bg-slate-200 print:text-black font-bold">
              {/* Row 1: Columns */}
              <tr>
                <th className="py-2.5 px-2 w-8 text-center border-r border-slate-200 print:border-black" rowSpan={2}>
                  No
                </th>
                <th className="py-2.5 px-2 w-16 text-center border-r border-slate-200 print:border-black" rowSpan={2}>
                  NIS
                </th>
                <th className="py-2.5 px-3 w-48 border-r border-slate-200 print:border-black" rowSpan={2}>
                  Nama Peserta Didik
                </th>
                <th className="py-2.5 px-1.5 w-8 text-center border-r border-slate-200 print:border-black" rowSpan={2}>
                  L/P
                </th>

                {/* Mapel Columns */}
                {sortedMapel.map((m) => (
                  <th
                    key={m.id}
                    className="py-2 px-2 text-center border-r border-slate-200 print:border-black min-w-[52px]"
                    title={m.nama}
                  >
                    <span className="font-bold">{m.kode}</span>
                  </th>
                ))}

                {/* Summaries */}
                <th className="py-2.5 px-2 text-center bg-indigo-50/70 text-indigo-900 border-r border-slate-200 print:border-black w-14 font-extrabold">
                  JUMLAH
                </th>
                <th className="py-2.5 px-2 text-center bg-indigo-50/70 text-indigo-900 border-r border-slate-200 print:border-black w-14 font-extrabold">
                  RATA²
                </th>
                <th className="py-2.5 px-2 text-center bg-amber-100/70 text-amber-950 border-r border-slate-200 print:border-black w-14 font-black">
                  RANK
                </th>
                <th className="py-2.5 px-2 text-center border-r border-slate-200 print:border-black w-12 text-emerald-800">
                  Tuntas
                </th>
                <th className="py-2.5 px-2 text-center w-12 text-rose-800">
                  Remed
                </th>
              </tr>

              {/* Row 2: KKTP */}
              <tr className="bg-slate-200/70 text-[10px] text-slate-600 print:bg-slate-100 print:text-black">
                {sortedMapel.map((m) => {
                  const cfg = subjectConfigs.find((c) => c.kelasId === selectedKelasId && c.mapelId === m.id);
                  const kktp = cfg?.kktp ?? 75;
                  return (
                    <th key={`kktp-${m.id}`} className="py-1 px-1 text-center border-r border-slate-200 print:border-black font-mono">
                      {kktp}
                    </th>
                  );
                })}
                <th className="py-1 px-1 text-center bg-indigo-100/70 border-r border-slate-200 print:border-black">-</th>
                <th className="py-1 px-1 text-center bg-indigo-100/70 border-r border-slate-200 print:border-black">-</th>
                <th className="py-1 px-1 text-center bg-amber-200/70 border-r border-slate-200 print:border-black">-</th>
                <th className="py-1 px-1 text-center border-r border-slate-200 print:border-black">-</th>
                <th className="py-1 px-1 text-center">-</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 print:divide-black">
              {displayedRows.map((row, idx) => {
                const isTop1 = row.ranking === 1;
                const isTop3 = row.ranking <= 3;

                return (
                  <tr
                    key={row.siswa.id}
                    className={`hover:bg-slate-50 transition ${
                      isTop1 ? 'bg-amber-50/40' : idx % 2 === 1 ? 'bg-slate-50/30' : ''
                    }`}
                  >
                    <td className="py-2 px-2 text-center text-slate-500 font-mono border-r border-slate-200 print:border-black">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-slate-600 border-r border-slate-200 print:border-black">
                      {row.siswa.nis}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-200 print:border-black whitespace-nowrap">
                      {row.siswa.nama}
                    </td>
                    <td className="py-2 px-1.5 text-center font-bold text-slate-600 border-r border-slate-200 print:border-black">
                      {row.siswa.jenisKelamin}
                    </td>

                    {/* Subject scores */}
                    {sortedMapel.map((m) => {
                      const cfg = subjectConfigs.find((c) => c.kelasId === selectedKelasId && c.mapelId === m.id);
                      const kktp = cfg?.kktp ?? 75;
                      const score = row.nilaiMapel[m.id] ?? 0;
                      const isUnder = score < kktp;

                      return (
                        <td
                          key={m.id}
                          className={`py-2 px-1 text-center font-mono border-r border-slate-200 print:border-black ${
                            isUnder
                              ? 'text-rose-600 font-bold bg-rose-50/50 print:bg-transparent'
                              : 'text-slate-800 font-medium'
                          }`}
                        >
                          {score || '-'}
                        </td>
                      );
                    })}

                    {/* Total */}
                    <td className="py-2 px-2 text-center font-bold text-slate-900 bg-indigo-50/40 border-r border-slate-200 print:border-black">
                      {row.totalNilai}
                    </td>

                    {/* Average */}
                    <td className="py-2 px-2 text-center font-black text-indigo-700 bg-indigo-50/40 border-r border-slate-200 print:border-black">
                      {row.rataRata}
                    </td>

                    {/* Ranking */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 print:border-black bg-amber-50/60">
                      {isTop3 ? (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                            row.ranking === 1
                              ? 'bg-amber-400 text-amber-950'
                              : row.ranking === 2
                              ? 'bg-slate-300 text-slate-900'
                              : 'bg-amber-600/30 text-amber-900'
                          }`}
                        >
                          {row.ranking}
                        </span>
                      ) : (
                        <span className="font-bold text-slate-700">{row.ranking}</span>
                      )}
                    </td>

                    {/* Tuntas Count */}
                    <td className="py-2 px-1 text-center font-bold text-emerald-700 border-r border-slate-200 print:border-black">
                      {row.jumlahTuntas}
                    </td>

                    {/* Belum Tuntas Count */}
                    <td className="py-2 px-1 text-center font-bold text-rose-600">
                      {row.jumlahBelumTuntas > 0 ? row.jumlahBelumTuntas : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Bottom Statistics Summary */}
            <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300 print:bg-slate-200 print:border-black">
              {/* Row 1: Rata-Rata Kelas */}
              <tr>
                <td colSpan={4} className="py-2 px-3 text-right border-r border-slate-300 print:border-black uppercase text-[11px]">
                  Rata-Rata Kelas
                </td>
                {sortedMapel.map((m) => (
                  <td key={`avg-${m.id}`} className="py-2 px-1 text-center font-mono border-r border-slate-300 print:border-black">
                    {subjectStats[m.id]?.avg ?? 0}
                  </td>
                ))}
                <td className="py-2 px-2 text-center border-r border-slate-300 print:border-black">{classAvgTotal}</td>
                <td className="py-2 px-2 text-center text-indigo-700 border-r border-slate-300 print:border-black">{classAvgMean}</td>
                <td className="py-2 px-2 text-center border-r border-slate-300 print:border-black">-</td>
                <td className="py-2 px-2 text-center border-r border-slate-300 print:border-black">-</td>
                <td className="py-2 px-2 text-center">-</td>
              </tr>

              {/* Row 2: Nilai Tertinggi */}
              <tr className="bg-emerald-50/50 text-emerald-900 print:bg-slate-100">
                <td colSpan={4} className="py-1.5 px-3 text-right border-r border-slate-300 print:border-black uppercase text-[11px]">
                  Nilai Tertinggi (Maks)
                </td>
                {sortedMapel.map((m) => (
                  <td key={`max-${m.id}`} className="py-1.5 px-1 text-center font-mono border-r border-slate-300 print:border-black">
                    {subjectStats[m.id]?.max ?? 0}
                  </td>
                ))}
                <td className="py-1.5 px-2 text-center border-r border-slate-300 print:border-black font-mono">
                  {allTotals.length > 0 ? Math.max(...allTotals) : 0}
                </td>
                <td className="py-1.5 px-2 text-center border-r border-slate-300 print:border-black font-mono">
                  {allAverages.length > 0 ? Math.max(...allAverages) : 0}
                </td>
                <td className="py-1.5 px-2 text-center border-r border-slate-300 print:border-black">1</td>
                <td className="py-1.5 px-2 text-center border-r border-slate-300 print:border-black">-</td>
                <td className="py-1.5 px-2 text-center">-</td>
              </tr>

              {/* Row 3: Nilai Terendah */}
              <tr className="bg-rose-50/50 text-rose-900 print:bg-slate-100">
                <td colSpan={4} className="py-1.5 px-3 text-right border-r border-slate-300 print:border-black uppercase text-[11px]">
                  Nilai Terendah (Min)
                </td>
                {sortedMapel.map((m) => (
                  <td key={`min-${m.id}`} className="py-1.5 px-1 text-center font-mono border-r border-slate-300 print:border-black">
                    {subjectStats[m.id]?.min ?? 0}
                  </td>
                ))}
                <td className="py-1.5 px-2 text-center border-r border-slate-300 print:border-black font-mono">
                  {allTotals.length > 0 ? Math.min(...allTotals) : 0}
                </td>
                <td className="py-1.5 px-2 text-center border-r border-slate-300 print:border-black font-mono">
                  {allAverages.length > 0 ? Math.min(...allAverages) : 0}
                </td>
                <td className="py-1.5 px-2 text-center border-r border-slate-300 print:border-black">
                  {rawLegerRows.length}
                </td>
                <td className="py-1.5 px-2 text-center border-r border-slate-300 print:border-black">-</td>
                <td className="py-1.5 px-2 text-center">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* PRINT-ONLY SIGNATURE SECTION */}
      <div className="hidden print-only mt-8 print-avoid-break">
        <div className="grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="h-16"></div>
            <p className="font-bold underline">{schoolInfo.namaKepalaSekolah}</p>
            <p>NIP. {schoolInfo.nipKepalaSekolah}</p>
          </div>

          <div>
            <p>{schoolInfo.tempatTanggalRapor}</p>
            <p className="font-bold">Wali Kelas {currentKelas?.nama}</p>
            <div className="h-16"></div>
            <p className="font-bold underline">{currentKelas?.waliKelas}</p>
            <p>NIP. {currentKelas?.nipWaliKelas}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
