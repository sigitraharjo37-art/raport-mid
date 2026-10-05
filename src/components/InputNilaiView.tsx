import React, { useState, useEffect } from 'react';
import { Kelas, MataPelajaran, Siswa, SubjectConfig, NilaiRecord, SchoolInfo, Guru } from '../types/rapor';
import { exportNilaiMapelToExcel } from '../utils/excelExport';
import {
  FileEdit,
  Save,
  Download,
  Upload,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Award,
  TrendingUp,
  Percent,
  FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface InputNilaiViewProps {
  schoolInfo: SchoolInfo;
  kelasList: Kelas[];
  mapelList: MataPelajaran[];
  siswaList: Siswa[];
  guruList?: Guru[];
  subjectConfigs: SubjectConfig[];
  scoresList: NilaiRecord[];
  onSaveScores: (records: NilaiRecord[]) => void;
  onSaveConfig: (config: SubjectConfig) => void;
}

export const InputNilaiView: React.FC<InputNilaiViewProps> = ({
  schoolInfo,
  kelasList,
  mapelList,
  siswaList,
  guruList = [],
  subjectConfigs,
  scoresList,
  onSaveScores,
  onSaveConfig,
}) => {
  const [selectedKelasId, setSelectedKelasId] = useState<string>(kelasList[0]?.id || '');
  const [selectedMapelId, setSelectedMapelId] = useState<string>(mapelList[0]?.id || '');

  // Current config for this class and subject
  const [namaGuru, setNamaGuru] = useState('');
  const [kktp, setKktp] = useState(75);
  const [bobotFormatif, setBobotFormatif] = useState(50);
  const [bobotSumatif, setBobotSumatif] = useState(50);
  const [deskripsiMapel, setDeskripsiMapel] = useState('');

  // Local state for scores of current class and subject
  const [localScores, setLocalScores] = useState<Record<string, { formatif: number; sumatif: number; akhir: number; capaian: string }>>({});
  const [isSavedToast, setIsSavedToast] = useState(false);

  const currentKelas = kelasList.find((k) => k.id === selectedKelasId) || kelasList[0];
  const currentMapel = mapelList.find((m) => m.id === selectedMapelId) || mapelList[0];
  const currentSiswa = siswaList.filter((s) => s.kelasId === selectedKelasId);

  // Komponen nilai yang aktif dari pengaturan periode tahun ajaran
  const showFormatif = schoolInfo.tampilkanFormatif ?? true;
  const showSumatif = schoolInfo.tampilkanSumatif ?? true;
  const isDualMode = showFormatif && showSumatif;

  // Rumus hitung nilai akhir berdasarkan mode 1 nilai atau 2 nilai
  const calculateAkhir = (fVal: number, sVal: number) => {
    if (showFormatif && showSumatif) {
      const sumBobot = (bobotFormatif + bobotSumatif) || 100;
      return Math.round((fVal * bobotFormatif + sVal * bobotSumatif) / sumBobot);
    } else if (showFormatif) {
      return fVal;
    } else {
      return sVal;
    }
  };

  // Load subject config and scores whenever kelas or mapel changes
  useEffect(() => {
    if (!selectedKelasId || !selectedMapelId) return;

    // Load config
    const conf = subjectConfigs.find((c) => c.kelasId === selectedKelasId && c.mapelId === selectedMapelId);
    if (conf) {
      setNamaGuru(conf.namaGuru || '');
      setKktp(conf.kktp ?? 75);
      setBobotFormatif(conf.bobotFormatif ?? 50);
      setBobotSumatif(conf.bobotSumatif ?? 50);
      setDeskripsiMapel(conf.deskripsiMapel || '');
    } else {
      setNamaGuru('');
      setKktp(75);
      setBobotFormatif(50);
      setBobotSumatif(50);
      setDeskripsiMapel('');
    }

    // Load scores
    const temp: Record<string, { formatif: number; sumatif: number; akhir: number; capaian: string }> = {};
    currentSiswa.forEach((s) => {
      const rec = scoresList.find((r) => r.siswaId === s.id && r.mapelId === selectedMapelId);
      if (rec) {
        const fVal = rec.nilaiFormatif;
        const sVal = rec.nilaiSumatif;
        temp[s.id] = {
          formatif: fVal,
          sumatif: sVal,
          akhir: calculateAkhir(fVal, sVal),
          capaian: rec.capaianKompetensi,
        };
      } else {
        temp[s.id] = {
          formatif: 75,
          sumatif: 75,
          akhir: 75,
          capaian: '',
        };
      }
    });
    setLocalScores(temp);
  }, [selectedKelasId, selectedMapelId, subjectConfigs, scoresList, siswaList, showFormatif, showSumatif, bobotFormatif, bobotSumatif]);

  // Recalculate akhir when formatif or sumatif changes
  const handleScoreChange = (siswaId: string, field: 'formatif' | 'sumatif', val: number) => {
    const clampedVal = Math.max(0, Math.min(100, val || 0));
    setLocalScores((prev) => {
      const current = prev[siswaId] || { formatif: 75, sumatif: 75, akhir: 75, capaian: '' };
      const nextFormatif = field === 'formatif' ? clampedVal : current.formatif;
      const nextSumatif = field === 'sumatif' ? clampedVal : current.sumatif;
      const calculatedAkhir = calculateAkhir(nextFormatif, nextSumatif);

      return {
        ...prev,
        [siswaId]: {
          ...current,
          [field]: clampedVal,
          akhir: calculatedAkhir,
        },
      };
    });
  };

  const handleCapaianChange = (siswaId: string, val: string) => {
    setLocalScores((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        capaian: val,
      },
    }));
  };

  // Auto-generate realistic capaian text based on KKTP, score, and input deskripsi materi
  const handleGenerateDeskripsiAll = () => {
    if (!currentMapel) return;
    const mapelName = currentMapel.nama;
    const materiText = deskripsiMapel.trim() || `materi pokok dan capaian pembelajaran ${mapelName}`;

    setLocalScores((prev) => {
      const updated = { ...prev };
      currentSiswa.forEach((s) => {
        const item = updated[s.id];
        if (!item) return;
        const akhir = item.akhir;
        let text = '';
        if (akhir >= 92) {
          text = `Menunjukkan penguasaan kompetensi yang sangat istimewa dalam ${materiText}, mampu berpikir kritis dan mandiri.`;
        } else if (akhir >= 85) {
          text = `Menunjukkan pemahaman yang sangat baik dalam menguasai ${materiText}.`;
        } else if (akhir >= kktp) {
          text = `Mencapai kriteria ketuntasan tujuan pembelajaran dengan baik dalam ${materiText}.`;
        } else {
          text = `Perlu bimbingan dan pendampingan intensif dalam memahami konsep dasar ${materiText}.`;
        }
        updated[s.id] = { ...item, capaian: text };
      });
      return updated;
    });
  };

  const handleSaveAll = () => {
    // 1. Save Config
    const newConfig: SubjectConfig = {
      kelasId: selectedKelasId,
      mapelId: selectedMapelId,
      namaGuru: namaGuru.trim(),
      kktp: Number(kktp) || 75,
      bobotFormatif: Number(bobotFormatif) || 50,
      bobotSumatif: Number(bobotSumatif) || 50,
      deskripsiMapel: deskripsiMapel.trim(),
    };
    onSaveConfig(newConfig);

    // 2. Prepare scores to save
    const otherScores = scoresList.filter(
      (r) => !(r.kelasId === selectedKelasId && r.mapelId === selectedMapelId)
    );

    const updatedThisMapelScores: NilaiRecord[] = currentSiswa.map((s) => {
      const entry = localScores[s.id] || { formatif: 75, sumatif: 75, akhir: 75, capaian: '' };
      return {
        id: `nr-${s.id}-${selectedMapelId}`,
        siswaId: s.id,
        mapelId: selectedMapelId,
        kelasId: selectedKelasId,
        nilaiFormatif: entry.formatif,
        nilaiSumatif: entry.sumatif,
        nilaiAkhir: entry.akhir,
        capaianKompetensi: entry.capaian,
      };
    });

    onSaveScores([...otherScores, ...updatedThisMapelScores]);

    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const handleExportExcel = () => {
    if (!currentKelas || !currentMapel) return;
    const cfg: SubjectConfig = {
      kelasId: selectedKelasId,
      mapelId: selectedMapelId,
      namaGuru,
      kktp,
      bobotFormatif,
      bobotSumatif,
    };
    const records = currentSiswa.map((s) => {
      const e = localScores[s.id] || { formatif: 0, sumatif: 0, akhir: 0, capaian: '' };
      return {
        id: `nr-${s.id}-${selectedMapelId}`,
        siswaId: s.id,
        mapelId: selectedMapelId,
        kelasId: selectedKelasId,
        nilaiFormatif: e.formatif,
        nilaiSumatif: e.sumatif,
        nilaiAkhir: e.akhir,
        capaianKompetensi: e.capaian,
      };
    });
    exportNilaiMapelToExcel(schoolInfo, currentKelas, currentMapel, cfg, currentSiswa, records);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Find header row containing NIS or Nama Siswa
        let headerIdx = -1;
        for (let i = 0; i < rows.length; i++) {
          if (rows[i] && rows[i].some((cell) => String(cell).toLowerCase().includes('nis'))) {
            headerIdx = i;
            break;
          }
        }

        if (headerIdx === -1) {
          alert('Format Excel tidak valid. Pastikan ada kolom NIS dan Nilai.');
          return;
        }

        const headers = rows[headerIdx].map((h) => String(h).toLowerCase().trim());
        const nisCol = headers.findIndex((h) => h.includes('nis') && !h.includes('nisn'));
        const fCol = headers.findIndex((h) => h.includes('formatif') || h.includes('tugas'));
        const sCol = headers.findIndex((h) => h.includes('sumatif') || h.includes('sts') || h.includes('uts'));
        const akhirCol = headers.findIndex((h) => h.includes('akhir'));
        const capCol = headers.findIndex((h) => h.includes('capaian') || h.includes('deskripsi'));

        setLocalScores((prev) => {
          const updated = { ...prev };
          for (let i = headerIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            const nis = String(row[nisCol] || '').trim();
            const targetSiswa = currentSiswa.find((s) => s.nis === nis);
            if (targetSiswa) {
              const f = fCol !== -1 && row[fCol] !== undefined ? Number(row[fCol]) : 75;
              const s = sCol !== -1 && row[sCol] !== undefined ? Number(row[sCol]) : 75;
              const a = akhirCol !== -1 && row[akhirCol] !== undefined ? Number(row[akhirCol]) : Math.round((f + s) / 2);
              const cap = capCol !== -1 ? String(row[capCol] || '') : '';

              updated[targetSiswa.id] = {
                formatif: Math.min(100, Math.max(0, f)),
                sumatif: Math.min(100, Math.max(0, s)),
                akhir: Math.min(100, Math.max(0, a)),
                capaian: cap,
              };
            }
          }
          return updated;
        });

        alert('Berhasil mengimpor nilai dari Excel! Klik "Simpan Nilai" untuk menyimpan permanen.');
      } catch (err) {
        alert('Gagal membaca file Excel. Harap periksa format file.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Quick statistics calculation
  const allFinalScores = currentSiswa.map((s) => localScores[s.id]?.akhir || 0);
  const averageScore = allFinalScores.length > 0 ? (allFinalScores.reduce((a, b) => a + b, 0) / allFinalScores.length).toFixed(1) : 0;
  const maxScore = allFinalScores.length > 0 ? Math.max(...allFinalScores) : 0;
  const minScore = allFinalScores.length > 0 ? Math.min(...allFinalScores) : 0;
  const tuntasCount = allFinalScores.filter((v) => v >= kktp).length;
  const tuntasPercent = allFinalScores.length > 0 ? Math.round((tuntasCount / allFinalScores.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <FileEdit className="w-6 h-6 text-indigo-600" />
              <span>Input Nilai Mata Pelajaran</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Pilih kelas dan mata pelajaran, sesuaikan nama guru dan KKTP, lalu masukkan nilai formatif dan sumatif siswa.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateDeskripsiAll}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition border border-indigo-200"
              title="Buat deskripsi capaian otomatis untuk semua siswa sesuai KKTP"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Auto Deskripsi</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition border border-emerald-200"
              title="Unduh template / nilai saat ini ke Excel"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            <label
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              title="Impor nilai dari file Excel"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Impor Excel</span>
              <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
            </label>

            <button
              onClick={handleSaveAll}
              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSavedToast ? 'Tersimpan!' : 'Simpan Nilai'}</span>
            </button>
          </div>
        </div>

        {/* Kelas & Mapel Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pilih Rombel / Kelas:
            </label>
            <select
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
            >
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama} (Wali: {k.waliKelas})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pilih Mata Pelajaran:
            </label>
            <select
              value={selectedMapelId}
              onChange={(e) => setSelectedMapelId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
            >
              {mapelList.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.kode}] {m.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Config Bar: Nama Guru & KKTP (Required by prompt) */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-indigo-800">
        <div className="flex items-center justify-between mb-3 border-b border-indigo-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Konfigurasi Pembelajaran: {currentMapel?.nama} (Kelas {currentKelas?.nama})
            </h3>
          </div>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            {schoolInfo.kurikulum}
          </span>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isDualMode ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          <div>
            <label className="block text-xs font-semibold text-indigo-200 mb-1">
              Nama Guru Pengampu
            </label>
            <input
              type="text"
              list="datalist-guru-pengampu"
              value={namaGuru}
              onChange={(e) => setNamaGuru(e.target.value)}
              placeholder="Pilih atau ketik nama guru pengampu..."
              className="w-full px-3 py-2 bg-slate-800/80 border border-indigo-700/60 rounded-lg text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />
            {guruList && guruList.length > 0 && (
              <datalist id="datalist-guru-pengampu">
                {guruList.map((g) => (
                  <option key={g.id} value={g.nama}>
                    {g.nama} (NIP. {g.nip})
                  </option>
                ))}
              </datalist>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-indigo-200 mb-1 flex items-center justify-between">
              <span>KKTP / KKM Nilai</span>
              <span className="text-[10px] text-amber-300 font-bold">Batas Tuntas</span>
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={kktp}
              onChange={(e) => setKktp(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800/80 border border-indigo-700/60 rounded-lg text-sm font-bold text-amber-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />
          </div>

          {isDualMode ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-indigo-200 mb-1">
                  Bobot Formatif (Tugas/Harian)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={bobotFormatif}
                    onChange={(e) => setBobotFormatif(Number(e.target.value))}
                    className="w-20 px-3 py-2 bg-slate-800/80 border border-indigo-700/60 rounded-lg text-sm text-white focus:outline-none"
                  />
                  <span className="text-xs text-indigo-300">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-200 mb-1">
                  Bobot Sumatif (STS / PTS)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={bobotSumatif}
                    onChange={(e) => setBobotSumatif(Number(e.target.value))}
                    className="w-20 px-3 py-2 bg-slate-800/80 border border-indigo-700/60 rounded-lg text-sm text-white focus:outline-none"
                  />
                  <span className="text-xs text-indigo-300">%</span>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-1">
                Mode Input Nilai
              </label>
              <div className="px-3 py-2 bg-slate-800/80 border border-emerald-500/40 rounded-lg text-xs font-semibold text-emerald-300 flex items-center space-x-1.5 h-[38px]">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">1 Input Nilai: {showFormatif ? 'Formatif (Tugas/TP)' : 'Sumatif (STS/UTS)'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Deskripsi / Tujuan Pembelajaran STS */}
        <div className="mt-4 pt-4 border-t border-indigo-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <label className="text-xs font-bold text-amber-300 flex items-center space-x-1.5 uppercase tracking-wide">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Input Deskripsi / Lingkup Materi Tujuan Pembelajaran (TP) STS:</span>
            </label>
            <button
              type="button"
              onClick={handleGenerateDeskripsiAll}
              className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-700/70 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold border border-indigo-500/50 shadow-xs transition"
              title="Terapkan deskripsi materi ini ke seluruh siswa kelas berdasarkan capaian KKTP mereka"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Terapkan Deskripsi ke Semua Siswa</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={deskripsiMapel}
            onChange={(e) => setDeskripsiMapel(e.target.value)}
            placeholder="Contoh: Menyelesaikan operasi hitung bilangan bulat, pecahan, serta penyederhanaan bentuk aljabar."
            className="w-full px-3 py-2 bg-slate-800/90 border border-indigo-700/70 rounded-xl text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:outline-none leading-relaxed"
          />
          <p className="text-[11px] text-indigo-300/80 mt-1">
            Deskripsi ini akan digunakan sebagai dasar kalimat capaian kompetensi pada rapor siswa ({currentMapel?.nama}). Guru juga dapat menyesuaikan deskripsi per siswa pada tabel nilai di bawah.
          </p>
        </div>
      </div>

      {/* Subject Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Rata-Rata Kelas</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">{averageScore}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Skor dari {currentSiswa.length} siswa</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Nilai Tertinggi</span>
            <span className="text-emerald-600 font-bold text-xs">Maks</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{maxScore}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Nilai akhir tertinggi</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Nilai Terendah</span>
            <span className="text-rose-500 font-bold text-xs">Min</span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">{minScore}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Nilai akhir terendah</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Ketuntasan KKTP</span>
            <Percent className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{tuntasPercent}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            <span className="font-bold text-emerald-600">{tuntasCount}</span> tuntas / {currentSiswa.length - tuntasCount} belum
          </div>
        </div>
      </div>

      {/* Main Student Grades Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-base">
            Daftar Nilai Siswa Kelas {currentKelas?.nama}
          </h3>
          <span className="text-xs font-medium text-slate-500">
            {isDualMode ? (
              `Format: 2 Input Nilai (Formatif ${bobotFormatif}% + Sumatif ${bobotSumatif}% = Nilai Akhir)`
            ) : (
              `Format: 1 Input Nilai (${showFormatif ? 'Formatif / Tugas' : 'Sumatif / STS'}) = Nilai Akhir Langsung`
            )}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3 w-24">NIS</th>
                <th className="py-3 px-4 w-56">Nama Peserta Didik</th>
                {showFormatif && (
                  <th className="py-3 px-3 w-28 text-center">
                    Nilai Formatif {isDualMode ? '(TP/Tugas)' : '(Tugas/Harian)'}
                  </th>
                )}
                {showSumatif && (
                  <th className="py-3 px-3 w-28 text-center">
                    Nilai Sumatif (STS/UTS)
                  </th>
                )}
                <th className="py-3 px-3 w-24 text-center">Nilai Akhir</th>
                <th className="py-3 px-3 w-28 text-center">Status KKTP ({kktp})</th>
                <th className="py-3 px-4">Capaian Kompetensi / Deskripsi Pembelajaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentSiswa.map((s, idx) => {
                const entry = localScores[s.id] || { formatif: 75, sumatif: 75, akhir: 75, capaian: '' };
                const isTuntas = entry.akhir >= kktp;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-center text-xs font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-600 font-semibold">
                      {s.nis}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center space-x-2">
                        <span>{s.nama}</span>
                        <span className="text-[10px] text-slate-400">({s.jenisKelamin})</span>
                      </div>
                    </td>
                    {/* Formatif Input (muncul jika dicentang) */}
                    {showFormatif && (
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={entry.formatif}
                          onChange={(e) => handleScoreChange(s.id, 'formatif', Number(e.target.value))}
                          className="w-20 px-2.5 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                    )}
                    {/* Sumatif Input (muncul jika dicentang) */}
                    {showSumatif && (
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={entry.sumatif}
                          onChange={(e) => handleScoreChange(s.id, 'sumatif', Number(e.target.value))}
                          className="w-20 px-2.5 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                    )}
                    {/* Nilai Akhir (Calculated) */}
                    <td className="py-3 px-3 text-center font-black text-base text-indigo-700">
                      {entry.akhir}
                    </td>
                    {/* Status KKTP */}
                    <td className="py-3 px-3 text-center">
                      {isTuntas ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Tuntas</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Belum</span>
                        </span>
                      )}
                    </td>
                    {/* Capaian Kompetensi */}
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={entry.capaian}
                        onChange={(e) => handleCapaianChange(s.id, e.target.value)}
                        placeholder="Deskripsi pencapaian kompetensi siswa pada rapor..."
                        className="w-full px-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                );
              })}

              {currentSiswa.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada siswa di kelas ini. Buka tab "Data Siswa" untuk menambahkan data siswa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer save reminder */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-slate-500">
            Tips: Tekan tombol <strong>"Simpan Nilai"</strong> untuk memperbarui data buku Leger dan Rapor siswa.
          </p>
          <button
            onClick={handleSaveAll}
            className="inline-flex items-center justify-center space-x-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSavedToast ? 'Berhasil Disimpan!' : 'Simpan Semua Nilai'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
