import React, { useState } from 'react';
import { Kelas, Siswa, Guru } from '../types/rapor';
import { Users, Plus, Edit2, Trash2, Check, X, ShieldAlert } from 'lucide-react';

interface DataKelasViewProps {
  kelasList: Kelas[];
  siswaList: Siswa[];
  guruList?: Guru[];
  onAddKelas: (kelas: Kelas) => void;
  onUpdateKelas: (kelas: Kelas) => void;
  onDeleteKelas: (kelasId: string) => void;
}

export const DataKelasView: React.FC<DataKelasViewProps> = ({
  kelasList,
  siswaList,
  guruList = [],
  onAddKelas,
  onUpdateKelas,
  onDeleteKelas,
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Urutkan guruList ascending (A-Z) berdasarkan nama
  const sortedGuruList = [...guruList].sort((a, b) =>
    a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' })
  );

  // Form states
  const [formData, setFormData] = useState<Omit<Kelas, 'id'>>({
    nama: '',
    tingkat: '7',
    waliKelas: '',
    nipWaliKelas: '',
  });

  const handleStartEdit = (kelas: Kelas) => {
    setIsEditing(kelas.id);
    const matchedGuru = sortedGuruList.find((g) => g.nama === kelas.waliKelas);
    setFormData({
      nama: kelas.nama,
      tingkat: kelas.tingkat,
      waliKelas: kelas.waliKelas,
      nipWaliKelas: matchedGuru ? matchedGuru.nip : kelas.nipWaliKelas,
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!formData.nama.trim()) return;
    onUpdateKelas({
      id,
      ...formData,
    });
    setIsEditing(null);
  };

  const handleSaveAdd = () => {
    if (!formData.nama.trim()) return;
    const newId = `k-${Date.now()}`;
    onAddKelas({
      id: newId,
      ...formData,
    });
    setFormData({ nama: '', tingkat: '7', waliKelas: '', nipWaliKelas: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Data Kelas & Wali Kelas</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola daftar rombongan belajar, wali kelas, serta NIP untuk penandatanganan rapor dan legger.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setFormData({ nama: '', tingkat: '7', waliKelas: '', nipWaliKelas: '' });
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      {/* Add Modal / Inline Card */}
      {isAdding && (
        <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-indigo-900 mb-3">Tambah Rombongan Belajar (Kelas) Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kelas</label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: VII-C, VIII-A, X-MIPA"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat / Fase</label>
              <input
                type="text"
                value={formData.tingkat}
                onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
                placeholder="7 / 8 / 9 / X / dsb"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Wali Kelas</label>
              <select
                value={formData.waliKelas}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = sortedGuruList.find((g) => g.nama === val);
                  setFormData((prev) => ({
                    ...prev,
                    waliKelas: val,
                    nipWaliKelas: matched ? matched.nip : '',
                  }));
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">-- Pilih Guru Wali Kelas (A-Z) --</option>
                {sortedGuruList.map((g) => (
                  <option key={g.id} value={g.nama}>
                    {g.nama} {g.nip ? `(NIP. ${g.nip})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NIP Wali Kelas</label>
              <input
                type="text"
                value={formData.nipWaliKelas}
                readOnly
                placeholder="Otomatis mengikuti nama wali kelas"
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm font-mono text-slate-700 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end space-x-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
            >
              Batal
            </button>
            <button
              onClick={handleSaveAdd}
              disabled={!formData.nama.trim()}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Kelas</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid of Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {kelasList.map((k) => {
          const studentCount = siswaList.filter((s) => s.kelasId === k.id).length;
          const isCurrentEditing = isEditing === k.id;

          if (isCurrentEditing) {
            return (
              <div key={k.id} className="bg-amber-50/70 border border-amber-300 rounded-2xl p-5 shadow-md">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">Edit Data Kelas</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">Nama Kelas</label>
                    <input
                      type="text"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Wali Kelas</label>
                    <select
                      value={formData.waliKelas}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matched = sortedGuruList.find((g) => g.nama === val);
                        setFormData((prev) => ({
                          ...prev,
                          waliKelas: val,
                          nipWaliKelas: matched ? matched.nip : '',
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Pilih Guru Wali Kelas (A-Z) --</option>
                      {sortedGuruList.map((g) => (
                        <option key={g.id} value={g.nama}>
                          {g.nama} {g.nip ? `(NIP. ${g.nip})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">NIP Wali Kelas</label>
                    <input
                      type="text"
                      value={formData.nipWaliKelas}
                      readOnly
                      placeholder="Otomatis mengikuti nama wali kelas"
                      className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-md text-sm font-mono text-slate-700 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setIsEditing(null)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleSaveEdit(k.id)}
                      className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-xs"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={k.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-xl">
                      {k.nama}
                    </div>
                    <div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Tingkat {k.tingkat}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">{studentCount} Peserta Didik</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleStartEdit(k)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Edit Kelas"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Yakin ingin menghapus kelas ${k.nama}?`)) {
                          onDeleteKelas(k.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Wali Kelas</p>
                  {(() => {
                    const matched = sortedGuruList.find((g) => g.nama === k.waliKelas || (k.nipWaliKelas && k.nipWaliKelas !== '-' && g.nip === k.nipWaliKelas));
                    const wNama = matched ? matched.nama : (k.waliKelas || '-');
                    const wNip = matched ? matched.nip : (k.nipWaliKelas || '-');
                    return (
                      <>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{wNama}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">NIP. {wNip}</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
