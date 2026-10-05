import React, { useState } from 'react';
import { MataPelajaran } from '../types/rapor';
import { BookOpen, Plus, Edit2, Trash2, Check, ArrowUpDown } from 'lucide-react';

interface DataMapelViewProps {
  mapelList: MataPelajaran[];
  onAddMapel: (mapel: MataPelajaran) => void;
  onUpdateMapel: (mapel: MataPelajaran) => void;
  onDeleteMapel: (mapelId: string) => void;
}

export const DataMapelView: React.FC<DataMapelViewProps> = ({
  mapelList,
  onAddMapel,
  onUpdateMapel,
  onDeleteMapel,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    onUpdateMapel({
      id,
      ...formData,
    });
    setEditingId(null);
  };

  const handleSaveAdd = () => {
    if (!formData.nama.trim() || !formData.kode.trim()) return;
    const newId = `m-${Date.now()}`;
    onAddMapel({
      id: newId,
      ...formData,
      urutan: Number(formData.urutan) || mapelList.length + 1,
    });
    setFormData({
      kode: '',
      nama: '',
      kelompok: 'Kelompok A (Umum)',
      urutan: mapelList.length + 2,
    });
    setIsAdding(false);
  };

  const sortedList = [...mapelList].sort((a, b) => a.urutan - b.urutan);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <span>Mata Pelajaran (Struktur Kurikulum)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Daftar mata pelajaran yang diajarkan, kode ringkas, dan pengelompokan kurikulum pada rapor serta buku legger.
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
          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition self-start sm:self-auto"
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
                          if (confirm(`Hapus mata pelajaran ${m.nama}?`)) {
                            onDeleteMapel(m.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
    </div>
  );
};
