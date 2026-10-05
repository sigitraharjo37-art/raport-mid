import React, { useState } from 'react';
import { Kelas, Siswa } from '../types/rapor';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  Search,
  FileSpreadsheet,
  UserPlus,
  Check,
  FileDown,
  Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataSiswaViewProps {
  kelasList: Kelas[];
  selectedKelasId: string;
  onSelectKelas: (kelasId: string) => void;
  siswaList: Siswa[];
  onAddSiswa: (siswa: Siswa) => void;
  onUpdateSiswa: (siswa: Siswa) => void;
  onDeleteSiswa: (siswaId: string) => void;
  onAddBatchSiswa: (newSiswa: Siswa[]) => void;
  onPurgeDemoSiswa?: () => void;
}

export const DataSiswaView: React.FC<DataSiswaViewProps> = ({
  kelasList,
  selectedKelasId,
  onSelectKelas,
  siswaList,
  onAddSiswa,
  onUpdateSiswa,
  onDeleteSiswa,
  onAddBatchSiswa,
  onPurgeDemoSiswa,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isBatchAdding, setIsBatchAdding] = useState(false);
  const [batchNames, setBatchNames] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Siswa, 'id' | 'kelasId'>>({
    nis: '',
    nisn: '',
    nama: '',
    jenisKelamin: 'L',
  });

  const filteredSiswa = siswaList
    .filter((s) => s.kelasId === selectedKelasId)
    .filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.nama.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q)
      );
    });

  const currentKelas = kelasList.find((k) => k.id === selectedKelasId) || kelasList[0];

  const handleStartEdit = (s: Siswa) => {
    setEditingId(s.id);
    setFormData({
      nis: s.nis,
      nisn: s.nisn,
      nama: s.nama,
      jenisKelamin: s.jenisKelamin,
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!formData.nama.trim()) return;
    onUpdateSiswa({
      id,
      kelasId: selectedKelasId,
      ...formData,
    });
    setEditingId(null);
  };

  const handleSaveAdd = () => {
    if (!formData.nama.trim()) return;
    const newId = `s-${Date.now()}`;
    onAddSiswa({
      id: newId,
      kelasId: selectedKelasId,
      ...formData,
    });
    setFormData({ nis: '', nisn: '', nama: '', jenisKelamin: 'L' });
    setIsAdding(false);
  };

  const handleProcessBatchAdd = () => {
    const lines = batchNames.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    let baseNis = 240700 + filteredSiswa.length;
    const newItems: Siswa[] = lines.map((line, idx) => {
      baseNis += 1;
      return {
        id: `s-${Date.now()}-${idx}`,
        kelasId: selectedKelasId,
        nis: baseNis.toString(),
        nisn: `009${Math.floor(1000000 + Math.random() * 9000000)}`,
        nama: line,
        jenisKelamin: idx % 2 === 0 ? 'L' : 'P',
      };
    });

    onAddBatchSiswa(newItems);
    setBatchNames('');
    setIsBatchAdding(false);
  };

  // Unduh format template input siswa sesuai permintaan user
  // Kolom: No, NISN, NIS, Nama, Jenis Kelamin, kelas
  const handleDownloadFormatTemplate = () => {
    const targetKelasNama = currentKelas?.nama || 'VII-A';
    const templateData: (string | number)[][] = [
      ['No', 'NISN', 'NIS', 'Nama', 'Jenis Kelamin', 'kelas'],
      [1, '0098451201', '240701', 'Ahmad Fadillah Pratama', 'L', targetKelasNama],
      [2, '0098451202', '240702', 'Aulia Rahmawati Dewi', 'P', targetKelasNama],
      [3, '0098451203', '240703', 'Bima Satria Yudha', 'L', targetKelasNama],
      [4, '0098451204', '240704', 'Cantika Putri Amanda', 'P', targetKelasNama],
      [5, '0098451205', '240705', 'Daffa Danendra', 'L', targetKelasNama],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    // Set column widths
    ws['!cols'] = [
      { wch: 6 },  // No
      { wch: 16 }, // NISN
      { wch: 12 }, // NIS
      { wch: 32 }, // Nama
      { wch: 14 }, // Jenis Kelamin
      { wch: 12 }, // kelas
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Format_Input_Siswa');
    XLSX.writeFile(wb, `Format_Input_Siswa_Kelas_${targetKelasNama}.xlsx`);
  };

  // Impor file Excel berdasarkan format template
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
          alert('File Excel kosong atau tidak memiliki data.');
          return;
        }

        // Cari header row yang mengandung NISN, NIS, Nama
        let headerRowIdx = -1;
        for (let i = 0; i < rows.length; i++) {
          const rowStr = rows[i]?.map((c) => String(c).toLowerCase()).join(' ') || '';
          if (rowStr.includes('nisn') || rowStr.includes('nama')) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          alert('Format kolom tidak cocok. Pastikan terdapat kolom: No, NISN, NIS, Nama, Jenis Kelamin, kelas.');
          return;
        }

        const headers = rows[headerRowIdx].map((h) => String(h || '').trim().toLowerCase());
        const nisnCol = headers.findIndex((h) => h === 'nisn' || h.includes('nisn'));
        const nisCol = headers.findIndex((h) => h === 'nis' && !h.includes('nisn'));
        const namaCol = headers.findIndex((h) => h === 'nama' || h.includes('nama'));
        const jkCol = headers.findIndex((h) => h.includes('jenis kelamin') || h.includes('jk') || h === 'l/p');
        const kelasCol = headers.findIndex((h) => h === 'kelas' || h.includes('kelas') || h.includes('rombel'));

        const importedSiswa: Siswa[] = [];
        let autoNis = 240750;

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const namaVal = namaCol !== -1 ? String(row[namaCol] || '').trim() : '';
          if (!namaVal) continue; // skip baris kosong

          const nisnVal = nisnCol !== -1 ? String(row[nisnCol] || '').trim() : '';
          const nisVal = nisCol !== -1 && row[nisCol] ? String(row[nisCol] || '').trim() : `${autoNis++}`;
          
          let jkVal: 'L' | 'P' = 'L';
          if (jkCol !== -1 && row[jkCol]) {
            const rawJk = String(row[jkCol]).trim().toUpperCase();
            if (rawJk.startsWith('P') || rawJk.includes('PEREMPUAN')) {
              jkVal = 'P';
            }
          }

          // Tentukan kelas
          let assignedKelasId = selectedKelasId;
          if (kelasCol !== -1 && row[kelasCol]) {
            const rawKelas = String(row[kelasCol]).trim().toLowerCase();
            const matchedKelas = kelasList.find(
              (k) => k.nama.toLowerCase() === rawKelas || k.nama.toLowerCase().replace(/[^a-z0-9]/g, '') === rawKelas.replace(/[^a-z0-9]/g, '')
            );
            if (matchedKelas) {
              assignedKelasId = matchedKelas.id;
            }
          }

          importedSiswa.push({
            id: `s-${Date.now()}-${i}`,
            nis: nisVal,
            nisn: nisnVal || `009${Math.floor(1000000 + Math.random() * 9000000)}`,
            nama: namaVal,
            jenisKelamin: jkVal,
            kelasId: assignedKelasId,
          });
        }

        if (importedSiswa.length > 0) {
          onAddBatchSiswa(importedSiswa);
          alert(`Berhasil mengimpor ${importedSiswa.length} data siswa dari file Excel!`);
        } else {
          alert('Tidak ditemukan baris data siswa yang valid pada file tersebut.');
        }
      } catch (err) {
        alert('Gagal membaca file Excel. Pastikan format file sesuai template.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleExportExcel = () => {
    const data = filteredSiswa.map((s, idx) => ({
      No: idx + 1,
      NISN: s.nisn,
      NIS: s.nis,
      Nama: s.nama,
      'Jenis Kelamin': s.jenisKelamin,
      kelas: currentKelas?.nama || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Data Siswa ${currentKelas?.nama}`);
    XLSX.writeFile(wb, `Data_Siswa_Kelas_${currentKelas?.nama || 'Kelas'}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            <span>Data Peserta Didik (Siswa)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Daftar siswa terdaftar di setiap rombel kelas, NISN, NIS, dan jenis kelamin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          {/* Unduh Format Input Siswa */}
          <button
            onClick={handleDownloadFormatTemplate}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition shadow-xs"
            title="Unduh Format Excel Input Siswa (No, NISN, NIS, Nama, Jenis Kelamin, kelas)"
          >
            <FileDown className="w-4 h-4 text-amber-600" />
            <span>Unduh Format Siswa</span>
          </button>

          {/* Impor Format Excel */}
          <label
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            title="Impor Data Siswa dari format Excel yang sudah diisi"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Impor Excel</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleImportExcelTemplate} className="hidden" />
          </label>

          {/* Tambah Siswa Baru */}
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>

          {/* Tambah Cepat / Paste */}
          <button
            onClick={() => setIsBatchAdding(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            title="Tambah Banyak Siswa Sekaligus"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Cepat</span>
          </button>

          {/* Hapus Semua Siswa Demo */}
          {onPurgeDemoSiswa && siswaList.some((s) => s.id.startsWith('s-')) && (
            <button
              onClick={onPurgeDemoSiswa}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition shadow-xs"
              title="Hapus seluruh peserta didik data demo contoh bawaan secara permanen dari Cloud dan Local"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Hapus Siswa Demo</span>
            </button>
          )}

          {/* Ekspor Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
            title="Ekspor seluruh data siswa kelas saat ini ke Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor</span>
          </button>
        </div>
      </div>

      {/* Add Single Form */}
      {isAdding && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-indigo-900 mb-3">
            Tambah Siswa Baru ke Kelas {currentKelas?.nama}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NIS (Nomor Induk Siswa)</label>
              <input
                type="text"
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                placeholder="Contoh: 240716"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NISN (10 Digit)</label>
              <input
                type="text"
                value={formData.nisn}
                onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                placeholder="Contoh: 0098451216"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Siswa</label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Bunga Citra Permata"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={formData.jenisKelamin}
                onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              >
                <option value="L">Laki-Laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
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
              <span>Simpan Siswa</span>
            </button>
          </div>
        </div>
      )}

      {/* Batch Add Modal */}
      {isBatchAdding && (
        <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Tambah Banyak Siswa Cepat (Paste Baris Nama)</h3>
          <p className="text-xs text-slate-500 mb-3">
            Tuliskan atau paste satu nama per baris. NIS & NISN akan di-generate otomatis dan dapat disesuaikan kemudian.
          </p>
          <textarea
            rows={5}
            value={batchNames}
            onChange={(e) => setBatchNames(e.target.value)}
            placeholder="Ahmad Zaki&#10;Bella Safira&#10;Dedi Kurniawan"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500"
          />
          <div className="mt-3 flex items-center justify-end space-x-2">
            <button
              onClick={() => setIsBatchAdding(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Batal
            </button>
            <button
              onClick={handleProcessBatchAdd}
              disabled={!batchNames.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
            >
              Proses Tambahkan Siswa
            </button>
          </div>
        </div>
      )}

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau NIS siswa..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium self-end sm:self-auto">
          Menampilkan <span className="font-bold text-slate-800">{filteredSiswa.length}</span> siswa di Kelas {currentKelas?.nama}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28">NIS</th>
                <th className="py-3 px-4 w-32">NISN</th>
                <th className="py-3 px-4">Nama Lengkap Peserta Didik</th>
                <th className="py-3 px-4 w-24 text-center">L/P</th>
                <th className="py-3 px-4 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSiswa.map((s, idx) => {
                const isCurrentEditing = editingId === s.id;

                if (isCurrentEditing) {
                  return (
                    <tr key={s.id} className="bg-amber-50/70">
                      <td className="py-2.5 px-3 text-center text-xs font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={formData.nis}
                          onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                          className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={formData.nisn}
                          onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                          className="w-28 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
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
                      <td className="py-2.5 px-3 text-right space-x-1">
                        <button
                          onClick={() => handleSaveEdit(s.id)}
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
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-400 font-semibold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700">
                      {s.nis}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {s.nisn}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {s.nama}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block w-6 h-6 rounded-full text-xs font-bold leading-6 ${
                          s.jenisKelamin === 'L'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}
                      >
                        {s.jenisKelamin}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleStartEdit(s)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Siswa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus peserta didik ${s.nama}?`)) {
                            onDeleteSiswa(s.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredSiswa.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                    Belum ada siswa di kelas ini atau tidak ditemukan.
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
