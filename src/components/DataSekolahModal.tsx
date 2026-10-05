import React, { useState } from 'react';
import { SchoolInfo } from '../types/rapor';
import { X, Save, School, UserCheck, Calendar, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';

interface DataSekolahModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolInfo: SchoolInfo;
  onSave: (info: SchoolInfo) => void;
}

export const DataSekolahModal: React.FC<DataSekolahModalProps> = ({
  isOpen,
  onClose,
  schoolInfo,
  onSave,
}) => {
  const [formData, setFormData] = useState<SchoolInfo>({ ...schoolInfo });
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoSekolah' | 'logoKabupaten') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Harap pilih gambar dengan ukuran di bawah 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData((prev) => ({ ...prev, [field]: result }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = (field: 'logoSekolah' | 'logoKabupaten') => {
    setFormData((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 border border-indigo-500/30">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Identitas Sekolah & Kepala Sekolah</h2>
              <p className="text-xs text-slate-300">Data ini akan dicetak pada KOP dan Tanda Tangan Rapor serta Leger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section: Logo Kop Rapor */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-600 flex items-center space-x-2 mb-3">
              <ImageIcon className="w-4 h-4" />
              <span>Logo KOP Rapor (Logo Kabupaten & Logo Sekolah)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Logo ini akan otomatis dicetak pada KOP Laporan Rapor dan Buku Leger Nilai.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logo Kabupaten */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Logo Kabupaten / Daerah (Kiri KOP)</label>
                  {formData.logoKabupaten && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('logoKabupaten')}
                      className="text-xs text-rose-600 hover:text-rose-800 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {formData.logoKabupaten ? (
                      <img
                        src={formData.logoKabupaten}
                        alt="Logo Kabupaten"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-40" />
                        <span className="text-[10px] block">Belum ada</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition">
                      <Upload className="w-3.5 h-3.5 text-purple-600" />
                      <span>Pilih Gambar Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, 'logoKabupaten')}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Format: PNG / JPG / SVG (Maks. 2MB). Disarankan berlatar transparan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Logo Sekolah */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Logo Sekolah (Kanan KOP)</label>
                  {formData.logoSekolah && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('logoSekolah')}
                      className="text-xs text-rose-600 hover:text-rose-800 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {formData.logoSekolah ? (
                      <img
                        src={formData.logoSekolah}
                        alt="Logo Sekolah"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-40" />
                        <span className="text-[10px] block">Belum ada</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Pilih Gambar Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, 'logoSekolah')}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Format: PNG / JPG / SVG (Maks. 2MB). Disarankan berlatar transparan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 1: Profil Sekolah */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-600 flex items-center space-x-2 mb-3">
              <School className="w-4 h-4" />
              <span>Profil Lembaga</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Satuan Pendidikan / Sekolah</label>
                <input
                  type="text"
                  name="namaSekolah"
                  value={formData.namaSekolah}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Contoh: SMP NEGERI 1 TELADAN"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NPSN (Nomor Pokok Sekolah Nasional)</label>
                <input
                  type="text"
                  name="npsn"
                  value={formData.npsn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="20108392"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Jl. Merdeka Belajar No. 12"
                />
              </div>

              <div className="md:col-span-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-200">
                <div className="mb-2">
                  <label className="block text-xs font-bold text-indigo-900 mb-0.5">KOP Header Baris 1 (Pemerintah Daerah / Kabupaten)</label>
                  <input
                    type="text"
                    name="kopInstansi1"
                    value={formData.kopInstansi1 || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold uppercase focus:ring-2 focus:ring-indigo-500"
                    placeholder="PEMERINTAH KABUPATEN LOMBOK UTARA"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-0.5">KOP Header Baris 2 (Dinas / Instansi Pendidikan)</label>
                  <input
                    type="text"
                    name="kopInstansi2"
                    value={formData.kopInstansi2 || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                    placeholder="Dinas Pendidikan, Kebudayaan, Pemuda dan Olahraga (Dikbudpora)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
                <input
                  type="text"
                  name="kabupatenKota"
                  value={formData.kabupatenKota}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Provinsi</label>
                <input
                  type="text"
                  name="provinsi"
                  value={formData.provinsi}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  name="telepon"
                  value={formData.telepon}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Sekolah</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 2: Pimpinan & Titimangsa */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 flex items-center space-x-2 mb-3">
              <UserCheck className="w-4 h-4" />
              <span>Kepala Sekolah & Tanda Tangan Rapor</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kepala Sekolah (Lengkap Gelar)</label>
                <input
                  type="text"
                  name="namaKepalaSekolah"
                  value={formData.namaKepalaSekolah}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Dr. H. Hendra Wijaya, M.Pd."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  name="nipKepalaSekolah"
                  value={formData.nipKepalaSekolah}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="19680514 199203 1 005"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Titimangsa Cetak Rapor (Tempat, Tanggal)</label>
                <input
                  type="text"
                  name="tempatTanggalRapor"
                  value={formData.tempatTanggalRapor}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Jakarta, 11 Oktober 2024"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Format Rapor</label>
                <select
                  name="jenisRapor"
                  value={formData.jenisRapor}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="Sumatif Tengah Semester (STS)">Sumatif Tengah Semester (STS) - Kurikulum Merdeka</option>
                  <option value="Penilaian Tengah Semester (PTS)">Penilaian Tengah Semester (PTS) - K13</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 3: Periode Ajaran */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-600 flex items-center space-x-2 mb-3">
              <Calendar className="w-4 h-4" />
              <span>Periode Tahun Ajaran</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  name="tahunAjaran"
                  value={formData.tahunAjaran}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="2024/2025"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="Ganjil (1)">Ganjil (Semester 1)</option>
                  <option value="Genap (2)">Genap (Semester 2)</option>
                </select>
              </div>
            </div>

            {/* Pengaturan Komponen Input Nilai (Formatif & Sumatif) */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Komponen Input Nilai Siswa (Centang Nilai yang Muncul)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Tentukan input nilai yang akan muncul di tabel penilaian siswa. Jika centang 1 (misal Sumatif saja), maka tabel nilai siswa hanya menampilkan 1 input nilai. Jika centang 2, maka akan muncul 2 input nilai (Formatif dan Sumatif dengan pembobotan).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Centang Nilai Formatif */}
                <label className={`flex items-start space-x-3 p-3.5 rounded-xl border transition cursor-pointer ${
                  (formData.tampilkanFormatif ?? true) ? 'bg-indigo-50/80 border-indigo-300 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}>
                  <input
                    type="checkbox"
                    checked={formData.tampilkanFormatif ?? true}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (!checked && !(formData.tampilkanSumatif ?? true)) {
                        alert('Minimal salah satu jenis nilai (Formatif atau Sumatif) harus dipilih!');
                        return;
                      }
                      setFormData((prev) => ({ ...prev, tampilkanFormatif: checked }));
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Nilai Formatif (Tugas / TP)</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                      Penilaian harian, tugas mandiri, dan capaian tujuan pembelajaran berkala.
                    </span>
                  </div>
                </label>

                {/* Centang Nilai Sumatif */}
                <label className={`flex items-start space-x-3 p-3.5 rounded-xl border transition cursor-pointer ${
                  (formData.tampilkanSumatif ?? true) ? 'bg-indigo-50/80 border-indigo-300 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}>
                  <input
                    type="checkbox"
                    checked={formData.tampilkanSumatif ?? true}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (!checked && !(formData.tampilkanFormatif ?? true)) {
                        alert('Minimal salah satu jenis nilai (Formatif atau Sumatif) harus dipilih!');
                        return;
                      }
                      setFormData((prev) => ({ ...prev, tampilkanSumatif: checked }));
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Nilai Sumatif (STS / PTS)</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                      Asesmen Sumatif Tengah Semester atau tes UTS tengah semester.
                    </span>
                  </div>
                </label>
              </div>

              {/* Status Indicator */}
              <div className="mt-3 flex items-center space-x-2 text-xs">
                <span className="font-semibold text-slate-600">Status Form Input Nilai:</span>
                {(formData.tampilkanFormatif ?? true) && (formData.tampilkanSumatif ?? true) ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    2 Input Nilai Siswa (Formatif + Sumatif)
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    1 Input Nilai Siswa ({(formData.tampilkanFormatif ?? true) ? 'Nilai Formatif Saja' : 'Nilai Sumatif Saja'})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-600/20 transition"
            >
              <Save className="w-4 h-4" />
              <span>{savedToast ? 'Tersimpan!' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
