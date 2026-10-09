import React, { useState, useEffect, useRef } from 'react';
import { Kelas, MataPelajaran, Siswa, SubjectConfig, NilaiRecord, SchoolInfo, Guru, DAFTAR_AGAMA } from '../types/rapor';
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
  BookOpen,
  RotateCcw,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Cloud,
  CheckCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const CONTOH_DESKRIPSI_AGAMA: Record<string, string> = {
  Islam: 'Memahami hakikat beriman kepada kitab-kitab Allah serta meneladani perilaku jujur dan amanah.',
  Kristen: 'Menghayati karya keselamatan Allah melalui Yesus Kristus dan mempraktikkan kasih serta keteladanan hidup beriman.',
  Katolik: 'Memahami panggilan hidup sebagai murid Kristus dan mewujudkan nilai-nilai Kerajaan Allah dalam kehidupan sehari-hari.',
  Hindu: 'Memahami ajaran Tri Hita Karana, Panca Sradha, serta perilaku beretika dan berbudi luhur sesuai ajaran Veda.',
  Buddha: 'Memahami ajaran Empat Kebenaran Mulia, Hukum Karma, dan pengamalan Pancasila Buddhis dalam kehidupan bermasyarakat.',
  Konghucu: 'Memahami kebajikan Ren (Cinta Kasih), Xiao (Bakti), serta pengamalan ajaran moral Tian dalam kehidupan beragama.',
};

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
  onSaveClassMapel?: (
    kelasId: string,
    mapelId: string,
    updatedClassScores: NilaiRecord[],
    config: SubjectConfig
  ) => Promise<{ success: boolean; localOnly?: boolean; syncedCount: number; error?: string }>;
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
  onSaveClassMapel,
}) => {
  const [selectedKelasId, setSelectedKelasId] = useState<string>(kelasList[0]?.id || '');
  const [selectedMapelId, setSelectedMapelId] = useState<string>(mapelList[0]?.id || '');

  // Current config for this class and subject
  const [namaGuru, setNamaGuru] = useState('');
  const [kktp, setKktp] = useState(75);
  const [bobotFormatif, setBobotFormatif] = useState(50);
  const [bobotSumatif, setBobotSumatif] = useState(50);
  const [deskripsiMapel, setDeskripsiMapel] = useState('');
  const [deskripsiPerAgama, setDeskripsiPerAgama] = useState<Record<string, string>>({});
  const [activeAgamaTab, setActiveAgamaTab] = useState<string>('Islam');

  // Local state for scores of current class and subject
  const [localScores, setLocalScores] = useState<Record<string, { formatif: number; sumatif: number; akhir: number; capaian: string }>>({});
  
  // Model Sinkronisasi State
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [saveError, setSaveError] = useState('');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Baru saja');
  const [pendingSwitch, setPendingSwitch] = useState<{ type: 'kelas' | 'mapel'; id: string } | null>(null);

  // Ref to track active class & mapel to prevent background sync from wiping unsaved edits
  const activeSelectionRef = useRef({ kelasId: selectedKelasId, mapelId: selectedMapelId });
  const hasUnsavedRef = useRef(hasUnsavedChanges);
  hasUnsavedRef.current = hasUnsavedChanges;
  // Ref to prevent redundant local re-parsing loop during saving
  const isLocalSavingRef = useRef(false);

  const currentKelas = kelasList.find((k) => k.id === selectedKelasId) || kelasList[0];
  const currentMapel = mapelList.find((m) => m.id === selectedMapelId) || mapelList[0];
  const currentSiswa = siswaList
    .filter((s) => s.kelasId === selectedKelasId)
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));

  // Deteksi apakah mapel yang dipilih adalah mata pelajaran Agama (PAI, PAIBP, Pendidikan Agama, dll.)
  const isMapelAgama = Boolean(
    currentMapel && (
      currentMapel.nama.toLowerCase().includes('agama') ||
      currentMapel.kode.toLowerCase().includes('pai') ||
      currentMapel.kode.toLowerCase().includes('agm') ||
      currentMapel.kode.toLowerCase().includes('pabp') ||
      currentMapel.id.toLowerCase().includes('pai') ||
      currentMapel.id.toLowerCase().includes('agama')
    )
  );

  // Sort guru list ascending A-Z by name
  const sortedGuruList = [...guruList].sort((a, b) =>
    a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' })
  );

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

    const isDifferentSelection =
      activeSelectionRef.current.kelasId !== selectedKelasId ||
      activeSelectionRef.current.mapelId !== selectedMapelId;

    // If active class/mapel is the same AND teacher has unsaved manual changes, don't overwrite local draft!
    if (!isDifferentSelection && hasUnsavedRef.current) {
      return;
    }

    // If active class/mapel is the same AND (we just saved locally OR user has unsaved edits in progress), preserve existing localScores state!
    if (!isDifferentSelection && (isLocalSavingRef.current || hasUnsavedChanges)) {
      return;
    }

    if (isDifferentSelection) {
      activeSelectionRef.current = { kelasId: selectedKelasId, mapelId: selectedMapelId };
      setHasUnsavedChanges(false);
    }

    // Load config
    const conf = subjectConfigs.find((c) => c.kelasId === selectedKelasId && c.mapelId === selectedMapelId);
    if (conf) {
      // Resolve latest teacher name from guruList if available
      const matchedTeacher = sortedGuruList.find((g) => g.nama === conf.namaGuru);
      setNamaGuru(matchedTeacher ? matchedTeacher.nama : (conf.namaGuru || ''));
      setKktp(conf.kktp ?? 75);
      setBobotFormatif(conf.bobotFormatif ?? 50);
      setBobotSumatif(conf.bobotSumatif ?? 50);
      setDeskripsiMapel(conf.deskripsiMapel || '');
      setDeskripsiPerAgama(conf.deskripsiPerAgama || {});
    } else {
      setNamaGuru('');
      setKktp(75);
      setBobotFormatif(50);
      setBobotSumatif(50);
      setDeskripsiMapel('');
      // Auto-populate recommendation for religion subject if fresh
      if (selectedMapelId.toLowerCase().includes('pai') || selectedMapelId.toLowerCase().includes('agama')) {
        setDeskripsiPerAgama(CONTOH_DESKRIPSI_AGAMA);
      } else {
        setDeskripsiPerAgama({});
      }
    }

    // Load scores reliably for current students
    const temp: Record<string, { formatif: number; sumatif: number; akhir: number; capaian: string }> = {};
    currentSiswa.forEach((s) => {
      const rec = scoresList.find((r) => r.siswaId === s.id && r.mapelId === selectedMapelId);
      if (rec) {
        const fVal = typeof rec.nilaiFormatif === 'number' && !isNaN(rec.nilaiFormatif) ? rec.nilaiFormatif : 0;
        const sVal = typeof rec.nilaiSumatif === 'number' && !isNaN(rec.nilaiSumatif) ? rec.nilaiSumatif : 0;
        const aVal = typeof rec.nilaiAkhir === 'number' && !isNaN(rec.nilaiAkhir) ? rec.nilaiAkhir : calculateAkhir(fVal, sVal);
        temp[s.id] = {
          formatif: fVal,
          sumatif: sVal,
          akhir: aVal,
          capaian: rec.capaianKompetensi || '',
        };
      } else {
        temp[s.id] = {
          formatif: 0,
          sumatif: 0,
          akhir: 0,
          capaian: '',
        };
      }
    });
    setLocalScores(temp);
  }, [selectedKelasId, selectedMapelId, subjectConfigs, scoresList, siswaList, showFormatif, showSumatif, bobotFormatif, bobotSumatif]);

  // Recalculate akhir when formatif or sumatif changes
  const handleScoreChange = (siswaId: string, field: 'formatif' | 'sumatif', val: number) => {
    const clampedVal = Math.max(0, Math.min(100, val || 0));
    setHasUnsavedChanges(true);
    setLocalScores((prev) => {
      const current = prev[siswaId] || { formatif: 0, sumatif: 0, akhir: 0, capaian: '' };
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
    setHasUnsavedChanges(true);
    setLocalScores((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        capaian: val,
      },
    }));
  };

  // Auto-generate realistic capaian text based on KKTP, score, and input deskripsi materi (per agama)
  const handleGenerateDeskripsiAll = () => {
    if (!currentMapel) return;
    const mapelName = currentMapel.nama;
    setHasUnsavedChanges(true);

    setLocalScores((prev) => {
      const updated = { ...prev };
      currentSiswa.forEach((s) => {
        const item = updated[s.id];
        if (!item) return;
        const akhir = item.akhir;
        const sAgama = s.agama || 'Islam';

        // Ambil materi per agama jika mapel agama, atau materi umum jika mapel selain agama
        const agamaMateri = deskripsiPerAgama[sAgama]?.trim();
        const materiText = isMapelAgama
          ? (agamaMateri || `materi pokok dan capaian pembelajaran ${mapelName} (${sAgama})`)
          : (deskripsiMapel.trim() || `materi pokok dan capaian pembelajaran ${mapelName}`);

        // Jika nilai masih 0 (belum dinilai), kosongkan capaian
        if (akhir === 0) {
          updated[s.id] = { ...item, capaian: '' };
          return;
        }

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

  // Reset semua nilai siswa di kelas dan mapel saat ini menjadi 0
  const handleResetAllToZero = () => {
    setHasUnsavedChanges(true);
    setLocalScores((prev) => {
      const updated = { ...prev };
      currentSiswa.forEach((s) => {
        updated[s.id] = {
          formatif: 0,
          sumatif: 0,
          akhir: 0,
          capaian: '',
        };
      });
      return updated;
    });
  };

  const handleSetAgamaDeskripsi = (agama: string, value: string) => {
    setHasUnsavedChanges(true);
    setDeskripsiPerAgama((prev) => ({
      ...prev,
      [agama]: value,
    }));
  };

  const handleFillAllExampleAgama = () => {
    setHasUnsavedChanges(true);
    setDeskripsiPerAgama(CONTOH_DESKRIPSI_AGAMA);
  };

  const handleCopyFromGeneral = (agama: string) => {
    if (!deskripsiMapel.trim()) {
      alert('Deskripsi umum belum diisi.');
      return;
    }
    setHasUnsavedChanges(true);
    handleSetAgamaDeskripsi(agama, deskripsiMapel.trim());
  };

  // Navigasi aman saat ada perubahan belum disimpan
  const handleSelectKelas = (newId: string) => {
    if (newId === selectedKelasId) return;
    if (hasUnsavedChanges) {
      setPendingSwitch({ type: 'kelas', id: newId });
    } else {
      setSelectedKelasId(newId);
    }
  };

  const handleSelectMapel = (newId: string) => {
    if (newId === selectedMapelId) return;
    if (hasUnsavedChanges) {
      setPendingSwitch({ type: 'mapel', id: newId });
    } else {
      setSelectedMapelId(newId);
    }
  };

  const handleConfirmSwitchWithSave = async () => {
    if (!pendingSwitch) return;
    await handleSaveAll();
    if (pendingSwitch.type === 'kelas') {
      setSelectedKelasId(pendingSwitch.id);
    } else {
      setSelectedMapelId(pendingSwitch.id);
    }
    setPendingSwitch(null);
  };

  const handleConfirmSwitchWithoutSave = () => {
    if (!pendingSwitch) return;
    setHasUnsavedChanges(false);
    if (pendingSwitch.type === 'kelas') {
      setSelectedKelasId(pendingSwitch.id);
    } else {
      setSelectedMapelId(pendingSwitch.id);
    }
    setPendingSwitch(null);
  };

  // Simpan Semua Nilai (Model Sinkron Manual ke Database Lokal & Cloud)
  const handleSaveAll = async () => {
    if (isSaving) return;

    // Fast-path: Mark saving and immediately acknowledge locally
    isLocalSavingRef.current = true;
    setIsSaving(true);
    setSaveError('');
    setHasUnsavedChanges(false);
    hasUnsavedRef.current = false;

    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    setLastSyncedTime(timeStr);

    // 1. Save Config
    const newConfig: SubjectConfig = {
      kelasId: selectedKelasId,
      mapelId: selectedMapelId,
      namaGuru: namaGuru.trim(),
      kktp: Number(kktp) || 75,
      bobotFormatif: Number(bobotFormatif) || 50,
      bobotSumatif: Number(bobotSumatif) || 50,
      deskripsiMapel: deskripsiMapel.trim(),
      deskripsiPerAgama: deskripsiPerAgama,
    };

    // 2. Prepare scores to save
    const updatedThisMapelScores: NilaiRecord[] = currentSiswa.map((s) => {
      const entry = localScores[s.id] || { formatif: 0, sumatif: 0, akhir: 0, capaian: '' };
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

    try {
      if (onSaveClassMapel) {
        const res = await onSaveClassMapel(selectedKelasId, selectedMapelId, updatedThisMapelScores, newConfig);
        if (res.error) {
          setSaveError(res.error);
        } else {
          setSaveError('');
        }
        if (res.localOnly) {
          setToastMsg(`Tersimpan di perangkat lokal! (Cloud: Kuota harian habis). Data Anda tetap aman.`);
        } else {
          setToastMsg(`Berhasil! Seluruh data nilai ${updatedThisMapelScores.length} siswa Kelas ${currentKelas?.nama || ''} telah tersimpan dan terkirim ke Cloud.`);
        }
        setHasUnsavedChanges(false);
      } else {
        const otherScores = scoresList.filter(
          (r) => !(r.kelasId === selectedKelasId && r.mapelId === selectedMapelId)
        );
        onSaveConfig(newConfig);
        onSaveScores([...otherScores, ...updatedThisMapelScores]);
        setToastMsg(`Berhasil! Seluruh data nilai ${updatedThisMapelScores.length} siswa Kelas ${currentKelas?.nama || ''} telah tersimpan.`);
        setHasUnsavedChanges(false);
      }

      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 4000);
    } catch (err: any) {
      console.error(err);
      setSaveError('Terjadi kesalahan saat sinkronisasi Cloud. Seluruh nilai tetap tersimpan aman di database lokal browser.');
    } finally {
      setIsSaving(false);
      // Allow cooldown before releasing local saving guard
      setTimeout(() => {
        isLocalSavingRef.current = false;
      }, 1000);
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S untuk simpan cepat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedKelasId,
    selectedMapelId,
    namaGuru,
    kktp,
    bobotFormatif,
    bobotSumatif,
    deskripsiMapel,
    deskripsiPerAgama,
    localScores,
    isSaving,
    currentSiswa,
  ]);

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
              const f = fCol !== -1 && row[fCol] !== undefined ? Number(row[fCol]) : 0;
              const s = sCol !== -1 && row[sCol] !== undefined ? Number(row[sCol]) : 0;
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

        setHasUnsavedChanges(true);
        alert('Berhasil mengimpor nilai dari Excel! Klik "Simpan Semua Nilai" untuk menyimpan dan menyinkronkan data ke Cloud.');
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
      {/* Banner Model Sinkronisasi Input Data Siswa */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
            <Database className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Model Sinkronisasi Data Siswa
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                Penyimpanan Manual Terkontrol
              </span>
              {isSaving ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-300" />
                  <span>Sedang Mengirim ke Cloud...</span>
                </span>
              ) : hasUnsavedChanges ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/25 text-amber-300 border border-amber-400/40 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Ada Nilai Belum Disimpan (Ctrl+S)</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span>Tersinkron ke Cloud & Lokal</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Nilai yang diinputkan guru disimpan dalam penampung draf lokal dan <strong>disinkronkan secara resmi ke database Cloud (Firestore) serta buku Leger & Rapor</strong> saat menekan tombol <strong>"Simpan Semua Nilai"</strong>.
            </p>
          </div>
        </div>

        {/* Info Terakhir Disimpan & Total Siswa */}
        <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-5 text-xs text-slate-300 shrink-0">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Terakhir Disimpan:</span>
            <span className="font-bold text-white font-mono">{lastSyncedTime}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Jumlah Siswa:</span>
            <span className="font-bold text-emerald-400">{currentSiswa.length} Siswa</span>
          </div>
        </div>
      </div>

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
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition border border-indigo-200 cursor-pointer"
              title="Buat deskripsi capaian otomatis untuk semua siswa sesuai KKTP"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Auto Deskripsi</span>
            </button>

            <button
              onClick={handleResetAllToZero}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition border border-rose-200 cursor-pointer"
              title="Setel nilai seluruh siswa di kelas ini menjadi 0 (kosongkan)"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Setel Nilai ke 0</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition border border-emerald-200 cursor-pointer"
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

            {/* Tombol Simpan Semua Nilai Utama */}
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className={`inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all duration-150 cursor-pointer active:scale-95 ${
                isSaving
                  ? 'bg-indigo-600 text-white shadow-indigo-500/25 ring-2 ring-indigo-300'
                  : hasUnsavedChanges
                  ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400/60 shadow-amber-600/30 animate-pulse'
                  : isSavedToast
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-300'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
              }`}
              title="Simpan seluruh nilai kelas ini dan kirim ke Cloud (Pintasan: Ctrl+S)"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Mengirim ke Cloud...</span>
                </>
              ) : isSavedToast ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                  <span>Tersimpan & Terkirim!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Semua Nilai</span>
                  <span className="hidden sm:inline-block text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-medium">
                    Ctrl+S
                  </span>
                  {hasUnsavedChanges && (
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notifikasi Error jika ada kendala simpan */}
        {saveError && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Kelas & Mapel Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Pilih Rombel / Kelas:
              </label>
              {hasUnsavedChanges && (
                <span className="text-[10px] text-amber-600 font-semibold">
                  (Simpan nilai sebelum pindah)
                </span>
              )}
            </div>
            <select
              value={selectedKelasId}
              onChange={(e) => handleSelectKelas(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama} (Wali: {k.waliKelas})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Pilih Mata Pelajaran:
              </label>
              {hasUnsavedChanges && (
                <span className="text-[10px] text-amber-600 font-semibold">
                  (Simpan nilai sebelum pindah)
                </span>
              )}
            </div>
            <select
              value={selectedMapelId}
              onChange={(e) => handleSelectMapel(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
            <label className="block text-xs font-semibold text-indigo-200 mb-1 flex items-center justify-between">
              <span>Nama Guru Pengampu</span>
              <span className="text-[10px] text-indigo-300 font-normal">Urut A - Z ({sortedGuruList.length} Guru)</span>
            </label>
            <select
              value={namaGuru}
              onChange={(e) => setNamaGuru(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-indigo-700/80 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                -- Pilih Guru Pengampu (A - Z) --
              </option>
              {sortedGuruList.map((g) => (
                <option key={g.id} value={g.nama} className="bg-slate-900 text-white">
                  {g.nama} {g.nip ? `(NIP. ${g.nip})` : ''}
                </option>
              ))}
              {namaGuru && !sortedGuruList.some((g) => g.nama === namaGuru) && (
                <option value={namaGuru} className="bg-slate-900 text-amber-300">
                  {namaGuru} (Tersimpan)
                </option>
              )}
            </select>
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

        {/* Input Deskripsi / Tujuan Pembelajaran STS (HANYA MUNCUL JIKA BUKAN MAPEL AGAMA) */}
        {!isMapelAgama && (
          <div className="mt-4 pt-4 border-t border-indigo-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <label className="text-xs font-bold text-amber-300 flex items-center space-x-1.5 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Input Deskripsi / Lingkup Materi Tujuan Pembelajaran (TP) STS:</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateDeskripsiAll}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-700/70 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold border border-indigo-500/50 shadow-xs transition cursor-pointer"
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
              Deskripsi umum ini digunakan sebagai dasar kalimat capaian kompetensi pada rapor siswa ({currentMapel?.nama}).
            </p>
          </div>
        )}

        {/* Input Deskripsi / TP Per Agama (HANYA MUNCUL JIKA MATA PELAJARAN AGAMA) */}
        {isMapelAgama && (
          <div className="mt-5 pt-4 border-t border-indigo-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <label className="text-xs font-bold text-amber-300 flex items-center space-x-1.5 uppercase tracking-wide">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Input Deskripsi Capaian Pembelajaran Tiap Agama:</span>
                </label>
                <p className="text-[11px] text-indigo-300/80 mt-0.5">
                  Deskripsi akan otomatis disesuaikan dan dicetak di lembar rapor sesuai agama masing-masing peserta didik.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleFillAllExampleAgama}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg text-xs font-semibold border border-amber-400/30 transition shadow-xs cursor-pointer"
                  title="Muat deskripsi standar Kurikulum Merdeka untuk seluruh 6 agama"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Muat Standar Semua Agama</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateDeskripsiAll}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-700/70 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold border border-indigo-500/50 shadow-xs transition cursor-pointer"
                  title="Terapkan deskripsi materi per agama ini ke seluruh siswa kelas berdasarkan capaian KKTP mereka"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Terapkan ke Siswa</span>
                </button>
              </div>
            </div>

            {/* Tab Selector Tiap Agama */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3 bg-slate-900/60 p-1.5 rounded-xl border border-indigo-900/80">
              {DAFTAR_AGAMA.map((agama) => {
                const countInClass = currentSiswa.filter((s) => (s.agama || 'Islam') === agama).length;
                const isFilled = !!deskripsiPerAgama[agama]?.trim();
                const isActive = activeAgamaTab === agama;

                return (
                  <button
                    key={agama}
                    type="button"
                    onClick={() => setActiveAgamaTab(agama)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-extrabold'
                        : 'text-indigo-200 hover:bg-white/10'
                    }`}
                  >
                    <span>{agama}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                        isActive
                          ? 'bg-black/20 text-slate-900'
                          : countInClass > 0
                          ? 'bg-indigo-600/80 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {countInClass} siswa
                    </span>
                    {isFilled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Deskripsi terisi" />}
                  </button>
                );
              })}
            </div>

            {/* Active Religion Description Textarea & Action Bar */}
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-indigo-800/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5 flex-wrap">
                  <span>Deskripsi Materi Pembelajaran untuk Siswa Beragama:</span>
                  <span className="font-extrabold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                    {activeAgamaTab}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    ({currentSiswa.filter((s) => (s.agama || 'Islam') === activeAgamaTab).length} siswa di Kelas {currentKelas?.nama})
                  </span>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSetAgamaDeskripsi(activeAgamaTab, CONTOH_DESKRIPSI_AGAMA[activeAgamaTab] || '')}
                    className="text-[11px] px-2 py-0.5 bg-indigo-800/80 hover:bg-indigo-700 text-indigo-200 rounded border border-indigo-600 transition cursor-pointer"
                    title="Gunakan kalimat materi standar Kurikulum Merdeka"
                  >
                    Gunakan Rekomendasi {activeAgamaTab}
                  </button>
                </div>
              </div>

              <textarea
                rows={2}
                value={deskripsiPerAgama[activeAgamaTab] || ''}
                onChange={(e) => handleSetAgamaDeskripsi(activeAgamaTab, e.target.value)}
                placeholder={`Contoh deskripsi capaian pembelajaran bagi siswa beragama ${activeAgamaTab}...`}
                className="w-full px-3 py-2 bg-slate-800/90 border border-indigo-700/70 rounded-xl text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:outline-none leading-relaxed"
              />
              <p className="text-[11px] text-amber-200/80">
                💡 Klik tombol <strong>"Terapkan ke Siswa"</strong> di atas atau <strong>"Auto Deskripsi"</strong> agar kalimat capaian otomatis tersusun sesuai nilai & agama masing-masing siswa.
              </p>
            </div>
          </div>
        )}
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
                const entry = localScores[s.id] || { formatif: 0, sumatif: 0, akhir: 0, capaian: '' };
                const isTuntas = entry.akhir > 0 && entry.akhir >= kktp;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-center text-xs font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-600 font-semibold">
                      {s.nis}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span>{s.nama}</span>
                        <span className="text-[10px] text-slate-400">({s.jenisKelamin})</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {s.agama || 'Islam'}
                        </span>
                      </div>
                    </td>
                    {/* Formatif Input (muncul jika dicentang) */}
                    {showFormatif && (
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={entry.formatif === 0 ? '' : entry.formatif}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                            handleScoreChange(s.id, 'formatif', Number.isNaN(val) ? 0 : val);
                          }}
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
                          value={entry.sumatif === 0 ? '' : entry.sumatif}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                            handleScoreChange(s.id, 'sumatif', Number.isNaN(val) ? 0 : val);
                          }}
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
                      {entry.akhir === 0 ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          <span>Belum Dinilai</span>
                        </span>
                      ) : isTuntas ? (
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
          <div className="space-y-0.5">
            <p className="text-xs text-slate-700 font-semibold flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Model Sinkronisasi Data Siswa: Manual via Tombol</span>
            </p>
            <p className="text-[11px] text-slate-500">
              {hasUnsavedChanges
                ? 'Ada nilai yang belum disimpan. Tekan tombol "Simpan Semua Nilai" agar data tersimpan aman ke Cloud & Rapor.'
                : 'Data nilai seluruh siswa kelas ini aman dan telah tersinkron ke Cloud & database lokal.'}
            </p>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`inline-flex items-center justify-center space-x-2 px-6 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all duration-150 cursor-pointer active:scale-95 ${
              isSaving
                ? 'bg-indigo-600 text-white shadow-indigo-500/25 ring-2 ring-indigo-300'
                : hasUnsavedChanges
                ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400/60 shadow-amber-600/30 animate-pulse'
                : isSavedToast
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-300'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Mengirim ke Cloud...</span>
              </>
            ) : isSavedToast ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-200" />
                <span>Berhasil Disimpan & Terkirim!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Semua Nilai</span>
                <span className="hidden sm:inline-block text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-medium">
                  Ctrl+S
                </span>
                {hasUnsavedChanges && (
                  <span className="ml-1 text-[10px] bg-white text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                    Belum Disimpan
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Dialog Konfirmasi Berpindah Rombel / Mapel jika Ada Nilai Belum Disimpan */}
      {pendingSwitch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-900 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Simpan Nilai Siswa Sebelum Berpindah?
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Terdapat nilai siswa pada <strong>Kelas {currentKelas?.nama} ({currentMapel?.nama})</strong> yang baru saja diinput atau diubah dan belum disimpan. Apakah Anda ingin menyimpan nilai tersebut sebelum berpindah ke {pendingSwitch.type === 'kelas' ? 'rombel lain' : 'mata pelajaran lain'}?
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPendingSwitch(null)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal (Tetap di Sini)
              </button>
              <button
                type="button"
                onClick={handleConfirmSwitchWithoutSave}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 transition cursor-pointer"
              >
                Pindah Tanpa Menyimpan
              </button>
              <button
                type="button"
                onClick={handleConfirmSwitchWithSave}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Semua & Pindah</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Setelah Berhasil Sinkron */}
      {isSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-emerald-500/80 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 backdrop-blur-md animate-bounce">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white flex items-center space-x-1.5">
              <span>Sinkronisasi Berhasil!</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 font-mono">
                {lastSyncedTime}
              </span>
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {toastMsg || 'Data nilai siswa telah tersimpan dan disinkronkan ke Cloud & Rapor.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
