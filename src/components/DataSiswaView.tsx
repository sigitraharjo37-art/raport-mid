import React, { useState } from 'react';
import { Kelas, Siswa, DAFTAR_AGAMA } from '../types/rapor';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  Search,
  FileSpreadsheet,
  Check,
  FileDown,
  Upload,
  CheckSquare,
  Square,
  AlertTriangle,
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
  onDeleteBatchSiswa?: (siswaIds: string[]) => void;
  onPurgeDemoSiswa?: () => void;
  onAddBatchKelas?: (newClasses: Kelas[]) => void;
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
  onDeleteBatchSiswa,
  onPurgeDemoSiswa,
  onAddBatchKelas,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [kelasFilter, setKelasFilter] = useState<string>('ALL'); // 'ALL' shows all 431 students across school
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKelasId, setEditKelasId] = useState<string>(selectedKelasId);

  const [formData, setFormData] = useState<Omit<Siswa, 'id' | 'kelasId'>>({
    nis: '',
    nisn: '',
    nama: '',
    jenisKelamin: 'L',
    agama: 'Islam',
  });

  const orphanStudents = siswaList.filter((s) => !kelasList.some((k) => k.id === s.kelasId));

  const filteredSiswa = siswaList
    .filter((s) => {
      if (kelasFilter === 'ALL') return true;
      if (kelasFilter === 'UNASSIGNED') {
        return !kelasList.some((k) => k.id === s.kelasId);
      }
      return s.kelasId === kelasFilter;
    })
    .filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchedKelas = kelasList.find((k) => k.id === s.kelasId);
      return (
        s.nama.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        (matchedKelas && matchedKelas.nama.toLowerCase().includes(q))
      );
    });

  const currentKelas =
    kelasList.find(
      (k) =>
        k.id ===
        (kelasFilter === 'ALL' || kelasFilter === 'UNASSIGNED'
          ? selectedKelasId
          : kelasFilter)
    ) || kelasList[0];

  const isAllSelected =
    filteredSiswa.length > 0 &&
    filteredSiswa.every((s) => selectedIds.includes(s.id));

  const isSomeSelected =
    filteredSiswa.some((s) => selectedIds.includes(s.id)) && !isAllSelected;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const visibleIdSet = new Set(filteredSiswa.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleIdSet.has(id)));
    } else {
      const visibleIds = filteredSiswa.map((s) => s.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleExecuteBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (
      !confirm(
        `PERINGATAN HAPUS MASSAL:\n\nApakah Anda yakin ingin MENGHAPUS PERMANEN ${count} data peserta didik terpilih beserta seluruh rekam nilai dan catatan mereka dari Cloud Database dan Penyimpanan Lokal?\n\nTindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    if (onDeleteBatchSiswa) {
      onDeleteBatchSiswa(selectedIds);
    } else {
      selectedIds.forEach((id) => onDeleteSiswa(id));
    }

    setSelectedIds([]);
    setIsBulkDeleteModalOpen(false);
    alert(`Berhasil menghapus ${count} data peserta didik secara permanen dari Cloud dan Lokal.`);
  };

  const handleDeleteAllInCurrentClass = () => {
    const classStudents = siswaList.filter((s) => s.kelasId === selectedKelasId);
    if (classStudents.length === 0) {
      alert(`Tidak ada siswa di Kelas ${currentKelas?.nama}.`);
      return;
    }

    if (
      !confirm(
        `PERINGATAN HAPUS SELURUH KELAS:\n\nAnda akan MENGHAPUS SEMUA ${classStudents.length} peserta didik di Kelas ${currentKelas?.nama} beserta seluruh nilainya secara permanen!\n\nLanjutkan penghapusan massal?`
      )
    ) {
      return;
    }

    const ids = classStudents.map((s) => s.id);
    if (onDeleteBatchSiswa) {
      onDeleteBatchSiswa(ids);
    } else {
      ids.forEach((id) => onDeleteSiswa(id));
    }

    setSelectedIds([]);
    setIsBulkDeleteModalOpen(false);
    alert(`Berhasil menghapus seluruh (${classStudents.length}) data siswa di Kelas ${currentKelas?.nama}.`);
  };

  const handleStartEdit = (s: Siswa) => {
    setEditingId(s.id);
    setEditKelasId(s.kelasId);
    setFormData({
      nis: s.nis,
      nisn: s.nisn,
      nama: s.nama,
      jenisKelamin: s.jenisKelamin,
      agama: s.agama || 'Islam',
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!formData.nama.trim()) return;
    onUpdateSiswa({
      id,
      kelasId: editKelasId || selectedKelasId,
      ...formData,
      agama: formData.agama || 'Islam',
    });
    setEditingId(null);
  };

  const handleSaveAdd = () => {
    if (!formData.nama.trim()) return;
    const targetKelas = kelasFilter !== 'ALL' && kelasFilter !== 'UNASSIGNED' ? kelasFilter : selectedKelasId;
    const newId = `s-${Date.now()}`;
    onAddSiswa({
      id: newId,
      kelasId: targetKelas,
      ...formData,
      agama: formData.agama || 'Islam',
    });
    setFormData({ nis: '', nisn: '', nama: '', jenisKelamin: 'L', agama: 'Islam' });
    setIsAdding(false);
  };

  // Unduh format template input siswa sesuai permintaan user
  // Kolom: No, NISN, NIS, Nama, Jenis Kelamin, Agama, kelas
  const handleDownloadFormatTemplate = () => {
    const targetKelasNama = currentKelas?.nama || 'VII-A';
    const templateData: (string | number)[][] = [
      ['No', 'NISN', 'NIS', 'Nama', 'Jenis Kelamin', 'Agama', 'kelas'],
      [1, '0098451201', '240701', 'Ahmad Fadillah Pratama', 'L', 'Islam', targetKelasNama],
      [2, '0098451202', '240702', 'Aulia Rahmawati Dewi', 'P', 'Islam', targetKelasNama],
      [3, '0098451203', '240703', 'Chelsea Aurelia Putri', 'P', 'Kristen', targetKelasNama],
      [4, '0098451204', '240704', 'Gisella Natasha', 'P', 'Katolik', targetKelasNama],
      [5, '0098451205', '240705', 'Larasati Dewi', 'P', 'Hindu', targetKelasNama],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 6 },  // No
      { wch: 16 }, // NISN
      { wch: 12 }, // NIS
      { wch: 32 }, // Nama
      { wch: 14 }, // Jenis Kelamin
      { wch: 14 }, // Agama
      { wch: 12 }, // kelas
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Format_Input_Siswa');
    XLSX.writeFile(wb, `Format_Input_Siswa_Kelas_${targetKelasNama}.xlsx`);
  };

  // Impor file Excel berdasarkan format template dengan auto-detect & auto-create rombel kelas baru
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
        const agamaCol = headers.findIndex((h) => h.includes('agama') || h.includes('religion'));
        const kelasCol = headers.findIndex((h) => h === 'kelas' || h.includes('kelas') || h.includes('rombel'));

        const importedSiswa: Siswa[] = [];
        const newClassesToCreate: Kelas[] = [];
        const currentClassesMap = new Map<string, Kelas>();
        kelasList.forEach((k) => {
          currentClassesMap.set(k.nama.toLowerCase().replace(/[^a-z0-9]/g, ''), k);
        });

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

          let agamaVal = 'Islam';
          if (agamaCol !== -1 && row[agamaCol]) {
            const rawAgama = String(row[agamaCol]).trim();
            const matched = DAFTAR_AGAMA.find((a) => a.toLowerCase() === rawAgama.toLowerCase());
            if (matched) {
              agamaVal = matched;
            } else if (/kristen|protestan/i.test(rawAgama)) {
              agamaVal = 'Kristen';
            } else if (/katolik/i.test(rawAgama)) {
              agamaVal = 'Katolik';
            } else if (/hindu/i.test(rawAgama)) {
              agamaVal = 'Hindu';
            } else if (/buddha|budha/i.test(rawAgama)) {
              agamaVal = 'Buddha';
            } else if (/konghucu|khonghucu/i.test(rawAgama)) {
              agamaVal = 'Konghucu';
            } else if (rawAgama) {
              agamaVal = rawAgama;
            }
          }

          // Tentukan atau buat kelas otomatis
          let assignedKelasId = selectedKelasId;
          if (kelasCol !== -1 && row[kelasCol]) {
            const rawKelas = String(row[kelasCol]).trim();
            const cleanKey = rawKelas.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (currentClassesMap.has(cleanKey)) {
              assignedKelasId = currentClassesMap.get(cleanKey)!.id;
            } else {
              // Kelas baru terdeteksi di Excel (misal: VII-C, VII-D, dsb)
              const newKId = `k-${cleanKey || Date.now()}`;
              const createdK: Kelas = {
                id: newKId,
                nama: rawKelas.toUpperCase(),
                tingkat: rawKelas.match(/\d/)?.[0] || '7',
                waliKelas: 'Belum Ditentukan',
                nipWaliKelas: '-',
              };
              currentClassesMap.set(cleanKey, createdK);
              newClassesToCreate.push(createdK);
              assignedKelasId = newKId;
            }
          }

          importedSiswa.push({
            id: `s-${Date.now()}-${i}`,
            nis: nisVal,
            nisn: nisnVal || `009${Math.floor(1000000 + Math.random() * 9000000)}`,
            nama: namaVal,
            jenisKelamin: jkVal,
            agama: agamaVal,
            kelasId: assignedKelasId,
          });
        }

        if (newClassesToCreate.length > 0 && onAddBatchKelas) {
          onAddBatchKelas(newClassesToCreate);
        }

        if (importedSiswa.length > 0) {
          onAddBatchSiswa(importedSiswa);
          setKelasFilter('ALL'); // Beralih ke tampilan SEMUA KELAS agar langsung terlihat 400+ siswa!
          alert(
            `Berhasil mengimpor ${importedSiswa.length} data siswa dari file Excel!\n\n` +
            `Siswa otomatis ditempatkan ke masing-masing rombel kelas.${
              newClassesToCreate.length > 0
                ? `\n${newClassesToCreate.length} rombel kelas baru otomatis dibuat (${newClassesToCreate
                    .map((k) => k.nama)
                    .join(', ')}).`
                : ''
            }\n\nSeluruh data kini langsung tampil di tabel pada mode "SEMUA KELAS".`
          );
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
    const data = filteredSiswa.map((s, idx) => {
      const sKelas = kelasList.find((k) => k.id === s.kelasId);
      return {
        No: idx + 1,
        NISN: s.nisn,
        NIS: s.nis,
        Nama: s.nama,
        'Jenis Kelamin': s.jenisKelamin,
        kelas: sKelas ? sKelas.nama : 'Tanpa Rombel',
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    const title = kelasFilter === 'ALL' ? 'Semua_Kelas' : currentKelas?.nama || 'Kelas';
    XLSX.utils.book_append_sheet(wb, ws, `Data Siswa ${title}`);
    XLSX.writeFile(wb, `Data_Siswa_${title}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
              <span>Data Peserta Didik (Siswa)</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Daftar seluruh siswa terdaftar di sekolah, rombel kelas, NISN, NIS, dan jenis kelamin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Rombel Kelas Selector */}
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 pl-2">Filter Rombel:</span>
              <select
                value={kelasFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setKelasFilter(val);
                  if (val !== 'ALL' && val !== 'UNASSIGNED') {
                    onSelectKelas(val);
                  }
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-indigo-700 shadow-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">🌟 SEMUA KELAS ({siswaList.length} Siswa)</option>
                {kelasList.map((k) => {
                  const count = siswaList.filter((s) => s.kelasId === k.id).length;
                  return (
                    <option key={k.id} value={k.id}>
                      Kelas {k.nama} ({count} Siswa)
                    </option>
                  );
                })}
                {orphanStudents.length > 0 && (
                  <option value="UNASSIGNED">
                    ⚠️ Belum Terdaftar di Rombel ({orphanStudents.length} Siswa)
                  </option>
                )}
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

            {/* Tombol Hapus Massal */}
            <button
              onClick={() => {
                if (selectedIds.length > 0) {
                  handleExecuteBulkDelete();
                } else {
                  setIsBulkDeleteModalOpen(true);
                }
              }}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl transition shadow-xs ${
                selectedIds.length > 0
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 shadow-md'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
              }`}
              title="Hapus massal siswa yang dicentang atau seluruh siswa di kelas ini"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>
                Hapus Massal
                {selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
              </span>
            </button>

            {/* Ekspor Excel */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              title="Ekspor data siswa saat ini ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor</span>
            </button>
          </div>
        </div>

        {/* Ringkasan Statistik Siswa Sekolah */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div
            onClick={() => setKelasFilter('ALL')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              kelasFilter === 'ALL'
                ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400'
                : 'bg-slate-50/70 border-slate-200 hover:bg-indigo-50/40'
            }`}
          >
            <p className="text-[11px] font-bold text-slate-500 uppercase">Total Siswa Terdata</p>
            <p className="text-xl font-black text-indigo-900 mt-0.5">
              {siswaList.length} <span className="text-xs font-semibold text-indigo-600">Siswa</span>
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Total Rombel Kelas</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">
              {kelasList.length} <span className="text-xs font-semibold text-slate-500">Rombel</span>
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Laki-Laki (L)</p>
            <p className="text-xl font-black text-blue-700 mt-0.5">
              {siswaList.filter((s) => s.jenisKelamin === 'L').length} <span className="text-xs font-semibold text-slate-500">Siswa</span>
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Perempuan (P)</p>
            <p className="text-xl font-black text-pink-700 mt-0.5">
              {siswaList.filter((s) => s.jenisKelamin === 'P').length} <span className="text-xs font-semibold text-slate-500">Siswa</span>
            </p>
          </div>
        </div>
      </div>

      {/* Add Single Form */}
      {isAdding && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-indigo-900 mb-3">
            Tambah Siswa Baru ke Kelas {currentKelas?.nama}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Agama</label>
              <select
                value={formData.agama || 'Islam'}
                onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-indigo-900"
              >
                {DAFTAR_AGAMA.map((ag) => (
                  <option key={ag} value={ag}>
                    {ag}
                  </option>
                ))}
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

      {/* Active Bulk Selection Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white p-3.5 px-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-sm tracking-wide">
                {selectedIds.length} Siswa Dipilih
              </p>
              <p className="text-xs text-rose-100">
                Data yang dihapus akan terhapus permanen dari Cloud Firestore dan penyimpanan lokal.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleSelectAll}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl transition"
            >
              {isAllSelected ? 'Batalkan Semua' : `Pilih Semua (${filteredSiswa.length})`}
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition"
            >
              Batal
            </button>
            <button
              onClick={handleExecuteBulkDelete}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl shadow-md transition"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Hapus ({selectedIds.length}) Siswa Sekarang</span>
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

        <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium self-end sm:self-auto">
          {selectedIds.length > 0 && (
            <span className="font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              {selectedIds.length} dipilih
            </span>
          )}
          <span>
            Menampilkan <span className="font-bold text-slate-800">{filteredSiswa.length}</span> siswa{' '}
            {kelasFilter === 'ALL' ? (
              <span className="font-extrabold text-indigo-700">(SEMUA ROMBEL KELAS)</span>
            ) : (
              <span>di Kelas {currentKelas?.nama}</span>
            )}
          </span>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                    title={isAllSelected ? 'Batalkan pilihan semua' : 'Pilih semua siswa di tabel ini'}
                  />
                </th>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28">NIS</th>
                <th className="py-3 px-4 w-32">NISN</th>
                <th className="py-3 px-4">Nama Lengkap Peserta Didik</th>
                <th className="py-3 px-3 w-32 text-center">Rombel / Kelas</th>
                <th className="py-3 px-4 w-16 text-center">L/P</th>
                <th className="py-3 px-3 w-28 text-center">Agama</th>
                <th className="py-3 px-4 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSiswa.map((s, idx) => {
                const isCurrentEditing = editingId === s.id;
                const isSelected = selectedIds.includes(s.id);
                const matchedKelas = kelasList.find((k) => k.id === s.kelasId);

                if (isCurrentEditing) {
                  return (
                    <tr key={s.id} className="bg-amber-50/70">
                      <td className="py-2.5 px-3 text-center text-slate-300">-</td>
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
                          value={editKelasId}
                          onChange={(e) => setEditKelasId(e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                        >
                          {kelasList.map((k) => (
                            <option key={k.id} value={k.id}>
                              Kelas {k.nama}
                            </option>
                          ))}
                        </select>
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
                      <td className="py-2.5 px-3 text-center">
                        <select
                          value={formData.agama || 'Islam'}
                          onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                        >
                          {DAFTAR_AGAMA.map((ag) => (
                            <option key={ag} value={ag}>
                              {ag}
                            </option>
                          ))}
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
                  <tr
                    key={s.id}
                    className={`transition ${
                      isSelected ? 'bg-rose-50/70 border-l-4 border-l-rose-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(s.id)}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                        title={`Pilih ${s.nama}`}
                      />
                    </td>
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
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                          matchedKelas
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {matchedKelas ? `Kelas ${matchedKelas.nama}` : '⚠️ Tanpa Rombel'}
                      </span>
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
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {s.agama || 'Islam'}
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
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-sm">
                    Belum ada siswa di kelas ini atau tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pilihan Hapus Massal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Menu Hapus Massal Siswa</h3>
                <p className="text-xs text-slate-500">Pilih opsi penghapusan yang Anda butuhkan</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  handleToggleSelectAll();
                  setIsBulkDeleteModalOpen(false);
                }}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-semibold text-slate-800 flex items-center justify-between transition"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900">Centang Semua Siswa Kelas {currentKelas?.nama}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Pilih {filteredSiswa.length} siswa untuk kemudian ditinjau sebelum dihapus.
                  </div>
                </div>
                <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0 ml-2" />
              </button>

              <button
                onClick={handleDeleteAllInCurrentClass}
                className="w-full p-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-left text-xs font-semibold text-rose-900 flex items-center justify-between transition"
              >
                <div>
                  <div className="font-bold text-sm text-rose-700">Hapus Semua Siswa di Kelas {currentKelas?.nama}</div>
                  <div className="text-rose-600 text-[11px] mt-0.5">
                    Hapus langsung seluruh ({filteredSiswa.length}) siswa di kelas ini beserta nilai & presensinya.
                  </div>
                </div>
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
