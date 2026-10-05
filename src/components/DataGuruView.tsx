import React, { useState } from 'react';
import { Guru } from '../types/rapor';
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Search,
  FileSpreadsheet,
  FileDown,
  Upload,
  Check,
  Phone,
  PhoneCall,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataGuruViewProps {
  guruList: Guru[];
  onAddGuru: (guru: Guru) => void;
  onUpdateGuru: (guru: Guru) => void;
  onDeleteGuru: (guruId: string) => void;
  onAddBatchGuru: (newGurus: Guru[]) => void;
  onPurgeDemoGurus?: () => void;
}

export const DataGuruView: React.FC<DataGuruViewProps> = ({
  guruList,
  onAddGuru,
  onUpdateGuru,
  onDeleteGuru,
  onAddBatchGuru,
  onPurgeDemoGurus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Guru, 'id'>>({
    nama: '',
    nip: '',
    jenisKelamin: 'L',
    noHp: '',
  });

  const filteredGurus = guruList.filter((g) => {
    const q = searchQuery.toLowerCase();
    return (
      g.nama.toLowerCase().includes(q) ||
      g.nip.toLowerCase().includes(q) ||
      g.noHp.toLowerCase().includes(q)
    );
  });

  const handleStartEdit = (g: Guru) => {
    setEditingId(g.id);
    setFormData({
      nama: g.nama,
      nip: g.nip,
      jenisKelamin: g.jenisKelamin,
      noHp: g.noHp,
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!formData.nama.trim()) return;
    onUpdateGuru({
      id,
      ...formData,
    });
    setEditingId(null);
  };

  const handleSaveAdd = () => {
    if (!formData.nama.trim()) return;
    const newId = `g-${Date.now()}`;
    onAddGuru({
      id: newId,
      ...formData,
    });
    setFormData({ nama: '', nip: '', jenisKelamin: 'L', noHp: '' });
    setIsAdding(false);
  };

  // Unduh Format Excel Template Data Guru
  const handleDownloadFormatTemplate = () => {
    const templateData: (string | number)[][] = [
      ['No', 'Nama', 'NIP', 'Jenis Kelamin', 'No HP'],
      [1, 'Drs. H. Mulyadi, M.A.', '19690115 199403 1 002', 'L', '0813-8899-1004'],
      [2, 'Hj. Endang Suryani, S.Pd.', '19790422 200501 2 008', 'P', '0812-3456-7801'],
      [3, 'Budi Santoso, S.Pd.', '19810310 200604 1 009', 'L', '0812-9988-7705'],
      [4, 'Dra. Sri Wahyuni', '19710920 199702 2 001', 'P', '0813-4455-6607'],
      [5, 'Ahmad Fauzi, M.Pd.', '19800612 200501 1 012', 'L', '0857-1122-3306'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 6 },  // No
      { wch: 32 }, // Nama
      { wch: 24 }, // NIP
      { wch: 14 }, // Jenis Kelamin
      { wch: 18 }, // No HP
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Format_Data_Guru');
    XLSX.writeFile(wb, 'Format_Input_Data_Guru.xlsx');
  };

  // Impor Excel Data Guru
  const handleImportExcelTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) {
          alert('File Excel kosong atau tidak memiliki data guru.');
          return;
        }

        // Cari baris header
        let headerRowIdx = -1;
        for (let i = 0; i < rows.length; i++) {
          const rowStr = rows[i]?.map((c) => String(c).toLowerCase()).join(' ') || '';
          if (rowStr.includes('nama') || rowStr.includes('nip')) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          alert('Format kolom tidak cocok. Pastikan terdapat kolom: No, Nama, NIP, Jenis Kelamin, No HP.');
          return;
        }

        const headers = rows[headerRowIdx].map((h) => String(h || '').trim().toLowerCase());
        const namaCol = headers.findIndex((h) => h === 'nama' || h.includes('nama'));
        const nipCol = headers.findIndex((h) => h === 'nip' || h.includes('nip'));
        const jkCol = headers.findIndex((h) => h.includes('jenis kelamin') || h.includes('jk') || h === 'l/p');
        const hpCol = headers.findIndex((h) => h.includes('hp') || h.includes('telepon') || h.includes('kontak') || h.includes('wa'));

        const importedGurus: Guru[] = [];

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const namaVal = namaCol !== -1 ? String(row[namaCol] || '').trim() : '';
          if (!namaVal) continue;

          const nipVal = nipCol !== -1 ? String(row[nipCol] || '').trim() : '-';

          let jkVal: 'L' | 'P' = 'L';
          if (jkCol !== -1 && row[jkCol]) {
            const rawJk = String(row[jkCol]).trim().toUpperCase();
            if (rawJk.startsWith('P') || rawJk.includes('PEREMPUAN') || rawJk.includes('WANITA')) {
              jkVal = 'P';
            }
          }

          const hpVal = hpCol !== -1 ? String(row[hpCol] || '').trim() : '-';

          importedGurus.push({
            id: `g-${Date.now()}-${i}`,
            nama: namaVal,
            nip: nipVal,
            jenisKelamin: jkVal,
            noHp: hpVal,
          });
        }

        if (importedGurus.length > 0) {
          onAddBatchGuru(importedGurus);
          alert(`Berhasil mengimpor ${importedGurus.length} data guru dari file Excel!`);
        } else {
          alert('Tidak ditemukan baris data guru yang valid pada file tersebut.');
        }
      } catch (err) {
        alert('Gagal membaca file Excel. Pastikan format file sesuai template.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Ekspor Data Guru Saat Ini ke Excel
  const handleExportExcel = () => {
    const data = filteredGurus.map((g, idx) => ({
      No: idx + 1,
      Nama: g.nama,
      NIP: g.nip,
      'Jenis Kelamin': g.jenisKelamin,
      'No HP': g.noHp,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Guru');
    XLSX.writeFile(wb, `Data_Guru_${new Date().getFullYear()}.xlsx`);
  };

  const totalL = guruList.filter((g) => g.jenisKelamin === 'L').length;
  const totalP = guruList.filter((g) => g.jenisKelamin === 'P').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            <span>Data Pendidik & Tenaga Kependidikan (Guru)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Daftar guru pengampu mata pelajaran dan wali kelas, NIP, jenis kelamin, serta nomor kontak.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Unduh Format Excel Template */}
          <button
            onClick={handleDownloadFormatTemplate}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition shadow-xs"
            title="Unduh Format Excel Input Data Guru (No, Nama, NIP, Jenis Kelamin, No HP)"
          >
            <FileDown className="w-4 h-4 text-amber-600" />
            <span>Unduh Format Guru</span>
          </button>

          {/* Impor Format Excel */}
          <label
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            title="Impor Data Guru dari file Excel yang telah diisi"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Impor Excel</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleImportExcelTemplate} className="hidden" />
          </label>

          {/* Tambah Guru Baru */}
          <button
            onClick={() => {
              setIsAdding(true);
              setFormData({ nama: '', nip: '', jenisKelamin: 'L', noHp: '' });
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru</span>
          </button>

          {/* Hapus Semua Guru Demo Bawaan */}
          {onPurgeDemoGurus && guruList.some((g) => g.id.startsWith('g-')) && (
            <button
              onClick={onPurgeDemoGurus}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition shadow-xs"
              title="Hapus seluruh guru data demo contoh bawaan secara permanen dari Cloud dan Local"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Hapus Guru Demo</span>
            </button>
          )}

          {/* Ekspor Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
            title="Ekspor seluruh data guru ke Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Guru</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{guruList.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Guru Laki-Laki</p>
            <p className="text-2xl font-black text-blue-600 mt-0.5">{totalL}</p>
          </div>
          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
            L
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Guru Perempuan</p>
            <p className="text-2xl font-black text-pink-600 mt-0.5">{totalP}</p>
          </div>
          <span className="w-8 h-8 rounded-full bg-pink-100 text-pink-800 text-xs font-bold flex items-center justify-center">
            P
          </span>
        </div>
      </div>

      {/* Add Single Guru Form Card */}
      {isAdding && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-indigo-900 mb-3">
            Tambah Tenaga Pendidik (Guru) Baru
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap (Beserta Gelar)</label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Dra. Hj. Ratna, M.Pd."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NIP (18 Digit)</label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="19820514 200801 1 005 / -"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={formData.jenisKelamin}
                onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="L">Laki-Laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
              <input
                type="text"
                value={formData.noHp}
                onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end space-x-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg"
            >
              Batal
            </button>
            <button
              onClick={handleSaveAdd}
              disabled={!formData.nama.trim()}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Guru</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama guru, NIP, atau no HP..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium self-end sm:self-auto">
          Menampilkan <span className="font-bold text-slate-800">{filteredGurus.length}</span> guru terdaftar
        </div>
      </div>

      {/* Table of Teachers */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Lengkap Guru</th>
                <th className="py-3 px-4 w-52">NIP</th>
                <th className="py-3 px-4 w-28 text-center">Jenis Kelamin</th>
                <th className="py-3 px-4 w-44">No. HP / WhatsApp</th>
                <th className="py-3 px-4 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGurus.map((g, idx) => {
                const isCurrentEditing = editingId === g.id;

                if (isCurrentEditing) {
                  return (
                    <tr key={g.id} className="bg-amber-50/70">
                      <td className="py-2.5 px-3 text-center text-xs font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={formData.nama}
                          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm font-semibold"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={formData.nip}
                          onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <select
                          value={formData.jenisKelamin}
                          onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                        >
                          <option value="L">L</option>
                          <option value="P">P</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={formData.noHp}
                          onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1">
                        <button
                          onClick={() => handleSaveEdit(g.id)}
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
                  <tr key={g.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-400 font-semibold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {g.nama}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-600">
                      {g.nip || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block w-6 h-6 rounded-full text-xs font-bold leading-6 ${
                          g.jenisKelamin === 'L'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}
                      >
                        {g.jenisKelamin}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {g.noHp ? (
                        <div className="flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{g.noHp}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleStartEdit(g)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Data Guru"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus data guru ${g.nama}?`)) {
                            onDeleteGuru(g.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Guru"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredGurus.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                    Belum ada data guru atau guru tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
