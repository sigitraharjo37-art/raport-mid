import React, { useState } from 'react';
import { SchoolInfo, Kelas, MataPelajaran, Siswa, SubjectConfig, NilaiRecord, PresensiCatatan, LegerRow } from '../types/rapor';
import { calculateLegger } from '../utils/storage';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  User,
  Sliders,
  Award,
  FileSpreadsheet,
  CheckCircle,
  Eye,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface RaporPrintViewProps {
  schoolInfo: SchoolInfo;
  kelasList: Kelas[];
  selectedKelasId: string;
  onSelectKelas: (kelasId: string) => void;
  mapelList: MataPelajaran[];
  siswaList: Siswa[];
  subjectConfigs: SubjectConfig[];
  scoresList: NilaiRecord[];
  presensiList: PresensiCatatan[];
}

export const RaporPrintView: React.FC<RaporPrintViewProps> = ({
  schoolInfo,
  kelasList,
  selectedKelasId,
  onSelectKelas,
  mapelList,
  siswaList,
  subjectConfigs,
  scoresList,
  presensiList,
}) => {
  const currentKelas = kelasList.find((k) => k.id === selectedKelasId) || kelasList[0];
  const currentSiswaList = siswaList.filter((s) => s.kelasId === selectedKelasId);
  const sortedMapel = [...mapelList].sort((a, b) => a.urutan - b.urutan);

  const [selectedSiswaId, setSelectedSiswaId] = useState<string>(currentSiswaList[0]?.id || '');
  const [printAllStudents, setPrintAllStudents] = useState<boolean>(false);
  const [showRankingOnReport, setShowRankingOnReport] = useState<boolean>(true);
  const [showTeacherOnReport, setShowTeacherOnReport] = useState<boolean>(true);

  // Compute calculated leger for ranking
  const calculatedRows = calculateLegger(
    selectedKelasId,
    siswaList,
    sortedMapel,
    subjectConfigs,
    scoresList
  );

  const currentSiswa = currentSiswaList.find((s) => s.id === selectedSiswaId) || currentSiswaList[0];
  const currentIndex = currentSiswaList.findIndex((s) => s.id === (currentSiswa?.id || ''));

  const handlePrevSiswa = () => {
    if (currentIndex > 0) {
      setSelectedSiswaId(currentSiswaList[currentIndex - 1].id);
    }
  };

  const handleNextSiswa = () => {
    if (currentIndex < currentSiswaList.length - 1) {
      setSelectedSiswaId(currentSiswaList[currentIndex + 1].id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportRaporExcel = () => {
    if (!currentKelas) return;
    const wb = XLSX.utils.book_new();

    // Export a summary worksheet for all students
    const summaryData: (string | number)[][] = [
      [schoolInfo.namaSekolah.toUpperCase()],
      [`REKAP LAPORAN HASIL ${schoolInfo.jenisRapor.toUpperCase()}`],
      [`KELAS: ${currentKelas.nama} | TAHUN AJARAN: ${schoolInfo.tahunAjaran} | SEMESTER: ${schoolInfo.semester}`],
      [],
      ['No', 'NIS', 'NISN', 'Nama Peserta Didik', 'L/P', ...sortedMapel.map((m) => m.kode), 'Total Nilai', 'Rata-rata', 'Peringkat', 'Sakit', 'Izin', 'Alpa', 'Catatan Wali Kelas'],
    ];

    calculatedRows.forEach((row, idx) => {
      const pres = presensiList.find((p) => p.siswaId === row.siswa.id) || { sakit: 0, izin: 0, alpa: 0, catatanWaliKelas: '' };
      summaryData.push([
        idx + 1,
        row.siswa.nis,
        row.siswa.nisn,
        row.siswa.nama,
        row.siswa.jenisKelamin,
        ...sortedMapel.map((m) => row.nilaiMapel[m.id] || 0),
        row.totalNilai,
        row.rataRata,
        row.ranking,
        pres.sakit,
        pres.izin,
        pres.alpa,
        pres.catatanWaliKelas,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, `Rapor_${currentKelas.nama}`);
    XLSX.writeFile(wb, `Rekap_Rapor_Kelas_${currentKelas.nama}.xlsx`);
  };

  // Helper to render one single report sheet for a given student
  const renderSingleReport = (siswa: Siswa, pageBreak: boolean = false) => {
    const studentLeger = calculatedRows.find((r) => r.siswa.id === siswa.id);
    const presensi = presensiList.find((p) => p.siswaId === siswa.id) || {
      sakit: 0,
      izin: 0,
      alpa: 0,
      catatanWaliKelas: 'Pertahankan motivasi belajar dan prestasimu.',
    };

    return (
      <div
        key={siswa.id}
        className={`bg-white p-8 md:p-12 text-black max-w-4xl mx-auto shadow-sm rounded-xl print:shadow-none print:rounded-none print:p-0 print:m-0 print:max-w-none ${
          pageBreak ? 'print-page-break mb-8 print:mb-0' : ''
        }`}
        style={{ fontFamily: 'Tinos, serif', minHeight: '270mm' }}
      >
        {/* KOP RESMI SEKOLAH */}
        <div className="border-b-[3px] border-black pb-2 mb-4 text-center relative">
          <div className="flex items-center justify-between">
            {/* Logo Kiri: Logo Kabupaten / Daerah */}
            <div className="w-20 h-20 flex items-center justify-center shrink-0">
              {schoolInfo.logoKabupaten ? (
                <img
                  src={schoolInfo.logoKabupaten}
                  alt="Logo Kabupaten"
                  className="max-w-[76px] max-h-[76px] object-contain"
                />
              ) : (
                <div className="w-16 h-16 flex flex-col items-center justify-center border-2 border-black rounded-full p-1 text-[9px] font-bold text-center leading-tight">
                  <span className="uppercase text-[8px]">PEMDA</span>
                  <span className="font-extrabold text-[9px]">DAERAH</span>
                </div>
              )}
            </div>

            {/* Teks KOP Tengah */}
            <div className="flex-1 px-4 text-center">
              <h1 className="text-base font-bold uppercase tracking-wider">
                PEMERINTAH DAERAH {schoolInfo.provinsi.toUpperCase()}
              </h1>
              <h2 className="text-sm font-bold uppercase">
                DINAS PENDIDIKAN DAN KEBUDAYAAN
              </h2>
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-950">
                {schoolInfo.namaSekolah}
              </h3>
              <p className="text-[11px] leading-tight mt-0.5">
                {schoolInfo.alamat} {schoolInfo.kabupatenKota} • NPSN: {schoolInfo.npsn}
              </p>
              <p className="text-[10px] leading-tight text-slate-700">
                Telp: {schoolInfo.telepon} | Email: {schoolInfo.email} | Web: {schoolInfo.website}
              </p>
            </div>

            {/* Logo Kanan: Logo Sekolah / Tut Wuri Handayani */}
            <div className="w-20 h-20 flex items-center justify-center shrink-0">
              {schoolInfo.logoSekolah ? (
                <img
                  src={schoolInfo.logoSekolah}
                  alt="Logo Sekolah"
                  className="max-w-[76px] max-h-[76px] object-contain"
                />
              ) : (
                <div className="w-16 h-16 flex flex-col items-center justify-center border-2 border-black rounded-full p-1 text-[9px] font-bold text-center leading-tight">
                  <span className="uppercase text-[8px]">TUT WURI</span>
                  <span className="font-extrabold text-[9px]">HANDAYANI</span>
                </div>
              )}
            </div>
          </div>
          <div className="border-b border-black mt-2"></div>
        </div>

        {/* JUDUL RAPOR */}
        <div className="text-center my-3">
          <h2 className="text-sm font-bold uppercase tracking-wide underline underline-offset-4">
            LAPORAN HASIL {schoolInfo.jenisRapor.toUpperCase()}
          </h2>
          <p className="text-xs font-semibold mt-1">
            TAHUN AJARAN {schoolInfo.tahunAjaran} — SEMESTER {schoolInfo.semester.toUpperCase()}
          </p>
        </div>

        {/* IDENTITAS PESERTA DIDIK */}
        <div className="text-xs mb-4 grid grid-cols-2 gap-x-8 gap-y-1 bg-slate-50/50 print:bg-transparent p-2.5 rounded-lg border border-slate-200 print:border-none print:p-0">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-36 font-semibold">Nama Peserta Didik</span>
              <span className="mr-2">:</span>
              <span className="font-bold uppercase">{siswa.nama}</span>
            </div>
            <div className="flex">
              <span className="w-36 font-semibold">NIS / NISN</span>
              <span className="mr-2">:</span>
              <span className="font-mono">{siswa.nis} / {siswa.nisn}</span>
            </div>
            <div className="flex">
              <span className="w-36 font-semibold">Jenis Kelamin</span>
              <span className="mr-2">:</span>
              <span>{siswa.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 font-semibold">Kelas / Rombel</span>
              <span className="mr-2">:</span>
              <span className="font-bold">{currentKelas.nama}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Fase / Kurikulum</span>
              <span className="mr-2">:</span>
              <span>{schoolInfo.kurikulum}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Wali Kelas</span>
              <span className="mr-2">:</span>
              <span>{currentKelas.waliKelas}</span>
            </div>
          </div>
        </div>

        {/* TABEL NILAI CAPAIAN HASIL BELAJAR */}
        <div className="mb-4">
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200 text-center font-bold">
                <th className="border border-black py-2 px-1 w-8">No</th>
                <th className="border border-black py-2 px-2 text-left">
                  Mata Pelajaran {showTeacherOnReport && <span className="font-normal text-[10px]">/ Guru Pengampu</span>}
                </th>
                <th className="border border-black py-2 px-1.5 w-14">KKTP</th>
                <th className="border border-black py-2 px-1.5 w-14">Nilai Akhir</th>
                <th className="border border-black py-2 px-1.5 w-14">Predikat</th>
                <th className="border border-black py-2 px-3 text-left">
                  Capaian Kompetensi / Deskripsi Pembelajaran
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMapel.map((mapel, mIdx) => {
                const cfg = subjectConfigs.find((c) => c.kelasId === selectedKelasId && c.mapelId === mapel.id);
                const rec = scoresList.find((r) => r.siswaId === siswa.id && r.mapelId === mapel.id);
                const kktpVal = cfg?.kktp ?? 75;
                const nilaiAkhir = rec?.nilaiAkhir ?? 0;
                const capaian = rec?.capaianKompetensi ?? '';

                // Predikat
                let predikat = 'C';
                if (nilaiAkhir >= 90) predikat = 'A';
                else if (nilaiAkhir >= 80) predikat = 'B';
                else if (nilaiAkhir >= kktpVal) predikat = 'C';
                else predikat = 'D';

                return (
                  <tr key={mapel.id} className="align-top">
                    <td className="border border-black py-1.5 px-1 text-center font-mono">
                      {mIdx + 1}
                    </td>
                    <td className="border border-black py-1.5 px-2">
                      <div className="font-bold">{mapel.nama}</div>
                      {showTeacherOnReport && cfg?.namaGuru && (
                        <div className="text-[10px] text-slate-600 italic">
                          Guru: {cfg.namaGuru}
                        </div>
                      )}
                    </td>
                    <td className="border border-black py-1.5 px-1 text-center font-mono">
                      {kktpVal}
                    </td>
                    <td className="border border-black py-1.5 px-1 text-center font-bold font-mono text-sm">
                      {nilaiAkhir || '-'}
                    </td>
                    <td className="border border-black py-1.5 px-1 text-center font-bold">
                      {predikat}
                    </td>
                    <td className="border border-black py-1.5 px-2.5 text-[11px] leading-relaxed">
                      {capaian || (
                        nilaiAkhir >= kktpVal
                          ? `Telah mencapai kriteria ketuntasan tujuan pembelajaran ${mapel.nama} dengan baik.`
                          : `Perlu peningkatan dan pendampingan materi ${mapel.nama}.`
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* REKAPITULASI NILAI & PERINGKAT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
          {/* Kolom 1: Ringkasan Nilai & Peringkat */}
          <div className="border border-black p-2.5 rounded print:rounded-none">
            <h4 className="font-bold uppercase text-[11px] border-b border-black pb-1 mb-2">
              Rekapitulasi Nilai & Peringkat
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Total Jumlah Nilai</span>
                <span className="font-mono font-bold">{studentLeger?.totalNilai || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Rata-Rata Nilai</span>
                <span className="font-mono font-bold text-sm">{studentLeger?.rataRata || 0}</span>
              </div>
              {showRankingOnReport && (
                <div className="flex justify-between font-bold pt-1 border-t border-dotted border-slate-400">
                  <span>Peringkat di Kelas</span>
                  <span className="font-black bg-slate-100 print:bg-transparent px-2 rounded">
                    Ke-{studentLeger?.ranking || 1} dari {currentSiswaList.length} siswa
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Kolom 2: Presensi Ketidakhadiran */}
          <div className="border border-black p-2.5 rounded print:rounded-none">
            <h4 className="font-bold uppercase text-[11px] border-b border-black pb-1 mb-2">
              Ketidakhadiran (Presensi)
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>1. Sakit (S)</span>
                <span className="font-mono font-semibold">{presensi.sakit} hari</span>
              </div>
              <div className="flex justify-between">
                <span>2. Izin (I)</span>
                <span className="font-mono font-semibold">{presensi.izin} hari</span>
              </div>
              <div className="flex justify-between">
                <span>3. Tanpa Keterangan (A)</span>
                <span className="font-mono font-semibold">{presensi.alpa} hari</span>
              </div>
            </div>
          </div>
        </div>

        {/* CATATAN WALI KELAS */}
        <div className="border border-black p-3 mb-6 rounded print:rounded-none text-xs">
          <span className="font-bold uppercase block mb-1">Catatan Wali Kelas:</span>
          <p className="italic text-[11px] leading-relaxed">
            "{presensi.catatanWaliKelas || 'Pertahankan motivasi belajar, kedisiplinan, dan terus tingkatkan prestasimu.'}"
          </p>
        </div>

        {/* TANDA TANGAN (SIGNATURES) */}
        <div className="text-xs print-avoid-break mt-6">
          <div className="text-right mb-4">
            <p>{schoolInfo.tempatTanggalRapor}</p>
          </div>

          <div className="grid grid-cols-3 text-center gap-4">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold">Orang Tua / Wali Peserta Didik</p>
              <div className="h-16"></div>
              <p className="font-bold">.........................................</p>
            </div>

            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold">Kepala Sekolah</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{schoolInfo.namaKepalaSekolah}</p>
              <p className="text-[10px]">NIP. {schoolInfo.nipKepalaSekolah}</p>
            </div>

            <div>
              <p>Wali Kelas,</p>
              <p className="font-semibold">Kelas {currentKelas.nama}</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{currentKelas.waliKelas}</p>
              <p className="text-[10px]">NIP. {currentKelas.nipWaliKelas}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden on Print) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs no-print space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Printer className="w-6 h-6 text-indigo-600" />
              <span>Cetak & Ekspor Rapor Tengah Semester</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Pratinjau lembar rapor peserta didik dengan format resmi, kop sekolah, tabel capaian, presensi, dan tanda tangan.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportRaporExcel}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition"
              title="Ekspor rekap rapor ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition"
              title="Cetak lembar rapor ke printer atau simpan sebagai file PDF"
            >
              <Printer className="w-4 h-4" />
              <span>{printAllStudents ? 'Cetak Semua Rapor (PDF)' : 'Cetak Rapor Siswa Ini (PDF)'}</span>
            </button>
          </div>
        </div>

        {/* Filters and Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Kelas Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Pilih Kelas:</label>
            <select
              value={selectedKelasId}
              onChange={(e) => {
                onSelectKelas(e.target.value);
                const firstStudent = siswaList.find((s) => s.kelasId === e.target.value);
                if (firstStudent) setSelectedSiswaId(firstStudent.id);
              }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-indigo-700"
            >
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Print: Single vs All */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Cakupan Cetak:</label>
            <select
              value={printAllStudents ? 'all' : 'single'}
              onChange={(e) => setPrintAllStudents(e.target.value === 'all')}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800"
            >
              <option value="single">Satu Siswa Terpilih Saja</option>
              <option value="all">Seluruh Siswa Kelas ({currentSiswaList.length} Rapor Sekaligus)</option>
            </select>
          </div>

          {/* Siswa Selector (if single) */}
          {!printAllStudents && (
            <div className="lg:col-span-2 flex items-end space-x-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Pilih Peserta Didik ({currentIndex + 1} dari {currentSiswaList.length}):
                </label>
                <select
                  value={selectedSiswaId}
                  onChange={(e) => setSelectedSiswaId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-800"
                >
                  {currentSiswaList.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      {idx + 1}. {s.nama} ({s.nis})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handlePrevSiswa}
                disabled={currentIndex <= 0}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                title="Siswa Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextSiswa}
                disabled={currentIndex >= currentSiswaList.length - 1}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                title="Siswa Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Display Toggles */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-600">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showRankingOnReport}
              onChange={(e) => setShowRankingOnReport(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Tampilkan Peringkat di Rapor</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showTeacherOnReport}
              onChange={(e) => setShowTeacherOnReport(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Tampilkan Nama Guru Pengampu per Mapel</span>
          </label>
        </div>
      </div>

      {/* Rapor Sheet Display */}
      {printAllStudents ? (
        <div className="space-y-8">
          {currentSiswaList.map((s) => renderSingleReport(s, true))}
        </div>
      ) : (
        currentSiswa ? renderSingleReport(currentSiswa, false) : (
          <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
            Tidak ada siswa ditemukan di kelas ini.
          </div>
        )
      )}
    </div>
  );
};
