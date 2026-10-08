import React, { useState } from 'react';
import { MataPelajaran } from '../types/rapor';
import { BookOpen, Plus, Edit2, Trash2, Check, ArrowUpDown, Cloud, CheckCircle2, RefreshCw } from 'lucide-react';

interface DataMapelViewProps {
  mapelList: MataPelajaran[];
  onAddMapel: (mapel: MataPelajaran) => void;
  onUpdateMapel: (mapel: MataPelajaran) => void;
  onDeleteMapel: (mapelId: string) => void;
  onSyncCloud?: () => Promise<void> | void;
}

export const DataMapelView: React.FC<DataMapelViewProps> = ({
  mapelList,
  onAddMapel,
  onUpdateMapel,
  onDeleteMapel,
  onSyncCloud,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [formData, setFormData] = useState<Omit<MataPelajaran, 'id'>>({
    kode: '',
    nama: '',
    kelompok: 'Kelompok A (Umum)',
    urutan: mapelList.length + 1,
  });

  const handleStartEdit = (m: MataPelajaran) => {
    setEditingId(m.id);
    setFormData({
      kode: m.kode,
      nama: m.nama,
      kelompok: m.kelompok,
      urutan: m.urutan,
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!formData.nama.trim() || !formData.kode.trim()) return;
    const updated: MataPelajaran = {
      id,
      kode: formData.kode.trim().toUpperCase(),
      nama: formData.nama.trim(),
      kelompok: formData.kelompok,
      urutan: Number(formData.urutan) || 1,
    };
    onUpdateMapel(updated);
    setEditingId(null);
    setToastMsg(`Mata pelajaran "${updated.nama}" berhasil diperbarui & disimpan ke Cloud!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSaveAdd = () => {
    if (!formData.nama.trim() || !formData.kode.trim()) return;
    const newId = `m-${Date.now()}`;
    const newMapel: MataPelajaran = {
      id: newId,
      kode: formData.kode.trim().toUpperCase(),
      nama: formData.nama.trim(),
      kelompok: formData.kelompok,
      urutan: Number(formData.urutan) || mapelList.length + 1,
    };
    onAddMapel(newMapel);
    setFormData({
      kode: '',
      nama: '',
      kelompok: 'Kelompok A (Umum)',
      urutan: mapelList.length + 2,
    });
    setIsAdding(false);
    setToastMsg(`Mata pelajaran "${newMapel.nama}" berhasil ditambahkan & disimpan ke Cloud!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleManualSync = async () => {
    if (onSyncCloud) {
      setIsSyncing(true);
      try {
        await onSyncCloud();
        setToastMsg(`Seluruh data ${mapelList.length} mata pelajaran berhasil disinkronkan ke Cloud!`);
      } catch (err) {
        console.error(err);
      } finally {
        setTimeout(() => setIsSyncing(false), 600);
        setTimeout(() => setToastMsg(null), 3500);
      }
    }
  };

  const sortedList = [...mapelList].sort((a, b) => a.urutan - b.urutan);

  return (
    <div className="space-y-6">
      {/* Cloud Sync Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
            <Cloud className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Database Mata Pelajaran Cloud
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                <span>Real-Time Aktif di Semua Perangkat</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Setiap mata pelajaran yang ditambah atau diubah otomatis disimpan permanen di database Cloud Firestore.
            </p>
          </div>
        </div>

        {onSyncCloud && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer self-start md:self-auto shrink-0"
            title="Sinkronkan ulang seluruh data mapel ke Cloud"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Ulang ke Cloud'}</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <span>Mata Pelajaran (Struktur Kurikulum)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Daftar mata pelajaran yang diajarkan, kode ringkas, dan pengelompokan kurikulum pada rapor serta buku legger ({mapelList.length} Mata Pelajaran Aktif).
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setFormData({
              kode: '',
              nama: '',
              kelompok: 'Kelompok A (Umum)',
              urutan: mapelList.length + 1,
            });
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mata Pelajaran</span>
        </button>
      </div>

      {/* Add Inline Card */}
      {isAdding && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-emerald-900 mb-3">Tambah Mata Pelajaran Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Mapel (Singkat)</label>
              <input
                type="text"
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
                placeholder="Contoh: BIND, MTK, IPA"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Mata Pelajaran</label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Matematika"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kelompok</label>
              <select
                value={formData.kelompok}
                onChange={(e) => setFormData({ ...formData, kelompok: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              >
                <option value="Kelompok A (Umum)">Kelompok A (Umum)</option>
                <option value="Kelompok B (Umum)">Kelompok B (Umum)</option>
                <option value="Kelompok C (Muatan Lokal / Pilihan)">Kelompok C (Muatan Lokal / Pilihan)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Urut Tampil</label>
              <input
                type="number"
                value={formData.urutan}
                onChange={(e) => setFormData({ ...formData, urutan: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
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
              disabled={!formData.nama.trim() || !formData.kode.trim()}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Mapel</span>
            </button>
          </div>
        </div>
      )}

      {/* Table of Subjects */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Urut</th>
                <th className="py-3 px-4 w-24">Kode</th>
                <th className="py-3 px-4">Nama Mata Pelajaran</th>
                <th className="py-3 px-4 w-52">Kelompok</th>
                <th className="py-3 px-4 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedList.map((m) => {
                const isCurrentEditing = editingId === m.id;

                if (isCurrentEditing) {
                  return (
                    <tr key={m.id} className="bg-amber-50/70">
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          value={formData.urutan}
                          onChange={(e) => setFormData({ ...formData, urutan: Number(e.target.value) })}
                          className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={formData.kode}
                          onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
                          className="w-20 px-2 py-1 bg-white border border-slate-300 rounded uppercase font-mono font-bold text-xs"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={formData.nama}
                          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm font-semibold"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={formData.kelompok}
                          onChange={(e) => setFormData({ ...formData, kelompok: e.target.value as any })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                        >
                          <option value="Kelompok A (Umum)">Kelompok A (Umum)</option>
                          <option value="Kelompok B (Umum)">Kelompok B (Umum)</option>
                          <option value="Kelompok C (Muatan Lokal / Pilihan)">Kelompok C (Muatan Lokal / Pilihan)</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1">
                        <button
                          onClick={() => handleSaveEdit(m.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                        >
                          Batal
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-400 font-semibold">
                      {m.urutan}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                        {m.kode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {m.nama}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        m.kelompok.includes('Kelompok A')
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : m.kelompok.includes('Kelompok B')
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {m.kelompok}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleStartEdit(m)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Edit Mapel"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus mata pelajaran ${m.nama} secara permanen dari Cloud dan semua perangkat?`)) {
                            onDeleteMapel(m.id);
                            setToastMsg(`Mata pelajaran "${m.nama}" berhasil dihapus dari Cloud.`);
                            setTimeout(() => setToastMsg(null), 3500);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus Mapel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-emerald-500/80 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 backdrop-blur-md animate-bounce">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Sinkronisasi Cloud Berhasil</p>
            <p className="text-[11px] text-slate-300 mt-0.5">{toastMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
};
