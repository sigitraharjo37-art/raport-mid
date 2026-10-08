import React, { useState, useEffect } from 'react';
import { Kelas, Siswa, PresensiCatatan } from '../types/rapor';
import { ClipboardCheck, Save, Sparkles, UserCheck } from 'lucide-react';

interface PresensiViewProps {
  kelasList: Kelas[];
  selectedKelasId: string;
  onSelectKelas: (kelasId: string) => void;
  siswaList: Siswa[];
  presensiList: PresensiCatatan[];
  onSavePresensi: (data: PresensiCatatan[], kelasId?: string) => void;
}

export const PresensiView: React.FC<PresensiViewProps> = ({
  kelasList,
  selectedKelasId,
  onSelectKelas,
  siswaList,
  presensiList,
  onSavePresensi,
}) => {
  const [localPresensi, setLocalPresensi] = useState<Record<string, { sakit: number; izin: number; alpa: number; catatan: string }>>({});
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const currentKelas = kelasList.find((k) => k.id === selectedKelasId) || kelasList[0];
  const currentSiswa = siswaList.filter((s) => s.kelasId === selectedKelasId);

  useEffect(() => {
    const temp: Record<string, { sakit: number; izin: number; alpa: number; catatan: string }> = {};
    currentSiswa.forEach((s) => {
      const rec = presensiList.find((p) => p.siswaId === s.id && p.kelasId === selectedKelasId);
      if (rec) {
        temp[s.id] = {
          sakit: rec.sakit,
          izin: rec.izin,
          alpa: rec.alpa,
          catatan: rec.catatanWaliKelas,
        };
      } else {
        temp[s.id] = {
          sakit: 0,
          izin: 0,
          alpa: 0,
          catatan: 'Pertahankan motivasi belajar, kedisiplinan dan prestasimu.',
        };
      }
    });
    setLocalPresensi(temp);
    setHasUnsavedChanges(false);
  }, [selectedKelasId]);

  const handleChange = (siswaId: string, field: 'sakit' | 'izin' | 'alpa', val: number) => {
    setHasUnsavedChanges(true);
    setLocalPresensi((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [field]: Math.max(0, val || 0),
      },
    }));
  };

  const handleCatatanChange = (siswaId: string, val: string) => {
    setHasUnsavedChanges(true);
    setLocalPresensi((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        catatan: val,
      },
    }));
  };

  const handleAutoFillCatatan = () => {
    setHasUnsavedChanges(true);
    const positiveTemplates = [
      'Pertahankan motivasi belajar, kedisiplinan, dan terus tingkatkan prestasimu.',
      'Sangat rajin dan berakhlak mulia. Teruslah menjadi teladan yang baik bagi teman-teman.',
      'Kemampuan akademis sangat baik, pertahankan keaktifan dan semangat belajarmu.',
      'Cukup baik dan mandiri. Tingkatkan konsistensi dalam mengulang materi pembelajaran di rumah.',
      'Tunjukkan potensi terbaikmu dan pertahankan kedisiplinan hadir tepat waktu di sekolah.',
    ];

    setLocalPresensi((prev) => {
      const updated = { ...prev };
      currentSiswa.forEach((s, idx) => {
        const item = updated[s.id] || { sakit: 0, izin: 0, alpa: 0, catatan: '' };
        if (!item.catatan || item.catatan.trim().length === 0) {
          updated[s.id] = {
            ...item,
            catatan: positiveTemplates[idx % positiveTemplates.length],
          };
        }
      });
      return updated;
    });
  };

  const handleSave = () => {
    const otherPresensi = presensiList.filter((p) => p.kelasId !== selectedKelasId);
    const updatedPresensi: PresensiCatatan[] = currentSiswa.map((s) => {
      const cur = localPresensi[s.id] || { sakit: 0, izin: 0, alpa: 0, catatan: '' };
      return {
        siswaId: s.id,
        kelasId: selectedKelasId,
        sakit: cur.sakit,
        izin: cur.izin,
        alpa: cur.alpa,
        catatanWaliKelas: cur.catatan,
      };
    });

    onSavePresensi([...otherPresensi, ...updatedPresensi], selectedKelasId);
    setHasUnsavedChanges(false);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ClipboardCheck className="w-6 h-6 text-indigo-600" />
            <span>Presensi & Catatan Wali Kelas</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Data ketidakhadiran (Sakit, Izin, Alpa) dan pesan motivasi wali kelas yang dicetak pada lembar rapor siswa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Kelas Selector */}
          <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 pl-2">Kelas:</span>
            <select
              value={selectedKelasId}
              onChange={(e) => onSelectKelas(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-indigo-700 shadow-xs"
            >
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAutoFillCatatan}
            className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            title="Isi catatan yang masih kosong dengan rekomendasi positif"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Isi Template Catatan</span>
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSavedToast ? 'Tersimpan!' : 'Simpan Presensi'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3 w-28">NIS</th>
                <th className="py-3 px-4 w-56">Nama Peserta Didik</th>
                <th className="py-3 px-2 w-20 text-center">Sakit (S)</th>
                <th className="py-3 px-2 w-20 text-center">Izin (I)</th>
                <th className="py-3 px-2 w-20 text-center">Tanpa Ket. (A)</th>
                <th className="py-3 px-4">Catatan Wali Kelas ({currentKelas?.waliKelas})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentSiswa.map((s, idx) => {
                const entry = localPresensi[s.id] || { sakit: 0, izin: 0, alpa: 0, catatan: '' };

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-center text-xs font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-600">
                      {s.nis}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {s.nama}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={entry.sakit}
                        onChange={(e) => handleChange(s.id, 'sakit', Number(e.target.value))}
                        className="w-14 px-2 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-center text-sm font-semibold"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={entry.izin}
                        onChange={(e) => handleChange(s.id, 'izin', Number(e.target.value))}
                        className="w-14 px-2 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-center text-sm font-semibold"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={entry.alpa}
                        onChange={(e) => handleChange(s.id, 'alpa', Number(e.target.value))}
                        className="w-14 px-2 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-center text-sm font-semibold"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={entry.catatan}
                        onChange={(e) => handleCatatanChange(s.id, e.target.value)}
                        placeholder="Ketik catatan motivasi atau perkembangan peserta didik..."
                        className="w-full px-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
